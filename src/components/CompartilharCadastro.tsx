"use client";

import { useState } from "react";

// Botao para RH/gestor/gerente convidar um diarista: manda o link do
// auto-cadastro pelo WhatsApp (ou copia o link).
export default function CompartilharCadastro() {
  const [fone, setFone] = useState("");
  const [copiado, setCopiado] = useState(false);

  function linkCadastro() {
    return `${window.location.origin}/sou-diarista`;
  }
  function mensagem() {
    return `Olá! Faça seu cadastro de diarista nas Pizzarias RWP por aqui (leva 1 minuto): ${linkCadastro()}`;
  }
  function enviarWhatsApp() {
    const dig = fone.replace(/\D/g, "");
    const numero = dig ? (dig.startsWith("55") ? dig : `55${dig}`) : "";
    const base = numero ? `https://wa.me/${numero}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(mensagem())}`, "_blank");
  }
  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkCadastro());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* alguns navegadores bloqueiam a copia automatica */
    }
  }

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-3">
      <p className="text-sm font-semibold text-green-800">Convidar diarista</p>
      <p className="mt-0.5 text-xs text-green-700">
        Mande o link pelo WhatsApp e a pessoa já se cadastra na hora (nome, sobrenome, CPF e data
        de nascimento).
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          value={fone}
          onChange={(e) => setFone(e.target.value)}
          inputMode="numeric"
          placeholder="WhatsApp do diarista (opcional)"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />
        <button
          type="button"
          onClick={enviarWhatsApp}
          className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          📲 Enviar no WhatsApp
        </button>
        <button
          type="button"
          onClick={copiarLink}
          className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {copiado ? "Link copiado!" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}
