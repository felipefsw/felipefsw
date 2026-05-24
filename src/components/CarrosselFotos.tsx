"use client";

import { useEffect, useState } from "react";

// Carrossel simples que troca as fotos sozinho (sem precisar clicar).
export default function CarrosselFotos({ fotos }: { fotos: string[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (fotos.length <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % fotos.length), 3000);
    return () => clearInterval(t);
  }, [fotos.length]);

  if (fotos.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {fotos.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt="Foto da loja"
            className="h-40 w-full shrink-0 object-cover"
            style={{ flex: "0 0 100%" }}
          />
        ))}
      </div>
      {fotos.length > 1 && (
        <div className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1.5">
          {fotos.map((_, k) => (
            <span
              key={k}
              className={`h-1.5 w-1.5 rounded-full ${k === i ? "bg-white" : "bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
