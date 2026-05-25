import Link from "next/link";
import { addDias, hojeISO } from "@/lib/dates";
import SeletorDataInput from "./SeletorDataInput";

// Barra de seleção de dia: atalhos Hoje / Amanhã / Esta semana + calendário.
// diaSel = dia escolhido (AAAA-MM-DD) ou null quando está na vista "Esta semana".
export default function BarraDia({
  basePath,
  diaSel,
}: {
  basePath: string;
  diaSel: string | null;
}) {
  const hoje = hojeISO();
  const amanha = addDias(hoje, 1);

  const chip = (ativo: boolean) =>
    `whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
      ativo ? "bg-orange-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link href={`${basePath}?dia=${hoje}`} className={chip(diaSel === hoje)}>
        Hoje
      </Link>
      <Link href={`${basePath}?dia=${amanha}`} className={chip(diaSel === amanha)}>
        Amanhã
      </Link>
      <Link href={basePath} className={chip(diaSel === null)}>
        Esta semana
      </Link>
      <SeletorDataInput basePath={basePath} value={diaSel ?? hoje} />
    </div>
  );
}
