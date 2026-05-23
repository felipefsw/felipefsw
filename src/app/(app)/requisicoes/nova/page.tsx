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
import { hojeISO } from "@/lib/dates";
import { FUNCOES } from "@/lib/funcoes";
import { createRequisicao } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovaRequisicaoPage() {
  const lojas = await prisma.loja.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  if (lojas.length === 0) {
    return (
      <div>
        <PageHeader title="Nova requisição" />
        <EmptyState>
          Cadastre uma{" "}
          <Link href="/lojas/nova" className="font-medium text-teal-700 underline">
            loja
          </Link>{" "}
          antes de criar uma requisição.
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Nova requisição" subtitle="A loja pede diaristas para um dia" />
      <Card>
        <form action={createRequisicao} className="space-y-4">
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
                defaultValue={hojeISO()}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="quantidade">
                Quantidade *
              </label>
              <input
                id="quantidade"
                name="quantidade"
                type="number"
                min={1}
                required
                defaultValue={1}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="horaInicio">
                Início *
              </label>
              <input
                id="horaInicio"
                name="horaInicio"
                type="time"
                required
                defaultValue="18:00"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="horaFim">
                Fim *
              </label>
              <input
                id="horaFim"
                name="horaFim"
                type="time"
                required
                defaultValue="23:00"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="valorDiaria">
              Valor da diária (R$) *
            </label>
            <input
              id="valorDiaria"
              name="valorDiaria"
              inputMode="decimal"
              required
              placeholder="ex.: 120,00"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="funcao">
              Função (opcional)
            </label>
            <select id="funcao" name="funcao" defaultValue="" className={inputClass}>
              <option value="">— Qualquer —</option>
              {FUNCOES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="observacoes">
              Observações (opcional)
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              rows={3}
              placeholder="Ex.: turno da noite, evento, etc."
              className={inputClass}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className={btnPrimary}>
              Criar requisição
            </button>
            <Link href="/requisicoes" className={btnSecondary}>
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
