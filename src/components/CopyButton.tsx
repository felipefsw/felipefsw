"use client";

import { useState } from "react";

export default function CopyButton({
  text,
  label = "Copiar endereço",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // alguns navegadores bloqueiam cópia automática
    }
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? "Copiado!" : label}
    </button>
  );
}
