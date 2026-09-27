import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Starfield } from "@/components/game/Starfield";
import { Astronaut } from "@/components/game/Astronaut";
import { Caution, GameButton, Panel, Stat, Transmission, WhyBox } from "@/components/game/ui";
import { useMission } from "@/game/state";

export const Route = createFileRoute("/planning")({
  head: () => ({
    meta: [
      { title: "Mission Planning — J&R ASTROLABS" },
      {
        name: "description",
        content:
          "Allocate limited mass, power and cargo capacity across life support, science, spares and shielding before lunar launch.",
      },
      { property: "og:title", content: "Mission Planning — J&R ASTROLABS" },
      {
        property: "og:description",
        content: "Trade mass, power and cargo — there is no perfect loadout.",
      },
    ],
  }),
  component: Planning,
});

interface Item {
  id: string;
  name: string;
  mass: number;
  power: number;
  cargo: number;
  effect: string;
  max: number;
}

const ITEMS: Item[] = [
  { id: "o2", name: "Oxygen reserves", mass: 8, power: 1, cargo: 10, effect: "+O₂ buffer", max: 4 },
  { id: "water", name: "Water tanks", mass: 9, power: 0, cargo: 12, effect: "+Water reserve", max: 4 },
  { id: "food", name: "Food supply", mass: 5, power: 0, cargo: 9, effect: "+Food days", max: 4 },
  { id: "battery", name: "Battery packs", mass: 7, power: -4, cargo: 6, effect: "+Stored power", max: 4 },
  { id: "solar", name: "Extra solar array", mass: 6, power: -9, cargo: 8, effect: "+Generation", max: 3 },
  { id: "spares", name: "Spare components", mass: 4, power: 0, cargo: 7, effect: "Enables repairs", max: 4 },
  { id: "medical", name: "Medical supplies", mass: 3, power: 1, cargo: 4, effect: "+Crew health recovery", max: 3 },
  { id: "shield", name: "Radiation shielding", mass: 12, power: 0, cargo: 10, effect: "−Radiation dose", max: 3 },
  { id: "science", name: "Science instruments", mass: 6, power: 6, cargo: 9, effect: "+Science rate", max: 4 },
  { id: "drill", name: "Drilling equipment", mass: 8, power: 5, cargo: 8, effect: "Enables ice drilling", max: 2 },
  { id: "rover", name: "Rover spares & charger", mass: 7, power: 3, cargo: 7, effect: "+Rover range", max: 2 },
];

const LIMITS = { mass: 60, power: 22, cargo: 70 };

function Planning() {
  const { state, update } = useMission();
  const navigate = useNavigate();
  const [cargo, setCargo] = useState<Record<string, number>>(() => ({ ...state.cargo }));

  const used = useMemo(() => {
    return ITEMS.reduce(
      (acc, it) => {
        const n = cargo[it.id] ?? 0;
        acc.mass += it.mass * n;
        acc.power += it.power * n;
        acc.cargo += it.cargo * n;
        return acc;
      },
      { mass: 0, power: 0, cargo: 0 },
    );
  }, [cargo]);

  const over = used.mass > LIMITS.mass || used.cargo > LIMITS.cargo || used.power > LIMITS.power;
  const nothing = Object.values(cargo).every((v) => !v);

  const change = (id: string, delta: number) =>
    setCargo((c) => {
      const item = ITEMS.find((i) => i.id === id);
      if (!item) return c;
      const next = Math.max(0, Math.min(item.max, (c[id] ?? 0) + delta));
      return { ...c, [id]: next };
    });

  return (
    <main className="relative min-h-screen bg-[#050a16] pb-16">
      <Starfield className="pointer-events-none absolute inset-0 size-full" density={90} />
      <div className="relative z-10 mx-auto max-w-6xl px-5 pt-8">
        <p className="hud-label text-primary">Mission assignment · Lunar outpost</p>
        <h1 className="font-display text-2xl tracking-[0.2em]">MISSION PLANNING — CARGO ALLOCATION</h1>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-4">
            <Transmission
              from="MISSION CONTROL"
              text="Your task: establish and operate a sustainable lunar research outpost for 30 mission days. Lift capacity is fixed — every kilogram of science is a kilogram of spares you leave behind."
            />

            <div className="grid grid-cols-3 gap-2">
              <Stat label={`Mass ${used.mass}/${LIMITS.mass}`} value={`${Math.round((used.mass / LIMITS.mass) * 100)}%`} accent={used.mass <= LIMITS.mass} />
              <Stat label={`Power ${used.power}/${LIMITS.power}`} value={`${used.power} kW`} />
              <Stat label={`Cargo ${used.cargo}/${LIMITS.cargo}`} value={`${Math.round((used.cargo / LIMITS.cargo) * 100)}%`} />
            </div>

            {over && <Caution>Over capacity. Remove items before the flight readiness review.</Caution>}

            <Panel title="Manifest">
              <div className="grid gap-2 sm:grid-cols-2">
                {ITEMS.map((it) => {
                  const n = cargo[it.id] ?? 0;
                  return (
                    <div
                      key={it.id}
                      className={`rounded-md border p-3 ${n > 0 ? "border-primary/60 bg-primary/10" : "border-border bg-secondary/25"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="readout text-sm">{it.name}</div>
                          <div className="hud-label mt-0.5">{it.effect}</div>
                          <div className="hud-label mt-1">
                            {it.mass} t · {it.cargo} vol · {it.power > 0 ? `+${it.power}` : it.power} kW
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => change(it.id, -1)}
                            className="readout size-7 rounded border border-border bg-background/60 hover:border-primary"
                            aria-label={`Remove ${it.name}`}
                          >
                            −
                          </button>
                          <span className="readout w-6 text-center text-sm">{n}</span>
                          <button
                            onClick={() => change(it.id, 1)}
                            className="readout size-7 rounded border border-border bg-background/60 hover:border-primary"
                            aria-label={`Add ${it.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel title="Crew manifest">
              <div className="space-y-3">
                {state.crew.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <Astronaut size={46} suit={i} hair={i + 1} skin={(i + 1) * 2} mood="happy" />
                    <div>
                      <div className="readout text-sm">{c.name}</div>
                      <div className="hud-label">{c.role} · skill {c.skill}</div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 border-t border-border/70 pt-3">
                  <Astronaut
                    size={46}
                    suit={state.profile.suit}
                    hair={state.profile.hair}
                    hairColor={state.profile.hairColor}
                    skin={state.profile.skin}
                    mood="focused"
                  />
                  <div>
                    <div className="readout text-sm text-primary">
                      YOU — {state.profile.name || "Astronaut"}
                    </div>
                    <div className="hud-label">{state.profile.specialty}</div>
                  </div>
                </div>
              </div>
            </Panel>

            <WhyBox title="Why is there no perfect loadout?">
              Every mission is a mass budget. Shielding protects the crew but crowds out science.
              Spares enable repairs but cost volume you could have spent on consumables. Real mission
              planners balance risk against return — and so do you.
            </WhyBox>

            <GameButton
              className="w-full"
              disabled={over || nothing}
              onClick={() => {
                update((d) => {
                  d.cargo = cargo;
                  d.phase = "launch";
                  // Loadout shapes the starting outpost state.
                  d.res.o2 = Math.min(100, 80 + (cargo["o2"] ?? 0) * 5);
                  d.res.water = Math.min(100, 72 + (cargo["water"] ?? 0) * 6);
                  d.res.food = Math.min(100, 76 + (cargo["food"] ?? 0) * 6);
                  d.res.battery = Math.min(100, 70 + (cargo["battery"] ?? 0) * 6);
                  d.res.solar = Math.min(100, 88 + (cargo["solar"] ?? 0) * 4);
                  d.res.radiation = Math.max(0, 8 - (cargo["shield"] ?? 0) * 2);
                  d.log.unshift({ day: 0, text: "Cargo manifest locked for launch.", kind: "info" });
                });
                navigate({ to: "/launch" });
              }}
            >
              Lock manifest → launch day
            </GameButton>
          </div>
        </div>
      </div>
    </main>
  );
}
