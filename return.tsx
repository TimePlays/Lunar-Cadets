import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Starfield } from "@/components/game/Starfield";
import { Panel, Stat, GameButton, NavButton } from "@/components/game/ui";
import { useMission, missionScore, grade } from "@/game/state";

export const Route = createFileRoute("/return")({
  head: () => ({
    meta: [
      { title: "Mission Report — J&R ASTROLABS" },
      { name: "description", content: "Return to Earth and review your personalised lunar mission report." },
      { property: "og:title", content: "Mission Report — J&R ASTROLABS" },
      { property: "og:description", content: "Splashdown and your final lunar mission score." },
    ],
  }),
  component: ReturnPage,
});

function ReturnPage() {
  const { state, reset } = useMission();
  const navigate = useNavigate();
  const s = missionScore(state);
  return (
    <main className="relative min-h-screen bg-background p-6 text-foreground">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="relative mx-auto max-w-3xl space-y-4">
        <h1 className="font-display text-3xl font-bold">Splashdown — Mission Complete</h1>
        <p className="text-sm text-muted-foreground">
          Orion re-entered at about 11 km/s, parachutes deployed and the crew splashed down safely. Welcome home.
        </p>
        <Panel title="Final Mission Report">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Overall" value={`${s.overall} · ${grade(s.overall)}`} accent />
            <Stat label="Crew safety" value={s.crewSafety} />
            <Stat label="Resources" value={s.resources} />
            <Stat label="Science" value={s.scienceReturn} />
            <Stat label="Exploration" value={s.exploration} />
            <Stat label="Objectives" value={`${s.completion}%`} />
            <Stat label="Samples" value={state.samples.length} />
            <Stat label="Badges" value={state.achievements.length} />
          </div>
        </Panel>
        <div className="flex flex-wrap gap-2">
          <GameButton onClick={() => { reset(); navigate({ to: "/" }); }}>New mission</GameButton>
          <NavButton to="/database">Mission database</NavButton>
          <NavButton to="/">Home</NavButton>
        </div>
        <p className="text-xs text-muted-foreground">Educational project — not an official or NASA-endorsed product.</p>
      </div>
    </main>
  );
}
