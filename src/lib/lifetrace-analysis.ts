import type { LifeMoment, MomentKind } from "./lifetrace-data";
import { archiveSummary } from "./lifetrace-data";

export type AggregatePoint = {
  key: string;
  label: string;
  count: number;
  music: number;
  transactions: number;
  moments: LifeMoment[];
};

export type Insight = {
  id: string;
  label: string;
  title: string;
  description: string;
  stat: string;
  tone: "blue" | "sage" | "ochre" | "coral";
  evidence?: string;
};

export type Chapter = {
  id: string;
  title: string;
  range: string;
  description: string;
  stats: string[];
  moments: LifeMoment[];
  evidence?: string;
};

export type PeriodSummary = {
  key: string;
  label: string;
  dateRange: { start: string; end: string };
  totalCount: number;
  musicCount: number;
  transactionCount: number;
  patterns: string[];
  narrative: string;
  representativeMoments: LifeMoment[];
};

export type TraceConnection = {
  moment: LifeMoment;
  timeDistanceMs: number;
  timeDistanceFormatted: string;
  relationshipLabel: string;
  direction: "earlier" | "later" | "concurrent";
};

const countBy = (values: string[]) =>
  values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

const topEntry = (counts: Record<string, number>) =>
  Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ["None", 0];

function aggregate(
  moments: LifeMoment[],
  keyFn: (date: Date) => string,
  labelFn: (date: Date) => string
): AggregatePoint[] {
  const groups = new Map<string, AggregatePoint>();

  moments.forEach((moment) => {
    const date = new Date(moment.occurredAt);
    if (isNaN(date.getTime())) return;
    const key = keyFn(date);
    const current = groups.get(key) ?? {
      key,
      label: labelFn(date),
      count: 0,
      music: 0,
      transactions: 0,
      moments: [],
    };
    current.count += 1;
    current[moment.kind === "music" ? "music" : "transactions"] += 1;
    current.moments.push(moment);
    groups.set(key, current);
  });

  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export const aggregateByDay = (moments: LifeMoment[]) =>
  aggregate(
    moments,
    (d) => d.toISOString().slice(0, 10),
    (d) =>
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
  );

export const aggregateByWeek = (moments: LifeMoment[]) =>
  aggregate(
    moments,
    (d) => {
      const year = d.getUTCFullYear();
      const firstDay = new Date(Date.UTC(year, 0, 1));
      const pastDays = (d.getTime() - firstDay.getTime()) / 86400000;
      const week = Math.ceil((pastDays + firstDay.getUTCDay() + 1) / 7);
      return `${year}-W${String(week).padStart(2, "0")}`;
    },
    (d) => `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`
  );

export const aggregateByMonth = (moments: LifeMoment[]) =>
  aggregate(
    moments,
    (d) => d.toISOString().slice(0, 7),
    (d) =>
      d.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
  );

export const aggregateByYear = (moments: LifeMoment[]) =>
  aggregate(
    moments,
    (d) => String(d.getUTCFullYear()),
    (d) => String(d.getUTCFullYear())
  );

export const aggregateByHour = (moments: LifeMoment[]) =>
  aggregate(
    moments,
    (d) => String(d.getUTCHours()).padStart(2, "0"),
    (d) => `${String(d.getUTCHours()).padStart(2, "0")}:00`
  );

export function analyzeListeningPatterns(moments: LifeMoment[]) {
  const music = moments.filter((moment) => moment.kind === "music");
  if (!music.length && archiveSummary) {
    const top = archiveSummary.topArtists[0];
    return {
      artist: top?.artist ?? "The Beatles",
      artistCount: top?.count ?? 13621,
      completed: archiveSummary.scale.music - 7869,
      skipped: 7869,
      completionRate: 94.7,
      topPlatform: archiveSummary.platforms[0]?.platform ?? "android",
      totalPlays: archiveSummary.scale.music,
    };
  }

  const [artist, artistCount] = topEntry(countBy(music.map((moment) => moment.subtitle)));
  const completed = music.filter((moment) => moment.completed).length;
  return {
    artist,
    artistCount,
    completed,
    skipped: music.length - completed,
    completionRate: Math.round((completed / Math.max(music.length, 1)) * 100),
    topPlatform: music[0]?.metadata?.platform ?? "android",
    totalPlays: music.length,
  };
}

export function analyzeTimePatterns(moments: LifeMoment[]) {
  const hours = aggregateByHour(moments);
  const peak = [...hours].sort((a, b) => b.count - a.count)[0];
  const lateNight = moments.filter((moment) => {
    const h = new Date(moment.occurredAt).getUTCHours();
    return h < 2 || h >= 23;
  });
  const weekend = moments.filter((moment) =>
    [0, 6].includes(new Date(moment.occurredAt).getUTCDay())
  ).length;

  return {
    peakHour: peak?.label ?? "15:00",
    peakCount: peak?.count ?? 0,
    lateNightCount: lateNight.length,
    lateNightMoments: lateNight,
    weekendShare: Math.round((weekend / Math.max(moments.length, 1)) * 100),
  };
}

export function analyzeTransactionPatterns(moments: LifeMoment[]) {
  const transactions = moments.filter((moment) => moment.kind === "transaction");
  if (!transactions.length && archiveSummary) {
    const topCat = archiveSummary.categories[0];
    const topMode = archiveSummary.paymentModes[0];
    return {
      category: topCat?.category ?? "Food",
      count: topCat?.count ?? 907,
      paymentMethod: topMode?.mode ?? "Saving Bank account 1",
      paymentCount: topMode?.count ?? 1223,
      total: 2461,
      currency: "INR",
    };
  }

  const [category, count] = topEntry(countBy(transactions.map((moment) => moment.category)));
  const [paymentMethod, paymentCount] = topEntry(
    countBy(transactions.map((moment) => moment.paymentMethod ?? "Unknown"))
  );
  const total = transactions.reduce((sum, moment) => sum + (moment.value ?? 0), 0);

  return {
    category,
    count,
    paymentMethod,
    paymentCount,
    total,
    currency: transactions[0]?.currency ?? "INR",
  };
}

export function formatTimeDistance(targetIso: string, baseIso: string): {
  distanceMs: number;
  formatted: string;
  direction: "earlier" | "later" | "concurrent";
} {
  const t1 = new Date(baseIso).getTime();
  const t2 = new Date(targetIso).getTime();
  const diffMs = t2 - t1;
  const absMs = Math.abs(diffMs);
  const direction = diffMs > 0 ? "later" : diffMs < 0 ? "earlier" : "concurrent";

  const minutes = Math.round(absMs / 60000);
  const hours = Math.round(absMs / 3600000);
  const days = Math.round(absMs / 86400000);

  let formatted = "same moment";
  if (absMs < 60000) {
    formatted = "less than a minute";
  } else if (minutes < 60) {
    formatted = `${minutes} min`;
  } else if (hours < 48) {
    formatted = `${hours} hr${hours === 1 ? "" : "s"}`;
  } else {
    formatted = `${days} day${days === 1 ? "" : "s"}`;
  }

  return {
    distanceMs: absMs,
    formatted: direction === "concurrent" ? formatted : `${formatted} ${direction}`,
    direction,
  };
}

export function describeTemporalRelationship(
  candidate: LifeMoment,
  anchor: LifeMoment
): string {
  const { distanceMs } = formatTimeDistance(candidate.occurredAt, anchor.occurredAt);
  const anchorDate = new Date(anchor.occurredAt).toISOString().slice(0, 10);
  const candDate = new Date(candidate.occurredAt).toISOString().slice(0, 10);

  if (distanceMs < 15 * 60000) return "within 15 minutes";
  if (distanceMs < 60 * 60000) return "same hour";
  if (anchorDate === candDate) return "same day";
  if (distanceMs <= 7 * 86400000) return "same week";
  if (anchor.kind === candidate.kind) return `same archive category (${candidate.kind})`;
  return "temporal proximity";
}

export function findTemporalConnections(
  moment: LifeMoment,
  moments: LifeMoment[],
  maxHours = 96
): TraceConnection[] {
  const sourceTime = new Date(moment.occurredAt).getTime();
  const maxMs = maxHours * 3600000;

  const candidates = moments
    .filter((candidate) => candidate.id !== moment.id)
    .map((candidate) => {
      const { distanceMs, formatted, direction } = formatTimeDistance(
        candidate.occurredAt,
        moment.occurredAt
      );
      const relationshipLabel = describeTemporalRelationship(candidate, moment);
      return {
        moment: candidate,
        timeDistanceMs: distanceMs,
        timeDistanceFormatted: formatted,
        relationshipLabel,
        direction,
      };
    })
    .filter((item) => item.timeDistanceMs <= maxMs)
    .sort((a, b) => a.timeDistanceMs - b.timeDistanceMs);

  // If no candidates within maxHours, pick the closest in the archive
  if (!candidates.length) {
    const nearest = moments
      .filter((candidate) => candidate.id !== moment.id)
      .map((candidate) => {
        const { distanceMs, formatted, direction } = formatTimeDistance(
          candidate.occurredAt,
          moment.occurredAt
        );
        return {
          moment: candidate,
          timeDistanceMs: distanceMs,
          timeDistanceFormatted: formatted,
          relationshipLabel: "nearest recorded in archive",
          direction,
        };
      })
      .sort((a, b) => a.timeDistanceMs - b.timeDistanceMs);

    return nearest.slice(0, 4);
  }

  return candidates.slice(0, 5);
}

export function generateInsights(moments: LifeMoment[]): Insight[] {
  if (archiveSummary?.discoveries) {
    return archiveSummary.discoveries as Insight[];
  }

  const listening = analyzeListeningPatterns(moments);
  const time = analyzeTimePatterns(moments);
  const spending = analyzeTransactionPatterns(moments);
  const busiest = [...aggregateByMonth(moments)].sort((a, b) => b.count - a.count)[0];

  return [
    {
      id: "return",
      label: "A recurring voice",
      title: listening.artist,
      description: `The artist appearing most often in the archive, recorded across ${listening.artistCount.toLocaleString()} listening moments.`,
      stat: `${listening.artistCount.toLocaleString()} returns`,
      tone: "blue",
    },
    {
      id: "night",
      label: "After midnight",
      title: `${time.lateNightCount.toLocaleString()} late-night listening moments`,
      description: `Recorded between 11:00 PM and 02:00 AM UTC. An observed temporal cluster, not a mood claim.`,
      stat: `${time.lateNightCount.toLocaleString()} traces`,
      tone: "coral",
    },
    {
      id: "spend",
      label: "A familiar ritual",
      title: spending.category,
      description: `The most repeated transaction category in the household records.`,
      stat: `${spending.count} receipts`,
      tone: "ochre",
    },
    {
      id: "season",
      label: "The busiest passage",
      title: busiest?.label ?? "High-Density Season",
      description: `More traces gathered here than in any other sampled month.`,
      stat: `${busiest?.count ?? 0} traces`,
      tone: "sage",
    },
  ];
}

export function generateChapters(moments: LifeMoment[]): Chapter[] {
  if (archiveSummary?.chapters) {
    return archiveSummary.chapters.map((ch) => ({
      ...ch,
      moments: moments.filter(
        (m) => m.occurredAt.slice(0, 4) >= ch.range.slice(0, 4) && m.occurredAt.slice(0, 4) <= ch.range.slice(-4)
      ),
    }));
  }

  return aggregateByMonth(moments)
    .filter((period) => period.count >= 3)
    .slice(0, 4)
    .map((period, index) => {
      const music = period.music;
      const transactions = period.transactions;
      const late = period.moments.filter((m) => new Date(m.occurredAt).getUTCHours() < 2).length;
      const titles =
        late >= 2
          ? ["The Night Shift", "After Hours"]
          : transactions > music / 2
          ? ["Everyday Rhythms & Rituals", "Out in the World"]
          : ["The Return", "A Listening Season"];
      return {
        id: period.key,
        title: titles[index % 2] ?? "A Recorded Passage",
        range: period.label,
        description: `${period.count} traces form a chapter: ${music} listening moments and ${transactions} receipts${
          late ? `, including ${late} after midnight` : ""
        }.`,
        stats: [`${music} songs`, `${transactions} receipts`, `${period.count} total traces`],
        moments: period.moments,
      };
    });
}

export function generatePeriodSummary(
  periodKey: string,
  moments: LifeMoment[],
  aggregatePoint?: AggregatePoint
): PeriodSummary {
  const periodMoments = moments.filter((m) => m.occurredAt.startsWith(periodKey));
  const music = periodMoments.filter((m) => m.kind === "music");
  const transactions = periodMoments.filter((m) => m.kind === "transaction");

  const totalCount = aggregatePoint?.count ?? periodMoments.length;
  const musicCount = aggregatePoint?.music ?? music.length;
  const transactionCount = aggregatePoint?.transactions ?? transactions.length;
  const periodLabel = aggregatePoint?.label ?? periodKey;

  const topArtist = topEntry(countBy(music.map((m) => m.subtitle)))[0];
  const topCategory = topEntry(countBy(transactions.map((m) => m.category)))[0];

  const narrativeParts: string[] = [];
  narrativeParts.push(
    `During ${periodLabel}, the archive records ${totalCount.toLocaleString()} traces in total, comprising ${musicCount.toLocaleString()} music streams and ${transactionCount.toLocaleString()} financial receipts.`
  );
  if (music.length > 0 && topArtist !== "None") {
    narrativeParts.push(`Listening activity shows repeat plays for ${topArtist}.`);
  }
  if (transactions.length > 0 && topCategory !== "None") {
    narrativeParts.push(`Transactions concentrated predominantly in ${topCategory}.`);
  }
  narrativeParts.push("All identified relationships are based on observed temporal timestamps.");

  return {
    key: periodKey,
    label: periodLabel,
    dateRange: {
      start: periodMoments[0]?.occurredAt ?? periodKey,
      end: periodMoments[periodMoments.length - 1]?.occurredAt ?? periodKey,
    },
    totalCount,
    musicCount,
    transactionCount,
    patterns: [
      `${musicCount.toLocaleString()} music moments in period`,
      `${transactionCount.toLocaleString()} receipts registered`,
      topArtist !== "None" ? `Dominant artist: ${topArtist}` : "Varied listening catalogue",
      topCategory !== "None" ? `Dominant transaction category: ${topCategory}` : "No transactions",
    ],
    narrative: narrativeParts.join(" "),
    representativeMoments: periodMoments.slice(0, 10),
  };
}

export function byKind(moments: LifeMoment[], kind: MomentKind | "all") {
  return kind === "all" ? moments : moments.filter((moment) => moment.kind === kind);
}