import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Phase =
  | "intro"
  | "application"
  | "selection"
  | "training"
  | "planning"
  | "launch"
  | "landing"
  | "outpost"
  | "return"
  | "complete";

export type Specialty =
  | "Commander"
  | "Pilot"
  | "Flight Engineer"
  | "Lunar Geologist"
  | "Medical Officer"
  | "Robotics Specialist"
  | "Life Support Specialist"
  | "Science Officer";

export interface Crew {
  id: string;
  name: string;
  role: string;
  hue: number;
  health: number;
  fatigue: number;
  morale: number;
  dose: number;
  skill: number;
}

export interface Sample {
  id: string;
  site: string;
  type: string;
  massKg: number;
  value: number;
  ice: boolean;
}

export interface LogEntry {
  day: number;
  text: string;
  kind: "info" | "warn" | "good";
}

export interface MissionState {
  version: number;
  started: boolean;
  demoMode: boolean;
  phase: Phase;
  profile: {
    name: string;
    callSign: string;
    age: string;
    country: string;
    specialty: Specialty;
    interests: string[];
    skills: string[];
    skin: number;
    hair: number;
    hairColor: number;
    suit: number;
    patch: number;
    why: string;
  };
  scores: {
    reaction: number;
    memory: number;
    spatial: number;
    logic: number;
    communication: number;
    teamwork: number;
  };
  training: Record<string, number>; // module id -> score 0..100
  cargo: Record<string, number>; // item id -> units
  launchScore: number;
  landingScore: number;
  landingFuel: number;
  day: number;
  clock: number; // hours 0..24 in lunar-surface time
  res: {
    o2: number;
    water: number;
    food: number;
    battery: number;
    solar: number; // condition % of arrays
    radiation: number; // accumulated dose %
    scrubber: number;
    recycler: number;
    hab: number;
  };
  rover: { battery: number; condition: number; x: number; distance: number };
  crew: Crew[];
  science: number;
  objectives: Record<string, boolean>;
  samples: Sample[];
  achievements: string[];
  log: LogEntry[];
  codex: string[];
  settings: { sound: boolean; reducedMotion: boolean; subtitles: boolean };
}

const CREW: Crew[] = [
  { id: "c1", name: "Cmdr. Vega", role: "Commander", hue: 20, health: 100, fatigue: 5, morale: 90, dose: 0, skill: 88 },
  { id: "c2", name: "Dr. Okonkwo", role: "Geologist", hue: 300, health: 100, fatigue: 8, morale: 88, dose: 0, skill: 82 },
  { id: "c3", name: "Eng. Sato", role: "Flight Engineer", hue: 200, health: 100, fatigue: 4, morale: 92, dose: 0, skill: 90 },
];

export const OBJECTIVES: { id: string; label: string }[] = [
  { id: "eva1", label: "Complete first lunar EVA" },
  { id: "samples5", label: "Collect 5 lunar samples" },
  { id: "ice", label: "Confirm subsurface water ice" },
  { id: "deploy", label: "Deploy surface instruments" },
  { id: "traverse", label: "Traverse 10 km by rover" },
  { id: "storm", label: "Survive a solar particle event" },
  { id: "repair", label: "Repair a critical system" },
  { id: "day30", label: "Complete 30 mission days" },
];

export const initialState: MissionState = {
  version: 1,
  started: false,
  demoMode: false,
  phase: "intro",
  profile: {
    name: "",
    callSign: "",
    age: "",
    country: "",
    specialty: "Flight Engineer",
    interests: [],
    skills: [],
    skin: 2,
    hair: 0,
    hairColor: 0,
    suit: 0,
    patch: 0,
    why: "",
  },
  scores: { reaction: 0, memory: 0, spatial: 0, logic: 0, communication: 0, teamwork: 0 },
  training: {},
  cargo: {},
  launchScore: 0,
  landingScore: 0,
  landingFuel: 0,
  day: 1,
  clock: 6,
  res: {
    o2: 96,
    water: 90,
    food: 100,
    battery: 88,
    solar: 100,
    radiation: 4,
    scrubber: 100,
    recycler: 100,
    hab: 100,
  },
  rover: { battery: 100, condition: 100, x: 0, distance: 0 },
  crew: CREW,
  science: 0,
  objectives: {},
  samples: [],
  achievements: [],
  log: [],
  codex: [],
  settings: { sound: true, reducedMotion: false, subtitles: true },
};

const KEY = "jr-astrolabs-mission-v1";

interface Ctx {
  state: MissionState;
  update: (fn: (draft: MissionState) => void) => void;
  reset: () => void;
  log: (text: string, kind?: LogEntry["kind"]) => void;
  award: (id: string) => void;
  unlockCodex: (id: string) => void;
  hydrated: boolean;
}

const MissionCtx = createContext<Ctx | null>(null);

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function MissionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MissionState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const ready = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MissionState;
        if (parsed.version === initialState.version) {
          setState({ ...clone(initialState), ...parsed });
        }
      }
    } catch {
      /* ignore corrupt save */
    }
    ready.current = true;
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full / unavailable */
    }
  }, [state]);

  const update = useCallback((fn: (draft: MissionState) => void) => {
    setState((prev) => {
      const draft = clone(prev);
      fn(draft);
      return draft;
    });
  }, []);

  const reset = useCallback(() => {
    setState(clone(initialState));
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  }, []);

  const log = useCallback(
    (text: string, kind: LogEntry["kind"] = "info") => {
      update((d) => {
        d.log.unshift({ day: d.day, text, kind });
        d.log = d.log.slice(0, 120);
      });
    },
    [update],
  );

  const award = useCallback(
    (id: string) => {
      update((d) => {
        if (!d.achievements.includes(id)) {
          d.achievements.push(id);
          d.log.unshift({ day: d.day, text: `Achievement unlocked — ${id}`, kind: "good" });
        }
      });
    },
    [update],
  );

  const unlockCodex = useCallback(
    (id: string) => {
      update((d) => {
        if (!d.codex.includes(id)) d.codex.push(id);
      });
    },
    [update],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("reduced-motion", state.settings.reducedMotion);
  }, [state.settings.reducedMotion]);

  const value = useMemo(
    () => ({ state, update, reset, log, award, unlockCodex, hydrated }),
    [state, update, reset, log, award, unlockCodex, hydrated],
  );

  return <MissionCtx.Provider value={value}>{children}</MissionCtx.Provider>;
}

export function useMission() {
  const ctx = useContext(MissionCtx);
  if (!ctx) throw new Error("useMission must be used inside MissionProvider");
  return ctx;
}

export function readiness(training: Record<string, number>, total: number) {
  const done = Object.values(training).filter((v) => v > 0);
  const sum = done.reduce((a, b) => a + b, 0);
  return Math.round(sum / total);
}

export function missionScore(s: MissionState) {
  const crewSafety = Math.round(s.crew.reduce((a, c) => a + c.health, 0) / s.crew.length);
  const resources = Math.round((s.res.o2 + s.res.water + s.res.food + s.res.battery) / 4);
  const scienceReturn = Math.min(100, Math.round(s.science / 2));
  const exploration = Math.min(100, Math.round(s.rover.distance * 4));
  const engineering = Math.round((s.res.solar + s.res.scrubber + s.res.recycler + s.rover.condition) / 4);
  const completion = Math.round((Object.values(s.objectives).filter(Boolean).length / OBJECTIVES.length) * 100);
  const overall = Math.round(
    crewSafety * 0.25 +
      scienceReturn * 0.2 +
      resources * 0.15 +
      engineering * 0.15 +
      exploration * 0.1 +
      completion * 0.15,
  );
  return { crewSafety, resources, scienceReturn, exploration, engineering, completion, overall };
}

export function grade(v: number) {
  if (v >= 90) return "OUTSTANDING";
  if (v >= 78) return "EXCELLENT";
  if (v >= 65) return "NOMINAL";
  if (v >= 50) return "MARGINAL";
  return "NEEDS REVIEW";
}
