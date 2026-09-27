import { useEffect, useRef } from "react";

interface Props {
  density?: number;
  speed?: number;
  className?: string;
}

/** Animated parallax starfield rendered on canvas. */
export function Starfield({ density = 140, speed = 0.06, className }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const stars = Array.from({ length: density }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.8 + 0.2,
      t: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.t += 0.02 * s.z;
        s.y += speed * 0.001 * s.z;
        if (s.y > 1) s.y = 0;
        const alpha = 0.35 + Math.sin(s.t) * 0.35 + s.z * 0.2;
        const size = s.z * 1.7;
        ctx.fillStyle = `rgba(210, 235, 255, ${Math.max(0.05, Math.min(1, alpha))})`;
        ctx.fillRect(s.x * w, s.y * h, size, size);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [density, speed]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
