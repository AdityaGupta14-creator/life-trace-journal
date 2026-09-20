import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { LifeTraceShell, PageIntro, SectionLabel } from "@/components/lifetrace-shell";
import { analyzeListeningPatterns, analyzeTimePatterns, analyzeTransactionPatterns, findTemporalConnections } from "@/lib/lifetrace-analysis";
import { lifeMoments } from "@/lib/lifetrace-data";

export const Route = createFileRoute("/patterns")({ head: () => ({ meta: [{ title: "Patterns — LIFE//TRACE" }, { name: "description", content: "Observed rhythms and recurring forms across a digital archive." }, { property: "og:title", content: "Patterns — LIFE//TRACE" }, { property: "og:description", content: "Explore listening, time, transaction, and cross-data patterns without confusing correlation for cause." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: PatternsPage });

function PatternsPage() {
  const patterns = useMemo(() => {
    const music = analyzeListeningPatterns(lifeMoments); const time = analyzeTimePatterns(lifeMoments); const transactions = analyzeTransactionPatterns(lifeMoments);
    const transaction = lifeMoments.find((m) => m.kind === "transaction"); const nearby = transaction ? findTemporalConnections(transaction, lifeMoments) : [];
    return [
      { group: "Time patterns", title: `${time.peakHour} gathers the most traces`, stat: `${time.peakCount} in sample`, body: `${time.weekendShare}% of sampled activity lands on weekends. This describes timing only.` },
      { group: "Music patterns", title: `${music.artist} keeps returning`, stat: `${music.artistCount} listens`, body: `${music.completionRate}% of sampled songs played through. Repetition is observed; meaning is left open.` },
      { group: "Transaction patterns", title: `${transactions.category} appears most often`, stat: `${transactions.count} receipts`, body: `${transactions.paymentMethod} is the most frequent payment method in this sample.` },
      { group: "Cross-data connections", title: `${nearby.length} moments sit close to one receipt`, stat: "within 72 hours", body: "These events are connected by temporal proximity. No causal relationship is implied." },
    ];
  }, []);
  const [active, setActive] = useState(0);
  const selectedPattern = patterns[active] ?? patterns[0];
  if (!selectedPattern) return <LifeTraceShell><div className="py-32 text-center"><h1 className="font-display text-4xl">No patterns yet.</h1><p className="mt-3 text-muted-foreground">Add records to begin finding repeated forms.</p></div></LifeTraceShell>;
  return <LifeTraceShell><PageIntro index="03" eyebrow="Patterns" title="Things you kept coming back to.">Repeated forms emerge when the archive is viewed from a distance. Every statement here can be traced to a count, time, or recorded field.</PageIntro>
      {patterns.map((pattern, index) => <button key={pattern.group} onClick={() => setActive(index)} className={`grid w-full gap-3 border-b border-border py-7 text-left transition-all focus-visible:outline-2 focus-visible:outline-ring md:grid-cols-[150px_1fr_auto] ${index === active ? "pl-4" : "text-muted-foreground hover:text-foreground"}`}><span className="font-mono text-[9px] uppercase tracking-[0.16em]">{pattern.group}</span><span className="font-display text-3xl">{pattern.title}</span><ArrowUpRight className="size-4" /></button>)}</div><aside className="relative min-h-[440px] overflow-hidden bg-field p-7 md:p-10"><div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border"/><div className="absolute bottom-8 left-8 top-8 border-l border-dashed border-border"/><div className="relative flex h-full flex-col justify-between"><div><div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Closer look · 0{active + 1}</div><h2 className="mt-8 font-display text-5xl">{selectedPattern.stat}</h2><p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">{selectedPattern.body}</p></div><div className="flex items-end gap-2" aria-hidden="true">{[28,54,39,76,48,91,63,34,70].map((height, i) => <span key={i} className={i === active + 4 ? "w-3 bg-coral" : "w-3 bg-sage"} style={{ height }} />)}</div></div></aside></div></section>
  </LifeTraceShell>;
}