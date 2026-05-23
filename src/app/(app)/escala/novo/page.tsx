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
import { hojeISO, isISODate } from "@/lib/dates";
import { createEscala } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const sp = await searchParams;
  const dataInicial = sp.data && isISODate(sp.data) ? sp.data : hojeISO();

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
              uma <Link href="/diaristas/nova" className="font-medium text-teal-700 underline">diarista</Link>
            </>
          )}
          {diaristas.length === 0 && lojas.length === 0 && " e "}
          {lojas.length === 0 && (
            <>
              uma <Link href="/lojas/nova" className="font-medium text-teal-700 underline">loja</Link>
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
                defaultValue={dataInicial}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="valor">
                Valor da diária (R$)
              </label>
              <input
                id="valor"
                name="valor"
                inputMode="decimal"
                placeholder="usa o valor padrão da diarista"
                className={inputClass}
              />
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
