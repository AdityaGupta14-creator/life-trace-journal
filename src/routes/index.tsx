import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Music2, ReceiptText, Sparkles, BookOpen, Layers } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LifeTraceShell, SectionLabel } from "@/components/lifetrace-shell";
import { LifeField } from "@/components/life-field";
import { TraceDialog } from "@/components/trace-dialog";
import { aggregateByMonth, generateChapters, generateInsights, type AggregatePoint } from "@/lib/lifetrace-analysis";
import { datasetScale, archiveSummary, initialMoments, fetchAllMoments, type LifeMoment } from "@/lib/lifetrace-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LIFE//TRACE — A life leaves traces" },
      {
        name: "description",
        content: "Explore 152,321 digital traces spanning 11 years: 149,860 music listening records and 2,461 household transactions gathered into patterns, connections, and chapters.",
      },
      { property: "og:title", content: "LIFE//TRACE — A life leaves traces" },
      {
        property: "og:description",
        content: "An interactive editorial archive where fragmented digital records become a story.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiscoverPage,
});

const tones = {
  blue: "bg-dusty-blue",
  sage: "bg-sage",
  ochre: "bg-ochre",
  coral: "bg-coral",
} as const;

function DiscoverPage() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [moments, setMoments] = useState<LifeMoment[]>(initialMoments);
  const [selectedTraceMoment, setSelectedTraceMoment] = useState<LifeMoment | null>(null);

  // Background fetch full moments for trace connections
  useEffect(() => {
    fetchAllMoments().then((data) => {
      setMoments(data);
    });
  }, []);

  const insights = useMemo(() => generateInsights(moments), [moments]);
  const chapters = useMemo(() => generateChapters(moments), [moments]);
  const periods = useMemo(() => {
    if (archiveSummary?.months) {
      return archiveSummary.months.map((m) => ({
        key: m.key,
        label: m.label,
        count: m.count,
        music: m.music,
        transactions: m.transactions,
        moments: moments.filter((item) => item.occurredAt.startsWith(m.key)),
      }));
    }
    return aggregateByMonth(moments);
  }, [moments]);

  const [selectedPeriod, setSelectedPeriod] = useState<AggregatePoint | null>(periods[0] ?? null);

  const handlePeriodSelect = (point: AggregatePoint) => {
    setSelectedPeriod(point);
  };

  const handleEnterPassage = (periodKey?: string) => {
    const key = periodKey || selectedPeriod?.key || "2017-08";
    navigate({
      to: "/journey",
      search: { period: key } as any,
    });
  };

  return (
    <LifeTraceShell>
      {/* Hero Section */}
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-12 md:px-10 md:pb-24 md:pt-16">
        <div className="grid items-end gap-12 lg:grid-cols-[1.45fr_0.55fr]">
          <div className="min-w-0">
            <div className="mb-6 flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[10px] sm:tracking-[0.2em]">
              <span className="inline-block size-1.5 rounded-full bg-ochre" />
              <span>Digital Archaeology · Archive 2013—2024</span>
              <span>·</span>
              <span>11 Years of Recorded Traces</span>
            </div>
            <h1 className="font-display text-[clamp(3.5rem,11vw,11rem)] leading-[0.8] tracking-tight">
              LIFE<span className="text-muted-foreground">//</span>TRACE
            </h1>
            <p className="mt-10 font-display text-3xl italic text-foreground md:text-5xl lg:text-6xl">
              A life leaves traces.
            </p>
          </div>

          <div className="border-t border-border pt-5 text-sm leading-6 text-muted-foreground lg:mb-2">
            Fragments of listening and household transactions, gathered into observable patterns. Not a verdict or causal claim—an archival invitation to touch real evidence through time.
          </div>
        </div>

        {/* Dataset Scale Indicator */}
        <div className="mt-14 grid grid-cols-2 border-y border-border md:mt-20 md:w-3/4 lg:w-2/3">
          <div className="py-6 pr-6">
            <div className="font-display text-4xl md:text-6xl">{datasetScale.music.toLocaleString()}</div>
            <div className="mt-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <Music2 className="size-3 text-dusty-blue" />
              <span>Music moments (Spotify 2013—2024)</span>
            </div>
          </div>
          <div className="border-l border-border py-6 pl-6">
            <div className="font-display text-4xl md:text-6xl">{datasetScale.transactions.toLocaleString()}</div>
            <div className="mt-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <ReceiptText className="size-3 text-ochre" />
              <span>Financial receipts ({datasetScale.householdTransactions.toLocaleString()} household + {datasetScale.indiaTransactions.toLocaleString()} card)</span>
            </div>
          </div>
        </div>
        <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Total Archive: {datasetScale.total.toLocaleString()} recorded moments across 11 calendar years
        </div>

        {/* Archival Progression Cue */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span>Raw Receipts</span>
            <span>→</span>
            <span>Moments</span>
            <span>→</span>
            <span>Connections</span>
            <span>→</span>
            <span>Patterns</span>
            <span>→</span>
            <span className="text-foreground">Chapters</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Explore the temporal field below</span>
            <ArrowDownRight className="size-4" />
          </div>
        </div>
      </section>

      {/* 01 · Life Field Section */}
      <section aria-labelledby="field-title" className="border-t border-border">
        <div className="mx-auto max-w-[1440px] px-5 pt-16 md:px-10">
          <SectionLabel>01 · The Temporal Field</SectionLabel>
          <div className="mb-10 grid gap-6 md:grid-cols-2">
            <h2 id="field-title" className="font-display text-5xl leading-tight md:text-7xl">
              Every mark<br />
              <em className="italic">recorded in time.</em>
            </h2>
            <div className="self-end space-y-3">
              <p className="text-sm leading-6 text-muted-foreground">
                The field aggregates 152,321 records across 138 monthly intervals from 2013 to 2024. Dusty blue points denote streaming sessions; ochre points denote periods with overlapping daily household transactions.
              </p>
              <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-dusty-blue" />
                  <span>Music Density</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-ochre" />
                  <span>Overlapping Receipts (2015-2018)</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Life Field Visualization */}
        <LifeField points={periods} onSelect={handlePeriodSelect} />

        {/* Selected Field Region Action Bar */}
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-6 md:px-10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Passage selected:
            </span>
            <span className="font-display text-lg text-foreground">
              {selectedPeriod?.label ?? "August 2017"}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              ({selectedPeriod?.count.toLocaleString() ?? "3,485"} traces)
            </span>
          </div>
          <Button
            variant="editorial"
            onClick={() => handleEnterPassage(selectedPeriod?.key)}
            className="flex items-center gap-2"
          >
            <span>Enter this passage in Journey</span>
            <ArrowUpRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* 02 · Discoveries Section */}
      <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
        <SectionLabel>02 · Archival Discoveries</SectionLabel>
        <div className="grid border-t border-border md:grid-cols-2">
          {insights.map((insight, index) => (
            <motion.article
              key={insight.id}
              whileHover={prefersReducedMotion ? {} : { y: -3 }}
              className={`relative min-h-72 border-b border-border p-6 md:p-10 ${
                index % 2 === 1 ? "md:border-l" : ""
              }`}
            >
              <span className={`absolute right-6 top-7 size-3 rounded-full ${tones[insight.tone]}`} />
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                {insight.label}
              </div>
              <h3 className="mt-8 max-w-lg font-display text-4xl leading-tight md:text-5xl">
                {insight.title}
              </h3>
              <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                {insight.description}
              </p>
              <div className="mt-8 flex items-center justify-between border-t border-dashed border-border pt-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Observed record
                </span>
                <span className="font-mono text-[11px] font-medium uppercase text-foreground">
                  {insight.stat}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* 03 · Chapters Section */}
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-32">
          <SectionLabel className="text-paper/70 before:bg-paper/30">03 · Chapters</SectionLabel>
          <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <h2 className="font-display text-6xl leading-[0.9] md:text-8xl">
                The archive,<br />
                <em className="italic text-paper/80">in passages.</em>
              </h2>
              <p className="mt-6 max-w-sm text-sm leading-6 text-paper/70">
                Data-driven chapters derived from real historical density shifts, catalog playthroughs, and transaction logging periods.
              </p>
            </div>

            <div className="border-t border-paper/30">
              {chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  onClick={() => handleEnterPassage(chapter.range.slice(0, 7))}
                  className="group grid cursor-pointer gap-4 border-b border-paper/20 py-7 transition-colors hover:bg-paper/5 focus-visible:outline-2 focus-visible:outline-paper md:grid-cols-[50px_1fr_auto]"
                >
                  <span className="font-mono text-[10px] text-paper/50">0{index + 1}</span>
                  <div>
                    <h3 className="font-display text-3xl transition-transform group-hover:translate-x-1 md:text-4xl">
                      {chapter.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-paper/70">
                      {chapter.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-wider text-paper/50">
                      {chapter.stats.map((stat, i) => (
                        <span key={i} className="border border-paper/20 px-2 py-0.5">
                          {stat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="self-center font-mono text-[10px] uppercase text-paper/60 group-hover:text-paper">
                    <span>{chapter.range}</span>
                    <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">↗</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Follow the Trace Dialog when inspecting moments */}
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