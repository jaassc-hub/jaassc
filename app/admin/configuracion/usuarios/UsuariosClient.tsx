"use client";

import { useState } from "react";
import { MODULOS } from "@/lib/permisos";
import { UserPlus } from "lucide-react";

type Usuario = {
  id: string;
  username: string;
  nombre: string | null;
  rol: string;
  permisos: string;
  activo: boolean;
};

const ROLES = ["PRESIDENTE", "TESORERO", "SECRETARIA", "FISCAL", "VOCAL", "COBRADOR"];
const NOMBRE_ROL: Record<string, string> = {
  PRESIDENTE: "Presidente",
  TESORERO: "Tesorero",
  SECRETARIA: "Secretaria",
  FISCAL: "Fiscal",
  VOCAL: "Vocal",
  COBRADOR: "Cobrador (solo cobros)",
};
const ACCESO_TOTAL = ["PRESIDENTE", "TESORERO"];
const ACCESO_FIJO = ["COBRADOR"]; // roles cuyo permiso no se edita manualmente, ya viene fijo

export default function UsuariosClient({
  usuariosIniciales,
  usuarioActualId,
}: {
  usuariosIniciales: Usuario[];
  usuarioActualId: string;
}) {
  const [usuarios, setUsuarios] = useState(usuariosIniciales);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("VOCAL");
  const [permisosSel, setPermisosSel] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  function togglePermisoNuevo(key: string) {
    setPermisosSel((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  }

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    setGuardando(true);
    setError("");
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, nombre, rol, permisos: permisosSel }),
    });
    setGuardando(false);
    if (res.ok) {
      const nuevo = await res.json();
      setUsuarios([...usuarios, nuevo]);
      setMostrarForm(false);
      setUsername("");
      setPassword("");
      setNombre("");
      setRol("VOCAL");
      setPermisosSel([]);
    } else {
      const data = await res.json();
      setError(data.error || "Error al crear el usuario");
    }
  }

  async function actualizar(id: string, cambios: any) {
    const res = await fetch(`/api/usuarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    });
    if (res.ok) {
      const actualizado = await res.json();
      setUsuarios(usuarios.map((u) => (u.id === id ? actualizado : u)));
    }
  }

  function togglePermisoExistente(u: Usuario, key: string) {
    const permisos: string[] = JSON.parse(u.permisos || "[]");
    const nuevos = permisos.includes(key) ? permisos.filter((x) => x !== key) : [...permisos, key];
    actualizar(u.id, { permisos: nuevos });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-end">
        <button onClick={() => setMostrarForm(!mostrarForm)} className="btn-primario text-sm flex items-center gap-1.5">
          <UserPlus size={16} /> {mostrarForm ? "Cancelar" : "Nuevo usuario"}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={crearUsuario} className="card space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="label">Nombre completo</label>
              <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <label className="label">Rol</label>
              <select className="input" value={rol} onChange={(e) => setRol(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{NOMBRE_ROL[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Usuario (para iniciar sesión)</label>
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          {ACCESO_TOTAL.includes(rol) ? null : ACCESO_FIJO.includes(rol) ? (
            <p className="text-sm text-gray-500 bg-gray-50 border rounded-lg px-3 py-2">
              El rol Cobrador solo tiene acceso al módulo de Pagos, automáticamente.
            </p>
          ) : (
            <div>
              <label className="label">Módulos a los que tendrá acceso</label>
              <div className="flex flex-wrap gap-2">
                {MODULOS.map((m) => (
                  <label key={m.key} className="flex items-center gap-2 text-sm bg-gray-50 border rounded-lg px-3 py-2">
                    <input
                      type="checkbox"
                      checked={permisosSel.includes(m.key)}
                      onChange={() => togglePermisoNuevo(m.key)}
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button disabled={guardando} className="btn-primario text-sm">
            {guardando ? "Creando..." : "Crear usuario"}
          </button>
        </form>
      )}

      <div className="card divide-y">
        {usuarios.map((u) => {
          const permisos: string[] = JSON.parse(u.permisos || "[]");
          const accesoTotal = ACCESO_TOTAL.includes(u.rol);
          return (
            <div key={u.id} className="py-3 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium">
                    {u.nombre || u.username}{" "}
                    <span className="text-gray-400 text-sm">({u.username})</span>
                  </p>
                  <p className="text-xs text-gray-400">{NOMBRE_ROL[u.rol]}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="input text-sm py-1 w-auto"
                    value={u.rol}
                    onChange={(e) => actualizar(u.id, { rol: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{NOMBRE_ROL[r]}</option>
                    ))}
                  </select>
                  <span className={u.activo ? "badge-verde" : "badge-rojo"}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                  {u.id !== usuarioActualId && (
                    <button
                      onClick={() => actualizar(u.id, { activo: !u.activo })}
                      className="text-xs text-gray-500"
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  )}
                </div>
              </div>

              {accesoTotal ? (
                <p className="text-xs text-gray-400">Acceso total a todo el sistema.</p>
              ) : ACCESO_FIJO.includes(u.rol) ? (
                <p className="text-xs text-gray-400">Acceso fijo: solo Pagos.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {MODULOS.map((m) => (
                    <label
                      key={m.key}
                      className="flex items-center gap-1.5 text-xs bg-gray-50 border rounded-md px-2 py-1"
                    >
                      <input
                        type="checkbox"
                        checked={permisos.includes(m.key)}
                        onChange={() => togglePermisoExistente(u, m.key)}
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
