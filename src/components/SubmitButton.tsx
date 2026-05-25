"use client";

import { useFormStatus } from "react-dom";

// Bolinha girando (usa a cor atual do texto do botão).
function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

// Botão de submit que mostra "bolinha girando" enquanto a ação roda,
// dando resposta imediata ao toque.
export default function SubmitButton({
  children,
  pendingLabel,
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-70`}>
      {pending ? (
        <span className="inline-flex items-center justify-center gap-1.5">
          <Spinner />
          {pendingLabel ? <span>{pendingLabel}</span> : null}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
