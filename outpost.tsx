import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Starfield } from "@/components/game/Starfield";
import { Astronaut } from "@/components/game/Astronaut";
import {
  Caution,
  GameButton,
  Meter,
  NavButton,
  Panel,
  Stat,
  Transmission,
  WhyBox,
} from "@/components/game/ui";
import { OBJECTIVES, useMission, type MissionState } from "@/game/state";
import { Battery, Droplets, Radiation, Wind, Wheat, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/outpost")({
  head: () => ({
    meta: [
      { title: "Lunar Outpost — J&R ASTROLABS" },
      {
        name: "description",
        content:
          "Run a lunar research outpost for 30 mission days: balance oxygen, water, power, food, crew health and radiation while doing real science.",
      },
      { property: "og:title", content: "Lunar Outpost — J&R ASTROLABS" },
      {
        property: "og:description",
        content: "Thirty days of interconnected life support, power and science decisions.",
      },
    ],
  }),
  component: Outpost,
});

type ModuleId = "command" | "habitat" | "life" | "lab" | "med" | "power" | "airlock" | "garage";

const MODULES: { id: ModuleId; name: string; x: number; y: number }[] = [
  { id: "command", name: "Command", x: 6, y: 18 },
  { id: "habitat", name: "Crew habitat", x: 30, y: 18 },
  { id: "life", name: "Life support", x: 54, y: 18 },
  { id: "lab", name: "Laboratory", x: 78, y: 18 },
  { id: "med", name: "Medical bay", x: 6, y: 58 },
  { id: "power", name: "Power control", x: 30, y: 58 },
  { id: "airlock", name: "Airlock", x: 54, y: 58 },
  { id: "garage", name: "Rover garage", x: 78, y: 58 },
];

const LOADS = [
  { id: "life", name: "Life support", kw: 9, critical: true },
  { id: "heat", name: "Thermal / heating", kw: 6, critical: true },
  { id: "lab", name: "Science laboratory", kw: 5, critical: false },
  { id: "rover", name: "Rover charging", kw: 4, critical: false },
  { id: "comms", name: "Non-critical comms", kw: 3, critical: false },
  { id: "green", name: "Greenhouse lighting", kw: 3, critical: false },
];

interface GameEvent {
  id: string;
  title: string;
  text: string;
  options: { label: string; detail: string; apply: (d: MissionState) => string }[];
}

const EVENTS: GameEvent[] = [
  {
    id: "dust",
    title: "Solar array dust accumulation",
    text: "Regolith dust has coated Solar Array B. Generation has dropped 12%.",
    options: [
      {
        label: "Send an EVA crew to clean the array",
        detail: "Costs 4 hours and crew fatigue",
        apply: (d) => {
          d.res.solar = Math.min(100, d.res.solar + 10);
          d.crew.forEach((c) => (c.fatigue = Math.min(100, c.fatigue + 10)));
          d.clock += 4;
          return "Array cleaned — generation restored.";
        },
      },
      {
        label: "Accept the loss and conserve power",
        detail: "No time cost, reduced generation",
        apply: (d) => {
          d.res.solar = Math.max(30, d.res.solar - 8);
          return "Generation remains degraded; battery margin narrows.";
        },
      },
    ],
  },
  {
    id: "scrubber",
    title: "CO₂ scrubber efficiency falling",
    text: "Cabin CO₂ is trending upward. The scrubber bed may be saturated.",
    options: [
      {
        label: "Replace the scrubber filter from spares",
        detail: "Consumes one spare component",
        apply: (d) => {
          const spares = d.cargo["spares"] ?? 0;
          if (spares > 0) {
            d.cargo["spares"] = spares - 1;
            d.res.scrubber = 100;
            d.objectives["repair"] = true;
            return "Filter replaced. CO₂ returning to nominal.";
          }
          d.res.scrubber = Math.max(20, d.res.scrubber - 18);
          d.crew.forEach((c) => (c.health = Math.max(20, c.health - 6)));
          return "No spare components available — CO₂ continues rising and the crew reports headaches.";
        },
      },
      {
        label: "Bake out the existing bed overnight",
        detail: "Costs power, partial recovery",
        apply: (d) => {
          d.res.scrubber = Math.min(100, d.res.scrubber + 22);
          d.res.battery = Math.max(5, d.res.battery - 12);
          return "Partial regeneration at the cost of stored power.";
        },
      },
    ],
  },
  {
    id: "storm",
    title: "Solar particle event warning",
    text: "Space weather forecasts a solar particle event reaching the Moon within the hour.",
    options: [
      {
        label: "Recall all EVA crew to the shielded module",
        detail: "Lose a working day, protect the crew",
        apply: (d) => {
          d.clock += 8;
          d.res.radiation = Math.min(100, d.res.radiation + 3);
          d.objectives["storm"] = true;
          if (!d.achievements.includes("STORM SURVIVOR")) d.achievements.push("STORM SURVIVOR");
          return "Crew sheltered. Dose increase kept minimal.";
        },
      },
      {
        label: "Finish the current EVA task first",
        detail: "Keeps science on schedule, higher dose",
        apply: (d) => {
          d.res.radiation = Math.min(100, d.res.radiation + 14);
          d.crew.forEach((c) => {
            c.dose = Math.min(100, c.dose + 12);
            c.health = Math.max(15, c.health - 8);
          });
          d.science += 4;
          d.objectives["storm"] = true;
          return "Task completed, but the crew absorbed a significant radiation dose.";
        },
      },
    ],
  },
  {
    id: "recycler",
    title: "Water recycler malfunction",
    text: "Recycling efficiency has fallen to 60%. Reserves will drain faster than planned.",
    options: [
      {
        label: "Repair immediately using spares",
        detail: "3 hours, one spare component",
        apply: (d) => {
          const spares = d.cargo["spares"] ?? 0;
          if (spares > 0) {
            d.cargo["spares"] = spares - 1;
            d.res.recycler = 100;
            d.clock += 3;
            d.objectives["repair"] = true;
            return "Recycler restored to full efficiency.";
          }
          d.res.recycler = Math.max(40, d.res.recycler - 10);
          return "No spares. The loop keeps losing water.";
        },
      },
      {
        label: "Ration water consumption instead",
        detail: "Crew morale drops, reserves last longer",
        apply: (d) => {
          d.crew.forEach((c) => (c.morale = Math.max(20, c.morale - 12)));
          d.res.water = Math.min(100, d.res.water + 4);
          return "Rationing in effect. The crew is not happy about it.";
        },
      },
    ],
  },
  {
    id: "micro",
    title: "Micrometeoroid impact",
    text: "A small impact has punctured a radiator line on the power module.",
    options: [
      {
        label: "Patch the line during an EVA",
        detail: "5 hours, restores thermal control",
        apply: (d) => {
          d.clock += 5;
          d.res.hab = Math.min(100, d.res.hab + 6);
          d.crew.forEach((c) => (c.fatigue = Math.min(100, c.fatigue + 12)));
          d.objectives["repair"] = true;
          return "Line patched. Thermal control is stable again.";
        },
      },
      {
        label: "Isolate the loop and run degraded",
        detail: "Faster, but equipment wears out",
        apply: (d) => {
          d.res.hab = Math.max(30, d.res.hab - 12);
          d.res.solar = Math.max(30, d.res.solar - 6);
          return "Loop isolated. Systems run hot and degrade faster.";
        },
      },
    ],
  },
  {
    id: "medical",
    title: "Medical event",
    text: "A crew member reports dizziness and an elevated heart rate after a long EVA.",
    options: [
      {
        label: "Stand them down for a full rest cycle",
        detail: "Lose crew work time",
        apply: (d) => {
          const c = d.crew[0];
          if (c) {
            c.health = Math.min(100, c.health + 14);
            c.fatigue = Math.max(0, c.fatigue - 30);
          }
          d.clock += 6;
          return "Crew member recovered after rest and fluids.";
        },
      },
      {
        label: "Treat with medical supplies and continue",
        detail: "Uses medical stock",
        apply: (d) => {
          const med = d.cargo["medical"] ?? 0;
          if (med > 0) {
            d.cargo["medical"] = med - 1;
            const c = d.crew[0];
            if (c) c.health = Math.min(100, c.health + 8);
            return "Treated on station; crew member is back on duty.";
          }
          const c = d.crew[0];
          if (c) c.health = Math.max(15, c.health - 12);
          return "No medical supplies remaining — condition worsens.";
        },
      },
    ],
  },
];

const EXPERIMENTS = [
  { id: "regolith", name: "Regolith composition analysis", steps: ["Load sample", "Evacuate chamber", "Run spectrometer", "Log results"], value: 8 },
  { id: "seismic", name: "Seismic network reading", steps: ["Arm geophone", "Set threshold", "Record 2 hours", "Transmit data"], value: 7 },
  { id: "plants", name: "Plant growth experiment", steps: ["Hydrate substrate", "Set light cycle", "Record growth", "Sample tissue"], value: 6 },
  { id: "dose", name: "Radiation dosimetry survey", steps: ["Calibrate dosimeter", "Survey modules", "Compare shielding", "Report to Houston"], value: 7 },
];

function Outpost() {
  const { state, update, award, unlockCodex } = useMission();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ModuleId>("command");
  const [shed, setShed] = useState<string[]>([]);
  const [event, setEvent] = useState<GameEvent | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [expStep, setExpStep] = useState<{ id: string; step: number } | null>(null);

  const generation = Math.round((state.res.solar / 100) * 26 * (state.clock > 5 && state.clock < 19 ? 1 : 0.25));
  const demand = LOADS.filter((l) => !shed.includes(l.id)).reduce((a, l) => a + l.kw, 0);
  const deficit = demand - generation;

  const advanceTime = useCallback(
    (hours: number) => {
      update((d) => {
        d.clock += hours;
        while (d.clock >= 24) {
          d.clock -= 24;
          d.day += 1;
          // --- daily resource tick: interconnected systems ---
          const gen = (d.res.solar / 100) * 26;
          const dmd = LOADS.filter((l) => !shed.includes(l.id)).reduce((a, l) => a + l.kw, 0);
          const net = gen * 0.55 - dmd * 0.5;
          d.res.battery = Math.max(0, Math.min(100, d.res.battery + net));
          const lowPower = d.res.battery < 25;
          d.res.o2 = Math.max(
            0,
            d.res.o2 - 2.6 + (d.res.scrubber / 100) * (lowPower ? 0.8 : 2.4),
          );
          d.res.water = Math.max(0, d.res.water - 3 + (d.res.recycler / 100) * 2.3);
          d.res.food = Math.max(0, d.res.food - 2.2);
          d.res.radiation = Math.min(100, d.res.radiation + 0.6);
          d.res.scrubber = Math.max(0, d.res.scrubber - 1.2);
          d.res.recycler = Math.max(0, d.res.recycler - 1);
          d.res.solar = Math.max(0, d.res.solar - 0.8);
          d.crew.forEach((c) => {
            c.fatigue = Math.max(0, Math.min(100, c.fatigue + 4));
            if (d.res.food < 15 || d.res.water < 15 || d.res.o2 < 25) c.health = Math.max(0, c.health - 7);
            else if (c.fatigue > 70) c.health = Math.max(0, c.health - 2);
            else c.health = Math.min(100, c.health + 1);
            c.morale = Math.max(0, Math.min(100, c.morale + (lowPower ? -3 : 1)));
            c.dose = Math.min(100, c.dose + 0.5);
          });
          if (d.day > 30) d.objectives["day30"] = true;
        }
        if (d.samples.length >= 5) d.objectives["samples5"] = true;
        if (d.rover.distance >= 10) d.objectives["traverse"] = true;
      });
    },
    [update, shed],
  );

  const endDay = () => {
    advanceTime(24 - state.clock);
    // random event fires on most days
    if (Math.random() < 0.72) {
      const pool = EVENTS;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (pick) setEvent(pick);
    }
  };

  const critical = useMemo(() => {
    const r = state.res;
    if (r.o2 <= 12) return "OXYGEN RESERVE CRITICAL";
    if (r.battery <= 8) return "BATTERY CHARGE CRITICAL";
    if (r.water <= 10) return "WATER RESERVE CRITICAL";
    if (r.food <= 8) return "FOOD SUPPLY CRITICAL";
    if (state.crew.some((c) => c.health <= 20)) return "CREW HEALTH CRITICAL";
    return null;
  }, [state.res, state.crew]);

  useEffect(() => {
    if (state.day > 30) {
      update((d) => {
        d.phase = "return";
      });
    }
  }, [state.day, update]);

  const runExperiment = (id: string) => {
    const exp = EXPERIMENTS.find((e) => e.id === id);
    if (!exp) return;
    if (!expStep || expStep.id !== id) {
      setExpStep({ id, step: 0 });
      return;
    }
    const nextStep = expStep.step + 1;
    if (nextStep >= exp.steps.length) {
      update((d) => {
        d.science += exp.value;
        d.res.battery = Math.max(0, d.res.battery - 4);
        d.clock += 3;
        d.objectives["deploy"] = true;
        d.log.unshift({ day: d.day, text: `${exp.name} completed (+${exp.value} science).`, kind: "good" });
      });
      unlockCodex("regolith");
      setExpStep(null);
    } else {
      setExpStep({ id, step: nextStep });
    }
  };

  return (
    <main className="relative min-h-screen bg-[#050a16] pb-16">
      <Starfield className="pointer-events-none absolute inset-0 size-full" density={70} />
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6">
        {/* HUD */}
        <div className="panel flex flex-wrap items-center justify-between gap-3 p-3">
          <div>
            <p className="hud-label text-primary">Lunar outpost · Shackleton region</p>
            <p className="readout text-lg">
              MISSION DAY {String(state.day).padStart(2, "0")} / 30 —{" "}
              {String(Math.floor(state.clock)).padStart(2, "0")}:
              {String(Math.floor((state.clock % 1) * 60)).padStart(2, "0")} LST
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <NavButton to="/rover">Rover ops</NavButton>
            <NavButton to="/database">Database</NavButton>
            <NavButton to="/">Home</NavButton>
          </div>
        </div>

        {critical && (
          <div className="alarm-pulse mt-3 rounded-md border border-destructive bg-destructive/15 p-3">
            <p className="readout text-sm uppercase tracking-widest text-destructive">⚠ {critical}</p>
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          <Meter label="Oxygen" value={state.res.o2} icon={<Wind className="size-3" />} />
          <Meter label="Water" value={state.res.water} icon={<Droplets className="size-3" />} />
          <Meter label="Food" value={state.res.food} icon={<Wheat className="size-3" />} />
          <Meter label="Battery" value={state.res.battery} icon={<Battery className="size-3" />} />
          <Meter label="Solar cond." value={state.res.solar} />
          <Meter
            label="Radiation"
            value={state.res.radiation}
            invert
            danger={70}
            warn={45}
            icon={<Radiation className="size-3" />}
          />
          <Meter
            label="Science"
            value={Math.min(100, state.science)}
            unit=""
            icon={<FlaskConical className="size-3" />}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            {/* Animated cutaway base */}
            <Panel title="Outpost cutaway">
              <div className="relative h-64 overflow-hidden rounded-md border border-border bg-[#0a1020] grid-floor">
                {MODULES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m.id)}
                    className={`absolute w-[18%] rounded-md border p-2 text-left transition-all ${
                      selected === m.id
                        ? "border-primary bg-primary/20"
                        : "border-border bg-secondary/40 hover:border-primary/60"
                    }`}
                    style={{ left: `${m.x}%`, top: `${m.y}%`, height: "34%" }}
                  >
                    <span className="hud-label">{m.name}</span>
                  </button>
                ))}
                {/* crew moving inside */}
                <div className="absolute bottom-2 left-[12%] animate-floaty">
                  <Astronaut size={40} mood="focused" suit={0} />
                </div>
                <div className="absolute bottom-2 left-[46%] animate-floaty" style={{ animationDelay: "-1.8s" }}>
                  <Astronaut size={40} mood="happy" suit={2} hair={2} skin={4} />
                </div>
                <div className="absolute bottom-2 right-[8%] animate-floaty" style={{ animationDelay: "-3s" }}>
                  <Astronaut size={40} mood="neutral" suit={1} hair={1} skin={1} />
                </div>
              </div>
            </Panel>

            {/* Module actions */}
            <Panel title={MODULES.find((m) => m.id === selected)?.name ?? "Module"}>
              {selected === "power" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="Generation" value={`${generation} kW`} accent />
                    <Stat label="Demand" value={`${demand} kW`} />
                    <Stat
                      label="Balance"
                      value={`${deficit > 0 ? "−" : "+"}${Math.abs(deficit)} kW`}
                    />
                  </div>
                  {deficit > 0 && (
                    <Caution>
                      Demand exceeds generation by {deficit} kW. The battery is covering the deficit
                      and will drain. Shed load to protect your reserve.
                    </Caution>
                  )}
                  {/* animated electrical flow */}
                  <svg viewBox="0 0 320 60" className="w-full">
                    {["SUN", "ARRAY", "BATTERY", "HABITAT"].map((l, i) => (
                      <g key={l}>
                        <rect x={i * 80 + 6} y={16} width={62} height={28} rx={6} fill="var(--secondary)" stroke="var(--border)" />
                        <text x={i * 80 + 37} y={34} fontSize="9" textAnchor="middle" fill="var(--foreground)">
                          {l}
                        </text>
                        {i < 3 && (
                          <line
                            x1={i * 80 + 68}
                            y1={30}
                            x2={i * 80 + 86}
                            y2={30}
                            stroke={deficit > 0 ? "var(--destructive)" : "var(--go)"}
                            strokeWidth="2"
                            strokeDasharray="4 3"
                          >
                            <animate attributeName="stroke-dashoffset" from="14" to="0" dur="0.8s" repeatCount="indefinite" />
                          </line>
                        )}
                      </g>
                    ))}
                  </svg>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {LOADS.map((l) => {
                      const off = shed.includes(l.id);
                      return (
                        <button
                          key={l.id}
                          onClick={() =>
                            setShed((s) => (off ? s.filter((x) => x !== l.id) : [...s, l.id]))
                          }
                          className={`readout flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-all ${
                            off ? "border-destructive/60 bg-destructive/10 text-destructive" : "border-go/40 bg-go/10 text-go"
                          }`}
                        >
                          <span>
                            {l.name} · {l.kw} kW {l.critical && "(critical)"}
                          </span>
                          <span>{off ? "OFF" : "ON"}</span>
                        </button>
                      );
                    })}
                  </div>
                  <WhyBox title="Why does shedding load help?">
                    Solar arrays produce electrical power only while illuminated and undamaged.
                    Batteries cover the gap, but a battery is a reservoir, not a source — if demand
                    stays above generation it empties. Turning off non-critical loads buys time.
                  </WhyBox>
                </div>
              )}

              {selected === "life" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat label="O₂" value={`${state.res.o2.toFixed(0)}%`} accent />
                    <Stat label="CO₂ scrubber" value={`${state.res.scrubber.toFixed(0)}%`} />
                    <Stat label="Water recycler" value={`${state.res.recycler.toFixed(0)}%`} />
                    <Stat label="Cabin pressure" value="101 kPa" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <GameButton
                      onClick={() => {
                        update((d) => {
                          const spares = d.cargo["spares"] ?? 0;
                          if (spares > 0) {
                            d.cargo["spares"] = spares - 1;
                            d.res.scrubber = 100;
                            d.objectives["repair"] = true;
                            d.log.unshift({ day: d.day, text: "Scrubber bed replaced.", kind: "good" });
                          } else {
                            d.log.unshift({ day: d.day, text: "No spare components for the scrubber.", kind: "warn" });
                          }
                          d.clock += 2;
                        });
                      }}
                    >
                      Service CO₂ scrubber (2 h, 1 spare)
                    </GameButton>
                    <GameButton
                      variant="ghost"
                      onClick={() => {
                        update((d) => {
                          d.res.o2 = Math.min(100, d.res.o2 + 6);
                          d.res.water = Math.max(0, d.res.water - 5);
                          d.res.battery = Math.max(0, d.res.battery - 7);
                          d.clock += 3;
                          d.log.unshift({ day: d.day, text: "Electrolysis run: water → oxygen.", kind: "info" });
                        });
                        unlockCodex("lifesupport");
                      }}
                    >
                      Run electrolysis (water → O₂)
                    </GameButton>
                  </div>
                  <WhyBox title="Where does outpost oxygen come from?">
                    Splitting water with electricity (electrolysis) produces breathable oxygen and
                    hydrogen. It costs both water and power — which is exactly why finding lunar water
                    ice would change what an outpost can sustain.
                  </WhyBox>
                </div>
              )}

              {selected === "lab" && (
                <div className="space-y-3">
                  <p className="text-sm text-foreground/85">
                    Each experiment is a procedure — step through it to produce valid data.
                  </p>
                  <div className="grid gap-2">
                    {EXPERIMENTS.map((e) => {
                      const active = expStep?.id === e.id;
                      return (
                        <div key={e.id} className="rounded-md border border-border bg-secondary/25 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="readout text-sm">{e.name}</span>
                            <GameButton onClick={() => runExperiment(e.id)}>
                              {active ? `Step ${(expStep?.step ?? 0) + 1}` : "Begin"}
                            </GameButton>
                          </div>
                          {active && (
                            <ol className="mt-2 space-y-1">
                              {e.steps.map((s, i) => (
                                <li
                                  key={s}
                                  className={`readout text-xs ${
                                    i < (expStep?.step ?? 0)
                                      ? "text-go"
                                      : i === expStep?.step
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  {i + 1}. {s}
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selected === "med" && (
                <div className="space-y-3">
                  {state.crew.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3 rounded-md border border-border bg-secondary/25 p-2">
                      <Astronaut size={40} suit={i} hair={i} skin={i * 2} mood={c.health < 60 ? "tired" : "happy"} />
                      <div className="flex-1">
                        <div className="readout text-sm">
                          {c.name} · {c.role}
                        </div>
                        <div className="hud-label">
                          health {Math.round(c.health)} · fatigue {Math.round(c.fatigue)} · morale{" "}
                          {Math.round(c.morale)} · dose {c.dose.toFixed(1)}
                        </div>
                      </div>
                      <GameButton
                        variant="ghost"
                        onClick={() =>
                          update((d) => {
                            const target = d.crew.find((x) => x.id === c.id);
                            if (target) {
                              target.fatigue = Math.max(0, target.fatigue - 35);
                              target.health = Math.min(100, target.health + 6);
                            }
                            d.clock += 6;
                            d.log.unshift({ day: d.day, text: `${c.name} took a rest cycle.`, kind: "info" });
                          })
                        }
                      >
                        Rest cycle (6 h)
                      </GameButton>
                    </div>
                  ))}
                </div>
              )}

              {selected === "garage" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="Rover battery" value={`${Math.round(state.rover.battery)}%`} accent />
                    <Stat label="Condition" value={`${Math.round(state.rover.condition)}%`} />
                    <Stat label="Traversed" value={`${state.rover.distance.toFixed(1)} km`} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <GameButton onClick={() => navigate({ to: "/rover" })}>Launch rover expedition</GameButton>
                    <GameButton
                      variant="ghost"
                      onClick={() =>
                        update((d) => {
                          const charge = Math.min(100 - d.rover.battery, 40);
                          d.rover.battery += charge;
                          d.res.battery = Math.max(0, d.res.battery - charge * 0.25);
                          d.clock += 4;
                        })
                      }
                    >
                      Charge rover (4 h, draws base power)
                    </GameButton>
                  </div>
                </div>
              )}

              {(selected === "command" || selected === "habitat" || selected === "airlock") && (
                <div className="space-y-3">
                  <Transmission
                    from="ASTRA"
                    text="I can explain any system, summarise damage and highlight telemetry — but the decisions are yours. Current priority: keep generation above demand and CO₂ scrubbing above 60%."
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {OBJECTIVES.map((o) => (
                      <div
                        key={o.id}
                        className={`readout rounded-md border px-3 py-2 text-xs ${
                          state.objectives[o.id]
                            ? "border-go/50 bg-go/10 text-go"
                            : "border-border bg-secondary/25 text-muted-foreground"
                        }`}
                      >
                        {state.objectives[o.id] ? "✔" : "☐"} {o.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <Panel title="Mission actions">
              <div className="grid gap-2">
                <GameButton onClick={endDay}>End mission day →</GameButton>
                <GameButton variant="ghost" onClick={() => advanceTime(4)}>
                  Advance 4 hours
                </GameButton>
                {state.day > 30 && (
                  <GameButton variant="accent" onClick={() => navigate({ to: "/return" })}>
                    Begin lunar departure
                  </GameButton>
                )}
              </div>
            </Panel>

            {event && (
              <Panel title="⚠ Event" className="animate-rise border-caution/60">
                <p className="readout text-sm text-caution">{event.title}</p>
                <p className="mt-1 text-sm text-foreground/85">{event.text}</p>
                <div className="mt-3 grid gap-2">
                  {event.options.map((o) => (
                    <button
                      key={o.label}
                      onClick={() => {
                        let result = "";
                        update((d) => {
                          result = o.apply(d);
                          d.log.unshift({ day: d.day, text: `${event.title}: ${result}`, kind: "warn" });
                        });
                        setOutcome(result);
                        setEvent(null);
                      }}
                      className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-left text-sm transition-colors hover:border-primary"
                    >
                      <span className="block">{o.label}</span>
                      <span className="hud-label">{o.detail}</span>
                    </button>
                  ))}
                </div>
              </Panel>
            )}

            {outcome && !event && (
              <Panel title="Consequence">
                <p className="text-sm text-foreground/85">{outcome}</p>
                <div className="mt-2">
                  <GameButton variant="ghost" onClick={() => setOutcome(null)}>
                    Acknowledge
                  </GameButton>
                </div>
              </Panel>
            )}

            <Panel title="Mission log">
              <ul className="max-h-60 space-y-1 overflow-y-auto pr-1 text-xs">
                {state.log.slice(0, 20).map((l, i) => (
                  <li key={i} className="readout flex gap-2">
                    <span className="text-muted-foreground">D{String(l.day).padStart(2, "0")}</span>
                    <span className={l.kind === "warn" ? "text-caution" : l.kind === "good" ? "text-go" : ""}>
                      {l.text}
                    </span>
                  </li>
                ))}
                {state.log.length === 0 && <li className="text-muted-foreground">No entries yet.</li>}
              </ul>
            </Panel>

            <Panel title="Samples">
              {state.samples.length === 0 ? (
                <p className="text-xs text-muted-foreground">No samples catalogued yet — drive out with the rover.</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {state.samples.map((s) => (
                    <li key={s.id} className="readout flex justify-between">
                      <span>
                        {s.id} · {s.type}
                      </span>
                      <span className={s.ice ? "text-primary" : "text-muted-foreground"}>
                        {s.massKg.toFixed(1)} kg {s.ice && "· ICE"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}
