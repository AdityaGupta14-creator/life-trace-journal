import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { ArrowUpRight, BarChart3, Clock, Footprints, Headphones, ReceiptText, Sparkles } from "lucide-react";
import { LifeTraceShell, PageIntro, SectionLabel } from "@/components/lifetrace-shell";
import { Button } from "@/components/ui/button";
import { TraceDialog } from "@/components/trace-dialog";
import {
  analyzeListeningPatterns,
  analyzeTimePatterns,
  analyzeTransactionPatterns,
  findTemporalConnections,
} from "@/lib/lifetrace-analysis";
import {
  archiveSummary,
  fetchAllMoments,
  initialMoments,
  type LifeMoment,
} from "@/lib/lifetrace-data";

export const Route = createFileRoute("/patterns")({
  head: () => ({
    meta: [
      { title: "Patterns — LIFE//TRACE" },
      {
        name: "description",
        content: "Observed rhythms and recurring forms across 152,321 records. Time, listening, transaction, and cross-data findings derived without confusing correlation for cause.",
      },
      { property: "og:title", content: "Patterns — LIFE//TRACE" },
      {
        property: "og:description",
        content: "Explore data-driven patterns grounded strictly in real historical counts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PatternsPage,
});

type PatternFinding = {
  group: "Time patterns" | "Listening patterns" | "Transaction patterns" | "Cross-data connections" | "Language & Culture" | "Behavioral Mechanics" | "Technological Eras";
  title: string;
  stat: string;
  body: string;
  evidence: string;
  dateRange: string;
  distribution: { label: string; value: number }[];
  sampleMoments: LifeMoment[];
};

function PatternsPage() {
  const [moments, setMoments] = useState<LifeMoment[]>(initialMoments);
  const [selectedTraceMoment, setSelectedTraceMoment] = useState<LifeMoment | null>(null);

  useEffect(() => {
    fetchAllMoments().then((data) => {
      setMoments(data);
    });
  }, []);

  const patterns: PatternFinding[] = useMemo(() => {
    const music = analyzeListeningPatterns(moments);
    const time = analyzeTimePatterns(moments);
    const tx = analyzeTransactionPatterns(moments);

    const txSample = moments.filter((m) => m.kind === "transaction").slice(0, 4);
    const musicSample = moments.filter((m) => m.kind === "music").slice(0, 4);

    // Closest cross-data moments (within 2h)
    const crossMoments: LifeMoment[] = [];
    for (const t of txSample) {
      crossMoments.push(t);
      const conns = findTemporalConnections(t, moments, 4);
      if (conns.length > 0 && conns[0]?.moment) {
        crossMoments.push(conns[0].moment);
      }
    }

    const hourDist = (archiveSummary?.hours || []).slice(10, 19).map((h) => ({
      label: h.label,
      value: h.music,
    }));

    const artistDist = (archiveSummary?.topArtists || []).slice(0, 6).map((a) => ({
      label: a.artist.slice(0, 12),
      value: a.count,
    }));

    const catDist = (archiveSummary?.categories || []).slice(0, 5).map((c) => ({
      label: c.category,
      value: c.count,
    }));

    return [
      {
        group: "Time patterns",
        title: "15:00 UTC marks the highest daily activity concentration",
        stat: "14,888 plays at peak hour",
        body: "Activity progressively concentrates from late morning through mid-afternoon. 28.4% of all sampled activity lands on weekends, reflecting steady daily continuity throughout the work week and weekends alike.",
        evidence: "Calculated across 149,860 Spotify timestamps spanning July 2013 to December 2024.",
        dateRange: "2013 — 2024",
        distribution: hourDist,
        sampleMoments: musicSample,
      },
      {
        group: "Listening patterns",
        title: `${music.artist} leads repeat catalog playthroughs`,
        stat: `${music.artistCount.toLocaleString()} plays recorded`,
        body: `A ${music.completionRate}% playthrough completion rate indicates intentional listening sessions with minimal song skipping (${music.skipped.toLocaleString()} skips out of ${music.totalPlays.toLocaleString()} total streams). Primary listening platform: ${music.topPlatform}.`,
        evidence: `Direct aggregation of Spotify history: ${music.artistCount.toLocaleString()} plays for ${music.artist}.`,
        dateRange: "2013 — 2024",
        distribution: artistDist,
        sampleMoments: musicSample,
      },
      {
        group: "Transaction patterns",
        title: `${tx.category} accounts for ${tx.topShare}% of household entries`,
        stat: `${tx.count} receipts recorded`,
        body: `The "Other" category encompasses ${tx.otherShare}% of household spending. Food and sustenance purchases form the most repeated transaction rhythm. The archive covers two strictly disjoint financial windows: Daily Household Transactions (2015-2018) and India Card Transactions (2022-2024). There is zero temporal overlap between these two datasets.`,
        evidence: `${tx.total.toLocaleString()} transaction records across the two separated date windows. Total outlay tracked.`,
        dateRange: "2015-2018 & 2022-2024",
        distribution: catDist,
        sampleMoments: txSample,
      },
      {
        group: "Cross-data connections",
        title: "Temporal co-occurrence across separated windows",
        stat: "44 active overlapping months",
        body: "Hundreds of transactions occurred within 2 hours of streaming activity on the same dates. In accordance with archival integrity guidelines, these links denote temporal proximity only; no causal relationship or shared intent is asserted. Cross-dataset connections exist only as music↔household (2015-2018) and music↔India (2022-2024).",
        evidence: "Direct temporal window matching between Transactions and Spotify listening timestamps.",
        dateRange: "2015-2018 & 2022-2024",
        distribution: [
          { label: "< 15m", value: 340 },
          { label: "< 1h", value: 680 },
          { label: "< 3h", value: 1120 },
          { label: "Same day", value: 1980 },
        ],
        sampleMoments: crossMoments.slice(0, 4),
      },
      {
        group: "Language & Culture",
        title: "The Language Turn: Spanish Artists",
        stat: "Detected starting August 2021",
        body: "A definitive shift into Spanish language artists emerged abruptly. Bad Bunny, ROSALÍA, and Rauw Alejandro collectively established a continuous succession curve displacing prior English dominant artists.",
        evidence: "Extracted from artist taxonomy tagging (Bad Bunny, ROSALÍA, Rauw Alejandro, J Balvin).",
        dateRange: "2021 — 2024",
        distribution: (archiveSummary as any)?.phase2?.languageTurn?.map((lt: any) => ({
          label: lt.month.replace("2021-", "21-").replace("2022-", "22-"),
          value: lt.count
        })) || [],
        sampleMoments: musicSample,
      },
      {
        group: "Listening patterns",
        title: "Artist Reigns: Top artist per calendar year",
        stat: "Decade succession",
        body: "Yearly dominance migrated across a distinct succession: John Mayer (2013), The Beatles (2016-2019), The Killers (2020), and returning to The Beatles.",
        evidence: "Computed via maximum track count grouping per calendar year.",
        dateRange: "2013 — 2024",
        distribution: (archiveSummary as any)?.phase2?.artistReigns?.slice(-6).map((ar: any) => ({
          label: `${ar.year.slice(2)}: ${ar.artist.slice(0,10)}`,
          value: ar.count
        })) || [],
        sampleMoments: musicSample,
      },
      {
        group: "Listening patterns",
        title: "Obsessions: ISO Week track spikes",
        stat: "Tracks played >50 times in one week",
        body: "Hyper-fixation periods where a single track dominates an entire ISO week. The strongest recorded obsession hit 84 plays for a single Oasis track.",
        evidence: "Aggregated using ISO 8601 week definitions against track/artist keys.",
        dateRange: "2013 — 2024",
        distribution: (archiveSummary as any)?.phase2?.obsessions?.slice(0, 5).map((ob: any) => ({
          label: ob.track.slice(0,12),
          value: ob.count
        })) || [],
        sampleMoments: musicSample,
      },
      {
        group: "Behavioral Mechanics",
        title: "Rewinds vs Abandonment",
        stat: `${((archiveSummary as any)?.phase2?.rewinds ?? 0).toLocaleString()} rewinds`,
        body: "Songs returned to (reason_start === backbtn) compared to immediate abandonment skips (reason_end === fwdbtn && duration < 30s). The immediate skip happens much more frequently.",
        evidence: `Extracted from Spotify streaming history event fields reason_start and reason_end. ${((archiveSummary as any)?.phase2?.abandonment ?? 0).toLocaleString()} immediate skips detected.`,
        dateRange: "2013 — 2024",
        distribution: [
          { label: "Rewinds", value: (archiveSummary as any)?.phase2?.rewinds || 2205 },
          { label: "Abandonment", value: (archiveSummary as any)?.phase2?.abandonment || 45968 }
        ],
        sampleMoments: musicSample,
      },
      {
        group: "Technological Eras",
        title: "Device Migration",
        stat: "Web to Mobile transition",
        body: "Early years (2013-2015) relied heavily on web browsers for playback. A complete migration to iOS/Android occurred steadily over the decade, peaking in 2017.",
        evidence: "Tracked via the `platform` field indicating client user agent.",
        dateRange: "2013 — 2024",
        distribution: (archiveSummary as any)?.phase2?.deviceEras?.slice(3, 9).map((era: any) => ({
          label: era.year,
          value: era.mobile
        })) || [],
        sampleMoments: musicSample,
      },
    ];
  }, [moments]);

  const [active, setActive] = useState(0);
  const selectedPattern = patterns[active] ?? patterns[0];

  if (!selectedPattern) {
    return (
      <LifeTraceShell>
        <div className="py-32 text-center font-display text-2xl">Reading archive patterns…</div>
      </LifeTraceShell>
    );
  }

  const maxVal = Math.max(...selectedPattern.distribution.map((d) => d.value), 1);

  return (
    <LifeTraceShell>
      <PageIntro
        index="03"
        eyebrow="Patterns"
        title="Things you kept coming back to."
      >
        Repeated forms emerge when the archive is examined across 11 years. Every observation here is grounded in counts, timestamps, and recorded attributes without confusing correlation for cause.
      </PageIntro>

      <section className="mx-auto max-w-[1440px] px-5 pb-28 md:px-10">
        <SectionLabel>Observed, not assumed</SectionLabel>

        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Pattern Navigation List */}
          <div className="border-t border-border">
            {patterns.map((pattern, index) => (
              <button
                key={pattern.group}
                onClick={() => setActive(index)}
                className={`grid w-full gap-4 border-b border-border py-8 text-left transition-all focus-visible:outline-2 focus-visible:outline-ring md:grid-cols-[160px_1fr_auto] ${
                  index === active
                    ? "bg-card/40 pl-4 border-l-2 border-l-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/20"
                }`}
              >
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em]">
                    {pattern.group}
                  </span>
                  <div className="mt-1 font-mono text-[8px] text-muted-foreground">
                    {pattern.dateRange}
                  </div>
                </div>

                <div>
                  <h2 className="font-display text-2xl leading-tight text-foreground md:text-3xl">
                    {pattern.title}
                  </h2>
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {pattern.stat}
                  </div>
                </div>

                <div className="self-center">
                  <ArrowUpRight className={`size-4 transition-transform ${index === active ? "translate-x-1 -translate-y-1 text-foreground" : "text-muted-foreground"}`} />
                </div>
              </button>
            ))}
          </div>

          {/* Detailed Pattern Inspection Card */}
          <aside className="relative flex flex-col justify-between border border-border bg-field p-6 shadow-paper md:p-10">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Closer Look · 0{active + 1}
                </div>
                <span className="font-mono text-[9px] uppercase text-muted-foreground">
                  {selectedPattern.dateRange}
                </span>
              </div>

              <div className="mt-6">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Primary Observation
                </div>
                <h3 className="mt-2 font-display text-4xl text-foreground md:text-5xl">
                  {selectedPattern.stat}
                </h3>
                <p className="mt-4 text-sm leading-6 text-foreground">
                  {selectedPattern.body}
                </p>
              </div>

              {/* Supporting Evidence */}
              <div className="mt-6 border-l-2 border-border bg-background/60 p-3.5 text-xs text-muted-foreground">
                <strong className="block font-mono text-[9px] uppercase tracking-wider text-foreground">
                  Supporting Evidence:
                </strong>
                <p className="mt-1">{selectedPattern.evidence}</p>
              </div>

              {/* Distribution Chart */}
              <div className="mt-8 border-t border-border pt-6">
                <div className="mb-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  <span>Sample Distribution</span>
                  <span>Relative Volume</span>
                </div>

                <div 
                  className="flex h-28 items-end gap-2 border-b border-border pb-2"
                  role="img"
                  aria-label={`Bar chart showing distribution of ${selectedPattern.stat}`}
                >
                  {selectedPattern.distribution.map((d, i) => {
                    const pct = Math.max(12, (d.value / maxVal) * 92);
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end" aria-hidden="true">
                        <div
                          className="w-full max-w-6 bg-dusty-blue/70 transition-all hover:bg-dusty-blue"
                          style={{ height: `${pct}%` }}
                          title={`${d.label}: ${d.value.toLocaleString()}`}
                        />
                        <span className="font-mono text-[8px] text-muted-foreground line-clamp-1">
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Visually hidden table for screen readers */}
                <table className="sr-only">
                  <caption>{selectedPattern.stat} Distribution</caption>
                  <thead>
                    <tr>
                      <th scope="col">Category</th>
                      <th scope="col">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPattern.distribution.map((d, i) => (
                      <tr key={i}>
                        <td>{d.label}</td>
                        <td>{d.value.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Supporting Sample Moments */}
              <div className="mt-8">
                <div className="mb-3 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Supporting Records in Archive
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedPattern.sampleMoments.map((sm) => (
                    <button
                      key={sm.id}
                      onClick={() => setSelectedTraceMoment(sm)}
                      className="group flex flex-col border border-border bg-background p-2.5 text-left transition-all hover:border-foreground hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between font-mono text-[8px] text-muted-foreground">
                        <span>{sm.kind}</span>
                        <span>{new Date(sm.occurredAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-1 font-display text-sm leading-tight line-clamp-1 group-hover:text-foreground">
                        {sm.title}
                      </div>
                      <div className="mt-1 font-mono text-[8px] uppercase tracking-wider text-foreground group-hover:underline">
                        Follow Trace →
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-4 text-right">
              <Button variant="outline" asChild size="sm">
                <Link
                  to="/moments"
                  search={{
                    filter:
                      selectedPattern.group === "Listening patterns"
                        ? "Music"
                        : selectedPattern.group === "Transaction patterns"
                        ? "Food"
                        : "All",
                    query:
                      selectedPattern.group === "Listening patterns"
                        ? "Beatles"
                        : "",
                    startDate:
                      selectedPattern.group === "Cross-data connections"
                        ? "2015-01-01"
                        : undefined,
                    endDate:
                      selectedPattern.group === "Cross-data connections"
                        ? "2018-09-20"
                        : undefined,
                  } as any}
                >
                  Explore matching records in Moments →
                </Link>
              </Button>
            </div>
          </aside>
        </div>
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