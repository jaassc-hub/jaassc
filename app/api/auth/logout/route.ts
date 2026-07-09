import { NextResponse } from "next/server";
import { cerrarSesion } from "@/lib/auth";

export async function POST() {
  cerrarSesion();
  return NextResponse.json({ ok: true });
}
