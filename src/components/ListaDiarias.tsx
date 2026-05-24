"use client";

import { Fragment, useState } from "react";
import { distanciaMetros } from "@/lib/geo";
import { formatBRL, formatDateWithWeekday } from "@/lib/format";
import { corDoTurno } from "@/lib/horarios";
import { corDaFuncao } from "@/lib/funcoesCor";
import MarcaBadge from "./MarcaBadge";
import CopyButton from "./CopyButton";
import SubmitButton from "./SubmitButton";
import { inscreverNaDiaria } from "@/app/d/[token]/actions";

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
};

type Ordem = "marca" | "valor" | "distancia" | "horas" | "horario" | "nota";

const FILTROS: { key: Ordem; label: string }[] = [
  { key: "marca", label: "Marca" },
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
        className={`rounded-xl border p-3 shadow-sm ${fcor.bg} ${
          it.convidado ? "border-amber-400" : fcor.border
        }`}
      >
        {it.convidado && (
          <p className="mb-1 text-xs font-semibold text-amber-700">⭐ Você foi convidado</p>
        )}
        <div className="flex items-center gap-2">
          <MarcaBadge nome={it.lojaNome} className="h-6 w-6 shrink-0 rounded" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
            {it.lojaNome}
          </p>
          {mostrarDist && d != null && (
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
              {distLabel(d)}
            </span>
          )}
        </div>
        {(it.bairroCidade || it.rua) && (
          <p className="truncate text-xs text-gray-500">
            {[it.rua, it.bairroCidade].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="mt-1 text-sm capitalize text-gray-700">
          {formatDateWithWeekday(it.data)} ·{" "}
          <span className={`rounded px-1.5 py-0.5 font-medium ${turno.chip}`}>
            {it.horaInicio}–{it.horaFim}
          </span>
        </p>
        <p className="text-sm font-semibold text-gray-900">
          {formatBRL(it.valor)}
          {it.funcao ? <span className="font-normal text-gray-600"> · {it.funcao}</span> : null}
          {it.nota != null ? (
            <span className="font-normal text-gray-500"> · ★ {it.nota.toFixed(1)}</span>
          ) : null}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {it.inscrito ? (
            <span className="text-sm font-medium text-orange-600">✓ inscrição enviada</span>
          ) : (
            <form action={inscreverNaDiaria} className="flex-1">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="requisicaoId" value={it.id} />
              <SubmitButton
                pendingLabel="Enviando…"
                className="flex w-full items-center justify-center gap-1 rounded-xl bg-orange-600 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-700"
              >
                ✓ Quero trabalhar aqui!
              </SubmitButton>
            </form>
          )}
          {it.enderecoCompleto && (
            <>
              <CopyButton
                text={it.enderecoCompleto}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700"
              />
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(it.enderecoCompleto)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white"
              >
                📍 Ir
              </a>
            </>
          )}
        </div>
      </li>
    );
  }

  return (
    <div>
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
