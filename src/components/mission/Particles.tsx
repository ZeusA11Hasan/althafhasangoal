import { useEffect, useRef } from "react";

export function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let frameCount = 0;
    let hidden = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const isMobile = window.innerWidth < 768;
    const resize = () => {
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
      c.style.width = window.innerWidth + "px";
      c.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    const onVisibility = () => {
      hidden = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    const N = isMobile ? 40 : 70;
    const stars = Array.from({ length: N }).map(() => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      r: Math.random() * 1.4 * dpr + 0.2,
      vy: (Math.random() * 0.15 + 0.05) * dpr,
      a: Math.random() * 0.6 + 0.15,
    }));
    const loop = () => {
      raf = requestAnimationFrame(loop);
      // Throttle to 30fps (skip every other frame)
      frameCount++;
      if (frameCount % 2 !== 0) return;
      // Pause when tab is hidden
      if (hidden) return;
      ctx.clearRect(0, 0, c.width, c.height);
      for (const s of stars) {
        s.y += s.vy;
        if (s.y > c.height) {
          s.y = -2;
          s.x = Math.random() * c.width;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.fill();
      }
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0 opacity-50"
      aria-hidden
    />
  );
}