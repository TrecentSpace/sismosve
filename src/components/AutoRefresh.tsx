import { useEffect } from "react";

// Recarga la página completa cada 5 minutos para garantizar datos frescos para
// todos los usuarios (además del polling seamless de USGS cada 60s). Es
// considerada: no recarga si la pestaña está oculta ni mientras el usuario está
// interactuando; en ese caso reintenta apenas quede inactivo.

const REFRESH_MS = 5 * 60 * 1000; // 5 minutos
const IDLE_GRACE_MS = 20 * 1000; // esperar 20s de inactividad para no interrumpir
const CHECK_MS = 15 * 1000; // frecuencia de chequeo una vez vencido el plazo

export default function AutoRefresh() {
  useEffect(() => {
    const mountedAt = Date.now();
    let lastActivity = Date.now();

    const bump = () => {
      lastActivity = Date.now();
    };
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "wheel"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    const id = setInterval(() => {
      const now = Date.now();
      if (now - mountedAt < REFRESH_MS) return; // aún no vence el plazo
      if (document.hidden) return; // no recargar pestaña en segundo plano
      if (now - lastActivity < IDLE_GRACE_MS) return; // usuario activo: esperar
      window.location.reload();
    }, CHECK_MS);

    return () => {
      clearInterval(id);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, []);

  return null;
}
