import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CabecalhoPainel, CardPainel, Pendencia, superficie } from "@/components/painel/ui";
import { formatDate } from "@/lib/format";
import { opsDateDeHoje, textoDaData } from "@/lib/painel/opsDate";
import { lerParametros, vigenciaEmTexto } from "@/lib/painel/parametros";
import { contextoPainel } from "@/lib/painel/sessao";

export const dynamic = "force-dynamic";

// Os módulos da seção 7 do book, na ordem dos sprints da seção 12.
const MODULOS = [
  { nome: "Enviar relatórios", descricao: "Saipos, iFood, ponto e cupom do CD", sprint: 1 },
  { nome: "Vendas 360", descricao: "Hora a hora, dia da semana e previsão", sprint: 1 },
  { nome: "Placar da semana", descricao: "Meta, presença, checklists e prêmio", sprint: 2 },
  { nome: "CMV diário", descricao: "Contagem, cupom e desvio por item", sprint: 3 },
  { nome: "Dashboard do dia", descricao: "Previsão ao vivo, massa e motoboys", sprint: 4 },
  { nome: "Escala", descricao: "Necessidade por hora e cenários", sprint: 5 },
  { nome: "Entregadores", descricao: "Acerto do período e rankings", sprint: 5 },
  { nome: "iFood 360", descricao: "Bruto, repasse, anúncios e promoções", sprint: 6 },
];

export default async function PainelHome() {
  const ctx = await contextoPainel();
  const hoje = opsDateDeHoje();
  const params = await lerParametros(ctx.storeId, hoje);

  const [loja, pessoas, itensDeChecklist, ingredientes, uploads] = await Promise.all([
    prisma.store.findUnique({
      where: { id: ctx.storeId },
      select: { name: true, city: true, address: true, brand: { select: { name: true } } },
    }),
    prisma.employee.count({ where: { storeId: ctx.storeId, active: true } }),
    prisma.checklistItem.count(),
    prisma.ingredient.count(),
    prisma.upload.count({ where: { storeId: ctx.storeId } }),
  ]);

  const pizzasPorPedido = params.valor("pizzas_per_order");

  return (
    <>
      <CabecalhoPainel
        titulo={loja?.name ?? ctx.lojaNome}
        subtitulo={`${loja?.brand?.name ?? "RWP"} · dia operacional ${formatDate(hoje)}`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <CardPainel>
          <p className="text-xs uppercase text-[var(--painel-texto-fraco)]">Equipe cadastrada</p>
          <p className="painel-numero text-3xl font-bold">{pessoas}</p>
        </CardPainel>
        <CardPainel>
          <p className="text-xs uppercase text-[var(--painel-texto-fraco)]">Relatórios enviados</p>
          <p className="painel-numero text-3xl font-bold">{uploads}</p>
        </CardPainel>
        <CardPainel>
          <p className="text-xs uppercase text-[var(--painel-texto-fraco)]">Réguas vigentes desde</p>
          <p className="painel-numero text-3xl font-bold">
            {vigenciaEmTexto(params.versao) ? formatDate(vigenciaEmTexto(params.versao)!) : "—"}
          </p>
        </CardPainel>
      </div>

      <h2 className="mb-2 mt-6 text-lg font-bold">Falta cadastrar</h2>
      <div className="space-y-2">
        {itensDeChecklist === 0 ? (
          <Pendencia>
            Os checklists de Abertura, Pico e Fechamento estão sem itens. Eles vêm do
            documento <strong>Placar v3</strong>.
          </Pendencia>
        ) : null}
        {ingredientes === 0 ? (
          <Pendencia>
            A curva de 17 ingredientes, os preços do CD e a ficha técnica v3.2 ainda não
            foram carregados — sem eles o CMV não tem como ser calculado.
          </Pendencia>
        ) : null}
        {pizzasPorPedido === null ? (
          <Pendencia>
            O <strong>pizzas por pedido</strong> desta loja não foi definido. Ele sai
            sozinho quando os Itens Vendidos do Saipos forem enviados (Sprint 1).
          </Pendencia>
        ) : null}
        {itensDeChecklist > 0 && ingredientes > 0 && pizzasPorPedido !== null ? (
          <CardPainel>Tudo que o book pede já está cadastrado.</CardPainel>
        ) : null}
      </div>

      <h2 className="mb-2 mt-6 text-lg font-bold">Módulos</h2>
      <p className="mb-3 text-sm text-[var(--painel-texto-fraco)]">
        A base está pronta (Sprint 0). Os módulos entram um sprint por vez, na ordem
        da seção 12 do book.
      </p>
      <ul className="space-y-2">
        {MODULOS.map((m) => (
          <li key={m.nome} className={`${superficie} flex items-center justify-between gap-3 p-3`}>
            <div className="min-w-0">
              <p className="truncate font-semibold">{m.nome}</p>
              <p className="truncate text-sm text-[var(--painel-texto-fraco)]">{m.descricao}</p>
            </div>
            <span className="shrink-0 rounded-full border border-[var(--painel-borda)] px-2 py-0.5 text-xs text-[var(--painel-texto-fraco)]">
              Sprint {m.sprint}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center text-xs text-[var(--painel-texto-fraco)]">
        Hoje operacional começou às 06h00 de {formatDate(hoje)} e vai até 05h59 de{" "}
        {formatDate(textoDaData(new Date(new Date(`${hoje}T00:00:00Z`).getTime() + 86400000)))}.
      </p>
      <p className="mt-2 text-center text-xs">
        <Link href="/" className="underline">
          Ir para o app de diaristas
        </Link>
      </p>
    </>
  );
}
