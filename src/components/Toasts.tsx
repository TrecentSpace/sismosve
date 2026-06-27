import { useEffect } from "react";
import type { AlertToast } from "../lib/useQuakeAlerts";
import { colorFor } from "../lib/magnitude";

type Props = {
  toasts: AlertToast[];
  onDismiss: (id: string) => void;
};

export default function Toasts({ toasts, onDismiss }: Props) {
  return (
    <div className="toasts" aria-live="polite" aria-label="Avisos de sismos">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: AlertToast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const id = setTimeout(() => onDismiss(toast.id), 12000);
    return () => clearTimeout(id);
  }, [toast.id, onDismiss]);

  const time = new Date(toast.time).toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="toast" role="status">
      <span className="toast__mag" style={{ background: colorFor(toast.mag) }}>
        {toast.mag.toFixed(1)}
      </span>
      <div className="toast__body">
        <strong className="toast__title">Sismo reportado</strong>
        <span className="toast__place">{toast.place}</span>
        <span className="toast__meta">Reporte USGS · ya ocurrió · {time}</span>
      </div>
      <button
        className="toast__close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar aviso"
      >
        ×
      </button>
    </div>
  );
}
