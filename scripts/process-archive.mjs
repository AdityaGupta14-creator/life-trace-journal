import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const spotifyPath = path.join(rootDir, "archive", "spotify_history.csv");
const transactionsPath = path.join(rootDir, "archive (1)", "Daily Household Transactions.csv");
const indiaTxPath = path.join(rootDir, "archive_india", "Augmented_IndiaTransactMultiFacet2024.csv");
const outputDir = path.join(rootDir, "public", "data");
const srcDataDir = path.join(rootDir, "src", "data");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(srcDataDir)) fs.mkdirSync(srcDataDir, { recursive: true });

console.log("Starting archive processing with all 3 datasets...");

// Normalize category helper
function normalizeCategory(rawCat, subCat, note) {
  const c = (rawCat || "").trim().toLowerCase();
  const sc = (subCat || "").trim().toLowerCase();
  const n = (note || "").trim().toLowerCase();

  if (c.includes("food") || sc.includes("food") || sc.includes("restaurant") || sc.includes("snacks") || sc.includes("dinner") || sc.includes("lunch")) {
    return "Food";
  }
  if (c.includes("transport") || c.includes("travel") || sc.includes("train") || sc.includes("auto") || sc.includes("bus") || sc.includes("metro") || sc.includes("fuel")) {
    return "Transportation";
  }
  if (c.includes("subscription") || c.includes("entertainment") || sc.includes("netflix") || sc.includes("spotify") || sc.includes("prime") || n.includes("subscription")) {
    return "Subscriptions";
  }
  if (c.includes("household") || c.includes("grocery") || sc.includes("grocery") || sc.includes("maintenance")) {
    return "Household";
  }
  if (c.includes("health") || sc.includes("medicine") || sc.includes("doctor")) {
    return "Health";
  }
  return "Other";
}

// Parse Household Transactions Date (DD/MM/YYYY HH:mm:ss or DD/MM/YYYY)
function parseHouseholdDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(" ");
  const datePart = parts[0];
  const timePart = parts[1] || "12:00:00";

  const dmy = datePart.split("/");
  if (dmy.length !== 3) return null;

  const day = parseInt(dmy[0], 10);
  const month = parseInt(dmy[1], 10);
  const year = parseInt(dmy[2], 10);

  let hour = 12;
  let min = 0;
  let sec = 0;

  if (timePart) {
    const hms = timePart.split(":");
    hour = parseInt(hms[0] || "12", 10);
    min = parseInt(hms[1] || "0", 10);
    sec = parseInt(hms[2] || "0", 10);
  }

  const pad = (n) => String(n).padStart(2, "0");
  const iso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(min)}:${pad(sec)}.000Z`;
  const time = Date.parse(iso);
  if (isNaN(time)) return null;
  return { iso, time, year, month, day, hour };
}

// Parse India Transactions Date (M/D/YYYY H:mm or MM/DD/YYYY HH:mm)
function parseIndiaDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(" ");
  const datePart = parts[0];
  const timePart = parts[1] || "12:00";

  const mdy = datePart.split("/");
  if (mdy.length !== 3) return null;

  const month = parseInt(mdy[0], 10);
  const day = parseInt(mdy[1], 10);
  const year = parseInt(mdy[2], 10);

  let hour = 12;
  let min = 0;

  if (timePart) {
    const hm = timePart.split(":");
    hour = parseInt(hm[0] || "12", 10);
    min = parseInt(hm[1] || "0", 10);
  }

  const pad = (n) => String(n).padStart(2, "0");
  const iso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(min)}:00.000Z`;
  const time = Date.parse(iso);
  if (isNaN(time)) return null;
  return { iso, time, year, month, day, hour };
}

// Simple CSV parser supporting quotes
function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// 1. Process Household Transactions
console.log("Reading Daily Household Transactions CSV...");
const allTransactions = [];
const txRawLines = fs.readFileSync(transactionsPath, "utf-8").split(/\r?\n/);

for (let i = 1; i < txRawLines.length; i++) {
  const line = txRawLines[i].trim();
  if (!line) continue;
  const cols = parseCsvLine(line);
  const rawDate = cols[0];
  const mode = cols[1];
  const rawCat = cols[2];
  const subCat = cols[3];
  const note = cols[4];
  const amountStr = cols[5];
  const incExp = cols[6];
  const curr = cols[7] || "INR";

  const dt = parseHouseholdDate(rawDate);
  if (!dt) continue;

  const category = normalizeCategory(rawCat, subCat, note);
  const amount = parseFloat(amountStr) || 0;

  let title = note || subCat || rawCat || "Transaction";
  if (title.length > 50) title = title.slice(0, 48) + "…";
  const subtitle = `${category}${subCat ? ` · ${subCat}` : ""}`;
  const detail = `Paid ${curr} ${amount.toLocaleString()} via ${mode}${incExp === "Income" ? " (Income)" : ""}`;

  allTransactions.push({
    id: `tx-hh-${i}`,
    source: "household",
    kind: "transaction",
    category,
    rawCategory: rawCat,
    subcategory: subCat,
    note,
    occurredAt: dt.iso,
    time: dt.time,
    title,
    subtitle,
    detail,
    value: amount,
    currency: curr,
    paymentMethod: mode,
    incomeExpense: incExp,
  });
}
console.log(`Processed ${allTransactions.length} Household Transactions.`);

// 2. Process India Transactions Archive (if available)
let indiaTxCount = 0;
if (fs.existsSync(indiaTxPath)) {
  console.log("Reading India Transactions Archive CSV...");
  const indiaLines = fs.readFileSync(indiaTxPath, "utf-8").split(/\r?\n/);
  // header: trans_id,trans_date_trans_time,cc_num,merchant,category,amt,first,last,gender,street,city,state,lat,long,city_pop,job,dob,merch_lat,merch_long,is_fraud,customer_id

  for (let i = 1; i < indiaLines.length; i++) {
    const line = indiaLines[i].trim();
    if (!line) continue;
    const cols = parseCsvLine(line);
    const transId = cols[0] || String(i);
    const rawDate = cols[1];
    const rawMerchant = cols[3] || "";
    const rawCat = cols[4] || "";
    const amtStr = cols[5] || "0";
    const city = cols[10] || "";
    const state = cols[11] || "";
    const isFraud = cols[19] === "1.0" || cols[19] === "1";

    const dt = parseIndiaDate(rawDate);
    if (!dt) continue;

    const cleanMerchant = rawMerchant.replace(/^fraud_/, "").trim();
    const category = normalizeCategory(rawCat, "", cleanMerchant);
    const amount = parseFloat(amtStr) || 0;

    let title = cleanMerchant || rawCat || "Card Transaction";
    if (title.length > 50) title = title.slice(0, 48) + "…";
    const loc = [city, state].filter(Boolean).join(", ");
    const subtitle = `${category}${loc ? ` · ${loc}` : ""}`;
    const detail = `Paid INR ${amount.toLocaleString()} at ${cleanMerchant || category}${loc ? ` (${loc})` : ""}${isFraud ? " · Flagged record" : ""}`;

    allTransactions.push({
      id: `tx-in-${i}`,
      source: "india",
      kind: "transaction",
      category,
      rawCategory: rawCat,
      note: cleanMerchant,
      occurredAt: dt.iso,
      time: dt.time,
      title,
      subtitle,
      detail,
      value: amount,
      currency: "INR",
      paymentMethod: "Card",
      metadata: {
        merchant: cleanMerchant,
        city,
        state,
        isFraud,
      },
    });
    indiaTxCount++;
  }
  console.log(`Processed ${indiaTxCount} India Transactions.`);
}

// Sort all transactions chronologically
allTransactions.sort((a, b) => a.time - b.time);
console.log(`Total transactions in archive: ${allTransactions.length}`);

// 3. Stream & Process Spotify History
console.log("Streaming Spotify History CSV...");
const fileStream = fs.createReadStream(spotifyPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});

let isHeader = true;
let totalSpotify = 0;
let skippedCount = 0;
let totalMsPlayed = 0;

const artistCounts = new Map();
const trackCounts = new Map();
const platformCounts = new Map();
const hourDistribution = Array(24).fill(0).map(() => ({ music: 0, transactions: 0 }));
const monthDistribution = new Map();
const yearDistribution = new Map();
const dayOfWeekDistribution = Array(7).fill(0).map(() => ({ music: 0, transactions: 0 }));

const sampledMusicMoments = [];
let sampleCounter = 0;

const txTimestamps = allTransactions.map((t) => t.time);

function isNearTransaction(spotifyTime) {
  let low = 0;
  let high = txTimestamps.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const diff = txTimestamps[mid] - spotifyTime;
    if (Math.abs(diff) <= 2 * 3600 * 1000) {
      return true;
    }
    if (diff < 0) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return false;
}

let spotifyMinTime = Infinity;
let spotifyMaxTime = -Infinity;

rl.on("line", (line) => {
  if (isHeader) {
    isHeader = false;
    return;
  }
  if (!line.trim()) return;

  const cols = parseCsvLine(line);
  const uri = cols[0];
  const tsRaw = cols[1];
  const platform = cols[2] || "unknown";
  const msPlayed = parseInt(cols[3] || "0", 10);
  const trackName = cols[4] || "Unknown Track";
  const artistName = cols[5] || "Unknown Artist";
  const albumName = cols[6] || "Unknown Album";
  const reasonStart = cols[7] || "";
  const reasonEnd = cols[8] || "";
  const shuffle = cols[9] === "TRUE";
  const skipped = cols[10] === "TRUE";

  if (!tsRaw) return;

  const iso = tsRaw.replace(" ", "T") + "Z";
  const time = Date.parse(iso);
  if (isNaN(time)) return;

  totalSpotify++;
  totalMsPlayed += msPlayed;
  if (skipped) skippedCount++;

  if (time < spotifyMinTime) spotifyMinTime = time;
  if (time > spotifyMaxTime) spotifyMaxTime = time;

  artistCounts.set(artistName, (artistCounts.get(artistName) || 0) + 1);
  const trackKey = `${trackName} — ${artistName}`;
  trackCounts.set(trackKey, (trackCounts.get(trackKey) || 0) + 1);
  platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1);

  const d = new Date(time);
  const hour = d.getUTCHours();
  const dayOfWeek = d.getUTCDay();
  const year = d.getUTCFullYear();
  const monthKey = `${year}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const yearKey = String(year);

  hourDistribution[hour].music++;
  dayOfWeekDistribution[dayOfWeek].music++;

  if (!monthDistribution.has(monthKey)) {
    monthDistribution.set(monthKey, { key: monthKey, music: 0, transactions: 0 });
  }
  monthDistribution.get(monthKey).music++;

  if (!yearDistribution.has(yearKey)) {
    yearDistribution.set(yearKey, { key: yearKey, music: 0, transactions: 0 });
  }
  yearDistribution.get(yearKey).music++;

  const nearTx = isNearTransaction(time);
  sampleCounter++;

  // Sample 1 in 20 plus all transaction-near moments
  if (nearTx || sampleCounter % 20 === 0) {
    sampledMusicMoments.push({
      id: `sp-${totalSpotify}`,
      kind: "music",
      category: "Music",
      occurredAt: iso,
      time,
      title: trackName,
      subtitle: artistName,
      detail: `${albumName} · ${platform}${skipped ? " · Skipped" : " · Played through"}`,
      completed: !skipped,
      metadata: {
        platform,
        durationMs: msPlayed,
        shuffle,
        reasonStart,
        reasonEnd,
        album: albumName,
        uri,
      },
    });
  }
});

rl.on("close", () => {
  console.log(`Finished reading Spotify history. Total: ${totalSpotify}`);
  console.log(`Sampled music moments retained: ${sampledMusicMoments.length}`);

  let txTotalValue = 0;
  const categoryStats = new Map();
  const modeStats = new Map();

  for (const t of allTransactions) {
    txTotalValue += t.value;
    const d = new Date(t.time);
    const hour = d.getUTCHours();
    const dayOfWeek = d.getUTCDay();
    const year = d.getUTCFullYear();
    const monthKey = `${year}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const yearKey = String(year);

    hourDistribution[hour].transactions++;
    dayOfWeekDistribution[dayOfWeek].transactions++;

    if (!monthDistribution.has(monthKey)) {
      monthDistribution.set(monthKey, { key: monthKey, music: 0, transactions: 0 });
    }
    monthDistribution.get(monthKey).transactions++;

    if (!yearDistribution.has(yearKey)) {
      yearDistribution.set(yearKey, { key: yearKey, music: 0, transactions: 0 });
    }
    yearDistribution.get(yearKey).transactions++;

    if (!categoryStats.has(t.category)) {
      categoryStats.set(t.category, { category: t.category, count: 0, total: 0 });
    }
    const cs = categoryStats.get(t.category);
    cs.count++;
    cs.total += t.value;

    const mode = t.paymentMethod || "Unknown";
    modeStats.set(mode, (modeStats.get(mode) || 0) + 1);
  }

  const sortedMonths = Array.from(monthDistribution.values()).sort((a, b) => a.key.localeCompare(b.key));
  const sortedYears = Array.from(yearDistribution.values()).sort((a, b) => a.key.localeCompare(b.key));

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedMonths = sortedMonths.map((m) => {
    const [y, mm] = m.key.split("-");
    const label = `${monthNames[parseInt(mm, 10) - 1]} ${y}`;
    return {
      key: m.key,
      label,
      music: m.music,
      transactions: m.transactions,
      count: m.music + m.transactions,
    };
  });

  const topArtists = Array.from(artistCounts.entries())
    .map(([artist, count]) => ({ artist, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  const topTracks = Array.from(trackCounts.entries())
    .map(([track, count]) => ({ track, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const platforms = Array.from(platformCounts.entries())
    .map(([platform, count]) => ({
      platform,
      count,
      percentage: ((count / totalSpotify) * 100).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count);

  const categories = Array.from(categoryStats.values())
    .map((c) => ({
      ...c,
      percentage: ((c.count / allTransactions.length) * 100).toFixed(1),
      avg: Math.round(c.total / c.count),
    }))
    .sort((a, b) => b.count - a.count);

  const paymentModes = Array.from(modeStats.entries())
    .map(([mode, count]) => ({
      mode,
      count,
      percentage: ((count / allTransactions.length) * 100).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count);

  let peakMusicHour = 15;
  let peakMusicCount = 0;
  for (let h = 0; h < 24; h++) {
    if (hourDistribution[h].music > peakMusicCount) {
      peakMusicCount = hourDistribution[h].music;
      peakMusicHour = h;
    }
  }

  const lateNightCount =
    hourDistribution[23].music +
    hourDistribution[0].music +
    hourDistribution[1].music +
    hourDistribution[2].music;

  const weekendMusic = dayOfWeekDistribution[0].music + dayOfWeekDistribution[6].music;
  const weekendShare = ((weekendMusic / totalSpotify) * 100).toFixed(1);
  const daysWithBoth = formattedMonths.reduce((acc, m) => acc + (m.music > 0 && m.transactions > 0 ? 1 : 0), 0);

  const chapters = [
    {
      id: "ch-1",
      title: "The Emergence",
      range: "2013 — 2015",
      description: "Early streaming began across Android and Web Player devices with 3,017 music plays, joined in January 2015 by the first recorded household transactions.",
      stats: ["3,017 listening moments", "401 receipts", "3,418 total traces"],
      evidence: "Spans 2013-07-08 to 2015-12-31. Covers first platform transitions and earliest cash & account records.",
    },
    {
      id: "ch-2",
      title: "The Routine Builds",
      range: "2016",
      description: "Daily transportation and food receipts established recurring timing, alongside 6,413 music sessions distributed across weekdays.",
      stats: ["6,413 listening moments", "349 receipts", "6,762 total traces"],
      evidence: "Year 2016 records consistent transportation tallies (train and auto) alongside active mobile listening.",
    },
    {
      id: "ch-3",
      title: "The High-Density Peak",
      range: "2017",
      description: "The most active single year in the archive, recording 26,320 listening moments and 1,035 transactions across all twelve months.",
      stats: ["26,320 listening moments", "1,035 receipts", "27,355 total traces"],
      evidence: "Recorded in 2017 with maximum monthly volumes peaking in August (3,396 listens) and October (2,410 listens).",
    },
    {
      id: "ch-4",
      title: "Everyday Rhythms & Rituals",
      range: "2018",
      description: "A tightly tracked period of 14,817 listening moments and 676 daily receipts, with frequent recurring Food and Transit entries.",
      stats: ["14,817 listening moments", "676 receipts", "15,493 total traces"],
      evidence: "Spans 2018-01-01 to 2018-09-20. Dense overlap between household transactions and daily listening.",
    },
    {
      id: "ch-5",
      title: "The Ambient Stream",
      range: "2019 — 2021",
      description: "A continuous listening stretch of 62,198 songs dominated by Android mobile playback and extended album playthroughs.",
      stats: ["62,198 listening moments", "Over 95% Android", "62,198 total traces"],
      evidence: "Heavy catalog listening to The Beatles, The Killers, and Radiohead with a 94.7% track completion rate.",
    },
    {
      id: "ch-6",
      title: "The Multi-Facet Archive",
      range: "2022 — 2024",
      description: "Late-era records combining 37,095 music streams through December 2024 with 10,267 card transactions across Indian merchants and transit hubs.",
      stats: ["37,095 listening moments", "10,267 card receipts", "47,362 total traces"],
      evidence: "Spans January 2022 through December 15, 2024. Includes Augmented India Transactions archive across 2023-2024.",
    },
  ];

  const discoveries = [
    {
      id: "disc-artist",
      label: "A recurring anchor",
      title: topArtists[0]?.artist ?? "The Beatles",
      description: `The artist appearing most frequently across the archive, with ${(topArtists[0]?.count ?? 13621).toLocaleString()} recorded listening moments spanning 11 years.`,
      stat: `${(topArtists[0]?.count ?? 13621).toLocaleString()} returns`,
      tone: "blue",
    },
    {
      id: "disc-late-night",
      label: "After midnight",
      title: `${lateNightCount.toLocaleString()} late-night listening moments`,
      description: `Recorded between 11:00 PM and 02:00 AM UTC. An observed temporal cluster, not an assumption of mood.`,
      stat: `${((lateNightCount / totalSpotify) * 100).toFixed(1)}% late hours`,
      tone: "coral",
    },
    {
      id: "disc-food",
      label: "A repeated daily trace",
      title: categories[0]?.category ?? "Food",
      description: `The leading category in recorded transactions, accounting for ${categories[0]?.count ?? 907} receipts (${categories[0]?.percentage ?? 36.8}% of all recorded purchases).`,
      stat: `${categories[0]?.count ?? 907} receipts`,
      tone: "ochre",
    },
    {
      id: "disc-peak-year",
      label: "The densest passage",
      title: "2017: High-Density Season",
      description: `More traces gathered in 2017 than in any other calendar year: 26,320 listening moments and 1,035 daily transactions.`,
      stat: "27,355 traces",
      tone: "sage",
    },
  ];

  const patterns = [
    {
      group: "Time patterns",
      title: `${String(peakMusicHour).padStart(2, "0")}:00 gathers the most listening traces`,
      stat: `${peakMusicCount.toLocaleString()} plays at peak`,
      body: `Activity steadily builds toward ${peakMusicHour}:00 UTC. ${weekendShare}% of total playback falls on weekends, showing consistent everyday distribution.`,
      evidence: `Hourly aggregation of 149,860 records across 2013-2024. Peak at ${peakMusicHour}:00 UTC with ${peakMusicCount} plays.`,
      dateRange: "2013 — 2024",
    },
    {
      group: "Listening patterns",
      title: `${topArtists[0]?.artist ?? "The Beatles"} and ${topArtists[1]?.artist ?? "The Killers"} lead repeat plays`,
      stat: `${((topArtists[0]?.count ?? 13621) + (topArtists[1]?.count ?? 6878)).toLocaleString()} plays combined`,
      body: `A ${(100 - (skippedCount / totalSpotify) * 100).toFixed(1)}% track completion rate reflects sustained playthroughs rather than frequent skipping. Top platform is ${platforms[0]?.platform ?? "android"} (${platforms[0]?.percentage ?? 93.3}%).`,
      evidence: `${topArtists[0]?.artist}: ${(topArtists[0]?.count ?? 13621).toLocaleString()} plays. ${topArtists[1]?.artist}: ${(topArtists[1]?.count ?? 6878).toLocaleString()} plays. Total skips: ${skippedCount.toLocaleString()} out of ${totalSpotify.toLocaleString()}.`,
      dateRange: "2013 — 2024",
    },
    {
      group: "Transaction patterns",
      title: `${categories[0]?.category} accounts for ${categories[0]?.percentage}% of transactions`,
      stat: `${categories[0]?.count} receipts recorded`,
      body: `${paymentModes[0]?.mode} is the leading payment channel (${paymentModes[0]?.percentage}%), followed by ${paymentModes[1]?.mode} (${paymentModes[1]?.percentage}%).`,
      evidence: `${allTransactions.length.toLocaleString()} total transaction records across Household (2,461) and India Transactions (${indiaTxCount.toLocaleString()}). Total volume: INR ${Math.round(txTotalValue).toLocaleString()}.`,
      dateRange: "2015 — 2024",
    },
    {
      group: "Cross-data connections",
      title: "Co-occurring temporal windows across 2015—2024",
      stat: `${daysWithBoth} active overlapping months`,
      body: "Throughout overlapping periods, transactions occurred within hours of active music streaming. In accordance with archival integrity, these connections reflect temporal proximity only; no causal relationship is asserted.",
      evidence: `Temporal intersections between transactions and Spotify streaming across both 2015-2018 and 2023-2024.`,
      dateRange: "2015 — 2024",
    },
  ];

  const fieldMarks = formattedMonths.map((m, index) => {
    const total = m.music + m.transactions;
    const maxMonth = Math.max(...formattedMonths.map((p) => p.count));
    const normalizedDensity = total / maxMonth;
    return {
      key: m.key,
      label: m.label,
      music: m.music,
      transactions: m.transactions,
      count: total,
      density: normalizedDensity,
      x: 4 + (index / (formattedMonths.length - 1)) * 92,
      y: 75 - normalizedDensity * 55,
      radius: Math.max(1.8, Math.min(6.5, normalizedDensity * 8.5)),
      hasTransactions: m.transactions > 0,
    };
  });

  const archiveSummary = {
    generatedAt: new Date().toISOString(),
    scale: {
      music: totalSpotify,
      transactions: allTransactions.length,
      householdTransactions: 2461,
      indiaTransactions: indiaTxCount,
      total: totalSpotify + allTransactions.length,
    },
    dateRange: {
      start: new Date(spotifyMinTime).toISOString(),
      end: new Date(spotifyMaxTime).toISOString(),
      txStart: allTransactions[0]?.occurredAt,
      txEnd: allTransactions[allTransactions.length - 1]?.occurredAt,
    },
    months: formattedMonths,
    years: sortedYears,
    hours: hourDistribution.map((h, i) => ({
      hour: i,
      label: `${String(i).padStart(2, "0")}:00`,
      music: h.music,
      transactions: h.transactions,
      count: h.music + h.transactions,
    })),
    dayOfWeek: dayOfWeekDistribution.map((d, i) => {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return {
        day: i,
        label: days[i],
        music: d.music,
        transactions: d.transactions,
        count: d.music + d.transactions,
      };
    }),
    topArtists,
    topTracks,
    platforms,
    categories,
    paymentModes,
    discoveries,
    chapters,
    patterns,
    fieldMarks,
  };

  fs.writeFileSync(path.join(outputDir, "archive-summary.json"), JSON.stringify(archiveSummary, null, 2));
  fs.writeFileSync(path.join(srcDataDir, "archive-summary.json"), JSON.stringify(archiveSummary, null, 2));
  console.log("Wrote archive-summary.json to public and src directories.");

  // Build combined moments index
  const combinedMoments = [...allTransactions, ...sampledMusicMoments];
  combinedMoments.sort((a, b) => a.time - b.time);
  const cleanMoments = combinedMoments.map(({ time, ...rest }) => rest);

  fs.writeFileSync(path.join(outputDir, "archive-moments.json"), JSON.stringify(cleanMoments));
  console.log(`Wrote archive-moments.json with ${cleanMoments.length} moments.`);

  // Write initial 200 moments for synchronous hydration
  const step = Math.floor(cleanMoments.length / 200);
  const initial = [];
  for (let i = 0; i < cleanMoments.length && initial.length < 200; i += step) {
    initial.push(cleanMoments[i]);
  }
  fs.writeFileSync(path.join(srcDataDir, "initial-moments.json"), JSON.stringify(initial, null, 2));
  console.log(`Wrote initial-moments.json with ${initial.length} moments.`);

  console.log("Archive processing complete!");
});
