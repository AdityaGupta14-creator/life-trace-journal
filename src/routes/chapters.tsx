import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { LifeTraceShell, PageIntro, SectionLabel } from "@/components/lifetrace-shell";
import { generateChapters, type Chapter } from "@/lib/lifetrace-analysis";
import { fetchAllMoments, initialMoments, type LifeMoment } from "@/lib/lifetrace-data";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/chapters")({
  head: () => ({
    meta: [
      { title: "Chapters — LIFE//TRACE" },
      {
        name: "description",
        content: "Data-driven chapters derived from real historical density shifts, catalog playthroughs, and transaction logging periods across 11 recorded years.",
      },
      { property: "og:title", content: "Chapters — LIFE//TRACE" },
      {
        property: "og:description",
        content: "The archive, in passages: 6 chronological chapters synthesized from 152,000+ digital traces.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChaptersPage,
});

function ChaptersPage() {
  const [moments, setMoments] = useState<LifeMoment[]>(initialMoments);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllMoments().then((data) => {
      setMoments(data);
    });
  }, []);

  const chapters = useMemo(() => generateChapters(moments), [moments]);

  const handleEnterPassage = (rangeKey: string) => {
    const yearMatch = rangeKey.match(/\d{4}/);
    navigate({
      to: "/journey",
      search: {
        period: yearMatch ? yearMatch[0] : undefined,
        scale: "year",
        kind: "all",
      },
    });
  };

  return (
    <LifeTraceShell>
      <PageIntro
        index="04"
        eyebrow="Chapters"
        title="The archive, in passages."
      >
        Six data-driven chapters derived strictly from empirical temporal density shifts, catalog playthroughs, and transaction logging eras across 2013–2024.
      </PageIntro>

      <section className="mx-auto max-w-[1440px] px-5 pb-28 md:px-10">
        <SectionLabel>Chronological Archival Epochs</SectionLabel>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              onClick={() => handleEnterPassage(chapter.range)}
              className="group flex flex-col justify-between border border-border bg-card p-6 transition-all hover:border-foreground hover:shadow-paper cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Chapter 0{index + 1}
                  </span>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {chapter.range}
                  </span>
                </div>

                <h2 className="mt-4 font-display text-2xl md:text-3xl text-foreground group-hover:text-primary transition-colors">
                  {chapter.title}
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {chapter.description}
                </p>

                {chapter.evidence && (
                  <p className="mt-4 border-l-2 border-foreground/20 pl-3 font-mono text-[11px] text-foreground/80">
                    {chapter.evidence}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-4">
                  {chapter.stats.map((stat, i) => (
                    <span key={i} className="border border-border bg-muted/40 px-2 py-0.5 rounded-xs">
                      {stat}
                    </span>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between font-mono text-xs group-hover:border-foreground"
                >
                  <span>Explore in Journey</span>
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </LifeTraceShell>
  );
}
