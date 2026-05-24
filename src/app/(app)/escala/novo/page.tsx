import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Card,
  EmptyState,
  PageHeader,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
} from "@/components/ui";
import { hojeISO, isISODate, maxAgendamentoISO } from "@/lib/dates";
import { VALORES_DIARIA } from "@/lib/valoresDiaria";
import { createEscala } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const sp = await searchParams;
  const hoje = hojeISO();
  const max = maxAgendamentoISO();
  const dataInicial =
    sp.data && isISODate(sp.data) && sp.data >= hoje && sp.data <= max ? sp.data : hoje;

  const [diaristas, lojas] = await Promise.all([
    prisma.diarista.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.loja.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  if (diaristas.length === 0 || lojas.length === 0) {
    return (
      <div>
        <PageHeader title="Novo agendamento" />
        <EmptyState>
          Para agendar, você precisa de pelo menos{" "}
          {diaristas.length === 0 && (
            <>
              uma <Link href="/diaristas/nova" className="font-medium text-orange-700 underline">diarista</Link>
            </>
          )}
          {diaristas.length === 0 && lojas.length === 0 && " e "}
          {lojas.length === 0 && (
            <>
              uma <Link href="/lojas/nova" className="font-medium text-orange-700 underline">loja</Link>
            </>
          )}{" "}
          cadastrada.
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Novo agendamento" subtitle="Quem trabalha, onde e quando" />
      <Card>
        <form action={createEscala} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="diaristaId">
              Diarista *
            </label>
            <select id="diaristaId" name="diaristaId" required className={inputClass}>
              {diaristas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="lojaId">
              Loja *
            </label>
            <select id="lojaId" name="lojaId" required className={inputClass}>
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="data">
                Data *
              </label>
              <input
                id="data"
                name="data"
                type="date"
                required
                min={hoje}
                max={max}
                defaultValue={dataInicial}
                className={inputClass}
              />
            </div>
            <div>
              <p className={labelClass}>Valor da diária (toque em um)</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                <label>
                  <input type="radio" name="valor" value="" defaultChecked className="peer sr-only" />
                  <span className="block cursor-pointer rounded-lg border border-gray-300 bg-white px-2 py-2 text-center text-xs font-medium text-gray-700 peer-checked:border-orange-600 peer-checked:bg-orange-50 peer-checked:text-orange-800 peer-checked:ring-2 peer-checked:ring-orange-300">
                    Padrão
                  </span>
                </label>
                {VALORES_DIARIA.map((v) => (
                  <label key={v.value}>
                    <input type="radio" name="valor" value={v.value} className="peer sr-only" />
                    <span className="block cursor-pointer rounded-lg border border-gray-300 bg-white px-2 py-2 text-center text-gray-700 peer-checked:border-orange-600 peer-checked:bg-orange-50 peer-checked:text-orange-800 peer-checked:ring-2 peer-checked:ring-orange-300">
                      <span className="block text-sm font-bold">R$ {v.total}</span>
                      <span className="block text-[10px] text-gray-500 peer-checked:text-orange-700">
                        {v.base}+10
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className={btnPrimary}>
              Agendar
            </button>
            <Link href="/escala" className={btnSecondary}>
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
