import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Starfield } from "@/components/game/Starfield";
import { Astronaut } from "@/components/game/Astronaut";
import { GameButton, Panel, Transmission } from "@/components/game/ui";
import { useMission } from "@/game/state";

export const Route = createFileRoute("/selection")({
  head: () => ({
    meta: [
      { title: "Astronaut Selection — J&R ASTROLABS" },
      {
        name: "description",
        content:
          "Pass reaction, memory, spatial and observation testing, then face the selection board interview to earn a place in astronaut training.",
      },
      { property: "og:title", content: "Astronaut Selection — J&R ASTROLABS" },
      {
        property: "og:description",
        content: "Earn your place in the Junior Astronaut Program through real candidate testing.",
      },
    ],
  }),
  component: Selection,
});

type Stage = "brief" | "reaction" | "memory" | "spatial" | "observation" | "interview" | "board";

/* ---------------- Reaction test ---------------- */
function ReactionTest({ onDone }: { onDone: (score: number) => void }) {
  const [phase, setPhase] = useState<"idle" | "wait" | "go" | "early">("idle");
  const [times, setTimes] = useState<number[]>([]);
  const start = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const arm = useCallback(() => {
    setPhase("wait");
    timer.current = setTimeout(
      () => {
        start.current = performance.now();
        setPhase("go");
      },
      900 + Math.random() * 2200,
    );
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const hit = () => {
    if (phase === "wait") {
      if (timer.current) clearTimeout(timer.current);
      setPhase("early");
      return;
    }
    if (phase !== "go") return;
    const dt = performance.now() - start.current;
    const next = [...times, dt];
    setTimes(next);
    if (next.length >= 4) {
      const avg = next.reduce((a, b) => a + b, 0) / next.length;
      onDone(Math.max(30, Math.min(100, Math.round(140 - avg / 6))));
    } else {
      arm();
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground/85">
        Master caution panel test. When the indicator turns <span className="text-go">GO</span>,
        acknowledge immediately. Four valid responses required.
      </p>
      <button
        onClick={phase === "idle" || phase === "early" ? arm : hit}
        className={`readout flex h-52 w-full items-center justify-center rounded-lg border-2 text-xl uppercase tracking-[0.3em] transition-colors ${
          phase === "go"
            ? "border-go bg-go/25 text-go"
            : phase === "wait"
              ? "border-caution bg-caution/10 text-caution"
              : phase === "early"
                ? "border-destructive bg-destructive/15 text-destructive"
                : "border-border bg-secondary/30"
        }`}
      >
        {phase === "idle" && "press to arm panel"}
        {phase === "wait" && "stand by…"}
        {phase === "go" && "GO — acknowledge"}
        {phase === "early" && "too early — press to re-arm"}
      </button>
      <p className="hud-label">
        Responses {times.length}/4 ·{" "}
        {times.length ? `last ${Math.round(times[times.length - 1] ?? 0)} ms` : "no data"}
      </p>
    </div>
  );
}

/* ---------------- Memory test ---------------- */
function MemoryTest({ onDone }: { onDone: (score: number) => void }) {
  const PANEL = ["PWR", "O₂", "NAV", "COM", "THR", "ECS"];
  const [seq, setSeq] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [showing, setShowing] = useState(-1);
  const [round, setRound] = useState(0);
  const [msg, setMsg] = useState("Watch the panel sequence, then repeat it.");

  const play = useCallback((s: number[]) => {
    let i = 0;
    const id = setInterval(() => {
      setShowing(s[i] ?? -1);
      setTimeout(() => setShowing(-1), 380);
      i += 1;
      if (i >= s.length) clearInterval(id);
    }, 620);
  }, []);

  const next = () => {
    const s = [...seq, Math.floor(Math.random() * PANEL.length)];
    setSeq(s);
    setInput([]);
    setMsg("Observe…");
    play(s);
  };

  const press = (i: number) => {
    if (seq.length === 0) return;
    const ni = [...input, i];
    if (seq[ni.length - 1] !== i) {
      onDone(Math.max(30, Math.round((round / 6) * 100)));
      setMsg("Sequence broken. Evaluation recorded.");
      return;
    }
    setInput(ni);
    if (ni.length === seq.length) {
      const r = round + 1;
      setRound(r);
      if (r >= 5) {
        onDone(100);
        setMsg("Full sequence recall achieved.");
      } else {
        setMsg(`Sequence ${r} correct.`);
        setTimeout(next, 700);
      }
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground/85">{msg}</p>
      <div className="grid grid-cols-3 gap-2">
        {PANEL.map((p, i) => (
          <button
            key={p}
            onClick={() => press(i)}
            className={`readout rounded-md border py-6 text-sm uppercase tracking-widest transition-all ${
              showing === i
                ? "border-primary bg-primary/40 text-primary-foreground"
                : "border-border bg-secondary/40 hover:bg-secondary"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      {seq.length === 0 && <GameButton onClick={next}>Start sequence</GameButton>}
      <p className="hud-label">Sequences complete · {round}/5</p>
    </div>
  );
}

/* ---------------- Spatial test ---------------- */
function SpatialTest({ onDone }: { onDone: (score: number) => void }) {
  const [q, setQ] = useState(0);
  const [correct, setCorrect] = useState(0);
  const questions = [
    { angle: 90, answer: 1 },
    { angle: 180, answer: 2 },
    { angle: 270, answer: 3 },
  ];
  const cur = questions[q];
  if (!cur) return null;

  const pick = (i: number) => {
    const ok = i === cur.answer;
    const c = correct + (ok ? 1 : 0);
    setCorrect(c);
    if (q + 1 >= questions.length) onDone(Math.round((c / questions.length) * 100));
    else setQ(q + 1);
  };

  const Docking = ({ rotate }: { rotate: number }) => (
    <svg viewBox="0 0 80 80" className="size-full" style={{ transform: `rotate(${rotate}deg)` }}>
      <rect x="18" y="18" width="44" height="44" rx="6" fill="none" stroke="var(--primary)" strokeWidth="3" />
      <circle cx="40" cy="28" r="5" fill="var(--accent)" />
      <rect x="24" y="46" width="14" height="8" fill="var(--go)" />
    </svg>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/85">
        Docking adapter alignment. Rotate the reference port mentally by{" "}
        <span className="text-primary">{cur.angle}°</span> clockwise and select the matching view.
      </p>
      <div className="mx-auto size-28 rounded-md border border-border bg-background/60 p-2">
        <Docking rotate={0} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[0, 90, 180, 270].map((r, i) => (
          <button
            key={r}
            onClick={() => pick(i)}
            className="aspect-square rounded-md border border-border bg-secondary/40 p-2 transition-colors hover:border-primary"
          >
            <Docking rotate={r} />
          </button>
        ))}
      </div>
      <p className="hud-label">Item {q + 1}/3</p>
    </div>
  );
}

/* ---------------- Observation test ---------------- */
function ObservationTest({ onDone }: { onDone: (score: number) => void }) {
  const [found, setFound] = useState<number[]>([]);
  const faults = [
    { id: 0, x: 22, y: 30, label: "Disconnected power line" },
    { id: 1, x: 66, y: 55, label: "Open thermal valve" },
    { id: 2, x: 44, y: 74, label: "Cracked radiator panel" },
  ];
  const done = found.length === faults.length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground/85">
        Pre-flight inspection. Three anomalies are present on this spacecraft schematic. Click each
        one.
      </p>
      <div className="relative h-64 w-full overflow-hidden rounded-lg border border-border bg-background/60 grid-floor">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" preserveAspectRatio="none">
          <rect x="30" y="18" width="40" height="60" rx="10" fill="none" stroke="var(--primary)" strokeWidth="1" />
          <line x1="10" y1="30" x2="30" y2="30" stroke="var(--go)" strokeWidth="1" />
          <line x1="70" y1="55" x2="92" y2="55" stroke="var(--caution)" strokeWidth="1" />
          <rect x="36" y="70" width="28" height="8" fill="none" stroke="var(--regolith)" strokeWidth="1" />
        </svg>
        {faults.map((f) => (
          <button
            key={f.id}
            onClick={() => setFound((v) => (v.includes(f.id) ? v : [...v, f.id]))}
            aria-label={`Inspect region ${f.id + 1}`}
            className={`absolute size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all ${
              found.includes(f.id)
                ? "border-go bg-go/25"
                : "border-transparent hover:border-primary/60"
            }`}
            style={{ left: `${f.x}%`, top: `${f.y}%` }}
          />
        ))}
      </div>
      <ul className="readout space-y-1 text-xs">
        {faults.map((f) => (
          <li key={f.id} className={found.includes(f.id) ? "text-go" : "text-muted-foreground"}>
            {found.includes(f.id) ? `✔ ${f.label}` : "— unidentified anomaly"}
          </li>
        ))}
      </ul>
      <GameButton onClick={() => onDone(Math.round((found.length / faults.length) * 100))}>
        {done ? "Submit inspection" : "Submit incomplete inspection"}
      </GameButton>
    </div>
  );
}

/* ---------------- Interview ---------------- */
const QUESTIONS = [
  {
    q: "Your teammate wants to continue an EVA despite an unexpected oxygen drop. What do you do?",
    options: [
      { t: "Call a hold, verify the reading with a second sensor, and inform Mission Control.", comm: 10, team: 8 },
      { t: "Let them continue — the task is nearly finished.", comm: 2, team: 2 },
      { t: "Order them inside immediately without explaining.", comm: 5, team: 4 },
    ],
  },
  {
    q: "You have limited power and two damaged systems. Which do you repair first?",
    options: [
      { t: "The one keeping the crew alive, then the science system.", comm: 9, team: 9 },
      { t: "The science system — the mission objective matters most.", comm: 3, team: 3 },
      { t: "Ask Mission Control to decide for me.", comm: 5, team: 6 },
    ],
  },
  {
    q: "Your mission plan suddenly changes mid-flight. How do you respond?",
    options: [
      { t: "Read back the new plan, confirm understanding, then rebrief the crew.", comm: 10, team: 9 },
      { t: "Follow the original plan until someone insists.", comm: 2, team: 3 },
      { t: "Improvise without telling anyone.", comm: 1, team: 1 },
    ],
  },
];

function Interview({ onDone }: { onDone: (comm: number, team: number) => void }) {
  const [i, setI] = useState(0);
  const [comm, setComm] = useState(0);
  const [team, setTeam] = useState(0);
  const cur = QUESTIONS[i];
  if (!cur) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-6">
        <Astronaut suit={1} hair={1} skin={4} mood="focused" size={82} />
        <Astronaut suit={2} hair={2} skin={1} mood="neutral" size={82} />
      </div>
      <Transmission from="SELECTION BOARD" text={cur.q} />
      <div className="grid gap-2">
        {cur.options.map((o) => (
          <button
            key={o.t}
            onClick={() => {
              const c = comm + o.comm;
              const t = team + o.team;
              setComm(c);
              setTeam(t);
              if (i + 1 >= QUESTIONS.length) {
                onDone(Math.round((c / 30) * 100), Math.round((t / 27) * 100));
              } else setI(i + 1);
            }}
            className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-secondary"
          >
            {o.t}
          </button>
        ))}
      </div>
      <p className="hud-label">Question {i + 1}/3</p>
    </div>
  );
}

/* ---------------- Page ---------------- */
function Selection() {
  const { state, update, award } = useMission();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("brief");
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    if (stage !== "board") return;
    const id = setTimeout(() => setReveal(true), 2600);
    return () => clearTimeout(id);
  }, [stage]);

  const s = state.scores;
  const avg = Math.round(
    (s.reaction + s.memory + s.spatial + s.logic + s.communication + s.teamwork) / 6,
  );

  return (
    <main className="relative min-h-screen bg-[#050a16] pb-16">
      <Starfield className="pointer-events-none absolute inset-0 size-full" density={110} />
      <div className="relative z-10 mx-auto max-w-4xl px-5 pt-8">
        <p className="hud-label text-primary">Candidate evaluation terminal</p>
        <h1 className="font-display text-2xl tracking-[0.2em]">ASTRONAUT SELECTION</h1>

        <div className="mt-5 grid gap-4">
          {stage === "brief" && (
            <Panel title="Evaluation briefing" className="animate-rise">
              <Transmission
                from="ASTRA"
                text="Four aptitude stations, then the selection board. Nothing here is a written exam — you will operate real candidate testing hardware."
              />
              <ul className="readout mt-3 space-y-1 text-xs text-muted-foreground">
                <li>01 · REACTION — master caution acknowledgement</li>
                <li>02 · MEMORY — control panel sequence recall</li>
                <li>03 · SPATIAL — docking adapter orientation</li>
                <li>04 · OBSERVATION — pre-flight anomaly inspection</li>
                <li>05 · BOARD INTERVIEW — situational judgement</li>
              </ul>
              <div className="mt-4">
                <GameButton onClick={() => setStage("reaction")}>Begin evaluation</GameButton>
              </div>
            </Panel>
          )}

          {stage === "reaction" && (
            <Panel title="Station 01 — Reaction" className="animate-rise">
              <ReactionTest
                onDone={(v) => {
                  update((d) => {
                    d.scores.reaction = v;
                  });
                  setStage("memory");
                }}
              />
            </Panel>
          )}

          {stage === "memory" && (
            <Panel title="Station 02 — Memory" className="animate-rise">
              <MemoryTest
                onDone={(v) => {
                  update((d) => {
                    d.scores.memory = v;
                  });
                  setTimeout(() => setStage("spatial"), 900);
                }}
              />
            </Panel>
          )}

          {stage === "spatial" && (
            <Panel title="Station 03 — Spatial orientation" className="animate-rise">
              <SpatialTest
                onDone={(v) => {
                  update((d) => {
                    d.scores.spatial = v;
                    d.scores.logic = Math.round((v + d.scores.memory) / 2);
                  });
                  setStage("observation");
                }}
              />
            </Panel>
          )}

          {stage === "observation" && (
            <Panel title="Station 04 — Observation" className="animate-rise">
              <ObservationTest
                onDone={(v) => {
                  update((d) => {
                    d.scores.logic = Math.round((d.scores.logic + v) / 2);
                  });
                  setStage("interview");
                }}
              />
            </Panel>
          )}

          {stage === "interview" && (
            <Panel title="Station 05 — Selection board interview" className="animate-rise">
              <Interview
                onDone={(comm, team) => {
                  update((d) => {
                    d.scores.communication = comm;
                    d.scores.teamwork = team;
                  });
                  setStage("board");
                }}
              />
            </Panel>
          )}

          {stage === "board" && (
            <Panel title="Astronaut candidate evaluation" className="animate-rise">
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["Technical reasoning", s.logic],
                    ["Situational awareness", s.spatial],
                    ["Reaction", s.reaction],
                    ["Memory", s.memory],
                    ["Teamwork", s.teamwork],
                    ["Communication", s.communication],
                  ] as const
                ).map(([label, val]) => (
                  <div key={label} className="rounded-md border border-border/70 bg-background/40 p-2">
                    <div className="flex justify-between">
                      <span className="hud-label">{label}</span>
                      <span className="readout text-sm text-primary">{val}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-1000"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-primary/40 bg-primary/5 p-5 text-center">
                {!reveal ? (
                  <p className="readout animate-pulse text-sm uppercase tracking-[0.3em] text-muted-foreground">
                    Selection board deliberating…
                  </p>
                ) : (
                  <div className="animate-rise space-y-3">
                    <p className="font-display text-xl tracking-[0.25em] text-go">CONGRATULATIONS</p>
                    <p className="text-sm">
                      {state.profile.name || "Candidate"} “{state.profile.callSign || "—"}”, you have
                      been selected for astronaut training.
                    </p>
                    <p className="hud-label">Composite candidate score · {avg}</p>
                    <GameButton
                      onClick={() => {
                        award("ASTRONAUT CANDIDATE");
                        update((d) => {
                          d.phase = "training";
                          d.log.unshift({
                            day: 0,
                            text: "Selected for the Junior Astronaut Training Program.",
                            kind: "good",
                          });
                        });
                        navigate({ to: "/training" });
                      }}
                    >
                      Report to the training center
                    </GameButton>
                  </div>
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </main>
  );
}
