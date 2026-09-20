import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowRight, Calendar, Filter, Footprints, Music2, ReceiptText, Sparkles } from "lucide-react";
import { LifeTraceShell, PageIntro, SectionLabel } from "@/components/lifetrace-shell";
import { Button } from "@/components/ui/button";
import { TraceDialog } from "@/components/trace-dialog";
import {
  aggregateByDay,
  aggregateByHour,
  aggregateByMonth,
  aggregateByYear,
  byKind,
  generatePeriodSummary,
  type AggregatePoint,
} from "@/lib/lifetrace-analysis";
import {
  archiveSummary,
  fetchAllMoments,
  initialMoments,
  type LifeMoment,
  type MomentKind,
} from "@/lib/lifetrace-data";

export const Route = createFileRoute("/journey")({
  validateSearch: (search: Record<string, unknown>) => ({
    period: (search["period"] as string) || undefined,
    scale: (search["scale"] as "year" | "month" | "day") || undefined,
    kind: (search["kind"] as MomentKind | "all") || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Journey — LIFE//TRACE" },
      {
        name: "description",
        content: "Move through a digital life by year, month, and day. Discover period overviews, factual narratives, representative moments, and connected traces.",
      },
      { property: "og:title", content: "Journey — LIFE//TRACE" },
      {
        property: "og:description",
        content: "An interactive editorial temporal passage through listening and transaction traces.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JourneyPage,
});

function JourneyPage() {
  const search = Route.useSearch();
  const periodParam = search.period;
  const [scale, setScale] = useState<"year" | "month" | "day">(
    search.scale || (periodParam && periodParam.length === 4 ? "year" : "month")
  );
  const [kind, setKind] = useState<MomentKind | "all">(search.kind || "all");
  const [moments, setMoments] = useState<LifeMoment[]>(initialMoments);
  const [selectedTraceMoment, setSelectedTraceMoment] = useState<LifeMoment | null>(null);

  const navigate = Route.useNavigate();

  // Background fetch full moments
  useEffect(() => {
    fetchAllMoments().then((data) => {
      setMoments(data);
    });
  }, []);

  const filtered = useMemo(() => byKind(moments, kind), [moments, kind]);

  // Aggregate points based on chosen scale
  const points: AggregatePoint[] = useMemo(() => {
    if (scale === "year") {
      if (archiveSummary?.years && kind === "all") {
        return archiveSummary.years.map((y) => ({
          key: y.key,
          label: y.key,
          count: y.music + y.transactions,
          music: y.music,
          transactions: y.transactions,
          moments: moments.filter((m) => m.occurredAt.startsWith(y.key)),
        }));
      }
      return aggregateByYear(filtered);
    }
    if (scale === "month") {
      if (archiveSummary?.months && kind === "all") {
        return archiveSummary.months.map((m) => ({
          key: m.key,
          label: m.label,
          count: m.count,
          music: m.music,
          transactions: m.transactions,
          moments: moments.filter((item) => item.occurredAt.startsWith(m.key)),
        }));
      }
      return aggregateByMonth(filtered);
    }
    return aggregateByDay(filtered);
  }, [filtered, moments, scale, kind]);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    if (containerRef.current) {
      const observer = new ResizeObserver((entries) => {
        setContainerWidth(entries[0]?.contentRect.width ?? 800);
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
    return () => {};
  }, []);

  const itemSize = useMemo(() => {
    if (scale === "year") {
      return Math.max(64, containerWidth > 0 && points.length > 0 ? Math.floor(containerWidth / points.length) : 64);
    }
    return scale === "month" ? 28 : 12;
  }, [scale, containerWidth, points.length]);

  const virtualizer = useVirtualizer({
    count: points.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => itemSize,
    horizontal: true,
    overscan: 12,
  });

  // Default active index: choose 2017 or a dense month
  const defaultIndex = useMemo(() => {
    if (!points.length) return 0;
    if (periodParam) {
      const pIdx = points.findIndex((p) => p.key === periodParam || p.key.startsWith(periodParam));
      if (pIdx >= 0) return pIdx;
    }
    const peakIdx = points.findIndex((p) => p.key.includes("2017-08") || p.key === "2017");
    return peakIdx >= 0 ? peakIdx : Math.min(10, points.length - 1);
  }, [points, periodParam]);

  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  // Sync activeIndex if periodParam changes
  useEffect(() => {
    if (periodParam && points.length > 0) {
      const pIdx = points.findIndex((p) => p.key === periodParam || p.key.startsWith(periodParam));
      if (pIdx >= 0) setActiveIndex(pIdx);
    }
  }, [periodParam, points]);

  const activePoint = points[Math.min(activeIndex, Math.max(points.length - 1, 0))];
  const currentInspectPoint = (hoveredIndex !== null && points[hoveredIndex]) ? points[hoveredIndex] : activePoint;

  // Calculate real period summary & factual narrative using true aggregate counts
  const periodSummary = useMemo(() => {
    if (!activePoint) return null;
    return generatePeriodSummary(activePoint.key, moments, activePoint);
  }, [activePoint, moments]);

  // Sync back to URL
  useEffect(() => {
    navigate({
      search: (prev) => ({
        ...prev,
        period: activePoint?.key || undefined,
        scale,
        kind,
      }),
      replace: true,
    });
  }, [activePoint?.key, scale, kind, navigate]);

  const maxCount = Math.max(...points.map((p) => p.count), 1);

  return (
    <LifeTraceShell>
      <PageIntro
        index="02"
        eyebrow="Journey"
        title="Move through the traces."
      >
        A temporal map across 11 recorded years. Zoom between year, month, and day perspectives. The scale adjusts; the underlying records remain authentic.
      </PageIntro>

      <section className="mx-auto max-w-[1440px] px-5 pb-28 md:px-10">
        {/* Controls Bar */}
        <div className="flex flex-col justify-between gap-5 border-y border-border py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground mr-2">
              Time scale:
            </span>
            <div className="flex gap-1" role="group" aria-label="Time scale">
              {(["year", "month", "day"] as const).map((item) => (
                <Button
                  key={item}
                  variant={scale === item ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setScale(item);
                    setActiveIndex(0);
                    setHoveredIndex(null);
                  }}
                  className="capitalize font-mono text-xs"
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground mr-2">
              Receipt type:
            </span>
            <div className="flex gap-1" role="group" aria-label="Moment type">
              {(["all", "music", "transaction"] as const).map((item) => (
                <Button
                  key={item}
                  variant={kind === item ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setKind(item);
                    setActiveIndex(0);
                    setHoveredIndex(null);
                  }}
                  className="capitalize font-mono text-xs"
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Temporal Cluster Exploration */}
        {points.length > 0 ? (
          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 max-w-full">
              <div className="flex items-center justify-between">
                <SectionLabel>Select a temporal passage</SectionLabel>
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {points.length} periods mapped · hover bar for details
                </span>
              </div>

              {/* Dynamic Live Inspector HUD */}
              <div className="mt-3 mb-2 flex flex-wrap items-center justify-between gap-3 border border-border bg-card/85 px-4 py-2.5 font-mono text-xs shadow-xs transition-colors">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        currentInspectPoint && currentInspectPoint.transactions > 0
                          ? "var(--ochre)"
                          : "var(--dusty-blue)",
                    }}
                  />
                  <span className="font-semibold text-foreground text-sm">
                    {currentInspectPoint?.label}
                  </span>
                  <span className="text-muted-foreground">
                    ({currentInspectPoint?.count.toLocaleString()} total traces)
                  </span>
                  {hoveredIndex !== null && hoveredIndex !== activeIndex ? (
                    <span className="rounded bg-muted px-2 py-0.5 text-[9px] text-muted-foreground uppercase tracking-wider">
                      Hover Preview · Click to select
                    </span>
                  ) : (
                    <span className="rounded bg-foreground/10 px-2 py-0.5 text-[9px] text-foreground uppercase tracking-wider font-medium">
                      Selected Passage
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-dusty-blue font-medium">
                    <Music2 className="size-3.5" />
                    <span>{currentInspectPoint?.music.toLocaleString()} music</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-ochre font-medium">
                    <ReceiptText className="size-3.5" />
                    <span>{currentInspectPoint?.transactions.toLocaleString()} receipts</span>
                  </span>
                </div>
              </div>

              {/* Scrollable Bar Cluster */}
              <div
                ref={containerRef}
                className="h-[390px] w-full overflow-x-auto overflow-y-hidden border-b border-border pt-16 pb-2 select-none"
                role="listbox"
                aria-label="Temporal activity clusters"
                tabIndex={0}
              >
                <div
                  style={{
                    width: `${virtualizer.getTotalSize()}px`,
                    height: "100%",
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const index = virtualItem.index;
                    const point = points[index];
                    if (!point) return null;
                    const isSelected = index === activeIndex;
                    const isHovered = index === hoveredIndex;
                    const hasTx = point.transactions > 0;
                    const heightPercent = Math.max(10, (point.count / maxCount) * 82);

                    return (
                      <div
                        key={virtualItem.key}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: `${virtualItem.size}px`,
                          height: "100%",
                          transform: `translateX(${virtualItem.start}px)`,
                        }}
                        className="px-px"
                      >
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => setActiveIndex(index)}
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          onFocus={() => setHoveredIndex(index)}
                          onBlur={() => setHoveredIndex(null)}
                          className="group relative flex h-full w-full items-end justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none"
                          title={`${point.label}: ${point.count.toLocaleString()} traces (${point.music.toLocaleString()} music, ${point.transactions.toLocaleString()} receipts)`}
                        >
                          {/* Floating tooltip on hover */}
                          <div
                            className={`pointer-events-none absolute left-1/2 -translate-x-1/2 z-30 transition-all duration-150 ${
                              isHovered
                                ? "flex flex-col items-center opacity-100"
                                : "hidden group-hover:flex flex-col items-center opacity-0 group-hover:opacity-100"
                            }`}
                            style={{ bottom: `calc(${heightPercent}% + 8px)` }}
                          >
                            <div className="rounded border border-foreground bg-popover px-2.5 py-1.5 shadow-paper text-left whitespace-nowrap min-w-[110px]">
                              <div className="font-mono text-[10px] font-bold text-foreground">
                                {point.label}
                              </div>
                              <div className="font-mono text-[10px] text-foreground/85 mt-0.5">
                                {point.count.toLocaleString()} total
                              </div>
                              <div className="mt-1 flex items-center justify-between gap-2 font-mono text-[9px] border-t border-border pt-1">
                                <span className="text-dusty-blue font-medium">{point.music.toLocaleString()} m</span>
                                <span className="text-ochre font-medium">{point.transactions.toLocaleString()} tx</span>
                              </div>
                            </div>
                          </div>

                          <div
                            className="w-full bg-dusty-blue/70 transition-all group-hover:bg-dusty-blue"
                            style={{ height: `${heightPercent}%` }}
                          />
                          {hasTx && (
                            <div
                              className="absolute bottom-0 w-full bg-ochre transition-all group-hover:bg-ochre/80"
                              style={{
                                height: `${Math.max(4, (point.transactions / maxCount) * 82)}%`,
                              }}
                            />
                          )}
                          {isSelected && (
                            <div className="absolute -bottom-2.5 size-1.5 rounded-full bg-foreground" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>


              {/* Timeline Bounds */}
              <div className="mt-3 flex justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                <span>{points[0]?.label}</span>
                <span>{points[Math.floor(points.length / 2)]?.label}</span>
                <span>{points[points.length - 1]?.label}</span>
              </div>

              {/* Factual Contextual Narrative - Responsive wrapped text */}
              {periodSummary && (
                <div className="mt-10 border-t border-border pt-8 max-w-full lg:max-w-3xl">
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    Contextual Archival Narrative
                  </div>
                  <blockquote className="mt-4 border-l-2 border-foreground/30 pl-4 py-1">
                    <p className="font-display text-lg sm:text-xl md:text-2xl leading-relaxed text-foreground break-words whitespace-normal">
                      "{periodSummary.narrative}"
                    </p>
                  </blockquote>
                  <p className="mt-3 font-mono text-[10px] text-muted-foreground">
                    Derived strictly from observable record tallies. No personal or causal assumptions made.
                  </p>
                </div>
              )}
            </div>

            {/* Selected Period Details Sidebar */}
            <aside className="border-t border-foreground pt-5 lg:border-l lg:border-t-0 lg:pl-8">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                Selected Period Overview
              </div>
              <h2 className="mt-4 font-display text-4xl text-foreground">
                {activePoint?.label}
              </h2>

              {/* Activity Mix */}
              <div className="mt-6 grid grid-cols-2 gap-4 border-y border-border py-4 font-mono">
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Music2 className="size-3.5 text-dusty-blue" />
                    <span>Music</span>
                  </div>
                  <strong className="mt-2 block font-display text-3xl font-normal">
                    {activePoint?.music.toLocaleString()}
                  </strong>
                  <span className="text-[10px] text-muted-foreground">listening moments</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <ReceiptText className="size-3.5 text-ochre" />
                    <span>Receipts</span>
                  </div>
                  <strong className="mt-2 block font-display text-3xl font-normal">
                    {activePoint?.transactions.toLocaleString()}
                  </strong>
                  <span className="text-[10px] text-muted-foreground">daily transactions</span>
                </div>
              </div>

              {/* Observed Period Patterns */}
              {periodSummary && (
                <div className="mt-6 space-y-2">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Observed Patterns in this Period
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {periodSummary.patterns.map((pat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-foreground">·</span>
                        <span>{pat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Representative Moments */}
              <div className="mt-8">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Representative Moments ({Math.min(6, activePoint?.moments.length ?? 0)} shown of {activePoint?.count.toLocaleString()} total in passage)
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground">Click to Trace</span>
                </div>

                <div className="mt-4 space-y-3">
                  {(activePoint?.moments.slice(0, 6) ?? []).map((moment) => (
                    <button
                      key={moment.id}
                      onClick={() => setSelectedTraceMoment(moment)}
                      className="group flex w-full flex-col border border-border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-foreground hover:shadow-paper focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {moment.kind === "music" ? (
                            <Music2 className="size-3 text-dusty-blue" />
                          ) : (
                            <ReceiptText className="size-3 text-ochre" />
                          )}
                          <span className="font-mono text-[9px] uppercase text-muted-foreground">
                            {moment.kind}
                          </span>
                        </div>
                        <span className="font-mono text-[8px] text-muted-foreground">
                          {new Date(moment.occurredAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "UTC",
                          })}
                        </span>
                      </div>
                      <div className="mt-2 font-display text-base leading-snug group-hover:text-foreground">
                        {moment.title}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {moment.subtitle}
                      </div>
                      <div className="mt-2 flex items-center gap-1 font-mono text-[8px] uppercase tracking-wider text-foreground group-hover:underline">
                        <span>Follow trace</span>
                        <ArrowRight className="size-2.5" />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 border-t border-dashed border-border pt-3">
                  <Button variant="ghost" size="sm" asChild className="w-full justify-between font-mono text-xs">
                    <Link
                      to="/moments"
                      search={{
                        startDate: activePoint?.key.length === 4 ? `${activePoint.key}-01-01` : `${activePoint?.key}-01`,
                        endDate: activePoint?.key.length === 4 ? `${activePoint.key}-12-31` : `${activePoint?.key}-31`,
                      } as any}
                    >
                      <span>Explore all {activePoint?.count.toLocaleString()} in Moments</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="py-32 text-center">
            <h2 className="font-display text-4xl">No traces found in this period.</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Try choosing a broader time scale or choosing "All" receipt types.
            </p>
          </div>
        )}
      </section>

      {/* Follow the Trace Dialog */}
      <TraceDialog
        moment={selectedTraceMoment}
        moments={moments}
        open={Boolean(selectedTraceMoment)}
        onOpenChange={(open) => !open && setSelectedTraceMoment(null)}
        onMomentChange={setSelectedTraceMoment}
      />
    </LifeTraceShell>
  );
}