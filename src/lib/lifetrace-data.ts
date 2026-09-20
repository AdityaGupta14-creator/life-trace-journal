export type MomentKind = "music" | "transaction";
export type MomentCategory = "Music" | "Food" | "Transportation" | "Subscriptions" | "Other";

export type LifeMoment = {
  id: string;
  kind: MomentKind;
  category: MomentCategory;
  occurredAt: string;
  title: string;
  subtitle: string;
  detail: string;
  value?: number;
  completed?: boolean;
  paymentMethod?: string;
};

const artists = ["Bon Iver", "Nina Simone", "Radiohead", "Khruangbin", "Joni Mitchell", "The National"];
const tracks = ["Holocene", "Sinnerman", "Reckoner", "Friday Morning", "A Case of You", "Light Years"];
const merchants = ["Corner Table", "Metro Transit", "The Reading Room", "North Star Coffee", "Mubi", "Sunday Market"];
const transactionCategories: MomentCategory[] = ["Food", "Transportation", "Other", "Food", "Subscriptions", "Other"];

function dateFor(index: number, hour: number) {
  const date = new Date(Date.UTC(2022 + Math.floor(index / 24), (index * 3) % 12, 2 + ((index * 7) % 25), hour, (index * 11) % 60));
  return date.toISOString();
}

const sampleMusic: LifeMoment[] = Array.from({ length: 48 }, (_, index) => {
  const artistIndex = index % artists.length;
  const hour = index % 5 === 0 ? 0 + (index % 3) : 7 + ((index * 4) % 16);
  return {
    id: `m-${index + 1}`,
    kind: "music",
    category: "Music",
    occurredAt: dateFor(index, hour),
    title: tracks[artistIndex],
    subtitle: artists[artistIndex],
    detail: index % 4 === 0 ? "Skipped after the first minute" : "Listened through",
    completed: index % 4 !== 0,
  };
});

const sampleTransactions: LifeMoment[] = Array.from({ length: 18 }, (_, index) => {
  const merchantIndex = index % merchants.length;
  const anchor = index * 2;
  const hour = 8 + ((index * 5) % 13);
  return {
    id: `t-${index + 1}`,
    kind: "transaction",
    category: transactionCategories[merchantIndex],
    occurredAt: dateFor(anchor, hour),
    title: merchants[merchantIndex],
    subtitle: transactionCategories[merchantIndex],
    detail: index % 3 === 0 ? "Paid with mobile wallet" : "Paid with card",
    value: 4.5 + ((index * 13) % 47),
    paymentMethod: index % 3 === 0 ? "Mobile wallet" : "Card",
  };
});

export const lifeMoments = [...sampleMusic, ...sampleTransactions].sort(
  (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
);

export const datasetScale = { music: 149860, transactions: 2461 };

export interface LifeDataAdapter {
  getMoments(): Promise<LifeMoment[]>;
}

export const mockLifeDataAdapter: LifeDataAdapter = {
  async getMoments() {
    return lifeMoments;
  },
};