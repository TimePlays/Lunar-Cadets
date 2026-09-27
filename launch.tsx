import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Starfield } from "@/components/game/Starfield";
import { Astronaut } from "@/components/game/Astronaut";
import { GameButton, Panel, Stat, Transmission, WhyBox } from "@/components/game/ui";
import { useMission } from "@/game/state";

export const Route = createFileRoute("/launch")({
  head: () => ({
    meta: [
      { title: "Launch & Ascent — J&R ASTROLABS" },
      {
        name: "description",
        content:
          "Suit up, run the pre-launch checklist, ride the countdown and fly the ascent through staging to orbit and trans-lunar injection.",
      },
      { property: "og:title", content: "Launch & Ascent — J&R ASTROLABS" },
      {
        property: "og:description",
        content: "An interactive rocket launch: checklist, countdown, staging and orbital insertion.",
      },
    ],
  }),
  component: Launch,
});

type Stage = "walkout" | "checklist" | "countdown" | "ascent" | "orbit" | "tli";

const CHECKS = [
  { id: "power", label: "Electrical power — internal" },
  { id: "comm", label: "Communications — locked with Houston" },
  { id: "ecs", label: "Environmental control — cabin pressure nominal" },
  { id: "nav", label: "Navigation platform — aligned" },
  { id: "prop", label: "Propulsion — tanks pressurised" },
  { id: "harness", label: "Crew harness — secure" },
];

function Launch() {
  const { state, update, award, unlockCodex } = useMission();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("walkout");
  const [checked, setChecked] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [tel, setTel] = useState({ alt: 0, vel: 0, acc: 0, fuel: 100, t: 0 });
  const [events, setEvents] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<null | { text: string; action: string }>(null);
  const [errors, setErrors] = useState(0);
  const promptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* countdown */
  useEffect(() => {
    if (stage !== "countdown") return;
    if (count <= 0) {
      setStage("ascent");
      return;
    }
    const id = setTimeout(() => setCount((c) => c - 1), 900);
    return () => clearTimeout(id);
  }, [stage, count]);

  /* ascent physics + scripted events */
  useEffect(() => {
    if (stage !== "ascent") return;
    const id = setInterval(() => {
      setTel((p) => {
        const t = p.t + 0.5;
        const acc = 1.3 + t * 0.045;
        const vel = p.vel + acc * 0.5 * 10;
        const alt = p.alt + (vel / 3600) * 0.5;
        const fuel = Math.max(0, p.fuel - 0.9);
        return { t, acc, vel, alt, fuel };
      });
    }, 500);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage !== "ascent") return;
    const t = tel.t;
    const add = (text: string) => setEvents((e) => (e.includes(text) ? e : [...e, text]));
    if (t > 6 && t < 7) {
      add("Max dynamic pressure — vehicle is throttling");
      setPrompt({ text: "Confirm throttle bucket through max-Q.", action: "THROTTLE DOWN" });
    }
    if (t > 16 && t < 17) {
      add("Solid booster separation confirmed");
      setPrompt({ text: "Command booster separation.", action: "SEP BOOSTERS" });
    }
    if (t > 30 && t < 31) {
      add("Core stage shutdown — upper stage ignition");
      setPrompt({ text: "Arm upper stage ignition sequence.", action: "ARM UPPER STAGE" });
    }
    if (t >= 44) {
      setStage("orbit");
      unlockCodex("rockets");
      unlockCodex("orbits");
    }
  }, [tel.t, stage, unlockCodex]);

  /* missed prompt penalty */
  useEffect(() => {
    if (!prompt) return;
    promptTimer.current = setTimeout(() => {
      setErrors((e) => e + 1);
      setPrompt(null);
    }, 6000);
    return () => {
      if (promptTimer.current) clearTimeout(promptTimer.current);
    };
  }, [prompt]);

  const shaking = stage === "ascent" && tel.t < 20 && !state.settings.reducedMotion;

  return (
    <main className={`relative min-h-screen bg-[#04060e] pb-16 ${shaking ? "animate-shake" : ""}`}>
      <Starfield className="pointer-events-none absolute inset-0 size-full" density={140} />
      <div className="relative z-10 mx-auto max-w-5xl px-5 pt-8">
        <p className="hud-label text-primary">Launch complex · lunar mission</p>
        <h1 className="font-display text-2xl tracking-[0.2em]">LAUNCH DAY</h1>

        {stage === "walkout" && (
          <Panel title="Crew walkout" className="animate-rise mt-4">
            <div className="flex flex-wrap items-end justify-center gap-4 py-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-floaty" style={{ animationDelay: `${-i * 0.9}s` }}>
                  <Astronaut helmet size={82} suit={i} hair={i} skin={i * 2} mood="happy" />
                </div>
              ))}
              <div className="animate-floaty" style={{ animationDelay: "-2.2s" }}>
                <Astronaut
                  helmet
                  size={92}
                  suit={state.profile.suit}
                  hair={state.profile.hair}
                  hairColor={state.profile.hairColor}
                  skin={state.profile.skin}
                  mood="focused"
                />
              </div>
            </div>
            <Transmission
              from="MISSION CONTROL"
              text="Suit-up complete. Transport to the pad, elevator to the crew access arm, then ingress and harness connection. Have a good flight."
            />
            <div className="mt-4">
              <GameButton onClick={() => setStage("checklist")}>Board the spacecraft</GameButton>
            </div>
          </Panel>
        )}

        {stage === "checklist" && (
          <Panel title="Pre-launch checklist" className="animate-rise mt-4">
            <p className="text-sm text-foreground/85">
              Verify every item before the terminal count. Each switch is a real system you will use
              later in the mission.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {CHECKS.map((c) => {
                const on = checked.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => setChecked((v) => (on ? v.filter((x) => x !== c.id) : [...v, c.id]))}
                    className={`readout flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-all ${
                      on ? "border-go bg-go/10 text-go" : "border-border bg-secondary/40"
                    }`}
                  >
                    {c.label}
                    <span>{on ? "GO" : "—"}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4">
              <GameButton disabled={checked.length < CHECKS.length} onClick={() => setStage("countdown")}>
                {checked.length < CHECKS.length
                  ? `${CHECKS.length - checked.length} items outstanding`
                  : "Go for terminal count"}
              </GameButton>
            </div>
          </Panel>
        )}

        {stage === "countdown" && (
          <div className="mt-8 text-center">
            <div className="font-display text-8xl tabular-nums text-primary text-glow">{count}</div>
            <p className="hud-label mt-3">
              {count > 6 ? "Terminal count" : count > 2 ? "Ignition sequence start" : "Engines at full thrust"}
            </p>
            <div className="mx-auto mt-6 h-40 w-24 rounded-t-full bg-gradient-to-b from-[#e8edf5] to-[#9aa3b4]" />
            <div
              className="mx-auto w-16 rounded-b-full bg-gradient-to-b from-accent to-transparent transition-all"
              style={{ height: count <= 3 ? 90 : 0, opacity: count <= 3 ? 1 : 0 }}
            />
          </div>
        )}

        {stage === "ascent" && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Stat label="Altitude" value={`${tel.alt.toFixed(1)} km`} accent />
              <Stat label="Velocity" value={`${Math.round(tel.vel)} m/s`} />
              <Stat label="Acceleration" value={`${tel.acc.toFixed(2)} g`} />
              <Stat label="Fuel" value={`${Math.round(tel.fuel)}%`} />
              <Stat label="MET" value={`T+${tel.t.toFixed(0)}s`} />
            </div>

            <div className="panel relative h-56 overflow-hidden">
              <div
                className="absolute left-1/2 -translate-x-1/2 transition-all duration-500"
                style={{ bottom: `${Math.min(70, tel.alt * 0.6)}%` }}
              >
                <div className="h-16 w-6 rounded-t-full bg-[#e8edf5]" />
                <div className="mx-auto h-8 w-4 animate-pulse rounded-b-full bg-gradient-to-b from-accent to-destructive" />
              </div>
              <div className="absolute bottom-0 h-8 w-full bg-[#10233f]" />
              <p className="hud-label absolute left-3 top-3">Trajectory · downrange profile</p>
            </div>

            {prompt && (
              <div className="panel animate-rise flex flex-wrap items-center justify-between gap-3 border-caution/60 p-3">
                <p className="text-sm text-caution">{prompt.text}</p>
                <GameButton
                  variant="accent"
                  onClick={() => {
                    if (promptTimer.current) clearTimeout(promptTimer.current);
                    setPrompt(null);
                  }}
                >
                  {prompt.action}
                </GameButton>
              </div>
            )}

            <Panel title="Flight events">
              <ul className="readout space-y-1 text-xs text-foreground/85">
                {events.map((e) => (
                  <li key={e}>✔ {e}</li>
                ))}
                {events.length === 0 && <li className="text-muted-foreground">Standing by…</li>}
              </ul>
            </Panel>
          </div>
        )}

        {stage === "orbit" && (
          <Panel title="Earth orbit" className="animate-rise mt-4">
            <div className="relative h-52 overflow-hidden rounded-lg border border-border bg-[#03060f]">
              <div
                className="absolute -bottom-40 left-1/2 size-96 -translate-x-1/2 rounded-full"
                style={{ background: "radial-gradient(circle at 40% 30%, #4aa3e0, #17518f 60%, #06152c)" }}
              />
              <svg viewBox="0 0 200 100" className="absolute inset-0 size-full">
                <ellipse cx="100" cy="86" rx="82" ry="26" fill="none" stroke="var(--primary)" strokeDasharray="4 4" />
                <circle r="3" fill="var(--accent)">
                  <animateMotion dur="6s" repeatCount="indefinite" path="M18,86 a82,26 0 1,0 164,0 a82,26 0 1,0 -164,0" />
                </circle>
              </svg>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="Apogee" value="412 km" />
              <Stat label="Perigee" value="186 km" />
              <Stat label="Period" value="90.4 min" />
            </div>
            <div className="mt-3">
              <Transmission
                from="MISSION CONTROL"
                text="Orbital insertion confirmed. Systems nominal. You are go for trans-lunar injection on the next pass."
              />
            </div>
            <div className="mt-3">
              <GameButton onClick={() => setStage("tli")}>Configure for TLI</GameButton>
            </div>
          </Panel>
        )}

        {stage === "tli" && (
          <Panel title="Trans-lunar injection" className="animate-rise mt-4">
            <p className="text-sm text-foreground/85">
              A single burn raises the far side of your orbit until it reaches the Moon. Confirm the
              maneuver to begin the three-day transit.
            </p>
            <svg viewBox="0 0 320 120" className="mt-4 w-full">
              <circle cx="40" cy="80" r="22" fill="#2f7fc4" />
              <circle cx="286" cy="34" r="14" fill="#c9c6bf" />
              <path
                d="M62 74 C 130 70, 210 44, 272 36"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeDasharray="5 5"
              >
                <animate attributeName="stroke-dashoffset" from="60" to="0" dur="2s" repeatCount="indefinite" />
              </path>
              <text x="70" y="104" fill="var(--muted-foreground)" fontSize="9">
                EARTH
              </text>
              <text x="262" y="60" fill="var(--muted-foreground)" fontSize="9">
                MOON
              </text>
            </svg>
            <WhyBox title="Why one burn instead of flying straight there?">
              In orbital mechanics you change your path by changing your velocity at the right point.
              Burning prograde raises the opposite side of the orbit — aim that side at where the Moon
              will be in three days and gravity does the rest.
            </WhyBox>
            <div className="mt-4">
              <GameButton
                onClick={() => {
                  const score = Math.max(50, 100 - errors * 12);
                  update((d) => {
                    d.launchScore = score;
                    d.phase = "landing";
                    d.log.unshift({ day: 0, text: `Launch and TLI complete (${score}%).`, kind: "good" });
                  });
                  award("OFF THE PAD");
                  navigate({ to: "/landing" });
                }}
              >
                Execute TLI → lunar approach
              </GameButton>
            </div>
          </Panel>
        )}
      </div>
    </main>
  );
}
