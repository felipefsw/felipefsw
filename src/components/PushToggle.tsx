"use client";

import { useEffect, useState } from "react";
import { salvarPushSubscription } from "@/app/d/[token]/actions";

const PUB = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function PushToggle({ token }: { token: string }) {
  const [estado, setEstado] = useState<"oculto" | "ativo" | "inativo" | "erro">("oculto");

  useEffect(() => {
    if (
      !PUB ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setEstado(sub ? "ativo" : "inativo");
    });
  }, []);

  async function ativar() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setEstado("erro");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUB!) as BufferSource,
      });
      const j = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      await salvarPushSubscription(token, j.endpoint ?? "", j.keys?.p256dh ?? "", j.keys?.auth ?? "");
      setEstado("ativo");
    } catch {
      setEstado("erro");
    }
  }

  if (estado === "oculto") return null;

  if (estado === "ativo") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
        🔔 Avisos de diária ativados neste aparelho.
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={ativar}
      className="w-full rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800"
    >
      🔔 Ativar avisos de diária
      {estado === "erro" && (
        <span className="mt-1 block text-xs font-normal text-red-600">
          Não foi possível ativar. Permita notificações no navegador.
        </span>
      )}
    </button>
  );
}
