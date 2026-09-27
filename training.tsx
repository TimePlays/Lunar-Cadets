import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Starfield } from "@/components/game/Starfield";
import { Astronaut } from "@/components/game/Astronaut";
import { Caution, GameButton, NavButton, Panel, Transmission, WhyBox } from "@/components/game/ui";
import { useMission } from "@/game/state";
import { CheckCircle2, Lock } from "lucide-react";

export const Route = createFileRoute("/training")({
  head: () => ({
    meta: [
      { title: "Training Center — J&R ASTROLABS" },
      {
        name: "description",
        content:
          "Microgravity physics, EVA spacewalk procedures, lunar gravity mobility, geology and emergency drills — hands-on astronaut training modules.",
      },
      { property: "og:title", content: "Training Center — J&R ASTROLABS" },
      {
        property: "og:description",
        content: "Interactive astronaut training: microgravity, EVA, geology and emergencies.",
      },
    ],
  }),
  component: Training,
});

const MODULES = [
  { id: "micro", name: "Microgravity Training", blurb: "Newton's laws, inertia, handrail translation" },
  { id: "eva", name: "EVA / Spacewalk Training", blurb: "Suit consumables, tether discipline, repair procedure" },
  { id: "lunar", name: "Lunar Gravity Mobility", blurb: "1/6 g loping, load carriage, fall recovery" },
  { id: "geology", name: "Lunar Geology", blurb: "Sample triage and scientific value" },
  { id: "emergency", name: "Emergency Procedures", blurb: "Cabin pressure loss response chain" },
];

const REQUIRED = MODULES.length;

/* ---------- Microgravity minigame (canvas physics) ---------- */
function Microgravity({ onDone }: { onDone: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [collected, setCollected] = useState(0);
  const [impacts, setImpacts] = useState(0);
  const [running, setRunning] = useState(true);
  const stateRef = useRef({
    p: { x: 80, y: 120, vx: 0, vy: 0 },
    items: [] as { x: number; y: number; vx: number; vy: number; got: boolean }[],
    keys: new Set<string>(),
  });

  useEffect(() => {
    const st = stateRef.current;
    st.items = Array.from({ length: 5 }, () => ({
      x: 120 + Math.random() * 420,
      y: 40 + Math.random() * 220,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      got: false,
    }));
    const down = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
      st.keys.add(e.key);
    };
    const up = (e: KeyboardEvent) => st.keys.delete(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const W = 640;
    const H = 300;

    const loop = () => {
      const st = stateRef.current;
      const k = st.keys;
      const thrust = 0.035;
      if (k.has("ArrowLeft") || k.has("a")) st.p.vx -= thrust;
      if (k.has("ArrowRight") || k.has("d")) st.p.vx += thrust;
      if (k.has("ArrowUp") || k.has("w")) st.p.vy -= thrust;
      if (k.has("ArrowDown") || k.has("s")) st.p.vy += thrust;

      st.p.x += st.p.vx;
      st.p.y += st.p.vy;

      // Walls: no friction in microgravity, only bounce (action/reaction)
      if (st.p.x < 12 || st.p.x > W - 12) {
        st.p.vx *= -0.7;
        st.p.x = Math.max(12, Math.min(W - 12, st.p.x));
        setImpacts((i) => i + 1);
      }
      if (st.p.y < 12 || st.p.y > H - 12) {
        st.p.vy *= -0.7;
        st.p.y = Math.max(12, Math.min(H - 12, st.p.y));
        setImpacts((i) => i + 1);
      }

      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(120,190,230,0.25)";
      ctx.strokeRect(6, 6, W - 12, H - 12);
      // handrails
      ctx.strokeStyle = "rgba(120,190,230,0.45)";
      ctx.lineWidth = 3;
      for (let y = 60; y < H; y += 90) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(W - 30, y);
        ctx.stroke();
      }

      for (const it of st.items) {
        if (it.got) continue;
        it.x += it.vx;
        it.y += it.vy;
        if (it.x < 14 || it.x > W - 14) it.vx *= -1;
        if (it.y < 14 || it.y > H - 14) it.vy *= -1;
        const d = Math.hypot(it.x - st.p.x, it.y - st.p.y);
        if (d < 20) {
          it.got = true;
          setCollected((c) => c + 1);
        }
        ctx.fillStyle = "#f0a63c";
        ctx.fillRect(it.x - 7, it.y - 7, 14, 14);
      }

      // astronaut marker + velocity vector
      ctx.fillStyle = "#e8edf5";
      ctx.beginPath();
      ctx.arc(st.p.x, st.p.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#4fc3e8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(st.p.x, st.p.y);
      ctx.lineTo(st.p.x + st.p.vx * 24, st.p.y + st.p.vy * 24);
      ctx.stroke();

      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (collected >= 5 && running) {
      setRunning(false);
      onDone(Math.max(45, 100 - impacts * 4));
    }
  }, [collected, impacts, running, onDone]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground/85">
        Retrieve all five floating equipment cases. There is no friction — every push keeps you
        moving until you push back the other way. Arrow keys / WASD apply thrust.
      </p>
      <canvas
        ref={canvasRef}
        width={640}
        height={300}
        className="w-full rounded-lg border border-border bg-background/70"
      />
      <div className="flex flex-wrap gap-4">
        <span className="hud-label">Equipment secured · {collected}/5</span>
        <span className="hud-label">Uncontrolled contacts · {impacts}</span>
      </div>
      <WhyBox title="Why don't you stop when you release the key?">
        Newton's first law: with no friction and no gravity to fight, a body in motion stays in
        motion. Astronauts translate by pulling on handrails and then apply an equal, opposite push
        to arrest that motion before arrival.
      </WhyBox>
    </div>
  );
}

/* ---------- EVA procedure ---------- */
const EVA_STEPS = [
  "Verify suit pressure and tether attachment",
  "Translate along handrail to worksite",
  "Safety the failed avionics box",
  "Disconnect the power connector",
  "Remove and stow the failed unit",
  "Install and torque the replacement unit",
  "Reconnect power and verify telemetry",
  "Translate back to airlock",
];

function EVATraining({ onDone }: { onDone: (score: number) => void }) {
  const [step, setStep] = useState(0);
  const [o2, setO2] = useState(100);
  const [rate, setRate] = useState<"slow" | "fast">("slow");
  const [errors, setErrors] = useState(0);
  const [event, setEvent] = useState<string | null>(null);
  const [tether, setTether] = useState(true);

  useEffect(() => {
    if (step >= EVA_STEPS.length) return;
    const id = setInterval(() => {
      setO2((v) => Math.max(0, v - (rate === "fast" ? 1.4 : 0.5)));
    }, 700);
    return () => clearInterval(id);
  }, [rate, step]);

  useEffect(() => {
    if (step === 4) setEvent("Tool drift detected — a wrench is floating away from the worksite.");
  }, [step]);

  const done = step >= EVA_STEPS.length;
  useEffect(() => {
    if (done) onDone(Math.max(40, Math.round(o2 * 0.6 + (tether ? 30 : 0) - errors * 8) + 10));
  }, [done, o2, errors, tether, onDone]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Oxygen", `${Math.round(o2)}%`, o2 < 30],
          ["Suit pressure", "4.3 psi", false],
          ["CO₂", rate === "fast" ? "elevated" : "nominal", rate === "fast"],
          ["Tether", tether ? "connected" : "FREE", !tether],
        ].map(([l, v, bad]) => (
          <div
            key={l as string}
            className={`rounded-md border p-2 ${bad ? "border-destructive alarm-pulse" : "border-border/70"} bg-background/40`}
          >
            <div className="hud-label">{l as string}</div>
            <div className="readout text-sm">{v as string}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <GameButton variant={rate === "slow" ? "primary" : "ghost"} onClick={() => setRate("slow")}>
          Move deliberately
        </GameButton>
        <GameButton variant={rate === "fast" ? "accent" : "ghost"} onClick={() => setRate("fast")}>
          Move quickly
        </GameButton>
        <GameButton variant="ghost" onClick={() => setTether((t) => !t)}>
          {tether ? "Release tether" : "Reattach tether"}
        </GameButton>
      </div>

      {!tether && <Caution>Tether released. A free-floating crew member cannot be recovered quickly.</Caution>}

      {event && (
        <div className="panel space-y-2 p-3">
          <p className="text-sm text-caution">{event}</p>
          <div className="flex flex-wrap gap-2">
            <GameButton
              onClick={() => {
                setEvent(null);
              }}
            >
              Retrieve with tether hook
            </GameButton>
            <GameButton
              variant="ghost"
              onClick={() => {
                setErrors((e) => e + 1);
                setEvent(null);
              }}
            >
              Let it go and continue
            </GameButton>
          </div>
        </div>
      )}

      <ol className="space-y-1">
        {EVA_STEPS.map((s, i) => (
          <li
            key={s}
            className={`readout flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
              i < step
                ? "border-go/40 bg-go/10 text-go"
                : i === step
                  ? "border-primary bg-primary/10"
                  : "border-border/60 text-muted-foreground"
            }`}
          >
            {i < step ? <CheckCircle2 className="size-3.5" /> : <span>{String(i + 1).padStart(2, "0")}</span>}
            {s}
          </li>
        ))}
      </ol>

      {!done && (
        <GameButton onClick={() => setStep((s) => s + 1)} disabled={!!event}>
          Execute step {step + 1}
        </GameButton>
      )}
      <WhyBox title="Why does moving quickly cost oxygen?">
        Higher exertion raises metabolic rate, so the crew member consumes oxygen faster and
        produces more CO₂ and heat for the suit to remove. Trained EVA crews move slowly and
        deliberately to protect consumables.
      </WhyBox>
    </div>
  );
}

/* ---------- Lunar gravity mobility ---------- */
function LunarMobility({ onDone }: { onDone: (score: number) => void }) {
  const [x, setX] = useState(0);
  const [vy, setVy] = useState(0);
  const [y, setY] = useState(0);
  const [mode, setMode] = useState<"earth" | "moon">("moon");
  const [falls, setFalls] = useState(0);
  const [reached, setReached] = useState(false);

  useEffect(() => {
    const g = mode === "moon" ? 0.055 : 0.33;
    const id = setInterval(() => {
      setY((prevY) => {
        const ny = prevY + vy;
        if (ny <= 0) {
          setVy(0);
          return 0;
        }
        return ny;
      });
      setVy((v) => v - g);
    }, 30);
    return () => clearInterval(id);
  }, [vy, mode]);

  const hop = () => {
    if (y <= 0.5) {
      setVy(mode === "moon" ? 1.6 : 1.6);
      setX((v) => {
        const nx = v + (mode === "moon" ? 9 : 3.5);
        if (nx >= 100 && !reached) {
          setReached(true);
          onDone(Math.max(50, 100 - falls * 10));
        }
        return Math.min(100, nx);
      });
      if (mode === "earth" && Math.random() < 0.2) setFalls((f) => f + 1);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground/85">
        Traverse 100 m to the sample site by loping. Compare Earth gravity (9.81 m/s²) with lunar
        gravity (1.62 m/s²) — the same muscle effort carries you much further on the Moon.
      </p>
      <div className="flex gap-2">
        <GameButton variant={mode === "moon" ? "primary" : "ghost"} onClick={() => setMode("moon")}>
          Lunar 1/6 g
        </GameButton>
        <GameButton variant={mode === "earth" ? "accent" : "ghost"} onClick={() => setMode("earth")}>
          Earth 1 g
        </GameButton>
      </div>
      <div className="relative h-44 overflow-hidden rounded-lg border border-border bg-gradient-to-b from-[#05070f] to-[#1a1a22]">
        <div className="absolute bottom-0 h-10 w-full bg-[#3a3833]" />
        <div
          className="absolute bottom-8 transition-[left] duration-100"
          style={{ left: `calc(${Math.min(92, x)}% )`, transform: `translateY(${-y * 12}px)` }}
        >
          <Astronaut helmet size={54} mood={y > 1 ? "happy" : "focused"} />
        </div>
        <div className="absolute bottom-10 right-3 text-xs text-accent">▲ SAMPLE SITE</div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <GameButton onClick={hop}>Hop forward</GameButton>
        <span className="hud-label">Distance · {Math.round(x)} m / 100 m</span>
        <span className="hud-label">Stumbles · {falls}</span>
      </div>
      {reached && <p className="readout text-sm text-go">Traverse complete — mobility qualified.</p>}
    </div>
  );
}

/* ---------- Geology triage ---------- */
const ROCKS = [
  { id: "r1", name: "Vesicular basalt", value: 8, note: "Volcanic, gas bubbles — mare origin" },
  { id: "r2", name: "Anorthosite fragment", value: 10, note: "Ancient crust, high scientific value" },
  { id: "r3", name: "Impact breccia", value: 7, note: "Welded fragments from an impact event" },
  { id: "r4", name: "Loose regolith fines", value: 4, note: "Common, still useful for dust studies" },
  { id: "r5", name: "Shocked glass bead", value: 9, note: "Formed by impact melting" },
];

function Geology({ onDone }: { onDone: (score: number) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const budget = 3;
  const best = [...ROCKS].sort((a, b) => b.value - a.value).slice(0, budget).map((r) => r.id);

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground/85">
        You can carry only {budget} samples back to the lander. Choose the highest-value science.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {ROCKS.map((r) => (
          <button
            key={r.id}
            onClick={() =>
              setPicked((p) =>
                p.includes(r.id) ? p.filter((i) => i !== r.id) : p.length < budget ? [...p, r.id] : p,
              )
            }
            className={`rounded-md border p-3 text-left transition-all ${
              picked.includes(r.id)
                ? "border-primary bg-primary/15"
                : "border-border bg-secondary/30 hover:bg-secondary/60"
            }`}
          >
            <div className="readout text-sm">{r.name}</div>
            <div className="hud-label mt-1">{r.note}</div>
          </button>
        ))}
      </div>
      <GameButton
        disabled={picked.length < budget}
        onClick={() => {
          const hits = picked.filter((p) => best.includes(p)).length;
          onDone(Math.round((hits / budget) * 100));
        }}
      >
        Stow selected samples
      </GameButton>
    </div>
  );
}

/* ---------- Emergency drill ---------- */
const CORRECT_ORDER = ["alarm", "isolate", "crew", "stabilize", "report"];
const ACTIONS = [
  { id: "alarm", label: "Acknowledge master alarm and identify the fault" },
  { id: "isolate", label: "Isolate the affected module hatch" },
  { id: "crew", label: "Account for all crew members" },
  { id: "stabilize", label: "Repressurise from reserve tanks" },
  { id: "report", label: "Report configuration to Mission Control" },
];

function EmergencyDrill({ onDone }: { onDone: (score: number) => void }) {
  const [order, setOrder] = useState<string[]>([]);
  const [t, setT] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setT((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [done]);

  const submit = () => {
    const accuracy = order.filter((id, i) => CORRECT_ORDER[i] === id).length / CORRECT_ORDER.length;
    setDone(true);
    onDone(Math.max(35, Math.round(accuracy * 100 - Math.max(0, t - 25))));
  };

  return (
    <div className="space-y-3">
      <div className="alarm-pulse rounded-md border border-destructive bg-destructive/10 p-3">
        <p className="readout text-sm uppercase tracking-widest text-destructive">
          ⚠ Cabin pressure loss — habitat module
        </p>
        <p className="hud-label mt-1">Elapsed {t}s · order matters</p>
      </div>
      <div className="grid gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            disabled={order.includes(a.id) || done}
            onClick={() => setOrder((o) => [...o, a.id])}
            className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-left text-sm transition-colors hover:border-primary disabled:opacity-40"
          >
            {order.includes(a.id) && (
              <span className="readout mr-2 text-primary">{order.indexOf(a.id) + 1}.</span>
            )}
            {a.label}
          </button>
        ))}
      </div>
      <GameButton disabled={order.length < ACTIONS.length || done} onClick={submit}>
        Submit response
      </GameButton>
      <WhyBox title="Why isolate before repressurising?">
        Feeding gas into a module that is still leaking dumps your reserves overboard. Isolating the
        leak first preserves consumables, and accounting for crew ensures nobody is sealed in the
        affected volume.
      </WhyBox>
    </div>
  );
}

/* ---------- Page ---------- */
function Training() {
  const { state, update, award, unlockCodex } = useMission();
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);

  const complete = useCallback(
    (id: string, score: number) => {
      update((d) => {
        d.training[id] = Math.max(d.training[id] ?? 0, Math.max(0, Math.min(100, score)));
        d.log.unshift({ day: 0, text: `Training module complete: ${id} (${score}%).`, kind: "good" });
      });
      if (id === "micro") unlockCodex("orbits");
      if (id === "eva") unlockCodex("eva");
      if (id === "lunar") unlockCodex("gravity");
      if (id === "geology") unlockCodex("regolith");
      if (id === "emergency") unlockCodex("lifesupport");
      setActive(null);
    },
    [update, unlockCodex],
  );

  const readinessPct = Math.round(
    MODULES.reduce((a, m) => a + (state.training[m.id] ?? 0), 0) / REQUIRED,
  );
  const allDone = MODULES.every((m) => (state.training[m.id] ?? 0) > 0);

  return (
    <main className="relative min-h-screen bg-[#050a16] pb-16">
      <Starfield className="pointer-events-none absolute inset-0 size-full" density={90} />
      <div className="relative z-10 mx-auto max-w-6xl px-5 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="hud-label text-primary">Astronaut training facility · Houston</p>
            <h1 className="font-display text-2xl tracking-[0.2em]">TRAINING CENTER</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="hud-label">Astronaut readiness</div>
              <div className="readout text-2xl text-primary">{readinessPct}%</div>
            </div>
            <NavButton to="/">Home</NavButton>
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
            style={{ width: `${readinessPct}%` }}
          />
        </div>

        {/* Animated hub with trainees */}
        <div className="panel relative mt-5 h-32 overflow-hidden">
          <div className="grid-floor absolute inset-0 opacity-50" />
          <div className="absolute bottom-3 left-6 animate-floaty">
            <Astronaut size={62} mood="happy" suit={0} />
          </div>
          <div className="absolute bottom-3 left-40 animate-floaty" style={{ animationDelay: "-1.4s" }}>
            <Astronaut size={58} mood="focused" suit={2} hair={1} skin={4} />
          </div>
          <div className="absolute bottom-3 right-10 animate-floaty" style={{ animationDelay: "-2.6s" }}>
            <Astronaut size={58} mood="neutral" suit={3} hair={3} skin={1} />
          </div>
          <p className="hud-label absolute right-4 top-3">Trainee concourse · live</p>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="space-y-2">
            {MODULES.map((m) => {
              const score = state.training[m.id] ?? 0;
              return (
                <button
                  key={m.id}
                  onClick={() => setActive(m.id)}
                  className={`panel flex w-full items-center justify-between gap-3 p-3 text-left transition-all hover:border-primary ${
                    active === m.id ? "border-primary" : ""
                  }`}
                >
                  <div>
                    <div className="readout text-sm">{m.name}</div>
                    <div className="hud-label">{m.blurb}</div>
                  </div>
                  {score > 0 ? (
                    <span className="readout text-xs text-go">{score}%</span>
                  ) : (
                    <Lock className="size-4 text-muted-foreground" aria-hidden />
                  )}
                </button>
              );
            })}
            {allDone && (
              <GameButton
                className="w-full"
                onClick={() => {
                  award("MISSION QUALIFIED");
                  update((d) => {
                    d.phase = "planning";
                  });
                  navigate({ to: "/planning" });
                }}
              >
                Final readiness report → mission assignment
              </GameButton>
            )}
          </div>

          <Panel title={(active ? MODULES.find((m) => m.id === active)?.name : "Select a module") ?? "Module"}>
            {!active && (
              <div className="space-y-3">
                <Transmission
                  from="ASTRA"
                  text="Every module is hands-on. Complete all five to reach flight readiness — launch is locked until then."
                />
                <p className="text-sm text-muted-foreground">
                  Choose a training module on the left to begin.
                </p>
              </div>
            )}
            {active === "micro" && <Microgravity onDone={(s) => complete("micro", s)} />}
            {active === "eva" && <EVATraining onDone={(s) => complete("eva", s)} />}
            {active === "lunar" && <LunarMobility onDone={(s) => complete("lunar", s)} />}
            {active === "geology" && <Geology onDone={(s) => complete("geology", s)} />}
            {active === "emergency" && <EmergencyDrill onDone={(s) => complete("emergency", s)} />}
          </Panel>
        </div>
      </div>
    </main>
  );
}
