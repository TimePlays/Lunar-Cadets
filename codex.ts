export interface CodexEntry {
  id: string;
  title: string;
  tag: "REAL SPACE SCIENCE" | "GAME MODEL";
  body: string;
}

export const CODEX: CodexEntry[] = [
  {
    id: "moon",
    title: "The Moon",
    tag: "REAL SPACE SCIENCE",
    body: "The Moon orbits Earth at roughly 384,400 km. A lunar day lasts about 29.5 Earth days, so a surface site sees ~14 days of sunlight followed by ~14 days of darkness — which is why stored power matters so much at an outpost.",
  },
  {
    id: "gravity",
    title: "Lunar Gravity",
    tag: "REAL SPACE SCIENCE",
    body: "Surface gravity on the Moon is about 1.62 m/s², roughly one sixth of Earth's 9.81 m/s². Mass does not change — weight does. Loping hops are more efficient than walking because each push lifts you further and for longer.",
  },
  {
    id: "ice",
    title: "Lunar Water Ice",
    tag: "REAL SPACE SCIENCE",
    body: "Permanently shadowed craters near the lunar poles never receive direct sunlight and can stay below -170 °C, cold enough to trap water ice for billions of years. Water means drinking supply, breathable oxygen through electrolysis, and potentially hydrogen/oxygen rocket propellant.",
  },
  {
    id: "regolith",
    title: "Regolith",
    tag: "REAL SPACE SCIENCE",
    body: "Lunar regolith is a layer of broken rock and glassy dust created by billions of years of micrometeoroid impacts. The grains are sharp and electrostatically charged, so they cling to suits, abrade seals and coat solar panels — reducing power output.",
  },
  {
    id: "radiation",
    title: "Space Radiation",
    tag: "REAL SPACE SCIENCE",
    body: "Without Earth's atmosphere and magnetic field, crews are exposed to galactic cosmic rays and occasional solar particle events. Shielding mass, shelter time and limiting exposure are the practical defences — dose accumulates and cannot be undone.",
  },
  {
    id: "lifesupport",
    title: "Life Support",
    tag: "REAL SPACE SCIENCE",
    body: "A closed-loop life support system removes carbon dioxide, controls humidity and regenerates oxygen. CO₂ scrubbers saturate over time; if scrubbing falls behind, CO₂ rises and causes headaches and impaired judgement long before oxygen runs out.",
  },
  {
    id: "power",
    title: "Solar Power & Batteries",
    tag: "REAL SPACE SCIENCE",
    body: "Solar arrays only generate while illuminated and at an efficient sun angle. Batteries carry the base through darkness and demand spikes. Total demand above generation means the battery drains — the only fix is to shed load or restore generation.",
  },
  {
    id: "eva",
    title: "Space Suits & EVA",
    tag: "REAL SPACE SCIENCE",
    body: "An EVA suit is a personal spacecraft: pressure, oxygen, CO₂ removal, cooling, power and comms. Higher exertion means faster oxygen use and more heat to reject, so trained astronauts move deliberately and stay tethered.",
  },
  {
    id: "orbits",
    title: "Orbits & Trajectories",
    tag: "REAL SPACE SCIENCE",
    body: "An orbit is continuous free fall with enough sideways speed to keep missing the planet. A trans-lunar injection burn raises the far side of the orbit until it reaches the Moon — timing matters more than raw thrust.",
  },
  {
    id: "rockets",
    title: "Rockets & Staging",
    tag: "REAL SPACE SCIENCE",
    body: "Rockets work by Newton's third law: expelled propellant pushes the vehicle the other way. Staging discards empty tanks and engines so the remaining vehicle accelerates more efficiently.",
  },
  {
    id: "habitat",
    title: "Lunar Habitats",
    tag: "GAME MODEL",
    body: "Our outpost is modelled as connected modules sharing one power, air and water budget. Damage anywhere propagates: the point is systems thinking, not an exact engineering replica of any real habitat design.",
  },
  {
    id: "rover",
    title: "Pressurised & Unpressurised Rovers",
    tag: "REAL SPACE SCIENCE",
    body: "Surface rovers extend the science range far beyond walking distance, but every kilometre out is a kilometre back. Crews plan a walk-back or drive-back energy margin before they leave the outpost.",
  },
];
