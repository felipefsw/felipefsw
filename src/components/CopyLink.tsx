"use client";

import { useEffect, useRef, useState } from "react";

export default function CopyLink({ path }: { path: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  // Depois que a página carrega no navegador, mostra a URL completa (com o domínio).
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = `${window.location.origin}${path}`;
    }
  }, [path]);

  async function copy() {
    const url = inputRef.current?.value ?? path;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Alguns navegadores bloqueiam a cópia automática; o usuário pode copiar manualmente.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        readOnly
        defaultValue={path}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full truncate rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
      />
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-lg bg-orange-700 px-3 py-2 text-sm font-medium text-white hover:bg-orange-800"
      >
        {copied ? "Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
