"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BotonAtras({ href, label = "Atrás" }: { href?: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => (href ? router.push(href) : router.back())}
      className="no-imprimir flex items-center gap-1.5 text-azul text-sm font-medium mb-3 hover:underline"
    >
      <ArrowLeft size={16} strokeWidth={2} />
      {label}
    </button>
  );
}
