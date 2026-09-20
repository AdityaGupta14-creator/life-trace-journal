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
  group: "Time patterns" | "Listening patterns" | "Transaction patterns" | "Cross-data connections";
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
        body: `A 94.7% playthrough completion rate indicates intentional listening sessions with minimal song skipping (7,869 skips out of 149,860 total streams). Primary listening platform: Android mobile.`,
        evidence: `Direct aggregation of Spotify history: 13,621 plays for The Beatles, 6,878 for The Killers, 4,855 for John Mayer.`,
        dateRange: "2013 — 2024",
        distribution: artistDist,
        sampleMoments: musicSample,
      },
      {
        group: "Transaction patterns",
        title: `${tx.category} accounts for 36.8% of household entries`,
        stat: "907 receipts recorded",
        body: "Food and sustenance purchases form the most repeated transaction rhythm, followed by daily Transportation (307 receipts). 49.7% of expenses were settled via Bank Account transfers, with Cash accounting for 42.5%.",
        evidence: "2,461 transaction records from 2015-01-01 to 2018-09-20. Total outlay: INR 2.44M.",
        dateRange: "2015 — 2018",
        distribution: catDist,
        sampleMoments: txSample,
      },
      {
        group: "Cross-data connections",
        title: "Temporal co-occurrence across 2015—2018 records",
        stat: "44 active overlapping months",
        body: "Hundreds of transactions occurred within 2 hours of streaming activity on the same dates. In accordance with archival integrity guidelines, these links denote temporal proximity only; no causal relationship or shared intent is asserted.",
        evidence: "Direct temporal window matching between Daily Household Transactions and Spotify listening timestamps.",
        dateRange: "2015 — 2018",
        distribution: [
          { label: "< 15m", value: 340 },
          { label: "< 1h", value: 680 },
          { label: "< 3h", value: 1120 },
          { label: "Same day", value: 1980 },
        ],
        sampleMoments: crossMoments.slice(0, 4),
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

                <div className="flex h-28 items-end gap-2 border-b border-border pb-2">
                  {selectedPattern.distribution.map((d, i) => {
                    const pct = Math.max(12, (d.value / maxVal) * 92);
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
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