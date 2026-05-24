"use client";

import { useState } from "react";
import MapaLojas, { type PontoLoja } from "./MapaLojas";

// Mostra um mapa com as lojas que têm diária disponível, perto da pessoa.
// Só pede a localização quando ela toca no botão.
export default function MapaDiariasPerto({ lojas }: { lojas: PontoLoja[] }) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [estado, setEstado] = useState<"inicial" | "carregando" | "negado" | "indisponivel">(
    "inicial",
  );

  function pedirLocal() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setEstado("indisponivel");
      return;
    }
    setEstado("carregando");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setEstado("inicial");
      },
      () => setEstado("negado"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (lojas.length === 0) return null;

  if (pos) {
    return (
      <div className="mb-3">
        <MapaLojas eu={pos} lojas={lojas} />
        <p className="mt-1 text-center text-xs text-gray-400">
          🟧 lojas com diária · 🔵 você
        </p>
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-xl border border-gray-200 bg-white p-4 text-center">
      <p className="text-sm text-gray-600">Veja no mapa as lojas com diária perto de você.</p>
      <button
        type="button"
        onClick={pedirLocal}
        disabled={estado === "carregando"}
        className="mt-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {estado === "carregando" ? "Buscando localização…" : "📍 Liberar localização e ver mapa"}
      </button>
      {estado === "negado" && (
        <p className="mt-2 text-xs text-amber-700">
          Você não permitiu a localização. Toque de novo e permita o acesso.
        </p>
      )}
      {estado === "indisponivel" && (
        <p className="mt-2 text-xs text-amber-700">Seu aparelho não permite compartilhar a localização.</p>
      )}
    </div>
  );
}
