const SKINS = ["#f3d0b0", "#e3b189", "#c98d5f", "#9a6239", "#6f4429", "#4a2e1c"];
const HAIRS = ["#2a2118", "#4b3520", "#8a5a2b", "#c9a227", "#b0b7c3", "#6b3fa0"];
const SUITS = [
  { shell: "#e8edf5", trim: "#4fc3e8" },
  { shell: "#dfe6f2", trim: "#f0a63c" },
  { shell: "#d4dbe8", trim: "#7ee0a5" },
  { shell: "#e5e2f3", trim: "#b48cf2" },
];

export type Mood = "neutral" | "happy" | "focused" | "worried" | "tired";

interface Props {
  skin?: number;
  hair?: number;
  hairColor?: number;
  suit?: number;
  mood?: Mood;
  helmet?: boolean;
  floating?: boolean;
  size?: number;
  className?: string;
}

/**
 * Original 2D illustrated astronaut character with blinking eyes,
 * expressive mouth shapes and idle motion. No photorealism.
 */
export function Astronaut({
  skin = 2,
  hair = 0,
  hairColor = 0,
  suit = 0,
  mood = "neutral",
  helmet = false,
  floating = false,
  size = 160,
  className = "",
}: Props) {
  const sk = SKINS[skin % SKINS.length] ?? SKINS[0]!;
  const hc = HAIRS[hairColor % HAIRS.length] ?? HAIRS[0]!;
  const st = SUITS[suit % SUITS.length] ?? SUITS[0]!;

  const mouth = {
    neutral: "M 44 68 q 8 4 16 0",
    happy: "M 42 64 q 10 12 20 0",
    focused: "M 45 69 h 14",
    worried: "M 43 70 q 9 -7 18 0",
    tired: "M 44 70 q 8 3 15 -2",
  }[mood];

  const browY = mood === "worried" ? 44 : mood === "focused" ? 45 : 42;

  return (
    <svg
      viewBox="0 0 104 150"
      width={size}
      height={size * 1.44}
      className={`${floating ? "animate-floaty" : ""} ${className}`}
      role="img"
      aria-label="Astronaut character"
    >
      {/* backpack */}
      <rect x="20" y="78" width="64" height="44" rx="14" fill={st.shell} opacity="0.5" />
      {/* torso */}
      <rect x="26" y="82" width="52" height="46" rx="16" fill={st.shell} />
      <rect x="34" y="92" width="36" height="14" rx="7" fill={st.trim} opacity="0.85" />
      <circle cx="42" cy="115" r="3" fill={st.trim} />
      <circle cx="52" cy="115" r="3" fill="#f05a5a" />
      <circle cx="62" cy="115" r="3" fill="#7ee0a5" />
      {/* arms */}
      <rect x="12" y="86" width="16" height="38" rx="8" fill={st.shell} />
      <rect x="76" y="86" width="16" height="38" rx="8" fill={st.shell} />
      <circle cx="20" cy="126" r="8" fill={st.trim} />
      <circle cx="84" cy="126" r="8" fill={st.trim} />
      {/* legs */}
      <rect x="32" y="124" width="16" height="22" rx="7" fill={st.shell} />
      <rect x="56" y="124" width="16" height="22" rx="7" fill={st.shell} />
      {/* neck ring */}
      <rect x="40" y="74" width="24" height="10" rx="5" fill={st.trim} />
      {/* head */}
      <g>
        <ellipse cx="52" cy="54" rx="24" ry="26" fill={sk} />
        {/* hair styles */}
        {hair % 4 === 0 && <path d="M28 46 q 24 -30 48 0 q -10 -12 -24 -12 q -14 0 -24 12 z" fill={hc} />}
        {hair % 4 === 1 && (
          <path d="M28 50 q 0 -30 24 -30 q 24 0 24 30 q -6 -16 -24 -16 q -18 0 -24 16 z" fill={hc} />
        )}
        {hair % 4 === 2 && (
          <>
            <path d="M28 48 q 24 -28 48 0 q -6 -14 -24 -14 q -18 0 -24 14 z" fill={hc} />
            <path d="M26 48 q -4 24 4 34 q -10 -18 -4 -34 z" fill={hc} />
            <path d="M78 48 q 4 24 -4 34 q 10 -18 4 -34 z" fill={hc} />
          </>
        )}
        {hair % 4 === 3 && <path d="M30 44 q 22 -22 44 0 q -4 -18 -22 -18 q -18 0 -22 18 z" fill={hc} />}
        {/* brows */}
        <rect x="36" y={browY} width="12" height="3" rx="1.5" fill="#00000055" />
        <rect x="56" y={browY} width="12" height="3" rx="1.5" fill="#00000055" />
        {/* eyes with blink */}
        <g style={{ transformOrigin: "42px 54px", animation: "blinkeye 5.5s infinite" }}>
          <ellipse cx="42" cy="54" rx="4.4" ry="5" fill="#1b2430" />
          <circle cx="43.4" cy="52.4" r="1.4" fill="#fff" />
        </g>
        <g style={{ transformOrigin: "62px 54px", animation: "blinkeye 5.5s infinite" }}>
          <ellipse cx="62" cy="54" rx="4.4" ry="5" fill="#1b2430" />
          <circle cx="63.4" cy="52.4" r="1.4" fill="#fff" />
        </g>
        <path d={mouth} stroke="#7a3a35" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        {mood === "happy" && (
          <>
            <circle cx="33" cy="62" r="4" fill="#f08a8a" opacity="0.4" />
            <circle cx="71" cy="62" r="4" fill="#f08a8a" opacity="0.4" />
          </>
        )}
      </g>
      {helmet && (
        <>
          <circle cx="52" cy="54" r="32" fill="#9fdcf5" opacity="0.18" />
          <circle cx="52" cy="54" r="32" fill="none" stroke={st.trim} strokeWidth="3" />
          <path d="M34 36 q 12 -8 24 -4" stroke="#ffffff" strokeWidth="4" opacity="0.5" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
