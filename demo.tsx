import { createFileRoute } from "@tanstack/react-router";
import { Panel, NavButton } from "@/components/game/ui";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Judge Demo — J&R ASTROLABS" },
      { name: "description", content: "Jump straight to any showcase stage of the lunar mission simulator." },
      { property: "og:title", content: "Judge Demo — J&R ASTROLABS" },
      { property: "og:description", content: "Quick access to every stage of the lunar mission." },
    ],
  }),
  component: Demo,
});

const STAGES = [
  ["/apply", "Astronaut application"],
  ["/selection", "Selection tests"],
  ["/training", "Training centre"],
  ["/planning", "Cargo planning"],
  ["/launch", "Launch"],
  ["/landing", "Lunar landing"],
  ["/outpost", "30-day outpost"],
  ["/rover", "Rover & water ice"],
  ["/return", "Mission report"],
] as const;

function Demo() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="font-display text-3xl font-bold">Judge Demo Mode</h1>
        <Panel title="Jump to a stage">
          <div className="grid gap-2 sm:grid-cols-2">
            {STAGES.map(([to, label], i) => (
              <NavButton key={to} to={to}>{`${i + 1}. ${label}`}</NavButton>
            ))}
          </div>
        </Panel>
        <NavButton to="/">Home</NavButton>
      </div>
    </main>
  );
}
