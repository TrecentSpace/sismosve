import { useEffect, useRef } from "react";

// Traza de sismógrafo: una línea que corre de derecha a izquierda con ruido
// ambiente tenue y un "spike" rojo cuando llega un sismo nuevo. Es el elemento
// distintivo del encabezado. Respeta prefers-reduced-motion.

type Props = { spikeKey: number; spikeMag: number };

export default function LiveTicker({ spikeKey, spikeMag }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<number[]>([]);
  const spikeRef = useRef(0);

  // Inyecta un spike cuando cambia spikeKey.
  useEffect(() => {
    if (spikeKey === 0) return;
    spikeRef.current = Math.min(1, 0.35 + spikeMag / 8);
  }, [spikeKey, spikeMag]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (dataRef.current.length === 0)
        dataRef.current = new Array(Math.ceil(w)).fill(0);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let phase = 0;
    const styles = getComputedStyle(document.documentElement);
    const trace = styles.getPropertyValue("--trace").trim() || "#1B7F79";
    const red = styles.getPropertyValue("--r3").trim() || "#CC2B1D";

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const mid = h / 2;
      const buf = dataRef.current;

      // Genera la nueva muestra (ruido ambiente + decaimiento del spike).
      phase += 0.3;
      const ambient = Math.sin(phase) * 0.04 + (Math.random() - 0.5) * 0.05;
      let sample = ambient;
      if (spikeRef.current > 0.01) {
        sample += (Math.random() - 0.5) * spikeRef.current * 1.8;
        spikeRef.current *= 0.86; // decae
      }
      buf.push(sample);
      while (buf.length > w) buf.shift();

      ctx.clearRect(0, 0, w, h);
      // baseline
      ctx.strokeStyle = "rgba(199,188,169,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(w, mid);
      ctx.stroke();

      // traza
      const maxAbs = Math.max(0.12, ...buf.map((v) => Math.abs(v)));
      const isHot = spikeRef.current > 0.08 || maxAbs > 0.5;
      ctx.strokeStyle = isHot ? red : trace;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let x = 0; x < buf.length; x++) {
        const y = mid - buf[x] * (h * 0.42);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    if (reduced) {
      // Línea estática.
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = trace;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="ticker" aria-hidden="true" />;
}
