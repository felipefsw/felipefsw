"use client";

import { useEffect, useState } from "react";
import { distanciaMetros } from "@/lib/geo";
import { formatBRL, formatDateWithWeekday } from "@/lib/format";
import { corDoTurno } from "@/lib/horarios";
import MarcaBadge from "./MarcaBadge";
import MapaLojas, { type PontoLoja } from "./MapaLojas";
import SubmitButton from "./SubmitButton";
import CopyButton from "./CopyButton";
import { inscreverNaDiaria } from "@/app/d/[token]/actions";

export type ItemPerto = {
  id: string;
  lojaId: string;
  lojaNome: string;
  endereco: string;
  lat: number | null;
  lng: number | null;
  data: string;
  horaInicio: string;
  horaFim: string;
  valorDiaria: number;
  funcao: string | null;
  inscrito: boolean;
};

type Estado = "carregando" | "ok" | "negado" | "indisponivel";

function distLabel(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1).replace(".", ",")} km de você`;
}

export default function PertoDeMim({ token, itens }: { token: string; itens: ItemPerto[] }) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [estado, setEstado] = useState<Estado>("carregando");

  function pedirLocal() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setEstado("indisponivel");
      return;
    }
    setEstado("carregando");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setEstado("ok");
      },
      () => setEstado("negado"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEstado("indisponivel");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setEstado("ok");
      },
      () => setEstado("negado"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const comDist = itens.map((it) => ({
    it,
    dist:
      pos && it.lat != null && it.lng != null
        ? distanciaMetros(pos.lat, pos.lng, it.lat, it.lng)
        : null,
  }));
  comDist.sort((a, b) => {
    if (a.dist == null && b.dist == null) return a.it.data.localeCompare(b.it.data);
    if (a.dist == null) return 1;
    if (b.dist == null) return -1;
    return a.dist - b.dist;
  });

  const vistos = new Set<string>();
  const pontos: PontoLoja[] = [];
  for (const { it } of comDist) {
    if (it.lat != null && it.lng != null && !vistos.has(it.lojaId)) {
      vistos.add(it.lojaId);
      pontos.push({ id: it.lojaId, nome: it.lojaNome, lat: it.lat, lng: it.lng });
    }
  }

  return (
    <div className="space-y-4">
      {estado === "carregando" && (
        <p className="rounded-xl border border-gray-200 bg-white p-3 text-center text-sm text-gray-600">
          📍 Buscando sua localização… Permita o acesso quando o navegador perguntar.
        </p>
      )}

      {estado === "negado" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p>
            Para ver as lojas mais perto de você, precisamos da sua localização. A lista abaixo está
            ordenada por data por enquanto.
          </p>
          <button
            type="button"
            onClick={pedirLocal}
            className="mt-2 rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700"
          >
            Permitir localização
          </button>
        </div>
      )}

      {estado === "indisponivel" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Seu aparelho não permite compartilhar a localização. A lista abaixo está ordenada por data.
        </p>
      )}

      {estado === "ok" && pos && pontos.length > 0 && <MapaLojas eu={pos} lojas={pontos} />}

      {itens.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
          Nenhuma diária disponível no momento.
        </div>
      ) : (
        <ul className="space-y-3">
          {comDist.map(({ it, dist }) => {
            const turno = corDoTurno(it.horaInicio);
            return (
              <li key={it.id} className={`rounded-xl border p-4 shadow-sm ${turno.card}`}>
                <div className="flex items-center gap-2">
                  <MarcaBadge nome={it.lojaNome} className="h-7 w-7 shrink-0 rounded" />
                  <p className="font-medium text-gray-900">{it.lojaNome}</p>
                  {dist != null && (
                    <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-gray-700">
                      {distLabel(dist)}
                    </span>
                  )}
                </div>
                {it.endereco && <p className="mt-0.5 text-sm text-gray-500">{it.endereco}</p>}
                <p className="mt-1 text-sm capitalize text-gray-600">
                  {formatDateWithWeekday(it.data)} · {it.horaInicio}–{it.horaFim}
                </p>
                <p className="text-sm text-gray-600">
                  {formatBRL(it.valorDiaria)}
                  {it.funcao ? ` · ${it.funcao}` : ""}
                </p>

                {it.endereco && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <CopyButton
                      text={it.endereco}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                    />
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(it.endereco)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      📍 Siga até a loja
                    </a>
                  </div>
                )}

                <div className="mt-3">
                  {it.inscrito ? (
                    <span className="flex-1 rounded-xl bg-green-100 py-2 text-center text-sm font-semibold text-green-700">
                      ✓ Solicitação já enviada
                    </span>
                  ) : (
                    <form action={inscreverNaDiaria}>
                      <input type="hidden" name="token" value={token} />
                      <input type="hidden" name="requisicaoId" value={it.id} />
                      <SubmitButton
                        pendingLabel="Enviando…"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-base font-bold text-white shadow-sm hover:bg-orange-700"
                      >
                        ✓ Quero trabalhar aqui!
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
