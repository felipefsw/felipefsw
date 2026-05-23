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
import { hojeISO, maxAgendamentoISO } from "@/lib/dates";
import { FUNCOES } from "@/lib/funcoes";
import FuncaoValor from "@/components/FuncaoValor";
import { createRequisicao } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovaRequisicaoPage() {
  const [lojas, valores, diaristas] = await Promise.all([
    prisma.loja.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.valorFuncao.findMany(),
    prisma.diarista.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);
  const mapaValores = Object.fromEntries(valores.map((v) => [v.funcao, v.valor]));

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
                min={hojeISO()}
                max={maxAgendamentoISO()}
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

          <FuncaoValor funcoes={FUNCOES} valores={mapaValores} />

          <div>
            <p className={labelClass}>Convidar diaristas (opcional)</p>
            <p className="mb-2 -mt-0.5 text-xs text-gray-400">
              A vaga continua aberta a todos; os convidados são avisados e aparecem em destaque.
            </p>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <select key={i} name={`convidado${i}`} defaultValue="" className={inputClass}>
                  <option value="">— ninguém —</option>
                  {diaristas.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </select>
              ))}
            </div>
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
