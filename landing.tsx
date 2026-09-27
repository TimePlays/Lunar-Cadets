import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Starfield } from "@/components/game/Starfield";
import { Astronaut } from "@/components/game/Astronaut";
import { GameButton, Panel, Stat, Transmission, WhyBox } from "@/components/game/ui";
import { useMission } from "@/game/state";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "Lunar Landing — J&R ASTROLABS" },
      {
        name: "description",
        content:
          "Fly the powered descent by hand: manage vertical and horizontal velocity, read the landing radar, avoid craters and touch down with fuel to spare.",
      },
      { property: "og:title", content: "Lunar Landing — J&R ASTROLABS" },
      {
        property: "og:description",
        content: "Hand-fly a powered lunar descent to a safe touchdown.",
      },
    ],
  }),
  component: Landing,
});

const G = 0.009; // scaled lunar gravity per tick

function Landing() {
  const { state, update, award, unlockCodex } = useMission();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"approach" | "descent" | "crash" | "touchdown" | "firststep">(
    "approach",
  );
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hud, setHud] = useState({ alt: 220, vv: -0.25, hv: 0.12, fuel: 100 });
  const sim = useRef({
    x: 90,
    y: 220,
    vx: 0.12,
    vy: -0.25,
    fuel: 100,
    thrust: false,
    left: false,
    right: false,
    pads: [] as { x: number; w: number }[],
    terrain: [] as number[],
  });

  /* terrain generation */
  useEffect(() => {
    const s = sim.current;
    const pts: number[] = [];
    for (let i = 0; i <= 64; i++) {
      const base = 30 + Math.sin(i * 0.4) * 10 + Math.sin(i * 0.13) * 14;
      pts.push(base + (Math.random() - 0.5) * 8);
    }
    // flatten two landing pads
    const pads = [
      { x: 12, w: 14 },
      { x: 38, w: 14 },
    ];
    for (const p of pads) {
      const h = pts[p.x] ?? 30;
      for (let i = p.x; i < p.x + p.w; i++) pts[i] = h;
    }
    s.terrain = pts;
    s.pads = pads;
  }, []);

  const groundAt = useCallback((xFrac: number) => {
    const t = sim.current.terrain;
    if (!t.length) return 30;
    const i = Math.max(0, Math.min(t.length - 1, Math.round(xFrac * (t.length - 1))));
    return t[i] ?? 30;
  }, []);

  /* controls */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const s = sim.current;
      if (e.key === "ArrowUp" || e.key === " " || e.key === "w") {
        e.preventDefault();
        s.thrust = true;
      }
      if (e.key === "ArrowLeft" || e.key === "a") s.left = true;
      if (e.key === "ArrowRight" || e.key === "d") s.right = true;
    };
    const up = (e: KeyboardEvent) => {
      const s = sim.current;
      if (e.key === "ArrowUp" || e.key === " " || e.key === "w") s.thrust = false;
      if (e.key === "ArrowLeft" || e.key === "a") s.left = false;
      if (e.key === "ArrowRight" || e.key === "d") s.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  /* simulation loop */
  useEffect(() => {
    if (phase !== "descent") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 720;
    const H = 380;
    let raf = 0;

    const loop = () => {
      const s = sim.current;
      // physics
      s.vy -= G;
      if (s.thrust && s.fuel > 0) {
        s.vy += 0.05;
        s.fuel = Math.max(0, s.fuel - 0.1);
      }
      if (s.left && s.fuel > 0) {
        s.vx -= 0.01;
        s.fuel = Math.max(0, s.fuel - 0.025);
      }
      if (s.right && s.fuel > 0) {
        s.vx += 0.01;
        s.fuel = Math.max(0, s.fuel - 0.025);
      }
      s.x = Math.max(2, Math.min(98, s.x + s.vx * 0.32));
      s.y += s.vy;

      const ground = groundAt(s.x / 100);
      setHud({ alt: Math.max(0, s.y - ground), vv: s.vy, hv: s.vx, fuel: s.fuel });

      // draw
      ctx.clearRect(0, 0, W, H);
      const toPx = (yVal: number) => H - (yVal / 260) * H;

      // terrain
      ctx.fillStyle = "#3c3a35";
      ctx.beginPath();
      ctx.moveTo(0, H);
      s.terrain.forEach((h, i) => ctx.lineTo((i / (s.terrain.length - 1)) * W, toPx(h)));
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // pads
      ctx.fillStyle = "#4fc3e8";
      for (const p of s.pads) {
        const px = (p.x / (s.terrain.length - 1)) * W;
        const pw = (p.w / (s.terrain.length - 1)) * W;
        ctx.fillRect(px, toPx(s.terrain[p.x] ?? 30) - 3, pw, 3);
      }

      // lander
      const lx = (s.x / 100) * W;
      const ly = toPx(s.y);
      ctx.fillStyle = "#e8edf5";
      ctx.fillRect(lx - 11, ly - 14, 22, 14);
      ctx.strokeStyle = "#9aa3b4";
      ctx.beginPath();
      ctx.moveTo(lx - 11, ly);
      ctx.lineTo(lx - 16, ly + 10);
      ctx.moveTo(lx + 11, ly);
      ctx.lineTo(lx + 16, ly + 10);
      ctx.stroke();
      if (s.thrust && s.fuel > 0) {
        ctx.fillStyle = "#f0a63c";
        ctx.beginPath();
        ctx.moveTo(lx - 6, ly);
        ctx.lineTo(lx + 6, ly);
        ctx.lineTo(lx, ly + 16 + Math.random() * 10);
        ctx.closePath();
        ctx.fill();
      }

      // landing radar cross-hair
      ctx.strokeStyle = "rgba(79,195,232,0.4)";
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx, toPx(ground));
      ctx.stroke();

      // touchdown test
      if (s.y - ground <= 1.2) {
        const onPad = s.pads.some((p) => {
          const frac = s.x / 100;
          const i = frac * (s.terrain.length - 1);
          return i >= p.x && i <= p.x + p.w;
        });
        const soft = Math.abs(s.vy) < 0.6 && Math.abs(s.vx) < 0.4;
        if (soft && onPad) {
          setPhase("touchdown");
        } else {
          setPhase("crash");
        }
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [phase, groundAt]);

  const restart = () => {
    const s = sim.current;
    s.x = 90;
    s.y = 220;
    s.vx = 0.12;
    s.vy = -0.25;
    s.fuel = 100;
    setHud({ alt: 220, vv: -0.25, hv: 0.12, fuel: 100 });
    setPhase("descent");
  };

  return (
    <main className="relative min-h-screen bg-[#03060f] pb-16">
      <Starfield className="pointer-events-none absolute inset-0 size-full" density={150} />
      <div className="relative z-10 mx-auto max-w-5xl px-5 pt-8">
        <p className="hud-label text-primary">Lunar orbit · powered descent</p>
        <h1 className="font-display text-2xl tracking-[0.2em]">LUNAR LANDING</h1>

        {phase === "approach" && (
          <Panel title="Descent briefing" className="animate-rise mt-4">
            <Transmission
              from="MISSION CONTROL"
              text="You are go for powered descent. Null your horizontal velocity, keep the descent rate under 0.6, and put it down on a marked pad. Fuel is the margin you will be graded on."
            />
            <ul className="readout mt-3 space-y-1 text-xs text-muted-foreground">
              <li>↑ / SPACE — descent engine</li>
              <li>← / → — translate horizontally</li>
              <li>Blue strips are prepared landing pads; slopes and boulders are not</li>
            </ul>
            <div className="mt-4">
              <GameButton onClick={() => setPhase("descent")}>Begin powered descent</GameButton>
            </div>
          </Panel>
        )}

        {(phase === "descent" || phase === "crash") && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Altitude" value={`${hud.alt.toFixed(1)} m`} accent />
              <Stat
                label="Vertical velocity"
                value={`${hud.vv.toFixed(2)}${Math.abs(hud.vv) > 0.6 ? " ⚠" : ""}`}
              />
              <Stat
                label="Horizontal velocity"
                value={`${hud.hv.toFixed(2)}${Math.abs(hud.hv) > 0.4 ? " ⚠" : ""}`}
              />
              <Stat label="Fuel" value={`${Math.round(hud.fuel)}%`} />
            </div>
            <canvas
              ref={canvasRef}
              width={720}
              height={380}
              className="w-full rounded-lg border border-border bg-[#05070d]"
            />
            <div className="flex flex-wrap gap-2 sm:hidden">
              <GameButton
                onClick={() => {
                  sim.current.thrust = true;
                  setTimeout(() => (sim.current.thrust = false), 260);
                }}
              >
                Thrust
              </GameButton>
              <GameButton
                variant="ghost"
                onClick={() => {
                  sim.current.left = true;
                  setTimeout(() => (sim.current.left = false), 220);
                }}
              >
                ←
              </GameButton>
              <GameButton
                variant="ghost"
                onClick={() => {
                  sim.current.right = true;
                  setTimeout(() => (sim.current.right = false), 220);
                }}
              >
                →
              </GameButton>
            </div>
          </div>
        )}

        {phase === "crash" && (
          <Panel title="Mission review — hard landing" className="animate-rise mt-4">
            <p className="text-sm text-destructive">
              Touchdown exceeded structural limits or occurred outside a prepared pad.
            </p>
            <ul className="readout mt-2 space-y-1 text-xs text-muted-foreground">
              <li>Vertical velocity at contact · {hud.vv.toFixed(2)} (limit 0.6)</li>
              <li>Horizontal velocity at contact · {hud.hv.toFixed(2)} (limit 0.4)</li>
              <li>Prevention · start braking earlier and null sideways drift above 40 m</li>
            </ul>
            <div className="mt-4">
              <GameButton onClick={restart}>Retry from descent checkpoint</GameButton>
            </div>
          </Panel>
        )}

        {phase === "touchdown" && (
          <Panel title="Touchdown confirmed" className="animate-rise mt-4">
            <p className="font-display text-xl tracking-[0.25em] text-go">TOUCHDOWN CONFIRMED</p>
            <p className="mt-2 text-sm text-foreground/85">
              Engine shutdown. Dust settles. {Math.round(hud.fuel)}% descent propellant remaining.
            </p>
            <WhyBox title="Why is horizontal velocity so dangerous?">
              A lander that touches down while drifting sideways can dig a footpad into regolith and
              tip over. Crews null lateral motion before the final descent so the vehicle comes
              straight down.
            </WhyBox>
            <div className="mt-4">
              <GameButton
                onClick={() => {
                  setPhase("firststep");
                  unlockCodex("moon");
                  unlockCodex("gravity");
                  if (hud.fuel > 35) award("PERFECT LANDING");
                }}
              >
                Prepare for first EVA
              </GameButton>
            </div>
          </Panel>
        )}

        {phase === "firststep" && (
          <Panel title="First steps" className="animate-rise mt-4">
            <div className="relative h-52 overflow-hidden rounded-lg border border-border bg-gradient-to-b from-[#03060f] to-[#2a2823]">
              <div className="absolute bottom-0 h-16 w-full bg-[#3c3a35]" />
              <div
                className="absolute right-10 top-6 size-16 rounded-full"
                style={{ background: "radial-gradient(circle at 35% 30%, #4aa3e0, #17518f 60%, #06152c)" }}
              />
              <div className="absolute bottom-12 left-16 animate-floaty">
                <Astronaut
                  helmet
                  size={86}
                  suit={state.profile.suit}
                  hair={state.profile.hair}
                  hairColor={state.profile.hairColor}
                  skin={state.profile.skin}
                  mood="happy"
                />
              </div>
            </div>
            <Transmission
              from="MISSION CONTROL"
              text={`${state.profile.callSign || "Crew"}, Houston. We see you on the surface. Lunar outpost operations begin now — mission day 1 of 30.`}
            />
            <div className="mt-4">
              <GameButton
                onClick={() => {
                  update((d) => {
                    d.phase = "outpost";
                    d.landingFuel = Math.round(hud.fuel);
                    d.landingScore = Math.round(Math.min(100, 55 + hud.fuel * 0.45));
                    d.objectives["eva1"] = true;
                    d.log.unshift({ day: 1, text: "Touchdown and first lunar EVA complete.", kind: "good" });
                  });
                  award("FIRST STEPS");
                  navigate({ to: "/outpost" });
                }}
              >
                Begin lunar outpost operations
              </GameButton>
            </div>
          </Panel>
        )}
      </div>
    </main>
  );
}
