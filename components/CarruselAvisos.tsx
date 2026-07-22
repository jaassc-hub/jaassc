"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import type { AvisoPortal } from "@/lib/avisosPortalConfig";

export default function CarruselAvisos({ avisos }: { avisos: AvisoPortal[] }) {
  const activos = avisos.filter((a) => a.activo).sort((a, b) => a.orden - b.orden);
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (activos.length <= 1) return;
    const t = setInterval(() => setIndice((i) => (i + 1) % activos.length), 6000);
    return () => clearInterval(t);
  }, [activos.length]);

  if (activos.length === 0) {
    return (
      <div className="bg-white/10 border border-white/20 rounded-xl p-5 text-white/80 text-sm flex items-center gap-3 max-w-md mx-auto">
        <Megaphone size={22} className="shrink-0" />
        <span>Aquí puede ver las novedades de la Junta de Agua cuando suban algún aviso.</span>
      </div>
    );
  }

  const aviso = activos[indice];
  const Contenido = (
    <div className="bg-white rounded-xl shadow-lg p-4 text-left max-w-md mx-auto">
      {aviso.tipo === "IMAGEN" && aviso.imagenUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={aviso.imagenUrl} alt={aviso.titulo} className="w-full rounded-lg mb-2 max-h-48 object-cover" />
      )}
      {aviso.titulo && <p className="font-bold text-azul">{aviso.titulo}</p>}
      {aviso.tipo === "TEXTO" && aviso.cuerpo && <p className="text-sm text-gray-600 mt-1">{aviso.cuerpo}</p>}
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      {aviso.enlaceUrl ? (
        <a href={aviso.enlaceUrl} target="_blank" rel="noopener noreferrer">{Contenido}</a>
      ) : (
        Contenido
      )}

      {activos.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => setIndice((i) => (i - 1 + activos.length) % activos.length)}
            className="text-white/70 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-1.5">
            {activos.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === indice ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIndice((i) => (i + 1) % activos.length)}
            className="text-white/70 hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
