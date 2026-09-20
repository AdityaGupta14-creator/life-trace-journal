import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { ArrowDownUp, ChevronLeft, ChevronRight, Filter, Music2, ReceiptText, Search, X } from "lucide-react";
import { LifeTraceShell, PageIntro } from "@/components/lifetrace-shell";
import { TraceDialog } from "@/components/trace-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  archiveSummary,
  fetchAllMoments,
  initialMoments,
  type LifeMoment,
  type MomentCategory,
} from "@/lib/lifetrace-data";

export const Route = createFileRoute("/moments")({
  head: () => ({
    meta: [
      { title: "Moments — LIFE//TRACE" },
      {
        name: "description",
        content: "Search and inspect authentic music listening and household transaction artifacts inside LIFE//TRACE. Paginated archival explorer with temporal trace connections.",
      },
      { property: "og:title", content: "Moments — LIFE//TRACE" },
      {
        property: "og:description",
        content: "Find an artifact slip, inspect its timestamp, and follow nearby traces through time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    query: (search["query"] as string) || undefined,
    filter: (search["filter"] as (typeof filters)[number]) || undefined,
    startDate: (search["startDate"] as string) || undefined,
    endDate: (search["endDate"] as string) || undefined,
  }),
  component: MomentsPage,
});

const filters: (MomentCategory | "All" | "Transactions")[] = [
  "All",
  "Music",
  "Transactions",
  "Food",
  "Transportation",
  "Subscriptions",
  "Household",
  "Health",
  "Other",
];

const PAGE_SIZE = 24;

function MomentsPage() {
  const search = Route.useSearch();
  const [allMoments, setAllMoments] = useState<LifeMoment[]>(initialMoments);
  const [query, setQuery] = useState(search.query || "");
  const [filter, setFilter] = useState<(typeof filters)[number]>(search.filter || "All");
  const [startDate, setStartDate] = useState(search.startDate || "");
  const [endDate, setEndDate] = useState(search.endDate || "");
  const [ascending, setAscending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMoment, setSelectedMoment] = useState<LifeMoment | null>(null);

  // Sync state if search params change
  useEffect(() => {
    if (search.query !== undefined) setQuery(search.query);
    if (search.filter !== undefined) setFilter(search.filter);
    if (search.startDate !== undefined) setStartDate(search.startDate);
    if (search.endDate !== undefined) setEndDate(search.endDate);
  }, [search.query, search.filter, search.startDate, search.endDate]);

  // Background fetch full moments dataset (all 11,878 transactions + representative music)
  useEffect(() => {
    fetchAllMoments().then((data) => {
      setAllMoments(data);
    });
  }, []);

  // Filter and search against normalized indexed structures
  const filteredMoments = useMemo(() => {
    const q = query.toLowerCase().trim();

    return allMoments.filter((moment) => {
      // Category / Type filter
      if (filter !== "All") {
        if (filter === "Transactions") {
          if (moment.kind !== "transaction") return false;
        } else if (filter === "Music") {
          if (moment.kind !== "music") return false;
        } else {
          if (moment.category !== filter) return false;
        }
      }

      // Date range filter
      if (startDate && moment.occurredAt.slice(0, 10) < startDate) return false;
      if (endDate && moment.occurredAt.slice(0, 10) > endDate) return false;

      // Text search
      if (q) {
        const text = `${moment.title} ${moment.subtitle} ${moment.detail} ${moment.category} ${
          moment.paymentMethod || ""
        } ${moment.metadata?.album || ""} ${moment.metadata?.platform || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [allMoments, query, filter, startDate, endDate]);

  // Sort
  const sortedMoments = useMemo(() => {
    return [...filteredMoments].sort((a, b) => {
      const diff = new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
      return ascending ? diff : -diff;
    });
  }, [filteredMoments, ascending]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, filter, startDate, endDate, ascending]);

  // Pagination slice
  const totalItems = sortedMoments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const paginatedMoments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedMoments.slice(start, start + PAGE_SIZE);
  }, [sortedMoments, currentPage]);

  const clearFilters = () => {
    setQuery("");
    setFilter("All");
    setStartDate("");
    setEndDate("");
    setAscending(false);
  };

  const hasActiveFilters = Boolean(query || filter !== "All" || startDate || endDate);

  return (
    <LifeTraceShell>
      <PageIntro
        index="04"
        eyebrow="Moments"
        title="Find one fragment. Follow where it leads."
      >
        The individual receipts and listening moments that sit beneath every chapter and pattern. Search across 11 years of records without losing the archival thread.
      </PageIntro>

      <section className="mx-auto max-w-[1440px] px-5 pb-28 md:px-10">
        {/* Search & Sort Bar */}
        <div className="grid gap-4 border-y border-border py-4 md:grid-cols-[1fr_auto]">
          <label className="relative flex items-center">
            <Search className="absolute left-1 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <span className="sr-only">Search moments</span>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search artist, song, album, merchant, category, or platform…"
              className="h-11 rounded-none border-0 border-b border-border bg-transparent pl-8 font-interface text-sm shadow-none focus-visible:ring-0 focus-visible:border-foreground"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </label>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAscending((v) => !v)}
              className="font-mono text-xs flex items-center gap-1.5"
            >
              <ArrowDownUp className="size-3.5" />
              <span>{ascending ? "Oldest first" : "Newest first"}</span>
            </Button>
          </div>
        </div>

        {/* Date Range & Secondary Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-3 text-xs">
          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none" aria-label="Filter moments by category">
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`shrink-0 border-b-2 px-2 py-1 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                  filter === item
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Date range pickers */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <span>Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min="2013-07-08"
              max="2024-12-15"
              className="border border-border bg-card px-2 py-1 text-foreground focus:outline-none focus:border-foreground"
              aria-label="Start date filter"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min="2013-07-08"
              max="2024-12-15"
              className="border border-border bg-card px-2 py-1 text-foreground focus:outline-none focus:border-foreground"
              aria-label="End date filter"
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 font-mono text-[10px]">
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Archive Result Count & Active Filter Indicator */}
        <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>
            Displaying {paginatedMoments.length} of {totalItems.toLocaleString()} matching records
          </span>
          <span>
            Total archive: {archiveSummary.scale.total.toLocaleString()} moments (149.8k music · 2.4k receipts)
          </span>
        </div>

        {/* Artifact Grid Display */}
        {paginatedMoments.length > 0 ? (
          <div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedMoments.map((moment, index) => {
                const isMusic = moment.kind === "music";
                const dateObj = new Date(moment.occurredAt);
                const formattedDate = dateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                });
                const formattedTime = dateObj.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                });

                return (
                  <button
                    key={moment.id}
                    onClick={() => setSelectedMoment(moment)}
                    className={`group flex min-h-[260px] flex-col justify-between border border-border bg-card p-5 text-left shadow-paper transition-all hover:-translate-y-1 hover:border-foreground focus-visible:outline-2 focus-visible:outline-ring ${
                      index % 4 === 1
                        ? "rotate-[0.25deg]"
                        : index % 4 === 3
                        ? "-rotate-[0.25deg]"
                        : ""
                    }`}
                  >
                    <div>
                      {/* Card Header Stamp */}
                      <div className="flex items-center justify-between border-b border-dashed border-border pb-3">
                        <div className="flex items-center gap-1.5">
                          {isMusic ? (
                            <Music2 className="size-3.5 text-dusty-blue" />
                          ) : (
                            <ReceiptText className="size-3.5 text-ochre" />
                          )}
                          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                            {moment.category}
                          </span>
                        </div>
                        <span className="font-mono text-[8px] text-muted-foreground">
                          {formattedTime}
                        </span>
                      </div>

                      {/* Main Title & Subtitle */}
                      <h2 className="mt-4 font-display text-2xl leading-snug text-foreground group-hover:text-foreground line-clamp-2">
                        {moment.title}
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {moment.subtitle}
                      </p>
                    </div>

                    {/* Card Footer / Receipt details */}
                    <div className="mt-6 border-t border-dashed border-border pt-3">
                      <div className="flex items-center justify-between font-mono text-[9px] text-muted-foreground">
                        <span>{formattedDate}</span>
                        {moment.value !== undefined ? (
                          <span className="font-medium text-foreground">
                            {moment.currency ?? "INR"} {moment.value.toLocaleString()}
                          </span>
                        ) : (
                          <span>{moment.completed ? "Listened" : "Skipped"}</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-mono text-[8px] text-muted-foreground">
                          ID: {moment.id}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-foreground group-hover:underline">
                          Follow Trace →
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="font-mono text-xs flex items-center gap-1"
                  >
                    <ChevronLeft className="size-3.5" />
                    <span>Previous</span>
                  </Button>

                  <div className="flex items-center gap-1 font-mono text-xs">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        pageNum = Math.min(currentPage - 2 + i, totalPages - (4 - i));
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`size-8 border text-center transition-colors ${
                            currentPage === pageNum
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-foreground hover:bg-card"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="font-mono text-xs flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-28 text-center">
            <h2 className="font-display text-4xl">No matching traces found.</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Try a broader search term or clear the active date and category filters.
            </p>
            <Button className="mt-6" onClick={clearFilters}>
              Clear all filters
            </Button>
          </div>
        )}
      </section>

      {/* Follow the Trace Dialog */}
      <TraceDialog
        moment={selectedMoment}
        moments={allMoments}
        open={Boolean(selectedMoment)}
        onOpenChange={(open) => !open && setSelectedMoment(null)}
        onMomentChange={setSelectedMoment}
      />
    </LifeTraceShell>
  );
}