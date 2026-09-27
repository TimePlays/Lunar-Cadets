import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Starfield } from "@/components/game/Starfield";
import { Caution, GameButton, Meter, NavButton, Panel, Stat, Transmission, WhyBox } from "@/components/game/ui";
import { useMission } from "@/game/state";
import { Battery, Gauge, Radiation } from "lucide-react";

export const Route = createFileRoute("/rover")({
  head: () => ({
    meta: [
      { title: "Rover Expedition — J&R ASTROLABS" },
      {
        name: "description",
        content:
          "Drive a pressurised lunar rover across real terrain, manage battery range and return margin, drill for subsurface water ice and collect samples.",
      },
      { property: "og:title", content: "Rover Expedition — J&R ASTROLABS" },
      {
        property: "og:description",
        content: "Traverse the lunar south pole, drill regolith cores and investigate water ice.",
      },
    ],
  }),
  component: Rover,
});

interface Site {
  km: number;
  name: string;
  type: string;
  shadowed: boolean;
  visited: boolean;
}

const SITE_TEMPLATE: Omit<Site, "visited">[] = [
  { km: 1.6, name: "Ejecta field A", type: "Basalt breccia", shadowed: false },
  { km: 3.4, name: "Rille edge", type: "Vesicular basalt", shadowed: false },
  { km: 5.2, name: "Crater rim CR-7", type: "Anorthosite", shadowed: false },
  { km: 7.0, name: "Shadowed floor PSR-1", type: "Icy regolith", shadowed: true },
  { km: 9.1, name: "Boulder apron", type: "Impact melt", shadowed: false },
  { km: 11.3, name: "Deep shadow PSR-2", type: "Ice-cemented regolith", shadowed: true },
];

function Rover() {
  const { state, update, award, unlockCodex } = useMission();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keys = useRef<Record<string, boolean>>({});
  const posRef = useRef(state.rover.x);
  const velRef = useRef(0);
  const battRef = useRef(state.rover.battery);

  const [sites, setSites] = useState<Site[]>(() => SITE_TEMPLATE.map((s) => ({ ...s, visited: false })));
  const [pos, setPos] = useState(state.rover.x);
  const [vel, setVel] = useState(0);
  const [batt, setBatt] = useState(state.rover.battery);
  const [message, setMessage] = useState<string | null>(null);
  const [drill, setDrill] = useState<{ site: Site; depth: number; ice: number } | null>(null);
  const [stranded, setStranded] = useState(false);

  const slopeAt = (x: number) => Math.sin(x * 0.55) * 0.6 + Math.sin(x * 0.17) * 0.4;
  const groundY = useCallback((x: number) => 200 + Math.sin(x * 0.55) * 14 + Math.sin(x * 0.17) * 26, []);

  // physics + render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();

    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;

      // --- physics ---
      const throttle = (keys.current["ArrowRight"] || keys.current["d"] ? 1 : 0) -
        (keys.current["ArrowLeft"] || keys.current["a"] ? 1 : 0);
      const slope = slopeAt(posRef.current);
      if (battRef.current > 0) {
        velRef.current += throttle * 1.6 * dt;
      }
      velRef.current -= slope * 0.35 * dt;
      velRef.current *= 0.985;
      velRef.current = Math.max(-2.2, Math.min(3.2, velRef.current));
      if (keys.current[" "]) velRef.current *= 0.9;
      const move = velRef.current * dt;
      posRef.current = Math.max(0, posRef.current + move);
      // energy: distance + uphill penalty
      const drawKwh = Math.abs(move) * (2.1 + Math.max(0, slope) * 2.4);
      battRef.current = Math.max(0, battRef.current - drawKwh);
      if (battRef.current <= 0) velRef.current *= 0.9;

      setPos(posRef.current);
      setVel(velRef.current);
      setBatt(battRef.current);

      // --- render ---
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "#03060f");
      grd.addColorStop(1, "#0a1220");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // stars
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      for (let i = 0; i < 60; i++) {
        const sx = (i * 137.5) % w;
        const sy = (i * 61.3) % 120;
        ctx.fillRect(sx, sy, 1.4, 1.4);
      }
      // Earth
      ctx.beginPath();
      ctx.arc(w - 80, 60, 22, 0, Math.PI * 2);
      ctx.fillStyle = "#2f6fb8";
      ctx.fill();
      ctx.strokeStyle = "rgba(120,200,255,0.5)";
      ctx.stroke();

      const camX = posRef.current;
      const scale = 46; // px per km-unit
      // terrain
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let px = 0; px <= w; px += 4) {
        const worldX = camX + (px - w / 2) / scale;
        ctx.lineTo(px, groundY(worldX));
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = "#9a9severe".slice(0, 0) || "#8d8f96";
      ctx.fill();
      ctx.strokeStyle = "#c9ccd6";
      ctx.lineWidth = 1;
      ctx.stroke();

      // sites
      sites.forEach((s) => {
        const px = w / 2 + (s.km - camX) * scale;
        if (px < -40 || px > w + 40) return;
        const gy = groundY(s.km);
        ctx.strokeStyle = s.shadowed ? "#7fd8ff" : s.visited ? "#5ad07a" : "#ffb648";
        ctx.beginPath();
        ctx.moveTo(px, gy);
        ctx.lineTo(px, gy - 42);
        ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fillRect(px, gy - 48, 8, 8);
        ctx.font = "9px monospace";
        ctx.fillText(`${s.km.toFixed(1)}km`, px - 10, gy - 54);
      });

      // rover
      const rx = w / 2;
      const ry = groundY(camX);
      const ang = Math.atan2(groundY(camX + 0.3) - groundY(camX - 0.3), 0.6 * scale);
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(ang);
      ctx.fillStyle = "#e6e9f0";
      ctx.fillRect(-22, -22, 44, 16);
      ctx.fillStyle = "#b9c0d0";
      ctx.fillRect(-26, -8, 52, 8);
      ctx.fillStyle = "#1a2740";
      ctx.fillRect(10, -19, 10, 9); // window
      ctx.fillStyle = "#3a3f4d";
      [-18, -4, 10, 20].forEach((wx) => {
        ctx.beginPath();
        ctx.arc(wx, 2, 6, 0, Math.PI * 2);
        ctx.fill();
      });
      // antenna
      ctx.strokeStyle = "#7fd8ff";
      ctx.beginPath();
      ctx.moveTo(-20, -22);
      ctx.lineTo(-24, -36);
      ctx.stroke();
      ctx.restore();

      // dust when moving
      if (Math.abs(velRef.current) > 0.3) {
        ctx.fillStyle = "rgba(200,200,210,0.25)";
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.arc(rx - 30 - i * 5, ry + 2 + (i % 3), 3 - i * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [groundY, sites]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      if ([" ", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const returnMargin = batt - pos * 2.4;
  const nearby = sites.find((s) => Math.abs(s.km - pos) < 0.35 && !s.visited);

  useEffect(() => {
    if (batt <= 0 && pos > 0.5 && !stranded) {
      setStranded(true);
      update((d) => {
        d.crew.forEach((c) => (c.health = Math.max(10, c.health - 12)));
        d.log.unshift({
          day: d.day,
          text: "Rover battery depleted in the field — crew walked back, costing time and health.",
          kind: "warn",
        });
      });
    }
  }, [batt, pos, stranded, update]);

  const collect = (site: Site) => {
    update((d) => {
      const id = `S-${String(d.samples.length + 1).padStart(3, "0")}`;
      d.samples.push({
        id,
        site: site.name,
        type: site.type,
        massKg: 0.6 + Math.random() * 1.8,
        value: site.shadowed ? 12 : 6,
        ice: false,
      });
      d.science += site.shadowed ? 8 : 5;
      d.objectives["eva1"] = true;
      if (d.samples.length >= 5) d.objectives["samples5"] = true;
      d.log.unshift({ day: d.day, text: `Sample ${id} collected at ${site.name}.`, kind: "good" });
    });
    setSites((s) => s.map((x) => (x.km === site.km ? { ...x, visited: true } : x)));
    setMessage(`Sample bagged at ${site.name}.`);
    unlockCodex("regolith");
  };

  const startDrill = (site: Site) => setDrill({ site, depth: 0, ice: 0 });

  const drillStep = () => {
    if (!drill) return;
    const depth = drill.depth + 20;
    // ice concentration grows with depth in permanently shadowed regions
    const ice = drill.site.shadowed ? Math.min(96, depth * 0.55 + Math.random() * 8) : Math.random() * 3;
    const next = { ...drill, depth, ice };
    setDrill(next);
    if (depth >= 100) {
      update((d) => {
        d.res.battery = Math.max(0, d.res.battery - 2);
        if (drill.site.shadowed) {
          d.samples.push({
            id: `ICE-${String(d.samples.length + 1).padStart(3, "0")}`,
            site: drill.site.name,
            type: "Ice-bearing core",
            massKg: 1.4,
            value: 20,
            ice: true,
          });
          d.science += 18;
          d.objectives["ice"] = true;
          if (!d.achievements.includes("ICE HUNTER")) d.achievements.push("ICE HUNTER");
          d.log.unshift({
            day: d.day,
            text: `Water ice confirmed at ${drill.site.name} — ${ice.toFixed(0)}% ice signature at 1 m depth.`,
            kind: "good",
          });
        } else {
          d.science += 3;
          d.log.unshift({
            day: d.day,
            text: `Core at ${drill.site.name} is dry regolith — negative for ice.`,
            kind: "info",
          });
        }
      });
      unlockCodex("ice");
      setSites((s) => s.map((x) => (x.km === drill.site.km ? { ...x, visited: true } : x)));
      setMessage(
        drill.site.shadowed
          ? "Spectrometer confirms water ice mixed into the regolith."
          : "No ice signature here — sunlit ground is far too warm to keep it.",
      );
      setDrill(null);
    }
  };

  const endExpedition = () => {
    update((d) => {
      d.rover.battery = batt;
      d.rover.distance = Math.max(d.rover.distance, pos * 2);
      d.rover.x = 0;
      d.clock += 6 + pos * 0.4;
      if (d.rover.distance >= 10) d.objectives["traverse"] = true;
      d.log.unshift({ day: d.day, text: `Rover expedition complete — ${(pos * 2).toFixed(1)} km round trip.`, kind: "info" });
    });
    if (pos * 2 >= 10) award("LONG RANGER");
    navigate({ to: "/outpost" });
  };

  return (
    <main className="relative min-h-screen bg-[#050a16] pb-16">
      <Starfield className="pointer-events-none absolute inset-0 size-full" density={50} />
      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-6">
        <div className="panel flex flex-wrap items-center justify-between gap-3 p-3">
          <div>
            <p className="hud-label text-primary">Pressurised rover · traverse ops</p>
            <p className="readout text-lg">MISSION DAY {String(state.day).padStart(2, "0")}</p>
          </div>
          <div className="flex gap-2">
            <NavButton to="/outpost">Back to outpost</NavButton>
            <NavButton to="/database">Database</NavButton>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Meter label="Rover battery" value={batt} icon={<Battery className="size-3" />} />
          <Stat label="Distance out" value={`${pos.toFixed(2)} km`} accent />
          <Stat label="Speed" value={`${(Math.abs(vel) * 3.6).toFixed(1)} km/h`} />
          <Stat label="Return margin" value={`${returnMargin.toFixed(0)}%`} />
        </div>

        {returnMargin < 20 && pos > 0.5 && (
          <div className="mt-3">
            <Caution>
              Return margin is thin. Every kilometre outbound must be paid for again coming home —
              turn back before the battery reaches the halfway point.
            </Caution>
          </div>
        )}

        <div className="mt-3 overflow-hidden rounded-md border border-border">
          <canvas ref={canvasRef} width={900} height={300} className="w-full bg-[#050a16]" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="hud-label">Controls:</span>
          <GameButton
            variant="ghost"
            onClick={() => {
              keys.current["ArrowLeft"] = true;
              setTimeout(() => (keys.current["ArrowLeft"] = false), 260);
            }}
          >
            ◀ Reverse
          </GameButton>
          <GameButton
            onClick={() => {
              keys.current["ArrowRight"] = true;
              setTimeout(() => (keys.current["ArrowRight"] = false), 260);
            }}
          >
            Drive ▶
          </GameButton>
          <GameButton
            variant="ghost"
            onClick={() => {
              velRef.current *= 0.3;
            }}
          >
            Brake
          </GameButton>
          <span className="hud-label">or use ← → and space on a keyboard</span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Station keeping">
            {nearby ? (
              <div className="space-y-2">
                <p className="readout text-sm text-primary">{nearby.name}</p>
                <p className="text-sm text-foreground/85">
                  Geology: {nearby.type}. {nearby.shadowed
                    ? "This crater floor has never seen sunlight — surface temperature about −230 °C."
                    : "Sunlit terrain, surface temperature above +100 °C at local noon."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <GameButton onClick={() => collect(nearby)}>Collect surface sample</GameButton>
                  <GameButton variant="accent" onClick={() => startDrill(nearby)}>
                    Drill 1 m core
                  </GameButton>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Drive to a marked science station (orange or blue flag) and stop within 350 m to work.
              </p>
            )}

            {drill && (
              <div className="mt-3 space-y-2 rounded-md border border-primary/40 bg-primary/5 p-3">
                <p className="readout text-sm">
                  Drilling {drill.site.name} — depth {drill.depth} cm
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary transition-all" style={{ width: `${drill.depth}%` }} />
                </div>
                <p className="hud-label">Neutron spectrometer: {drill.ice.toFixed(0)}% hydrogen signature</p>
                <GameButton onClick={drillStep}>Advance drill 20 cm</GameButton>
              </div>
            )}
          </Panel>

          <Panel title="Science return">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Samples" value={state.samples.length} accent />
              <Stat label="Science" value={state.science} />
              <Stat label="Ice cores" value={state.samples.filter((s) => s.ice).length} />
            </div>
            <div className="mt-3">
              <WhyBox title="Why is ice only in the shadows?">
                Near the lunar poles some crater floors never receive direct sunlight. These
                permanently shadowed regions stay near −230 °C, cold enough for water ice delivered by
                comets and impacts to survive for billions of years. Ice means drinking water, breathable
                oxygen and rocket propellant made on the Moon instead of carried from Earth.
              </WhyBox>
            </div>
            <div className="mt-3">
              <Transmission
                from="ASTRA"
                text="Remember the range rule: your usable battery is half your total, because the rover has to come home too."
              />
            </div>
          </Panel>
        </div>

        {message && (
          <div className="mt-3 rounded-md border border-go/50 bg-go/10 p-3 text-sm text-foreground/90">
            {message}
          </div>
        )}

        {stranded && (
          <div className="mt-3 rounded-md border border-destructive bg-destructive/10 p-3">
            <p className="readout text-sm text-destructive">ROVER STRANDED</p>
            <p className="mt-1 text-sm text-foreground/85">
              The battery reached zero away from the outpost. The crew walked back on suit consumables,
              losing health and a working day. Range planning is a survival skill, not a convenience.
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <GameButton variant="accent" onClick={endExpedition}>
            Return to outpost
          </GameButton>
          <span className="readout flex items-center gap-2 text-xs text-muted-foreground">
            <Gauge className="size-3" /> traverse logged {(pos * 2).toFixed(1)} km ·{" "}
            <Radiation className="size-3" /> surface dose rising
          </span>
        </div>
      </div>
    </main>
  );
}
