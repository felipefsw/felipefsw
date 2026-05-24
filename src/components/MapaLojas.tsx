"use client";

import { useEffect, useRef, useState } from "react";

export type PontoLoja = { id: string; nome: string; lat: number; lng: number };

const CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function carregarLeaflet(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve();

    if (!document.querySelector(`link[data-leaflet]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS;
      link.dataset.leaflet = "1";
      document.head.appendChild(link);
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[data-leaflet]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("leaflet")));
      if (window.L) resolve();
      return;
    }

    const s = document.createElement("script");
    s.src = JS;
    s.async = true;
    s.dataset.leaflet = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("leaflet"));
    document.body.appendChild(s);
  });
}

export default function MapaLojas({
  eu,
  lojas,
}: {
  eu: { lat: number; lng: number };
  lojas: PontoLoja[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let map: LeafletMap | null = null;
    let cancelado = false;

    carregarLeaflet()
      .then(() => {
        const L = window.L;
        if (cancelado || !L || !ref.current) return;

        map = L.map(ref.current, { scrollWheelZoom: false }).setView([eu.lat, eu.lng], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);

        L.circleMarker([eu.lat, eu.lng], {
          radius: 8,
          color: "#1d4ed8",
          weight: 2,
          fillColor: "#3b82f6",
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup("Você está aqui");

        const pontos: [number, number][] = [[eu.lat, eu.lng]];
        for (const lo of lojas) {
          L.circleMarker([lo.lat, lo.lng], {
            radius: 8,
            color: "#c2410c",
            weight: 2,
            fillColor: "#ea580c",
            fillOpacity: 0.9,
          })
            .addTo(map)
            .bindPopup(lo.nome);
          pontos.push([lo.lat, lo.lng]);
        }

        if (pontos.length > 1) {
          map.fitBounds(pontos, { padding: [30, 30] });
        }
      })
      .catch(() => {
        if (!cancelado) setErro(true);
      });

    return () => {
      cancelado = true;
      map?.remove();
    };
  }, [eu, lojas]);

  if (erro) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 bg-white p-3 text-center text-sm text-gray-500">
        Não foi possível carregar o mapa agora. A lista abaixo já está ordenada da loja mais perto
        para a mais longe.
      </p>
    );
  }

  return <div ref={ref} className="h-64 w-full overflow-hidden rounded-xl border border-gray-200" />;
}
