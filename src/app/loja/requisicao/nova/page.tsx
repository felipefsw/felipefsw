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
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/SubmitButton";
import { contextoLoja, getSessao } from "@/lib/auth";
import { convocarDiarista, criarRequisicaoLoja } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NovaRequisicaoLojaPage() {
  const sessao = await getSessao();
  const ctx = contextoLoja(sessao);
  if (!ctx) redirect("/entrar");

  const diaristas = await prisma.diarista.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      funcao: true,
      fotoUrl: true,
      _count: { select: { escalas: { where: { presenca: "PRESENTE" } } } },
    },
  });

  // Sugestões: top 5 diaristas de cada função (quem mais trabalhou).
  const sugestoesPorFuncao = FUNCOES.map((f) => ({
    funcao: f,
    lista: diaristas
      .filter((d) => d.funcao === f)
      .sort((a, b) => b._count.escalas - a._count.escalas)
      .slice(0, 5),
  })).filter((g) => g.lista.length > 0);

  // Gestor escolhe a loja; loja avulsa já está fixa.
  const lojasDoGestor =
    sessao?.tipo === "gestor"
      ? await prisma.loja.findMany({
          where: { gestores: { some: { id: sessao.gestorId } }, ativo: true },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true },
        })
      : [];

  return (
    <div className="space-y-4">
      <PageHeader title="Solicitar diaristas" subtitle="Para um dia e horário" />

      {sugestoesPorFuncao.length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-900">💡 Sugestões</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Os que mais trabalham, por função. Você pode convocar direto (escolha a data). Quem já
            tem diária no dia não é convocado.
          </p>
          <div className="mt-2 space-y-2">
            {sugestoesPorFuncao.map((g) => (
              <details key={g.funcao} className="rounded-lg border border-gray-200">
                <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-800">
                  {g.funcao} ({g.lista.length})
                </summary>
                <ul className="divide-y divide-gray-100 px-3 pb-2">
                  {g.lista.map((d, i) => (
                    <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="w-4 text-center text-xs font-bold text-gray-400">
                          {i + 1}
                        </span>
                        <Avatar nome={d.nome} fotoUrl={d.fotoUrl} className="h-8 w-8" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-900">
                            {d.nome}
                          </span>
                          <span className="block text-[11px] text-gray-500">
                            {d._count.escalas} diária(s)
                          </span>
                        </span>
                      </span>
                      <form action={convocarDiarista} className="flex shrink-0 items-center gap-1">
                        <input type="hidden" name="diaristaId" value={d.id} />
                        <input
                          type="date"
                          name="data"
                          required
                          min={hojeISO()}
                          max={maxAgendamentoISO()}
                          defaultValue={hojeISO()}
                          className="rounded-lg border border-gray-300 bg-white px-1.5 py-1 text-xs"
                        />
                        <SubmitButton
                          pendingLabel="…"
                          className="rounded-lg bg-orange-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-orange-800"
                        >
                          Convocar
                        </SubmitButton>
                      </form>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </Card>
      )}

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
