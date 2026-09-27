import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Starfield } from "@/components/game/Starfield";
import { GameButton, Panel, Stat } from "@/components/game/ui";
import { useMission } from "@/game/state";
import { Astronaut } from "@/components/game/Astronaut";
import { Volume2, VolumeX, Eye, Rocket } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "J&R ASTROLABS — Junior Astronaut: Lunar Mission" },
      {
        name: "description",
        content:
          "Begin your astronaut application, train at the space center, launch to the Moon and command a 30-day lunar outpost in this interactive simulation.",
      },
      { property: "og:title", content: "J&R ASTROLABS — Junior Astronaut: Lunar Mission" },
      {
        property: "og:description",
        content: "An interactive lunar mission simulator built for the NASA Space Apps Challenge.",
      },
    ],
  }),
  component: Home,
});

const INTRO_BEATS = [
  { t: 600, title: "J&R ASTROLABS" },
  { t: 3000, title: "JUNIOR ASTRONAUT PROGRAM" },
  { t: 5400, title: "LUNAR MISSION" },
];

function Home() {
  const { state, update, reset, hydrated } = useMission();
  const navigate = useNavigate();
  const [beat, setBeat] = useState(-1);
  const [subtitle, setSubtitle] = useState("");
  const [introDone, setIntroDone] = useState(false);
  const [moonClose, setMoonClose] = useState(false);

  const skipIntro = state.started;

  useEffect(() => {
    if (!hydrated || skipIntro) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    INTRO_BEATS.forEach((b, i) => timers.push(setTimeout(() => setBeat(i), b.t)));
    timers.push(
      setTimeout(
        () =>
          setSubtitle(
            "\u201CHumanity's next giant leap will require a new generation of explorers.\u201D",
          ),
        7000,
      ),
    );
    timers.push(setTimeout(() => setMoonClose(true), 9500));
    timers.push(setTimeout(() => setIntroDone(true), 11500));
    return () => timers.forEach(clearTimeout);
  }, [hydrated, skipIntro]);

  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!skipIntro) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#03060f]">
        <Starfield className="absolute inset-0 size-full" density={220} />
        {/* Earth */}
        <div
          className="absolute left-1/2 size-[520px] -translate-x-1/2 rounded-full transition-all duration-[4000ms] ease-out"
          style={{
            bottom: beat >= 0 ? "-300px" : "-520px",
            background:
              "radial-gradient(circle at 35% 30%, #4aa3e0, #17518f 55%, #06152c 80%)",
            boxShadow: "0 -20px 90px -20px #2f8fd8",
            opacity: moonClose ? 0.25 : 1,
          }}
        />
        {/* Moon approaching */}
        <div
          className="absolute right-[12%] top-[14%] rounded-full transition-all duration-[3000ms] ease-in-out"
          style={{
            width: moonClose ? 420 : 90,
            height: moonClose ? 420 : 90,
            background: "radial-gradient(circle at 38% 34%, #d9d6cf, #8d8a84 60%, #4a4844 90%)",
            boxShadow: "0 0 70px -10px #cfd4dd55",
          }}
        />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
          {INTRO_BEATS.map((b, i) => (
            <h1
              key={b.title}
              className={`font-display text-3xl tracking-[0.4em] transition-all duration-1000 sm:text-5xl ${
                beat === i ? "opacity-100 blur-0" : "pointer-events-none absolute opacity-0 blur-sm"
              } ${i === 0 ? "text-glow text-primary" : "text-foreground"}`}
            >
              {b.title}
            </h1>
          ))}

          {subtitle && state.settings.subtitles && (
            <p className="animate-rise mt-8 max-w-xl text-balance text-sm text-foreground/80 sm:text-base">
              {subtitle}
            </p>
          )}

          {introDone && (
            <div className="animate-rise mt-10 space-y-6">
              <p className="font-display text-xl tracking-[0.3em] text-accent">
                YOUR JOURNEY BEGINS NOW.
              </p>
              <GameButton
                onClick={() => {
                  update((d) => {
                    d.started = true;
                    d.phase = "application";
                  });
                  navigate({ to: "/apply" });
                }}
              >
                Begin astronaut application
              </GameButton>
            </div>
          )}

          <button
            onClick={() => {
              setBeat(2);
              setMoonClose(true);
              setIntroDone(true);
            }}
            className="hud-label absolute bottom-6 right-6 hover:text-foreground"
          >
            skip intro →
          </button>
        </div>
      </main>
    );
  }

  const phaseRoute: Record<string, string> = {
    application: "/apply",
    selection: "/selection",
    training: "/training",
    planning: "/planning",
    launch: "/launch",
    landing: "/landing",
    outpost: "/outpost",
    return: "/return",
    complete: "/return",
  };
  const continueTo = phaseRoute[state.phase] ?? "/apply";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050a16]">
      <Starfield className="absolute inset-0 size-full" density={170} />
      <div className="grid-floor absolute inset-0 opacity-40" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-8 px-6 py-12">
        <header className="animate-rise">
          <p className="hud-label text-primary">Junior Astronaut Program · Lunar Mission</p>
          <h1 className="text-glow font-display text-4xl tracking-[0.25em] sm:text-6xl">
            J&amp;R ASTROLABS
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            An interactive lunar mission simulation created for the NASA Space Apps Challenge. Not
            an official NASA product and not endorsed by NASA.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Astronaut file" className="animate-rise">
            <div className="flex items-center gap-4">
              <Astronaut
                skin={state.profile.skin}
                hair={state.profile.hair}
                hairColor={state.profile.hairColor}
                suit={state.profile.suit}
                mood="happy"
                size={92}
                floating
              />
              <div className="space-y-1">
                <div className="readout text-xl font-semibold">
                  {state.profile.name || "UNNAMED CANDIDATE"}
                </div>
                <div className="hud-label">Call sign · {state.profile.callSign || "—"}</div>
                <div className="hud-label">Specialty · {state.profile.specialty}</div>
                <div className="readout mt-2 inline-block rounded border border-primary/50 bg-primary/10 px-2 py-0.5 text-[11px] uppercase tracking-widest text-primary">
                  Phase: {state.phase}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Mission day" value={`${state.day}/30`} />
              <Stat label="Science" value={state.science} accent />
              <Stat label="Samples" value={state.samples.length} />
              <Stat label="Badges" value={state.achievements.length} />
            </div>
          </Panel>

          <Panel title="Mission menu" className="animate-rise">
            <div className="grid gap-2">
              <GameButton onClick={() => navigate({ to: continueTo })}>
                <Rocket className="mr-2 inline size-3.5" />
                Continue mission
              </GameButton>
              <GameButton variant="ghost" onClick={() => navigate({ to: "/training" })}>
                Training center
              </GameButton>
              <GameButton variant="ghost" onClick={() => navigate({ to: "/database" })}>
                Mission database
              </GameButton>
              <GameButton
                variant="accent"
                onClick={() => {
                  update((d) => {
                    d.demoMode = true;
                  });
                  navigate({ to: "/demo" });
                }}
              >
                Mission demo (judges)
              </GameButton>
              <GameButton
                variant="danger"
                onClick={() => {
                  if (confirm("Start a new mission? Current progress will be erased.")) {
                    reset();
                  }
                }}
              >
                New mission
              </GameButton>
            </div>

            <div className="mt-4 space-y-2 border-t border-border/70 pt-3">
              <p className="hud-label">Settings</p>
              <div className="flex flex-wrap gap-2">
                <GameButton
                  variant="ghost"
                  onClick={() =>
                    update((d) => {
                      d.settings.sound = !d.settings.sound;
                    })
                  }
                >
                  {state.settings.sound ? (
                    <Volume2 className="mr-2 inline size-3.5" />
                  ) : (
                    <VolumeX className="mr-2 inline size-3.5" />
                  )}
                  sound {state.settings.sound ? "on" : "off"}
                </GameButton>
                <GameButton
                  variant="ghost"
                  onClick={() =>
                    update((d) => {
                      d.settings.reducedMotion = !d.settings.reducedMotion;
                    })
                  }
                >
                  <Eye className="mr-2 inline size-3.5" />
                  motion {state.settings.reducedMotion ? "reduced" : "full"}
                </GameButton>
                <GameButton
                  variant="ghost"
                  onClick={() =>
                    update((d) => {
                      d.settings.subtitles = !d.settings.subtitles;
                    })
                  }
                >
                  subtitles {state.settings.subtitles ? "on" : "off"}
                </GameButton>
              </div>
            </div>
          </Panel>
        </div>

        {state.log.length > 0 && (
          <Panel title="Recent mission log" className="animate-rise">
            <ul className="space-y-1 text-xs">
              {state.log.slice(0, 5).map((l, i) => (
                <li key={i} className="readout flex gap-3">
                  <span className="text-muted-foreground">DAY {String(l.day).padStart(2, "0")}</span>
                  <span
                    className={
                      l.kind === "warn"
                        ? "text-caution"
                        : l.kind === "good"
                          ? "text-go"
                          : "text-foreground/85"
                    }
                  >
                    {l.text}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </main>
  );
}
