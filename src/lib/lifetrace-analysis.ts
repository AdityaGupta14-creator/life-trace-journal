import type { LifeMoment, MomentKind } from "./lifetrace-data";

export type AggregatePoint = { key: string; label: string; count: number; music: number; transactions: number; moments: LifeMoment[] };
export type Insight = { id: string; label: string; title: string; description: string; stat: string; tone: "blue" | "sage" | "ochre" | "coral" };
export type Chapter = { id: string; title: string; range: string; description: string; stats: string[]; moments: LifeMoment[] };

const countBy = (values: string[]) => values.reduce<Record<string, number>>((acc, value) => ({ ...acc, [value]: (acc[value] ?? 0) + 1 }), {});
const topEntry = (counts: Record<string, number>) => Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ["None", 0];

function aggregate(moments: LifeMoment[], keyFn: (date: Date) => string, labelFn: (date: Date) => string): AggregatePoint[] {
  const groups = new Map<string, AggregatePoint>();
  moments.forEach((moment) => {
    const date = new Date(moment.occurredAt);
    const key = keyFn(date);
    const current = groups.get(key) ?? { key, label: labelFn(date), count: 0, music: 0, transactions: 0, moments: [] };
    current.count += 1;
    current[moment.kind === "music" ? "music" : "transactions"] += 1;
    current.moments.push(moment);
    groups.set(key, current);
  });
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export const aggregateByDay = (moments: LifeMoment[]) => aggregate(moments, (d) => d.toISOString().slice(0, 10), (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }));
export const aggregateByMonth = (moments: LifeMoment[]) => aggregate(moments, (d) => d.toISOString().slice(0, 7), (d) => d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }));
export const aggregateByHour = (moments: LifeMoment[]) => aggregate(moments, (d) => String(d.getUTCHours()).padStart(2, "0"), (d) => `${String(d.getUTCHours()).padStart(2, "0")}:00`);

export function analyzeListeningPatterns(moments: LifeMoment[]) {
  const music = moments.filter((moment) => moment.kind === "music");
  const [artist, artistCount] = topEntry(countBy(music.map((moment) => moment.subtitle)));
  const completed = music.filter((moment) => moment.completed).length;
  return { artist, artistCount, completed, skipped: music.length - completed, completionRate: Math.round((completed / Math.max(music.length, 1)) * 100) };
}

export function analyzeTimePatterns(moments: LifeMoment[]) {
  const hours = aggregateByHour(moments);
  const peak = [...hours].sort((a, b) => b.count - a.count)[0];
  const lateNight = moments.filter((moment) => { const h = new Date(moment.occurredAt).getUTCHours(); return h < 2 || h >= 23; });
  const weekend = moments.filter((moment) => [0, 6].includes(new Date(moment.occurredAt).getUTCDay())).length;
  return { peakHour: peak?.label ?? "—", peakCount: peak?.count ?? 0, lateNight, weekendShare: Math.round((weekend / Math.max(moments.length, 1)) * 100) };
}

export function analyzeTransactionPatterns(moments: LifeMoment[]) {
  const transactions = moments.filter((moment) => moment.kind === "transaction");
  const [category, count] = topEntry(countBy(transactions.map((moment) => moment.category)));
  const [paymentMethod, paymentCount] = topEntry(countBy(transactions.map((moment) => moment.paymentMethod ?? "Unknown")));
  return { category, count, paymentMethod, paymentCount, total: transactions.reduce((sum, moment) => sum + (moment.value ?? 0), 0) };
}

export function findTemporalConnections(moment: LifeMoment, moments: LifeMoment[], hours = 72) {
  const sourceTime = new Date(moment.occurredAt).getTime();
  return moments.filter((candidate) => candidate.id !== moment.id && Math.abs(new Date(candidate.occurredAt).getTime() - sourceTime) <= hours * 3600000).sort((a, b) => Math.abs(new Date(a.occurredAt).getTime() - sourceTime) - Math.abs(new Date(b.occurredAt).getTime() - sourceTime)).slice(0, 4);
}

export function generateInsights(moments: LifeMoment[]): Insight[] {
  const listening = analyzeListeningPatterns(moments);
  const time = analyzeTimePatterns(moments);
  const spending = analyzeTransactionPatterns(moments);
  const busiest = [...aggregateByMonth(moments)].sort((a, b) => b.count - a.count)[0];
  return [
    { id: "return", label: "A recurring voice", title: listening.artist, description: `The artist appearing most often in this sample, across ${listening.artistCount} listening moments.`, stat: `${listening.artistCount} returns`, tone: "blue" },
    { id: "night", label: "After midnight", title: "The late hours held their own rhythm", description: `${time.lateNight.length} recorded moments happened between 11pm and 2am. This is an observed time pattern, not an explanation.`, stat: `${time.lateNight.length} moments`, tone: "coral" },
    { id: "spend", label: "A familiar ritual", title: spending.category, description: `This was the most repeated transaction category in the available sample.`, stat: `${spending.count} receipts`, tone: "ochre" },
    { id: "season", label: "The busiest passage", title: busiest?.label ?? "No period", description: `More traces gathered here than in any other sampled month.`, stat: `${busiest?.count ?? 0} traces`, tone: "sage" },
  ];
}

export function generateChapters(moments: LifeMoment[]): Chapter[] {
  return aggregateByMonth(moments).filter((period) => period.count >= 3).slice(0, 4).map((period, index) => {
    const music = period.music;
    const transactions = period.transactions;
    const late = period.moments.filter((m) => new Date(m.occurredAt).getUTCHours() < 2).length;
    const titles = late >= 2 ? ["The Night Shift", "After Hours"] : transactions > music / 2 ? ["The Errand Days", "Out in the World"] : ["The Return", "A Listening Season"];
    return { id: period.key, title: titles[index % 2] ?? "A Recorded Passage", range: period.label, description: `${period.count} traces form a small chapter: ${music} listening moments and ${transactions} receipts${late ? `, including ${late} after midnight` : ""}.`, stats: [`${music} songs`, `${transactions} receipts`, `${period.count} total traces`], moments: period.moments };
  });
}

export function byKind(moments: LifeMoment[], kind: MomentKind | "all") { return kind === "all" ? moments : moments.filter((moment) => moment.kind === kind); }