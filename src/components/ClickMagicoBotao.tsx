"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clickMagico, type ResultadoMagico } from "@/app/(app)/requisicoes/actions";
import { formatDateShort } from "@/lib/format";

function montarTextoGrupo(itens: ResultadoMagico["itens"]): string {
  const linhas: string[] = ["📋 *Diaristas convocados*", ""];
  for (const it of itens) {
    const cabecalho =
      `*${it.loja}* — ${formatDateShort(it.data)} · ${it.horaInicio} às ${it.horaFim}` +
      (it.funcao ? ` · ${it.funcao}` : "");
    linhas.push(cabecalho);
    for (const nome of it.nomes) linhas.push(`• ${nome}`);
    linhas.push("");
  }
  linhas.push("Confirmem a presença no app, por favor. 🙏");
  return linhas.join("\n").trim();
}

export default function ClickMagicoBotao() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [res, setRes] = useState<ResultadoMagico | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function rodar() {
    setPending(true);
    try {
      const r = await clickMagico();
      setRes(r);
      setCopiado(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function copiar() {
    if (!res) return;
    const texto = montarTextoGrupo(res.itens);
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = texto;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* sem suporte */
      }
      document.body.removeChild(ta);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div>
      <button
        type="button"
        onClick={rodar}
        disabled={pending}
        className="w-full rounded-xl bg-orange-600 px-4 py-3 text-center text-base font-bold text-white shadow-sm hover:bg-orange-700 disabled:opacity-60"
      >
        {pending ? "Convocando…" : "✨ Click mágico — convocar os melhores para cada vaga"}
      </button>

      {res && (
        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3">
          <p className="text-sm font-semibold text-green-800">
            ✨ {res.total} convocação(ões) enviada(s) em {res.itens.length} vaga(s).
          </p>
          {res.total === 0 ? (
            <p className="mt-1 text-xs text-green-800">
              Nenhuma vaga aberta para preencher (ou ninguém livre/elegível no dia).
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {res.itens.map((it, i) => (
                <li key={i} className="rounded-lg bg-white/70 p-2 text-sm">
                  <p className="font-medium text-gray-900">
                    {it.loja}
                    <span className="font-normal text-gray-500">
                      {" · "}
                      {it.funcao ?? "qualquer"} · {formatDateShort(it.data)} · {it.horaInicio}–
                      {it.horaFim} · {it.nomes.length} pessoa(s)
                    </span>
                  </p>
                  <p className="text-xs text-gray-600">Convocados: {it.nomes.join(", ")}</p>
                </li>
              ))}
            </ul>
          )}
          {res.itens.length > 0 && (
            <button
              type="button"
              onClick={copiar}
              className="mt-3 w-full rounded-lg border border-green-600 bg-white px-3 py-2 text-sm font-semibold text-green-800 hover:bg-green-100"
            >
              {copiado ? "✅ Copiado! Cole no grupo" : "📋 Copiar lista para o grupo"}
            </button>
          )}
          <p className="mt-2 text-[11px] text-green-700">
            Os diaristas vão aceitar pelo app. Acompanhe em cada requisição.
          </p>
        </div>
      )}
    </div>
  );
}
