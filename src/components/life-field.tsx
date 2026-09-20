import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { Music2, ReceiptText, Calendar } from "lucide-react";
import type { AggregatePoint } from "@/lib/lifetrace-analysis";
import { archiveSummary } from "@/lib/lifetrace-data";

export function LifeField({
  points,
  onSelect,
}: {
  points: AggregatePoint[];
  onSelect?: (point: AggregatePoint) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [active, setActive] = useState<AggregatePoint | null>(points[0] ?? null);

  // Combine points with precomputed archive summary marks if available
  const summaryMarks = archiveSummary?.fieldMarks ?? [];

  const marks = useMemo(() => {
    if (summaryMarks.length > 0) {
      return summaryMarks;
    }

    // Fallback if summaryMarks not present
    const maxCount = Math.max(...points.map((p) => p.count), 1);
    return points.map((point, index) => {
      const normalizedDensity = point.count / maxCount;
      return {
        key: point.key,
        label: point.label,
        music: point.music,
        transactions: point.transactions,
        count: point.count,
        density: normalizedDensity,
        x: 5 + (index / Math.max(points.length - 1, 1)) * 90,
        y: 75 - normalizedDensity * 55,
        radius: Math.max(2, Math.min(6, normalizedDensity * 7)),
        hasTransactions: point.transactions > 0,
      };
    });
  }, [points, summaryMarks]);

  const activeMark = marks.find((m) => m.key === active?.key) ?? marks[0];

  const handleSelect = (key: string) => {
    const pt = points.find((p) => p.key === key) ?? {
      key,
      label: key,
      count: 0,
      music: 0,
      transactions: 0,
      moments: [],
    };
    setActive(pt);
    onSelect?.(pt);
  };

  return (
    <div
      className="relative min-h-[460px] overflow-hidden border-y border-border bg-field px-4 py-8 md:min-h-[560px] md:px-10"
      aria-label="Interactive field of life activity across 2013-2024"
      role="region"
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="Aggregated music and transaction activity across 2013 to 2024"
      >
        <defs>
          <linearGradient id="threadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--dusty-blue)" stopOpacity="0.25" />
            <stop offset="45%" stopColor="var(--ochre)" stopOpacity="0.6" />
            <stop offset="60%" stopColor="var(--ochre)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--dusty-blue)" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* Temporal thread connecting regions */}
        <path
          d="M 4 72 Q 25 78, 38 45 T 65 32 T 85 58 T 96 68"
          fill="none"
          stroke="url(#threadGradient)"
          strokeWidth="0.4"
          strokeDasharray="1.5 2"
        />

        {/* Lightweight SVG marks */}
        {marks.map((mark) => {
          const isSelected = active?.key === mark.key;
          const isOchre = mark.hasTransactions && mark.transactions > 0;

          return (
            <g key={mark.key}>
              {/* Density halo on hover/select */}
              {isSelected && (
                <circle
                  cx={mark.x}
                  cy={mark.y}
                  r={mark.radius + 3}
                  fill="none"
                  stroke={isOchre ? "var(--ochre)" : "var(--dusty-blue)"}
                  strokeWidth="0.3"
                  strokeDasharray="1 1"
                  opacity={0.8}
                />
              )}

              {/* Core aggregated mark */}
              <motion.circle
                cx={mark.x}
                cy={mark.y}
                r={mark.radius}
                fill={isOchre ? "var(--ochre)" : "var(--dusty-blue)"}
                opacity={isSelected ? 0.95 : 0.48}
                initial={prefersReducedMotion ? false : { scale: 0 }}
                animate={{ scale: isSelected ? 1.4 : 1 }}
                transition={{ duration: 0.25 }}
              />

              {/* Accessible interactive target circle */}
              <circle
                cx={mark.x}
                cy={mark.y}
                r={Math.max(mark.radius, 4)}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${mark.label}: ${mark.count.toLocaleString()} traces (${mark.music.toLocaleString()} music, ${mark.transactions.toLocaleString()} receipts)`}
                aria-pressed={isSelected}
                onMouseEnter={() => handleSelect(mark.key)}
                onFocus={() => handleSelect(mark.key)}
                onClick={() => handleSelect(mark.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(mark.key);
                  }
                }}
                className="cursor-pointer focus:outline-none focus-visible:stroke-foreground focus-visible:stroke-1"
              />
            </g>
          );
        })}
      </svg>

      {/* Archival metadata overlay */}
      <div className="pointer-events-none relative z-10 flex h-full min-h-[380px] flex-col justify-between md:min-h-[480px]">
        <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>First recorded trace · Jul 2013</span>
          <span className="hidden sm:inline">Temporal density field (149,860 music · 2,461 receipts)</span>
          <span>Latest recorded trace · Dec 2024</span>
        </div>

        {/* Selected passage HUD */}
        <motion.div
          key={active?.key}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-[320px] border-l-2 border-foreground bg-background/85 p-4 shadow-paper backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            <Calendar className="size-3" />
            <span>Passage focus</span>
          </div>
          <div className="mt-1 font-display text-2xl md:text-3xl">
            {activeMark?.label ?? active?.label ?? "Select a temporal passage"}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase text-muted-foreground">
            <span className="flex items-center gap-1">
              <Music2 className="size-3 text-dusty-blue" />
              {activeMark?.music.toLocaleString() ?? active?.music ?? 0} music
            </span>
            <span className="flex items-center gap-1">
              <ReceiptText className="size-3 text-ochre" />
              {activeMark?.transactions.toLocaleString() ?? active?.transactions ?? 0} receipts
            </span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {activeMark && activeMark.transactions > 0
              ? "Overlapping window: music streaming and daily household receipts co-occur."
              : "Continuous digital streaming records without financial receipts."}
          </div>
        </motion.div>
      </div>
    </div>
  );
}