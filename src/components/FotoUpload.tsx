"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFotoDiarista } from "@/app/d/[token]/actions";

// Reduz a foto no próprio celular antes de enviar. Se algo falhar, envia a original.
function comprimir(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 1280;
      let { width, height } = img;
      if (width > max || height > max) {
        const escala = Math.min(max / width, max / height);
        width = Math.round(width * escala);
        height = Math.round(height * escala);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("sem canvas"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("sem blob"));
          resolve(new File([blob], "foto.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.82,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("imagem inválida"));
    };
    img.src = url;
  });
}

export default function FotoUpload({ token }: { token: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(null);
    setEnviando(true);
    try {
      let envio: File = file;
      try {
        envio = await comprimir(file);
      } catch {
        /* usa o original */
      }
      const fd = new FormData();
      fd.set("token", token);
      fd.set("foto", envio);
      const r = await uploadFotoDiarista(fd);
      if (r?.ok) {
        setMsg("✓ Foto atualizada!");
        router.refresh();
      } else {
        setMsg(r?.erro ?? "Não foi possível enviar.");
      }
    } catch {
      setMsg("Não foi possível enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={enviando}
        className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20 disabled:opacity-60"
      >
        {enviando ? "Enviando…" : "📷 Foto"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={aoSelecionar}
        className="hidden"
      />
      {msg && <span className="ml-2 text-[11px] text-orange-100">{msg}</span>}
    </>
  );
}
