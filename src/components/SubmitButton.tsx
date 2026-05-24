"use client";

import { useFormStatus } from "react-dom";

// Botão de submit que mostra estado "enviando" para dar resposta imediata ao toque.
export default function SubmitButton({
  children,
  pendingLabel = "Enviando…",
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-60`}>
      {pending ? pendingLabel : children}
    </button>
  );
}
