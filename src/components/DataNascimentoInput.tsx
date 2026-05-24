"use client";

import { useState } from "react";

// Campo de data de nascimento digitado (sem calendário). A pessoa digita só
// números e a máscara DD/MM/AAAA é aplicada; envia em ISO (AAAA-MM-DD) num
// campo oculto chamado "dataNascimento".
export default function DataNascimentoInput({ className }: { className?: string }) {
  const [valor, setValor] = useState("");

  function aoDigitar(e: React.ChangeEvent<HTMLInputElement>) {
    const d = e.target.value.replace(/\D/g, "").slice(0, 8);
    let m = d;
    if (d.length > 4) m = `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
    else if (d.length > 2) m = `${d.slice(0, 2)}/${d.slice(2)}`;
    setValor(m);
  }

  const dig = valor.replace(/\D/g, "");
  const iso = dig.length === 8 ? `${dig.slice(4)}-${dig.slice(2, 4)}-${dig.slice(0, 2)}` : "";

  return (
    <>
      <input
        inputMode="numeric"
        value={valor}
        onChange={aoDigitar}
        placeholder="DD/MM/AAAA"
        className={className}
      />
      <input type="hidden" name="dataNascimento" value={iso} />
    </>
  );
}
