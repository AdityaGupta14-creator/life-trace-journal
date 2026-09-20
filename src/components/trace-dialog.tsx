import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowRight, Clock, Footprints, Music2, ReceiptText, Sparkles, Tag, ExternalLink } from "lucide-react";
import { findTemporalConnections, formatTimeDistance, type TraceConnection } from "@/lib/lifetrace-analysis";
import type { LifeMoment } from "@/lib/lifetrace-data";
import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function TraceDialog({
  moment,
  moments,
  open,
  onOpenChange,
  onMomentChange,
}: {
  moment: LifeMoment | null;
  moments: LifeMoment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMomentChange?: (moment: LifeMoment) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [history, setHistory] = useState<LifeMoment[]>([]);

  // When a new root moment is opened from outside, reset history
  useEffect(() => {
    if (moment) {
      setHistory((prev) => {
        if (!prev.length || prev[prev.length - 1]?.id !== moment.id) {
          return [moment];
        }
        return prev;
      });
    }
  }, [moment]);

  if (!moment) return null;

  const currentMoment = history[history.length - 1] ?? moment;
  const connected = findTemporalConnections(currentMoment, moments, 120);

  const handleSelectNext = (nextMoment: LifeMoment) => {
    setHistory((prev) => [...prev, nextMoment]);
    onMomentChange?.(nextMoment);
  };

  const handleStepBack = (index: number) => {
    setHistory((prev) => prev.slice(0, index + 1));
    const target = history[index];
    if (target) onMomentChange?.(target);
  };

  const formattedDate = new Date(currentMoment.occurredAt).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const formattedTime = new Date(currentMoment.occurredAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto border-border bg-background p-5 shadow-paper sm:p-8 md:p-10">
        <DialogHeader className="pr-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <Footprints className="size-3 text-foreground" />
              <span>Follow the Trace · Step 0{history.length}</span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              Observable Evidence Chain
            </span>
          </div>

          {/* Breadcrumb path of clicked trace nodes */}
          {history.length > 1 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 py-1 text-xs">
              <span className="font-mono text-[9px] uppercase text-muted-foreground">Trace chain:</span>
              {history.map((h, i) => (
                <button
                  key={`${h.id}-${i}`}
                  onClick={() => handleStepBack(i)}
                  className={`flex items-center gap-1 font-mono text-[10px] transition-colors ${
                    i === history.length - 1
                      ? "font-semibold text-foreground underline"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{h.title.slice(0, 18)}</span>
                  {i < history.length - 1 && <span className="text-border">→</span>}
                </button>
              ))}
            </div>
          )}

          {/* Primary artifact display */}
          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
                    currentMoment.kind === "music"
                      ? "bg-dusty-blue/20 text-dusty-blue"
                      : "bg-ochre/20 text-ochre"
                  }`}
                >
                  {currentMoment.kind === "music" ? <Music2 className="size-3" /> : <ReceiptText className="size-3" />}
                  {currentMoment.kind === "music" ? "Music Artifact" : "Transaction Artifact"}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">ID: {currentMoment.id}</span>
              </div>

              <DialogTitle className="mt-4 font-display text-4xl font-normal leading-[1.05] md:text-5xl">
                {currentMoment.title}
              </DialogTitle>

              <DialogDescription className="pt-2 text-base text-foreground">
                {currentMoment.subtitle}
              </DialogDescription>
            </div>

            {/* Artifact physical slip / stamp */}
            <div className="flex flex-col justify-between border border-dashed border-border bg-field/60 p-4 font-mono text-xs md:w-56">
              <div className="space-y-1">
                <div className="text-[10px] uppercase text-muted-foreground">Recorded Timestamp</div>
                <div className="font-medium text-foreground">{formattedDate}</div>
                <div className="text-muted-foreground">{formattedTime} UTC</div>
              </div>

              <div className="mt-4 border-t border-dashed border-border pt-3">
                {currentMoment.value !== undefined ? (
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Amount</div>
                    <div className="font-display text-2xl text-foreground">
                      {currentMoment.currency ?? "INR"} {currentMoment.value.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{currentMoment.paymentMethod}</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Platform / Status</div>
                    <div className="text-foreground">{currentMoment.metadata?.platform ?? "Spotify"}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {currentMoment.completed ? "Played through" : "Skipped stream"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Detailed artifact metadata */}
        <div className="my-6 border-l-2 border-border bg-card/60 p-4 text-sm leading-6 text-muted-foreground">
          <p className="font-interface text-foreground">{currentMoment.detail}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Strict observation note: Connections below are identified solely by temporal adjacency in the archive. Adjacency does not denote psychological intent or cause.
          </p>
        </div>

        {/* Connected Trace Nodes */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <Clock className="size-3" />
              <span>Nearby temporal traces in archive ({connected.length} found)</span>
            </div>
            <span className="font-mono text-[9px] uppercase text-muted-foreground">
              Click node to step forward
            </span>
          </div>

          {/* Responsive chain: Horizontal flex on desktop, vertical stack on mobile */}
          <div className="overflow-x-auto pb-4 pt-2">
            <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
              {connected.map((item, index) => {
                const isMusic = item.moment.kind === "music";

                return (
                  <motion.div
                    key={item.moment.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.25 }}
                    className="flex flex-col items-center md:flex-row"
                  >
                    {/* Directional indicator */}
                    <div className="flex flex-col items-center gap-1 py-2 text-muted-foreground md:px-3 md:py-0">
                      <div className="hidden md:block">
                        <ArrowRight className="size-4" />
                      </div>
                      <div className="block md:hidden">
                        <ArrowDown className="size-4" />
                      </div>
                      <span className="whitespace-nowrap font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                        {item.timeDistanceFormatted}
                      </span>
                    </div>

                    {/* Interactive trace card */}
                    <button
                      onClick={() => handleSelectNext(item.moment)}
                      className="group flex w-full flex-col justify-between border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-foreground hover:shadow-paper focus-visible:outline-2 focus-visible:outline-ring md:w-52"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          {isMusic ? (
                            <Music2 className="size-4 text-dusty-blue" />
                          ) : (
                            <ReceiptText className="size-4 text-ochre" />
                          )}
                          <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                            {item.relationshipLabel}
                          </span>
                        </div>

                        <div className="mt-4 font-display text-lg font-normal leading-snug group-hover:text-foreground">
                          {item.moment.title}
                        </div>
                        <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {item.moment.subtitle}
                        </div>
                      </div>

                      <div className="mt-4 border-t border-dashed border-border pt-2">
                        <div className="font-mono text-[9px] text-muted-foreground">
                          {new Date(item.moment.occurredAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            timeZone: "UTC",
                          })}
                        </div>
                        <div className="mt-2 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-foreground group-hover:underline">
                          <span>Follow node</span>
                          <ArrowRight className="size-2.5" />
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}