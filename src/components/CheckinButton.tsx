"use client";

import { useRef, useState } from "react";

export default function CheckinButton({
  action,
  token,
  escalaId,
}: {
  action: (formData: FormData) => void;
  token: string;
  escalaId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function checkin() {
    setErro("");
    if (!navigator.geolocation) {
      setErro("Seu aparelho não permite localização.");
      return;
    }
    setCarregando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (latRef.current) latRef.current.value = String(pos.coords.latitude);
        if (lngRef.current) lngRef.current.value = String(pos.coords.longitude);
        formRef.current?.requestSubmit();
      },
      () => {
        setCarregando(false);
        setErro("Precisamos da sua localização para o check-in. Permita o acesso e tente de novo.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <form action={action} ref={formRef} className="mt-3">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="escalaId" value={escalaId} />
      <input type="hidden" name="lat" ref={latRef} />
      <input type="hidden" name="lng" ref={lngRef} />
      <button
        type="button"
        onClick={checkin}
        disabled={carregando}
        className="w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-60"
      >
        {carregando ? "Obtendo localização…" : "📍 Fazer check-in"}
      </button>
      {erro && <p className="mt-1 text-sm text-red-600">{erro}</p>}
    </form>
  );
}
