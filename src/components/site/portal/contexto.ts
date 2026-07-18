"use client";

/*
  Contexto global do portal (marca/loja/período). Persiste no localStorage e
  sincroniza entre as telas — demonstra a recomendação nº 1 da auditoria:
  "persistir marca, loja, regional e período entre módulos".

  Usa useSyncExternalStore (padrão do React para lojas externas), com um cache
  do snapshot para manter a referência estável entre renders.
*/
import { useSyncExternalStore } from "react";
import { LOJAS_DEMO } from "@/lib/site/portal";

const CHAVE = "rwp-portal-contexto";
const EVENTO = "rwp-contexto";

export type Contexto = { lojaId: string; periodo: string };
const PADRAO: Contexto = { lojaId: LOJAS_DEMO[0].id, periodo: "7d" };

export const PERIODOS = [
  { valor: "hoje", rotulo: "Hoje" },
  { valor: "7d", rotulo: "7 dias" },
  { valor: "30d", rotulo: "30 dias" },
];

let cacheRaw: string | null = null;
let cacheObj: Contexto = PADRAO;

function getSnapshot(): Contexto {
  if (typeof window === "undefined") return PADRAO;
  const raw = window.localStorage.getItem(CHAVE);
  if (raw === cacheRaw) return cacheObj; // referência estável quando nada mudou
  cacheRaw = raw;
  if (!raw) {
    cacheObj = PADRAO;
    return cacheObj;
  }
  try {
    const p = JSON.parse(raw) as Partial<Contexto>;
    cacheObj = { lojaId: p.lojaId ?? PADRAO.lojaId, periodo: p.periodo ?? PADRAO.periodo };
  } catch {
    cacheObj = PADRAO;
  }
  return cacheObj;
}

function getServerSnapshot(): Contexto {
  return PADRAO;
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENTO, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENTO, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useContexto() {
  const ctx = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function atualizar(parcial: Partial<Contexto>) {
    const novo = { ...getSnapshot(), ...parcial };
    window.localStorage.setItem(CHAVE, JSON.stringify(novo));
    cacheRaw = null; // força releitura no próximo snapshot
    window.dispatchEvent(new Event(EVENTO));
  }

  return { ctx, atualizar };
}
