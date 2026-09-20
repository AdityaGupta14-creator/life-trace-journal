import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Music2, ReceiptText } from "lucide-react";
import { findTemporalConnections } from "@/lib/lifetrace-analysis";
import type { LifeMoment } from "@/lib/lifetrace-data";

export function TraceDialog({ moment, moments, open, onOpenChange, onMomentChange }: { moment: LifeMoment | null; moments: LifeMoment[]; open: boolean; onOpenChange: (open: boolean) => void; onMomentChange?: (moment: LifeMoment) => void }) {
  if (!moment) return null;
  const connected = findTemporalConnections(moment, moments);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-border bg-background p-6 shadow-paper sm:p-10">
    <DialogHeader className="pr-8"><div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Follow a moment</div><DialogTitle className="font-display text-4xl font-normal leading-none md:text-5xl">{moment.title}</DialogTitle><DialogDescription className="pt-2 text-sm">{new Date(moment.occurredAt).toLocaleString()} · {moment.subtitle}</DialogDescription></DialogHeader>
    <p className="my-4 border-l border-border pl-4 text-sm leading-6 text-muted-foreground">Connections below reflect time proximity only. They suggest adjacency, never cause.</p>
    <div className="overflow-x-auto pb-3"><div className="flex min-w-max items-center gap-3 py-2">
      {[moment, ...connected].map((item, index) => <div key={item.id} className="flex items-center gap-3">
        {index > 0 && <div className="flex flex-col items-center gap-1 text-muted-foreground"><ArrowRight className="size-4" /><span className="font-mono text-[8px] uppercase">nearby</span></div>}
        <Button variant="artifact" onClick={() => onMomentChange?.(item)} className="h-40 w-36 flex-col items-start justify-start whitespace-normal p-4 text-left">
          {item.kind === "music" ? <Music2 className="size-4 text-dusty-blue" /> : <ReceiptText className="size-4 text-ochre" />}
          <span className="mt-4 font-display text-lg leading-tight">{item.title}</span><span className="text-[10px] text-muted-foreground">{new Date(item.occurredAt).toLocaleDateString()}</span>
        </Button>
      </div>)}
    </div></div>
  </DialogContent></Dialog>;
}