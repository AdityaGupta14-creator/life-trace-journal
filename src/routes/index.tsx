import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Music2, ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LifeTraceShell, SectionLabel } from "@/components/lifetrace-shell";
import { LifeField } from "@/components/life-field";
import { aggregateByMonth, generateChapters, generateInsights } from "@/lib/lifetrace-analysis";
import { datasetScale, lifeMoments } from "@/lib/lifetrace-data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "LIFE//TRACE — A life leaves traces" },
    { name: "description", content: "Explore a digital life through receipts, listening moments, patterns, and connected chapters." },
    { property: "og:title", content: "LIFE//TRACE — A life leaves traces" },
    { property: "og:description", content: "An interactive editorial archive where fragmented digital records become a story." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: DiscoverPage,
});

const tones = { blue: "bg-dusty-blue", sage: "bg-sage", ochre: "bg-ochre", coral: "bg-coral" } as const;

function DiscoverPage() {
  const insights = useMemo(() => generateInsights(lifeMoments), []);
  const chapters = useMemo(() => generateChapters(lifeMoments), []);
  const periods = useMemo(() => aggregateByMonth(lifeMoments), []);
  const [selected, setSelected] = useState(periods[0]);
  return <LifeTraceShell>
    <section className="mx-auto max-w-[1440px] px-5 pb-20 pt-14 md:px-10 md:pb-28 md:pt-20">
      <div className="grid items-end gap-12 lg:grid-cols-[1.45fr_0.55fr]">
        <div><div className="mb-7 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">A digital archaeology · Archive 2022—2023</div><h1 className="font-display text-[clamp(4.5rem,13vw,12rem)] leading-[0.72] tracking-normal">LIFE<span className="text-muted-foreground">//</span>TRACE</h1><p className="mt-12 font-display text-3xl italic md:text-5xl">A life leaves traces.</p></div>
        <div className="border-t border-border pt-5 text-sm leading-6 text-muted-foreground lg:mb-2">Fragments of listening and spending, gathered into patterns you can touch. Not a verdict on a life—an invitation to look closer.</div>
      </div>
      <div className="mt-14 grid grid-cols-2 border-y border-border md:mt-20 md:w-1/2">
        <div className="py-5 pr-4"><div className="font-display text-3xl md:text-5xl">{datasetScale.music.toLocaleString()}</div><div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><Music2 className="size-3" /> music moments</div></div>
        <div className="border-l border-border py-5 pl-4"><div className="font-display text-3xl md:text-5xl">{datasetScale.transactions.toLocaleString()}</div><div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><ReceiptText className="size-3" /> transaction moments</div></div>
      </div>
      <div className="mt-12 flex items-center justify-between text-xs text-muted-foreground"><span>The field below holds an aggregated sample of the archive.</span><ArrowDownRight className="size-5" /></div>
    </section>

    <section aria-labelledby="picture-title"><div className="mx-auto max-w-[1440px] px-5 pt-20 md:px-10"><SectionLabel>01 · The big picture</SectionLabel><div className="mb-10 grid gap-5 md:grid-cols-2"><h2 id="picture-title" className="font-display text-5xl md:text-7xl">Every mark<br/><em>left something behind.</em></h2><p className="max-w-md self-end text-sm leading-6 text-muted-foreground">Move across the field to find denser seasons. Select a cluster to open that passage of time.</p></div></div><LifeField points={periods} onSelect={setSelected} /><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-10"><span className="font-mono text-[10px] uppercase tracking-[0.16em]">Selected · {selected?.label} · {selected?.count} sample traces</span><Button variant="editorial" asChild><Link to="/journey">Enter this passage <ArrowUpRight /></Link></Button></div></section>

    <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36"><SectionLabel>02 · A few things we noticed</SectionLabel><div className="grid border-t border-border md:grid-cols-2">
      {insights.map((insight, index) => <motion.article key={insight.id} whileHover={{ y: -3 }} className={`relative min-h-72 border-b border-border p-6 md:p-10 ${index % 2 ? "md:border-l" : ""}`}><span className={`absolute right-6 top-7 size-3 ${tones[insight.tone]}`} /><div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{insight.label}</div><h3 className="mt-10 max-w-lg font-display text-4xl leading-tight md:text-5xl">{insight.title}</h3><p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">{insight.description}</p><div className="absolute bottom-6 right-6 font-mono text-[10px] uppercase">{insight.stat}</div></motion.article>)}
    </div></section>

    <section className="bg-ink text-paper"><div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36"><SectionLabel>03 · Chapters</SectionLabel><div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr]"><h2 className="font-display text-6xl md:text-8xl">The archive,<br/><em>in passages.</em></h2><div className="border-t border-paper/30">{chapters.map((chapter, index) => <Link to="/journey" key={chapter.id} className="group grid gap-4 border-b border-paper/30 py-7 focus-visible:outline-2 focus-visible:outline-paper md:grid-cols-[50px_1fr_auto]"><span className="font-mono text-[10px] text-paper/60">0{index + 1}</span><div><h3 className="font-display text-3xl md:text-4xl">{chapter.title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-paper/60">{chapter.description}</p></div><span className="self-center font-mono text-[10px] uppercase text-paper/60 group-hover:text-paper">{chapter.range} ↗</span></Link>)}</div></div></div></section>
  </LifeTraceShell>;
}