"use client";

import { useState, useEffect } from "react";
import { UserCog } from "lucide-react";

type UsuarioSimple = { id: string; nombre: string | null; username: string };

export default function DelegarBoton({
  pegueId,
  tipo,
  cuotaId,
  eventoId,
  onDelegado,
}: {
  pegueId: string;
  tipo: "COBRO_CUOTA" | "CORTE_MORA";
  cuotaId?: string;
  eventoId?: string;
  onDelegado?: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioSimple[]>([]);
  const [asignadoAId, setAsignadoAId] = useState("");
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [hecho, setHecho] = useState(false);

  useEffect(() => {
    if (abierto && usuarios.length === 0) {
      fetch("/api/usuarios/asignables")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          setUsuarios(data);
          if (data[0]) setAsignadoAId(data[0].id);
        });
    }
  }, [abierto, usuarios.length]);

  async function delegar() {
    if (!asignadoAId) return;
    setGuardando(true);
    const res = await fetch("/api/delegaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pegueId, tipo, cuotaId, eventoId, asignadoAId, nota }),
    });
    setGuardando(false);
    if (res.ok) {
      setHecho(true);
      setAbierto(false);
      onDelegado?.();
    }
  }

  if (hecho) {
    return <span className="text-xs text-green-600">✓ Delegado</span>;
  }

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="btn-outline text-xs flex items-center gap-1.5">
        <UserCog size={13} /> Delegar
      </button>
    );
  }

  return (
    <div className="border rounded-lg p-3 bg-gray-50 space-y-2 w-full max-w-xs">
      <div>
        <label className="label">Asignar a</label>
        <select className="input text-sm" value={asignadoAId} onChange={(e) => setAsignadoAId(e.target.value)}>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nombre || u.username}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Nota (opcional)</label>
        <input className="input text-sm" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej: él recibió el dinero directamente" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={delegar} disabled={guardando || !asignadoAId} className="btn-primario text-xs">
          {guardando ? "Guardando..." : "Confirmar"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="btn-outline text-xs">
          Cancelar
        </button>
      </div>
    </div>
  );
}
