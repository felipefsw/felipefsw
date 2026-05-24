"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { uploadFotoDiarista } from "@/app/d/[token]/actions";

// Reduz a foto no próprio celular antes de enviar: fica leve, sobe rápido e não
// estoura o limite do servidor. Se algo der errado, envia a imagem original.
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

export default function FotoUpload({
  token,
  nome,
  fotoUrl,
}: {
  token: string;
  nome: string;
  fotoUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<"ok" | "erro" | null>(null);

  async function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    setEnviando(true);
    try {
      let envio: File = file;
      try {
        envio = await comprimir(file);
      } catch {
        // segue com o arquivo original se não der pra comprimir
      }
      const fd = new FormData();
      fd.set("token", token);
      fd.set("foto", envio);
      const r = await uploadFotoDiarista(fd);
      if (r?.ok) {
        setMsg("ok");
        router.refresh();
      } else {
        setMsg("erro");
      }
    } catch {
      setMsg("erro");
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-3">
        <Avatar nome={nome} fotoUrl={fotoUrl} className="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">Sua foto</p>
          <p className="text-xs text-gray-500">
            Ajuda o RH e as lojas a te reconhecerem. Toque para escolher ou tirar uma foto.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="shrink-0 rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {enviando ? "Enviando…" : fotoUrl ? "Trocar" : "Enviar"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={aoSelecionar}
        className="hidden"
      />
      {msg === "ok" && <p className="mt-2 text-xs font-medium text-green-700">✓ Foto atualizada!</p>}
      {msg === "erro" && (
        <p className="mt-2 text-xs font-medium text-red-600">
          Não foi possível enviar a foto. Tente de novo.
        </p>
      )}
    </div>
  );
}
