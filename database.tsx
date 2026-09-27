import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Starfield } from "@/components/game/Starfield";
import { NavButton, Panel } from "@/components/game/ui";
import { CODEX } from "@/game/codex";
import { useMission } from "@/game/state";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/database")({
  head: () => ({
    meta: [
      { title: "Mission Database — J&R ASTROLABS" },
      {
        name: "description",
        content:
          "Short visual explainers on lunar gravity, water ice, regolith, radiation, life support, orbits and rovers — unlocked as you play.",
      },
      { property: "og:title", content: "Mission Database — J&R ASTROLABS" },
      {
        property: "og:description",
        content: "Real space science explainers unlocked through gameplay.",
      },
    ],
  }),
  component: Database,
});

function Database() {
  const { state } = useMission();
  const [open, setOpen] = useState<string>(CODEX[0]?.id ?? "moon");
  const entry = CODEX.find((c) => c.id === open) ?? CODEX[0]!;
  const unlocked = (id: string) => state.codex.includes(id) || state.codex.length === 0;

  return (
    <main className="relative min-h-screen bg-[#050a16] pb-16">
      <Starfield className="pointer-events-none absolute inset-0 size-full" density={100} />
      <div className="relative z-10 mx-auto max-w-5xl px-5 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="hud-label text-primary">Learning hub</p>
            <h1 className="font-display text-2xl tracking-[0.2em]">MISSION DATABASE</h1>
          </div>
          <NavButton to="/">← Home</NavButton>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
          <Panel title="Entries">
            <ul className="space-y-1">
              {CODEX.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setOpen(c.id)}
                    className={`readout flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs uppercase tracking-wider transition-colors ${
                      open === c.id ? "bg-primary/15 text-primary" : "hover:bg-secondary/60"
                    }`}
                  >
                    {c.title}
                    {!unlocked(c.id) && <Lock className="size-3 text-muted-foreground" aria-hidden />}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={entry.title}>
            <span
              className={`readout rounded px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                entry.tag === "REAL SPACE SCIENCE"
                  ? "bg-go/20 text-go"
                  : "bg-science/20 text-science"
              }`}
            >
              {entry.tag}
            </span>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">{entry.body}</p>
            <p className="mt-4 text-[11px] text-muted-foreground">
              J&amp;R ASTROLABS is an educational simulation created for the NASA Space Apps
              Challenge. It is not operated, endorsed or certified by NASA.
            </p>
          </Panel>
        </div>
      </div>
    </main>
  );
}
