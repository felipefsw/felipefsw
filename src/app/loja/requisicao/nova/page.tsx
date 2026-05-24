import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  PageHeader,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
} from "@/components/ui";
import { hojeISO, maxAgendamentoISO } from "@/lib/dates";
import { FUNCOES } from "@/lib/funcoes";
import { opcoesHoraFim } from "@/lib/horariosOpcoes";
import FuncaoValor from "@/components/FuncaoValor";
import { contextoLoja, getSessao } from "@/lib/auth";
import { criarRequisicaoLoja } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NovaRequisicaoLojaPage() {
  const sessao = await getSessao();
  const ctx = contextoLoja(sessao);
  if (!ctx) redirect("/entrar");

  const diaristas = await prisma.diarista.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  // Gestor escolhe a loja; loja avulsa já está fixa.
  const lojasDoGestor =
    sessao?.tipo === "gestor"
      ? await prisma.loja.findMany({
          where: { gestorId: sessao.gestorId, ativo: true },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true },
        })
      : [];

  return (
    <div>
      <PageHeader title="Solicitar diaristas" subtitle="Para um dia e horário" />
      <Card>
        <form action={criarRequisicaoLoja} className="space-y-4">
          {lojasDoGestor.length > 0 && (
            <div>
              <label className={labelClass} htmlFor="lojaId">
                Loja *
              </label>
              <select
                id="lojaId"
                name="lojaId"
                required
                defaultValue={ctx.lojaId}
                className={inputClass}
              >
                {lojasDoGestor.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              <select id="horaFim" name="horaFim" required defaultValue="23:00" className={inputClass}>
                {opcoesHoraFim().map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <FuncaoValor funcoes={FUNCOES} />

          <div>
            <p className={labelClass}>Convidar diaristas (opcional)</p>
            <p className="mb-2 -mt-0.5 text-xs text-gray-400">
              A vaga fica aberta a todos; os convidados são avisados e aparecem em destaque.
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
            <textarea id="observacoes" name="observacoes" rows={3} className={inputClass} />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className={btnPrimary}>
              Enviar solicitação
            </button>
            <Link href="/loja" className={btnSecondary}>
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
