import { Link, useRouterState } from "@tanstack/react-router";
import { Archive, Bookmark, BookOpen, Compass, Footprints, Grid2X2, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useSavedTraces } from "@/hooks/useSavedTraces";

const links = [
  { to: "/", label: "Discover", icon: Compass },
  { to: "/journey", label: "Journey", icon: Footprints },
  { to: "/patterns", label: "Patterns", icon: Grid2X2 },
  { to: "/moments", label: "Moments", icon: Search },
  { to: "/chapters", label: "Chapters", icon: BookOpen },
] as const;

export function LifeTraceShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { savedTraces } = useSavedTraces();
  
  return <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-17 max-w-[1440px] items-center justify-between px-5 md:px-10">
        <Link to="/" className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" aria-label="LIFE TRACE home">
          <Archive className="size-4" />
          <span className="font-interface text-sm font-semibold tracking-[0.14em]">LIFE//TRACE</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {links.map(({ to, label }) => <Link key={to} to={to} className={`border-b py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${pathname === to ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{label}</Link>)}
        </nav>
        <div className="flex items-center gap-4">
          {savedTraces.length > 0 && (
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ochre">
              <Bookmark className="size-3" />
              <span>{savedTraces.length} Saved</span>
            </span>
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hidden sm:inline-block">Archive 01 / 04</span>
        </div>
      </div>
    </header>
    <main className="pb-24 md:pb-0">{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden" aria-label="Mobile navigation">
      {links.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] ${pathname === to ? "text-foreground" : "text-muted-foreground"}`}><Icon className="size-4" /><span>{label}</span></Link>)}
    </nav>
  </div>;
}

export function PageIntro({ index, eyebrow, title, children }: { index: string; eyebrow: string; title: string; children: ReactNode }) {
  return <section className="mx-auto grid max-w-[1440px] gap-8 px-5 pb-14 pt-14 md:grid-cols-[1fr_2fr] md:px-10 md:pb-24 md:pt-24">
    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{index} — {eyebrow}</div>
    <div><h1 className="max-w-4xl font-display text-5xl leading-[0.96] md:text-7xl lg:text-8xl">{title}</h1><div className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">{children}</div></div>
  </section>;
}

export function SectionLabel({ children, className = "text-muted-foreground before:bg-border" }: { children: ReactNode; className?: string }) { return <div className={`mb-8 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] before:h-px before:w-8 ${className}`}>{children}</div>; }