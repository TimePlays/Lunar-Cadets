import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Starfield } from "@/components/game/Starfield";
import { Astronaut } from "@/components/game/Astronaut";
import { GameButton, Panel, Transmission } from "@/components/game/ui";
import { useMission, type Specialty } from "@/game/state";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Astronaut Application — J&R ASTROLABS" },
      {
        name: "description",
        content:
          "Complete your junior astronaut application, design your 2D astronaut avatar and receive your animated candidate ID card.",
      },
      { property: "og:title", content: "Astronaut Application — J&R ASTROLABS" },
      {
        property: "og:description",
        content: "Apply to the Junior Astronaut Program and build your astronaut identity.",
      },
    ],
  }),
  component: Apply,
});

const SPECIALTIES: Specialty[] = [
  "Commander",
  "Pilot",
  "Flight Engineer",
  "Lunar Geologist",
  "Medical Officer",
  "Robotics Specialist",
  "Life Support Specialist",
  "Science Officer",
];

const INTERESTS = ["Space", "Science", "Engineering", "Computers", "Biology", "Mathematics"];
const SKILLS = [
  "Problem solving",
  "Critical thinking",
  "Teamwork",
  "Programming",
  "Science",
  "Creativity",
  "Leadership",
];
const PATCHES = ["ARTEMIS-STYLE CHEVRON", "LUNAR CRESCENT", "ORBIT RING", "POLAR ICE"];

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`readout rounded-full border px-3 py-1.5 text-xs uppercase tracking-wider transition-all ${
        active
          ? "border-primary bg-primary/20 text-primary"
          : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Apply() {
  const { state, update } = useMission();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const p = state.profile;

  const set = (patch: Partial<typeof p>) =>
    update((d) => {
      Object.assign(d.profile, patch);
    });

  const toggle = (key: "interests" | "skills", value: string, max: number) =>
    update((d) => {
      const arr = d.profile[key];
      const i = arr.indexOf(value);
      if (i >= 0) arr.splice(i, 1);
      else if (arr.length < max) arr.push(value);
    });

  const steps = ["About you", "Identity", "Avatar", "Review"];
  const canNext =
    step === 0 ? p.name.trim().length > 1 && p.interests.length > 0 : step === 1 ? !!p.callSign : true;

  return (
    <main className="relative min-h-screen bg-[#050a16] pb-16">
      <Starfield className="pointer-events-none absolute inset-0 size-full" density={120} />
      <div className="relative z-10 mx-auto max-w-5xl px-5 pt-8">
        <p className="hud-label text-primary">J&amp;R ASTROLABS · Candidate intake terminal</p>
        <h1 className="font-display text-2xl tracking-[0.2em] sm:text-3xl">
          JUNIOR ASTRONAUT APPLICATION
        </h1>

        <div className="mt-4">
          <Transmission
            from="ASTRA"
            text="Welcome, candidate. I'm ASTRA, your mission assistant. Fill in your file and I'll forward it to the selection board."
          />
        </div>

        <ol className="mt-5 flex flex-wrap gap-2">
          {steps.map((s, i) => (
            <li
              key={s}
              className={`readout rounded border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                i === step
                  ? "border-primary bg-primary/15 text-primary"
                  : i < step
                    ? "border-go/50 text-go"
                    : "border-border text-muted-foreground"
              }`}
            >
              {i + 1}. {s}
            </li>
          ))}
        </ol>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <Panel title={`Step ${step + 1} — ${steps[step]}`} className="animate-rise">
            {step === 0 && (
              <div className="space-y-4">
                <label className="block">
                  <span className="hud-label">Astronaut name</span>
                  <input
                    value={p.name}
                    onChange={(e) => set({ name: e.target.value })}
                    placeholder="Enter your name"
                    className="readout mt-1 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="hud-label">Age</span>
                    <input
                      value={p.age}
                      onChange={(e) => set({ age: e.target.value })}
                      placeholder="e.g. 14"
                      className="readout mt-1 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="hud-label">Country</span>
                    <input
                      value={p.country}
                      onChange={(e) => set({ country: e.target.value })}
                      placeholder="e.g. India"
                      className="readout mt-1 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </label>
                </div>
                <div>
                  <span className="hud-label">Interests</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {INTERESTS.map((i) => (
                      <Chip
                        key={i}
                        active={p.interests.includes(i)}
                        onClick={() => toggle("interests", i, 6)}
                      >
                        {i}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="hud-label">Strongest skills (pick up to 3)</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SKILLS.map((s) => (
                      <Chip key={s} active={p.skills.includes(s)} onClick={() => toggle("skills", s, 3)}>
                        {s}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <label className="block">
                  <span className="hud-label">Call sign</span>
                  <input
                    value={p.callSign}
                    onChange={(e) => set({ callSign: e.target.value.toUpperCase().slice(0, 12) })}
                    placeholder="e.g. NOVA"
                    className="readout mt-1 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm uppercase tracking-[0.2em] outline-none focus:border-primary"
                  />
                </label>
                <div>
                  <span className="hud-label">Preferred mission specialty</span>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {SPECIALTIES.map((s) => (
                      <button
                        key={s}
                        onClick={() => set({ specialty: s })}
                        className={`readout rounded-md border px-3 py-2 text-left text-xs uppercase tracking-wider transition-all ${
                          p.specialty === s
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-secondary/30 hover:bg-secondary/60"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="hud-label">Why do you want to explore space?</span>
                  <textarea
                    value={p.why}
                    onChange={(e) => set({ why: e.target.value })}
                    rows={3}
                    placeholder="Type your answer…"
                    className="mt-1 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {(
                  [
                    ["Skin tone", "skin", 6],
                    ["Hairstyle", "hair", 4],
                    ["Hair colour", "hairColor", 6],
                    ["Flight suit", "suit", 4],
                    ["Mission patch", "patch", 4],
                  ] as const
                ).map(([label, key, count]) => (
                  <div key={key}>
                    <span className="hud-label">{label}</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Array.from({ length: count }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => set({ [key]: i } as Partial<typeof p>)}
                          className={`readout size-9 rounded-md border text-xs transition-all ${
                            p[key] === i
                              ? "border-primary bg-primary/20 text-primary"
                              : "border-border bg-secondary/40 hover:bg-secondary"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="hud-label">Patch design · {PATCHES[p.patch % PATCHES.length]}</p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3 text-sm">
                <p className="hud-label">Application summary</p>
                <ul className="readout space-y-1 text-xs">
                  <li>NAME · {p.name || "—"}</li>
                  <li>AGE · {p.age || "—"}</li>
                  <li>COUNTRY · {p.country || "—"}</li>
                  <li>CALL SIGN · {p.callSign || "—"}</li>
                  <li>SPECIALTY · {p.specialty}</li>
                  <li>INTERESTS · {p.interests.join(", ") || "—"}</li>
                  <li>SKILLS · {p.skills.join(", ") || "—"}</li>
                </ul>
                <p className="text-xs text-muted-foreground">
                  Submitting forwards your file to the candidate evaluation terminal, where aptitude
                  testing and the selection board interview take place.
                </p>
              </div>
            )}

            <div className="mt-5 flex justify-between gap-2">
              <GameButton variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                ← Back
              </GameButton>
              {step < 3 ? (
                <GameButton onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                  Next →
                </GameButton>
              ) : (
                <GameButton
                  onClick={() => {
                    update((d) => {
                      d.phase = "selection";
                      d.log.unshift({
                        day: 0,
                        text: `Application JRA-2047 submitted by ${d.profile.name}.`,
                        kind: "info",
                      });
                    });
                    navigate({ to: "/selection" });
                  }}
                >
                  Submit application
                </GameButton>
              )}
            </div>
          </Panel>

          {/* Animated candidate ID card */}
          <Panel title="Candidate ID" className="animate-rise self-start">
            <div className="scan-sweep relative overflow-hidden rounded-lg border border-primary/40 bg-gradient-to-br from-primary/10 to-background p-4">
              <div className="flex items-start gap-3">
                <Astronaut
                  skin={p.skin}
                  hair={p.hair}
                  hairColor={p.hairColor}
                  suit={p.suit}
                  mood="happy"
                  size={74}
                  floating
                />
                <div className="min-w-0 flex-1">
                  <p className="hud-label text-primary">J&amp;R ASTROLABS</p>
                  <p className="readout truncate text-base font-semibold">
                    {p.name || "CANDIDATE"}
                  </p>
                  <p className="hud-label">Call sign · {p.callSign || "—"}</p>
                  <p className="hud-label">{p.specialty}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2">
                <span className="hud-label">Training status</span>
                <span className="readout rounded bg-caution/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-caution">
                  Candidate
                </span>
              </div>
              <div className="readout mt-2 text-[10px] text-muted-foreground">
                ID JRA-2047 · {p.country || "EARTH"}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
