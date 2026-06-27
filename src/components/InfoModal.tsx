import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "sismo-ve:usgs-notice-dismissed";

export default function InfoModal() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Mostrar solo si no se ha cerrado antes.
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      /* localStorage no disponible: mostrar igual una vez */
    }
    if (!dismissed) setOpen(true);
  }, []);

  // Enfocar el botón y cerrar con Escape mientras está abierto.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignorar */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="modal__backdrop" onClick={dismiss}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="modal__eyebrow">Fuente de datos</span>
        <h2 id="modal-title" className="modal__title">
          Reportes oficiales del USGS
        </h2>
        <p className="modal__body">
          Todos los sismos que ves en este mapa y en el registro provienen
          directamente del Servicio Geológico de los Estados Unidos (USGS), la red
          que publica más reportes de actividad sísmica para la región. Los datos
          se actualizan automáticamente cada minuto.
        </p>
        <button ref={closeRef} className="modal__btn" onClick={dismiss}>
          Entendido
        </button>
        <p className="modal__note">No volverá a mostrarse este aviso.</p>
      </div>
    </div>
  );
}
