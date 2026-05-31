import { useEffect, useRef, useState } from "react";

/**
 * Full-screen Matrix-style rain canvas.
 * Only renders when [data-skin="matrix"] is active on <html>.
 */
const GLYPHS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノﾊﾋﾌﾍﾎマミムメモヤユヨラリルレロワヲABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+-=<>/\\|{}[]";

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [active, setActive] = useState(
    typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-skin") === "matrix",
  );

  // Watch skin changes on <html>
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setActive(document.documentElement.getAttribute("data-skin") === "matrix");
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-skin"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    let cols = 0;
    const fontSize = 16;
    let drops: { y: number; speed: number; opacity: number }[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / fontSize);
      drops = Array.from({ length: cols }, () => ({
        y: Math.random() * -height,
        speed: 0.6 + Math.random() * 1.8, // varied speeds
        opacity: 0.5 + Math.random() * 0.5, // varied opacity
      }));
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      // Fade previous frame for trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px "Share Tech Mono", "JetBrains Mono", monospace`;
      ctx.textBaseline = "top";

      for (let i = 0; i < cols; i++) {
        const d = drops[i];
        const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        const x = i * fontSize;
        const y = d.y;

        // Bright head
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 8;
        ctx.fillStyle = `rgba(200, 255, 220, ${d.opacity})`;
        ctx.fillText(ch, x, y);

        // Soft trail glyph above
        ctx.shadowBlur = 4;
        ctx.fillStyle = `rgba(0, 255, 120, ${d.opacity * 0.6})`;
        ctx.fillText(
          GLYPHS[(Math.random() * GLYPHS.length) | 0],
          x,
          y - fontSize,
        );

        d.y += d.speed * fontSize * 0.18 + d.speed;
        if (d.y > height + Math.random() * 200) {
          d.y = -fontSize * (5 + Math.random() * 20);
          d.speed = 0.6 + Math.random() * 1.8;
          d.opacity = 0.5 + Math.random() * 0.5;
        }
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
          background: "#000",
        }}
      />
      {/* Semi-transparent dark overlay above rain, below content */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, rgba(0,10,5,0.55) 0%, rgba(0,5,2,0.78) 100%)",
        }}
      />
    </>
  );
}
