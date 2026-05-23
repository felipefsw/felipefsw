"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export default function GeoCapture({
  defaultLat = "",
  defaultLng = "",
}: {
  defaultLat?: string;
  defaultLng?: string;
}) {
  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);
  const [erro, setErro] = useState("");

  function usar() {
    setErro("");
    if (!navigator.geolocation) {
      setErro("Seu aparelho não permite localização.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLat(String(p.coords.latitude));
        setLng(String(p.coords.longitude));
      },
      () => setErro("Não foi possível obter a localização."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        Localização (para check-in por GPS)
      </label>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="latitude"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="latitude"
          className={inputClass}
        />
        <input
          name="longitude"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          placeholder="longitude"
          className={inputClass}
        />
      </div>
      <button
        type="button"
        onClick={usar}
        className="mt-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-gray-50"
      >
        📍 Usar localização atual (estando na loja)
      </button>
      {erro && <p className="mt-1 text-sm text-red-600">{erro}</p>}
    </div>
  );
}
