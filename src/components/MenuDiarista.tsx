"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { sair } from "@/app/entrar/actions";

export default function MenuDiarista({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const base = `/d/${token}`;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const itemClass = "block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Conta"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white"
      >
        👤 Conta ▾
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <Link href={`${base}/perfil`} onClick={() => setOpen(false)} className={itemClass}>
            Perfil
          </Link>
          <Link href={`${base}/editar`} onClick={() => setOpen(false)} className={itemClass}>
            Editar dados
          </Link>
          <Link href={`${base}/editar#senha`} onClick={() => setOpen(false)} className={itemClass}>
            Mudar senha
          </Link>
          <form action={sair} className="border-t border-gray-100">
            <button type="submit" className={`${itemClass} font-medium text-red-600`}>
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
