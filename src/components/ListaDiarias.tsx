"use client";

import { Fragment, useState } from "react";
import { distanciaMetros } from "@/lib/geo";
import { formatBRL, formatDateWithWeekday } from "@/lib/format";
import { corDoTurno } from "@/lib/horarios";
import { corDaFuncao } from "@/lib/funcoesCor";
import MarcaBadge from "./MarcaBadge";
import CopyButton from "./CopyButton";
import SubmitButton from "./SubmitButton";
import { alternarFavorita, desfazerInscricao, inscreverNaDiaria } from "@/app/d/[token]/actions";

export type DiariaItem = {
  id: string;
  lojaId: string;
  lojaNome: string;
  marcaLabel: string;
  marcaOrdem: number;
  rua: string;
  enderecoCompleto: string;
  bairroCidade: string;
  lat: number | null;
  lng: number | null;
  data: string;
  horaInicio: string;
  horaFim: string;
  valor: number;
  funcao: string | null;
  inscrito: boolean;
  convidado: boolean;
  nota: number | null;
  freq: number;
  favorita: boolean;
  podeDesfazer: boolean;
};

type Ordem = "marca" | "favoritas" | "frequencia" | "valor" | "distancia" | "horas" | "horario" | "nota";

const FILTROS: { key: Ordem; label: string }[] = [
  { key: "marca", label: "Marca" },
  { key: "favoritas", label: "❤️ Favoritas" },
  { key: "frequencia", label: "Frequência" },
  { key: "valor", label: "Valor" },
  { key: "distancia", label: "Distância" },
  { key: "horas", label: "Horas" },
  { key: "horario", label: "Horário" },
  { key: "nota", label: "Nota" },
];

function minutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function duracaoMin(ini: string, fim: string): number {
  const d = minutos(fim) - minutos(ini);
  return d <= 0 ? d + 1440 : d;
}

export default function ListaDiarias({ token, itens }: { token: string; itens: DiariaItem[] }) {
  const [ordem, setOrdem] = useState<Ordem>("marca");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);

  function escolher(key: Ordem) {
    setOrdem(key);
    if (key !== "distancia" || pos) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoMsg("Seu aparelho não compartilha localização.");
      return;
    }
    setGeoMsg("Buscando sua localização…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeoMsg(null);
      },
      () => setGeoMsg("Permita a localização para ordenar por distância."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const dist = (it: DiariaItem): number | null =>
    pos && it.lat != null && it.lng != null
      ? distanciaMetros(pos.lat, pos.lng, it.lat, it.lng)
      : null;

  const ordenados = [...itens];
  if (ordem === "valor") ordenados.sort((a, b) => b.valor - a.valor);
  else if (ordem === "favoritas")
    ordenados.sort(
      (a, b) => Number(b.favorita) - Number(a.favorita) || a.marcaOrdem - b.marcaOrdem,
    );
  else if (ordem === "frequencia")
    ordenados.sort((a, b) => b.freq - a.freq || a.marcaOrdem - b.marcaOrdem);
  else if (ordem === "horario") ordenados.sort((a, b) => minutos(a.horaInicio) - minutos(b.horaInicio));
  else if (ordem === "horas")
    ordenados.sort((a, b) => duracaoMin(b.horaInicio, b.horaFim) - duracaoMin(a.horaInicio, a.horaFim));
  else if (ordem === "nota") ordenados.sort((a, b) => (b.nota ?? -1) - (a.nota ?? -1));
  else if (ordem === "distancia")
    ordenados.sort((a, b) => {
      const da = dist(a);
      const db = dist(b);
      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    });
  else ordenados.sort((a, b) => a.marcaOrdem - b.marcaOrdem);

  function distLabel(m: number): string {
    return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`;
  }

  function card(it: DiariaItem, mostrarDist: boolean) {
    const turno = corDoTurno(it.horaInicio);
    const fcor = corDaFuncao(it.funcao);
    const d = dist(it);
    return (
      <li
        key={it.id}
        className={`rounded-lg border p-2.5 shadow-sm ${fcor.bg} ${
          it.convidado ? "border-amber-400" : fcor.border
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <MarcaBadge nome={it.lojaNome} className="h-5 w-5 shrink-0 rounded" />
              <span className="truncate text-sm font-semibold text-gray-900">{it.lojaNome}</span>
              {it.convidado && <span title="Você foi convidado">⭐</span>}
              {it.freq > 0 && (
                <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                  {it.freq}× aqui
                </span>
              )}
            </div>
            {(it.bairroCidade || it.rua) && (
              <p className="truncate text-[11px] text-gray-500">
                {[it.rua, it.bairroCidade].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="mt-0.5 text-xs capitalize text-gray-700">
              {formatDateWithWeekday(it.data)} ·{" "}
              <span className={`rounded px-1 py-0.5 font-medium ${turno.chip}`}>
                {it.horaInicio}–{it.horaFim}
              </span>{" "}
              · <span className="font-semibold">{formatBRL(it.valor)}</span>
              {it.funcao ? ` · ${it.funcao}` : ""}
              {it.nota != null ? ` · ★ ${it.nota.toFixed(1)}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <form action={alternarFavorita}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="lojaId" value={it.lojaId} />
              <button
                type="submit"
                title={it.favorita ? "Remover dos favoritos" : "Favoritar loja"}
                aria-label={it.favorita ? "Remover dos favoritos" : "Favoritar loja"}
                className="text-lg leading-none"
              >
                {it.favorita ? "❤️" : "🤍"}
              </button>
            </form>
            {mostrarDist && d != null && (
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                {distLabel(d)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-1.5 flex items-center gap-1.5">
          {it.inscrito ? (
            it.podeDesfazer ? (
              <form action={desfazerInscricao} className="flex-1">
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="requisicaoId" value={it.id} />
                <SubmitButton
                  pendingLabel="Desfazendo…"
                  className="w-full rounded-lg border border-red-300 bg-white py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  ↩︎ Desfazer solicitação
                </SubmitButton>
              </form>
            ) : (
              <span
                className="flex-1 rounded-lg bg-gray-100 py-1.5 text-center text-sm font-semibold text-gray-400"
                title="Faltam menos de 12h: não dá mais para desfazer."
              >
                ✓ Solicitação enviada
              </span>
            )
          ) : (
            <form action={inscreverNaDiaria} className="flex-1">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="requisicaoId" value={it.id} />
              <SubmitButton
                pendingLabel="Enviando…"
                className="w-full rounded-lg bg-orange-600 py-1.5 text-sm font-bold text-white hover:bg-orange-700"
              >
                ✓ Quero!
              </SubmitButton>
            </form>
          )}
          {it.enderecoCompleto && (
            <>
              <CopyButton
                text={it.enderecoCompleto}
                label="📋"
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700"
              />
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(it.enderecoCompleto)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-blue-600 px-2 py-1.5 text-xs font-medium text-white"
              >
                📍
              </a>
            </>
          )}
        </div>
      </li>
    );
  }

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-gray-600">Filtrar/ordenar vagas por:</p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => escolher(f.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              ordem === f.key
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-gray-300 bg-white text-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {ordem === "distancia" && geoMsg && (
        <p className="mb-2 text-xs text-amber-700">{geoMsg}</p>
      )}

      {itens.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
          Nenhuma diária disponível no momento.
        </div>
      ) : ordem === "marca" ? (
        <ul className="space-y-2">
          {ordenados.map((it, idx) => {
            const prev = idx > 0 ? ordenados[idx - 1].marcaLabel : null;
            return (
              <Fragment key={it.id}>
                {it.marcaLabel !== prev && (
                  <li className="pt-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    {it.marcaLabel}
                  </li>
                )}
                {card(it, false)}
              </Fragment>
            );
          })}
        </ul>
      ) : (
        <ul className="space-y-2">{ordenados.map((it) => card(it, ordem === "distancia"))}</ul>
      )}
    </div>
  );
}
