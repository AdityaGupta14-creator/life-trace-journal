import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { AggregatePoint } from "@/lib/lifetrace-analysis";

export function LifeField({ points, onSelect }: { points: AggregatePoint[]; onSelect?: (point: AggregatePoint) => void }) {
  const [active, setActive] = useState<AggregatePoint | null>(points[0] ?? null);
  const marks = useMemo(() => points.flatMap((point, groupIndex) => Array.from({ length: Math.min(18, Math.max(4, point.count * 2)) }, (_, index) => ({ point, x: 5 + ((groupIndex * 23 + index * 7.7) % 90), y: 12 + ((groupIndex * 31 + index * 17) % 73), size: index % 5 === 0 ? 5 : 3 }))), [points]);
  return <div className="relative min-h-[420px] overflow-hidden border-y border-border bg-field px-4 py-8 md:min-h-[520px] md:px-10" aria-label="Interactive field of life activity">
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" role="img" aria-label="Aggregated music and transaction activity across time">
      <path d="M0 69 C20 43, 35 82, 55 52 S82 30, 100 45" fill="none" stroke="var(--thread)" strokeWidth="0.35" strokeDasharray="1.5 2" />
      {marks.map(({ point, x, y, size }, index) => <motion.circle key={`${point.key}-${index}`} cx={x} cy={y} r={size / 10} fill={point.transactions > 0 && index % 7 === 0 ? "var(--ochre)" : "var(--dusty-blue)"} opacity={active?.key === point.key ? 0.95 : 0.42} initial={{ scale: 0 }} animate={{ scale: active?.key === point.key ? 1.5 : 1 }} transition={{ delay: Math.min(index * 0.005, 0.7), duration: 0.35 }} />)}
      {points.map((point, index) => <circle key={point.key} cx={12 + ((index * 24) % 78)} cy={28 + ((index * 19) % 50)} r="7" fill="transparent" tabIndex={0} role="button" aria-label={`${point.label}, ${point.count} sample traces`} onMouseEnter={() => setActive(point)} onFocus={() => setActive(point)} onClick={() => { setActive(point); onSelect?.(point); }} className="cursor-pointer focus:outline-none" />)}
    </svg>
    <div className="pointer-events-none relative z-10 flex h-full min-h-[350px] flex-col justify-between md:min-h-[450px]">
      <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground"><span>First trace · Jan 2022</span><span>Latest trace · Dec 2023</span></div>
      <motion.div key={active?.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-[260px] border-l border-foreground pl-4">
        <div className="font-display text-2xl">{active?.label ?? "Move through the field"}</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{active ? `${active.music} music · ${active.transactions} receipts` : "Each mark is an aggregated trace"}</div>
      </motion.div>
    </div>
  </div>;
}