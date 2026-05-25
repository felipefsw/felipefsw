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
  const anteontem = addDias(hoje, -2);
  const ontem = addDias(hoje, -1);
  const amanha = addDias(hoje, 1);
  const depoisAmanha = addDias(hoje, 2);

  const chip = (ativo: boolean) =>
    `whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
      ativo ? "bg-orange-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  const atalhos: { label: string; dia: string }[] = [
    { label: "Anteontem", dia: anteontem },
    { label: "Ontem", dia: ontem },
    { label: "Hoje", dia: hoje },
    { label: "Amanhã", dia: amanha },
    { label: "Depois de amanhã", dia: depoisAmanha },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {atalhos.map((a) => (
        <Link key={a.label} href={`${basePath}?dia=${a.dia}`} className={chip(diaSel === a.dia)}>
          {a.label}
        </Link>
      ))}
      <Link href={basePath} className={chip(diaSel === null)}>
        Esta semana
      </Link>
      <SeletorDataInput basePath={basePath} value={diaSel ?? hoje} />
    </div>
  );
}
