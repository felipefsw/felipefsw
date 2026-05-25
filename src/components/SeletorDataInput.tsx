"use client";

import { useRouter } from "next/navigation";

// Input de data (calendário nativo) que navega para ?dia=AAAA-MM-DD ao escolher.
export default function SeletorDataInput({
  basePath,
  value,
}: {
  basePath: string;
  value: string;
}) {
  const router = useRouter();
  return (
    <input
      type="date"
      defaultValue={value}
      onChange={(e) => {
        const v = e.target.value;
        if (v) router.push(`${basePath}?dia=${v}`);
      }}
      aria-label="Escolher dia no calendário"
      className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
    />
  );
}
