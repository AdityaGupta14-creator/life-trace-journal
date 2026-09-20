import summaryData from "../data/archive-summary.json";
import initialMomentsData from "../data/initial-moments.json";

export type MomentKind = "music" | "transaction";
export type MomentCategory =
  | "Music"
  | "Food"
  | "Transportation"
  | "Subscriptions"
  | "Household"
  | "Health"
  | "Other"
  | "Online Shopping"
  | "Travel"
  | "Entertainment"
  | "Health & Fitness"
  | "Unrecorded";

export type LifeMoment = {
  id: string;
  kind: MomentKind;
  category: MomentCategory;
  timePrecision?: "minute" | "day";
  occurredAt: string;
  title: string;
  subtitle: string;
  detail: string;
  value?: number;
  currency?: string;
  completed?: boolean;
  paymentMethod?: string;
  subcategory?: string;
  note?: string;
  metadata?: {
    platform?: string;
    durationMs?: number;
    shuffle?: boolean;
    reasonStart?: string;
    reasonEnd?: string;
    album?: string;
    uri?: string;
    [key: string]: any;
  };
};

export type ArchiveSummary = typeof summaryData;

export const datasetScale = summaryData.scale;
export const archiveSummary: ArchiveSummary = summaryData;

// Initial 200 real records for immediate synchronous SSR hydration
export const initialMoments: LifeMoment[] = (initialMomentsData as any[]).map((m) => ({
  ...m,
  category: m.category as MomentCategory,
}));

// Default in-memory moments starting with initial real dataset
export let lifeMoments: LifeMoment[] = initialMoments;

let allMomentsCache: LifeMoment[] | null = null;
let loadPromise: Promise<LifeMoment[]> | null = null;

export async function fetchAllMoments(): Promise<LifeMoment[]> {
  if (allMomentsCache) return allMomentsCache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      if (typeof window !== "undefined") {
        const years = Array.from({ length: 12 }, (_, i) => 2013 + i);
        const fetches = years.map(year => 
          fetch(`/data/archive-moments-${year}.json`).then(res => res.ok ? res.json() : [])
        );
        const results = await Promise.all(fetches);
        const allData = results.flat();
        
        if (allData.length > 0) {
          allMomentsCache = allData as LifeMoment[];
          lifeMoments = allMomentsCache;
          return allMomentsCache;
        }
      }
    } catch (err) {
      console.warn("Could not fetch full archive moments, using initial moments:", err);
    }
    allMomentsCache = initialMoments;
    return initialMoments;
  })();

  return loadPromise;
}

export interface LifeDataAdapter {
  getSummary(): Promise<ArchiveSummary>;
  getMoments(): Promise<LifeMoment[]>;
  getMomentById(id: string): Promise<LifeMoment | null>;
  searchMoments(params: {
    query?: string;
    kind?: MomentKind | "all";
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
    ascending?: boolean;
  }): Promise<{ items: LifeMoment[]; total: number; page: number; totalPages: number }>;
}

export const archiveDataAdapter: LifeDataAdapter = {
  async getSummary() {
    return archiveSummary;
  },

  async getMoments() {
    return fetchAllMoments();
  },

  async getMomentById(id: string) {
    const moments = await fetchAllMoments();
    return moments.find((m) => m.id === id) ?? null;
  },

  async searchMoments({
    query = "",
    kind = "all",
    category = "All",
    startDate,
    endDate,
    page = 1,
    pageSize = 24,
    ascending = false,
  }) {
    const moments = await fetchAllMoments();
    const q = query.toLowerCase().trim();

    const filtered = moments.filter((m) => {
      if (kind !== "all" && m.kind !== kind) return false;
      if (category !== "All") {
        if (category === "Transactions" && m.kind !== "transaction") return false;
        if (category !== "Transactions" && m.category !== category) return false;
      }
      if (startDate && m.occurredAt < startDate) return false;
      if (endDate && m.occurredAt > endDate) return false;

      if (q) {
        const text = `${m.title} ${m.subtitle} ${m.detail} ${m.category} ${m.paymentMethod || ""} ${m.metadata?.album || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      const diff = new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
      return ascending ? diff : -diff;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      total,
      page: safePage,
      totalPages,
    };
  },
};

export const mockLifeDataAdapter = archiveDataAdapter;