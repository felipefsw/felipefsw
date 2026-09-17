import {
  CabecalhoPainel,
  CardPainel,
  ErroPainel,
  Pendencia,
  botaoPrimario,
  inputPainel,
  labelPainel,
  superficie,
} from "@/components/painel/ui";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { opsDateDeHoje, textoDaData } from "@/lib/painel/opsDate";
import {
  PARAMETROS_PADRAO,
  PARAMETROS_SEM_PADRAO,
  TODAS_AS_CHAVES,
  type ChaveParametro,
} from "@/lib/painel/parametros";
import { exigeEditar, podeEditar } from "@/lib/painel/papeis";
import { contextoPainel } from "@/lib/painel/sessao";
import { salvarParametro } from "./actions";

export const dynamic = "force-dynamic";

// O que cada chave significa, em português. Os valores vêm da seção 4 do book.
const EXPLICACAO: Partial<Record<ChaveParametro, string>> = {
  pizzas_per_order: "Pizzas por pedido desta loja (sai dos Itens Vendidos do Saipos)",
  prod_target: "Pizzas por hora que um produtor dá conta",
  att_target: "Pedidos por hora que um atendente dá conta",
  min_prod: "Mínimo de gente na produção",
  min_att: "Mínimo de gente no atendimento",
  courier_cost: "Custo por entrega (motoboy), em R$",
  box_cost: "Custo da caixa por pizza, em R$",
  gas_cost: "Custo de gás por pizza, em R$",
  drink_cost_order: "Custo de bebida por pedido, em R$",
  ifood_rate: "Comissão do iFood sobre a base (0,121 = 12,1%)",
  cmv_green: "CMV verde: abaixo disso está ótimo (%)",
  cmv_yellow: "CMV amarelo: até aqui ainda passa (%)",
  prod_time_ok: "Tempo de produção bom, em minutos",
  prod_time_bad: "Tempo de produção ruim, em minutos",
  delivery_ok: "Tempo de entrega bom, em minutos",
  delivery_bad: "Tempo de entrega ruim, em minutos",
  dough_max_min: "Quanto tempo a massa pode ficar aberta, em minutos",
  floor_pct: "Piso da loja: % da meta abaixo do qual só paga presença",
  nut_gate: "Nota mínima da nutricionista para valer prêmio",
  nut_excel: "Nota da nutricionista que dá o prêmio de excelência",
  late_tolerance: "Quantos atrasos a pessoa pode ter na semana",
  weeks_in_house: "Semanas de casa para entrar no prêmio de presença",
  calls_green: "Chamados verde: até este % está ótimo",
  calls_red: "Chamados vermelho: acima deste % estoura o limite do iFood",
  cancel_max: "Cancelamento máximo da semana, em %",
  nota_min: "Nota mínima no iFood para o prêmio de qualidade",
  prize_presence: "Prêmio de presença, em R$",
  prize_streak: "Prêmio da 4ª semana perfeita seguida, em R$",
  prize_cmv_green: "Prêmio de CMV verde, em R$",
  prize_cmv_yellow: "Prêmio de CMV amarelo, em R$",
  prize_pizzas: "Prêmio por bater a meta de pizzas, em R$",
  prize_pizzas_110: "Prêmio por 110% da meta de pizzas, em R$",
  prize_quality: "Prêmio de qualidade, em R$",
  prize_excel: "Prêmio de excelência, em R$",
  leader_potential: "Prêmio cheio do líder de produção no mês, em R$",
  manager_potential: "Prêmio cheio do gerente no mês, em R$",
  commission_pct: "Comissão sobre o prêmio da equipe, em %",
  accelerator_pct: "Acelerador quando todos os blocos vão bem, em %",
  manager_bonus_110: "Bônus do gerente por 110% do faturamento, em R$",
};

export default async function ParametrosPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const { erro, ok } = await searchParams;
  const ctx = await contextoPainel();
  exigeEditar(ctx.acesso, ctx.storeId, "parametros");

  const hoje = opsDateDeHoje();
  const podeMexerNaRede = podeEditar(ctx.acesso, ctx.storeId, "usuarios");

  const linhas = await prisma.param.findMany({
    where: { OR: [{ storeId: ctx.storeId }, { storeId: null }] },
    orderBy: { validFrom: "asc" },
    select: { storeId: true, key: true, valueNum: true, validFrom: true },
  });

  // Qual valor vale hoje, e de onde ele veio. Mesma regra do lerParametros:
  // a linha da LOJA ganha da linha da REDE; dentro de cada escopo vale a
  // vigência mais recente que já chegou. Como `linhas` vem ordenada por
  // vigência crescente, basta ir sobrescrevendo cada escopo separadamente.
  type Vigente = { valor: number; vigencia: string; origem: "loja" | "rede" };
  const daRede = new Map<string, Vigente>();
  const daLoja = new Map<string, Vigente>();
  for (const l of linhas) {
    if (l.valueNum === null) continue;
    const vigencia = textoDaData(l.validFrom);
    if (vigencia > hoje) continue; // ainda não começou a valer
    const origem = l.storeId === null ? "rede" : "loja";
    const destino = origem === "rede" ? daRede : daLoja;
    destino.set(l.key, { valor: Number(l.valueNum), vigencia, origem });
  }

  const vigenteAgora = new Map<string, Vigente>(daRede);
  for (const [chave, v] of daLoja) vigenteAgora.set(chave, v);

  const futuras = linhas.filter((l) => textoDaData(l.validFrom) > hoje);

  return (
    <>
      <CabecalhoPainel
        titulo="Parâmetros e réguas"
        subtitulo={`Valendo em ${formatDate(hoje)} para ${ctx.lojaNome}`}
      />

      {erro ? (
        <ErroPainel>
          {erro === "valor"
            ? "Digite um número (use vírgula ou ponto para o decimal)."
            : erro === "vigencia"
              ? "Escolha a data a partir de quando o valor passa a valer."
              : "Não deu certo."}
        </ErroPainel>
      ) : null}
      {ok ? (
        <div className="rounded-lg border border-[var(--painel-verde)]/40 bg-[var(--painel-verde)]/10 px-3 py-2 text-sm text-[var(--painel-verde)]">
          Valor gravado. Os cálculos de dias anteriores continuam com o valor antigo.
        </div>
      ) : null}

      <CardPainel className="mt-3">
        <p className="text-sm text-[var(--painel-texto-fraco)]">
          Mudar um valor <strong>não altera o passado</strong>: o painel guarda a data em
          que o novo valor passa a valer e cada apuração registra qual versão usou.
        </p>
      </CardPainel>

      {futuras.length > 0 ? (
        <div className="mt-3">
          <Pendencia>
            {futuras.length} valor(es) já agendado(s) para começar a valer depois de hoje.
          </Pendencia>
        </div>
      ) : null}

      <ul className="mt-4 space-y-3">
        {TODAS_AS_CHAVES.map((chave) => {
          const atual = vigenteAgora.get(chave);
          const padrao =
            chave in PARAMETROS_PADRAO
              ? PARAMETROS_PADRAO[chave as keyof typeof PARAMETROS_PADRAO]
              : null;
          const semPadrao = (PARAMETROS_SEM_PADRAO as readonly string[]).includes(chave);

          return (
            <li key={chave} className={`${superficie} p-4`}>
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{chave}</p>
                  <p className="text-sm text-[var(--painel-texto-fraco)]">
                    {EXPLICACAO[chave] ?? "—"}
                  </p>
                </div>
                <p className="painel-numero shrink-0 text-2xl font-bold">
                  {atual ? atual.valor : padrao !== null ? padrao : "—"}
                </p>
              </div>

              <p className="mt-1 text-xs text-[var(--painel-texto-fraco)]">
                {atual
                  ? `${atual.origem === "loja" ? "definido nesta loja" : "valor da rede"} · vale desde ${formatDate(atual.vigencia)}`
                  : semPadrao
                    ? "ainda não definido — o painel não inventa este número"
                    : "usando o valor padrão do book (ainda não gravado no banco)"}
              </p>

              <form action={salvarParametro} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="key" value={chave} />
                <div className="w-28">
                  <label className={labelPainel}>Novo valor</label>
                  <input
                    name="valor"
                    inputMode="decimal"
                    required
                    className={inputPainel}
                    defaultValue={atual ? String(atual.valor) : padrao !== null ? String(padrao) : ""}
                  />
                </div>
                <div className="w-40">
                  <label className={labelPainel}>Vale a partir de</label>
                  <input type="date" name="vigencia" required className={inputPainel} defaultValue={hoje} />
                </div>
                <div className="w-32">
                  <label className={labelPainel}>Onde vale</label>
                  <select name="escopo" className={inputPainel} defaultValue="loja">
                    <option value="loja">Só esta loja</option>
                    {podeMexerNaRede ? <option value="rede">Rede inteira</option> : null}
                  </select>
                </div>
                <button type="submit" className={botaoPrimario}>Gravar</button>
              </form>
            </li>
          );
        })}
      </ul>
    </>
  );
}
