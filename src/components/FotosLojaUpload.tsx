"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adicionarFotoLoja, removerFotoLoja } from "@/app/loja/actions";

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
          resolve(new File([blob], "loja.jpg", { type: "image/jpeg" }));
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

export default function FotosLojaUpload({ fotos }: { fotos: string[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [removendo, startRemover] = useTransition();

  async function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setErro(null);
    setEnviando(true);

    const restantes = Math.max(0, 5 - fotos.length);
    const aEnviar = files.slice(0, restantes);
    try {
      for (const file of aEnviar) {
        let envio: File = file;
        try {
          envio = await comprimir(file);
        } catch {
          /* usa original */
        }
        const fd = new FormData();
        fd.set("foto", envio);
        const r = await adicionarFotoLoja(fd);
        if (!r?.ok) {
          setErro(r?.erro ?? "Não foi possível enviar uma das fotos.");
          break;
        }
      }
      if (files.length > restantes) setErro("Máximo de 5 fotos — algumas não foram enviadas.");
    } catch {
      setErro("Não foi possível enviar as fotos.");
    } finally {
      setEnviando(false);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {fotos.map((url) => (
          <div key={url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Foto da loja" className="h-20 w-20 rounded-lg object-cover" />
            <button
              type="button"
              disabled={removendo}
              onClick={() =>
                startRemover(async () => {
                  await removerFotoLoja(url);
                  router.refresh();
                })
              }
              aria-label="Remover foto"
              className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow"
            >
              ✕
            </button>
          </div>
        ))}

        {fotos.length < 5 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
            className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 text-xs font-medium text-orange-700 disabled:opacity-60"
          >
            {enviando ? "Enviando…" : "+ Foto"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={aoSelecionar}
        className="hidden"
      />
      <p className="mt-1 text-xs text-gray-400">
        Até 5 fotos do ambiente — pode escolher várias de uma vez. Toque no ✕ para remover.
      </p>
      {erro && <p className="mt-1 text-xs font-medium text-red-600">{erro}</p>}
    </div>
  );
}
