import { useCallback, useEffect, useRef, useState } from "react";
import type { Quake } from "./usgs";

// Avisos de "sismo reportado": cuando aparece un sismo NUEVO en el feed del USGS,
// dispara una notificación del navegador y un toast en pantalla. Es un aviso
// POSTERIOR (el sismo ya ocurrió), no una predicción.

const KEY = "sismo-ve:alerts-enabled";

export type AlertToast = {
  id: string;
  mag: number;
  place: string;
  time: number;
};

type NotifPermission = "default" | "granted" | "denied" | "unsupported";

function currentPermission(): NotifPermission {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission as NotifPermission;
}

export function useQuakeAlerts(quakes: Quake[], newIds: Set<string>) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });
  const [permission, setPermission] = useState<NotifPermission>(currentPermission);
  const [toasts, setToasts] = useState<AlertToast[]>([]);
  const notified = useRef<Set<string>>(new Set());

  const enable = useCallback(async () => {
    let perm = currentPermission();
    if (perm === "default") {
      try {
        perm = (await Notification.requestPermission()) as NotifPermission;
      } catch {
        /* ignore */
      }
    }
    setPermission(perm);
    setEnabled(true);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const disable = useCallback(() => {
    setEnabled(false);
    try {
      localStorage.setItem(KEY, "0");
    } catch {
      /* ignore */
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Dispara avisos cuando llegan sismos nuevos (no en la carga inicial: newIds
  // viene vacío la primera vez).
  useEffect(() => {
    if (!enabled || newIds.size === 0) return;
    const fresh = quakes.filter(
      (q) => newIds.has(q.id) && !notified.current.has(q.id),
    );
    if (fresh.length === 0) return;
    fresh.forEach((q) => notified.current.add(q.id));

    setToasts((prev) =>
      [
        ...fresh.map((q) => ({
          id: q.id,
          mag: q.mag,
          place: q.place,
          time: q.time,
        })),
        ...prev,
      ].slice(0, 4),
    );

    if (permission === "granted") {
      fresh.forEach((q) => {
        try {
          new Notification(`Sismo reportado · M ${q.mag.toFixed(1)}`, {
            body: `${q.place}\nReporte del USGS — el sismo ya ocurrió.`,
            tag: q.id,
          });
        } catch {
          /* ignore */
        }
      });
    }
  }, [newIds, enabled, permission, quakes]);

  return { enabled, permission, enable, disable, toasts, dismissToast };
}
