import MapaDeCalor from "@/components/painel/MapaDeCalor";
import {
  CabecalhoPainel,
  NadaAindaPainel,
  NumeroPrincipal,
  Pendencia,
  botaoSecundario,
  inputPainel,
  labelPainel,
  superficie,
} from "@/components/painel/ui";
import { formatDate } from "@/lib/format";
import { exigeVer } from "@/lib/painel/papeis";
import { contextoPainel } from "@/lib/painel/sessao";
import { opsDateDeHoje, somaDias } from "@/lib/painel/opsDate";
import {
  NOME_DO_DIA,
  diaADia,
  janelaDoPerfil,
  perfilPorDiaDaSemana,
  perfilPorHora,
  periodoComDados,
  previsao14Dias,
  totaisDoPeriodo,
  type DiaDaSemana,
} from "@/lib/painel/vendas";

export const dynamic = "force-dynamic";

const dinheiro = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const dinheiroExato = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const numero = (v: number) => v.toLocaleString("pt-BR");

export default async function Vendas360Page({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const { de, ate } = await searchParams;
  const ctx = await contextoPainel();
  exigeVer(ctx.acesso, ctx.storeId);

  const hoje = opsDateDeHoje();
  const comDados = await periodoComDados(ctx.storeId);

  if (!comDados) {
    return (
      <>
        <CabecalhoPainel titulo="Vendas 360" />
        <NadaAindaPainel>
          Ainda não há pedidos desta loja. Envie o <strong>Vendas por período</strong> do
          Saipos em <strong>Enviar relatórios</strong> — é dele que saem o faturamento,
          o movimento por hora e a previsão.
        </NadaAindaPainel>
      </>
    );
  }

  // Por padrão mostra as últimas 6 semanas com dado, como no estudo do book.
  const ehData = (s: string | undefined) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const fim = ehData(ate) ? ate! : comDados.fim;
  const inicioPadrao = somaDias(fim, -41);
  const inicio = ehData(de) ? de! : (inicioPadrao > comDados.inicio ? inicioPadrao : comDados.inicio);

  const [totais, perfil, horas, dias, previsao] = await Promise.all([
    totaisDoPeriodo(ctx.storeId, inicio, fim),
    perfilPorDiaDaSemana(ctx.storeId, hoje),
    perfilPorHora(ctx.storeId, hoje),
    diaADia(ctx.storeId, inicio, fim),
    previsao14Dias(ctx.storeId, hoje),
  ]);

  const janela = janelaDoPerfil(hoje);
  const semPerfil = perfil.length === 0;

  return (
    <>
      <CabecalhoPainel
        titulo="Vendas 360"
        subtitulo={`${formatDate(inicio)} a ${formatDate(fim)} · ${ctx.lojaNome}`}
      />

      <form className="mb-4 flex flex-wrap items-end gap-2">
        <div className="w-40">
          <label className={labelPainel} htmlFor="de">De</label>
          <input id="de" type="date" name="de" defaultValue={inicio} className={inputPainel} />
        </div>
        <div className="w-40">
          <label className={labelPainel} htmlFor="ate">Até</label>
          <input id="ate" type="date" name="ate" defaultValue={fim} className={inputPainel} />
        </div>
        <button type="submit" className={botaoSecundario}>Ver período</button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        <NumeroPrincipal
          valor={dinheiroExato(totais.faturamento)}
          rotulo="Faturamento do período"
          detalhe={`${numero(totais.pedidos)} pedidos · ticket ${dinheiroExato(totais.ticket)}`}
        />
        <NumeroPrincipal
          valor={`${totais.cancelPct.toLocaleString("pt-BR")}%`}
          rotulo="Cancelamento"
          detalhe={`${numero(totais.cancelados)} pedidos cancelados · ${numero(totais.entregas)} entregas`}
          semaforo={totais.cancelPct <= 1 ? "verde" : totais.cancelPct <= 2 ? "amarelo" : "vermelho"}
        />
      </div>

      <h2 className="mb-2 mt-6 text-lg font-bold">Como é cada dia da semana</h2>
      {semPerfil ? (
        <Pendencia>
          Ainda não há semanas completas entre {formatDate(janela.inicio)} e{" "}
          {formatDate(janela.fim)}. O perfil aparece quando houver pelo menos uma
          semana fechada de dados.
        </Pendencia>
      ) : (
        <>
          <p className="mb-2 text-sm text-[var(--painel-texto-fraco)]">
            Média das semanas completas de {formatDate(janela.inicio)} a{" "}
            {formatDate(janela.fim)}, sem feriados.
          </p>
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--painel-texto-fraco)]">
                  <th scope="col" className="py-1 font-medium">Dia</th>
                  <th scope="col" className="py-1 text-right font-medium">Pedidos</th>
                  <th scope="col" className="py-1 text-right font-medium">Mín–máx</th>
                  <th scope="col" className="py-1 text-right font-medium">Faturamento</th>
                  <th scope="col" className="py-1 text-right font-medium">Dias</th>
                </tr>
              </thead>
              <tbody>
                {perfil.map((p) => (
                  <tr key={p.dia} className="border-t border-[var(--painel-borda)]">
                    <th scope="row" className="py-1.5 text-left font-medium">
                      {NOME_DO_DIA[p.dia as DiaDaSemana]}
                    </th>
                    <td className="py-1.5 text-right tabular-nums">{numero(p.mediaPedidos)}</td>
                    <td className="py-1.5 text-right tabular-nums text-[var(--painel-texto-fraco)]">
                      {numero(p.minPedidos)}–{numero(p.maxPedidos)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">{dinheiro(p.mediaFaturamento)}</td>
                    <td className="py-1.5 text-right tabular-nums text-[var(--painel-texto-fraco)]">
                      {p.diasMedidos}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {horas.length > 0 ? (
        <div className="mt-6">
          <MapaDeCalor horas={horas} titulo="Movimento por hora" />
        </div>
      ) : null}

      <h2 className="mb-2 mt-6 text-lg font-bold">Previsão dos próximos 14 dias</h2>
      <p className="mb-2 text-sm text-[var(--painel-texto-fraco)]">
        Cada dia recebe a média do dia da semana correspondente. Feriado se comporta
        como sábado.
      </p>
      <ul className="space-y-1">
        {previsao.map((d) => (
          <li
            key={d.data}
            className={`${superficie} flex items-center justify-between gap-2 px-3 py-2 text-sm`}
          >
            <span className="min-w-0">
              <span className="font-medium">{formatDate(d.data)}</span>{" "}
              <span className="text-[var(--painel-texto-fraco)]">{NOME_DO_DIA[d.dia]}</span>
              {d.feriado ? (
                <span className="ml-1 text-[var(--painel-dourado)]">· {d.feriado}</span>
              ) : null}
            </span>
            <span className="shrink-0 text-right tabular-nums">
              {d.pedidos === null ? (
                <span className="text-[var(--painel-texto-fraco)]">sem histórico</span>
              ) : (
                <>
                  {numero(d.pedidos)} pedidos
                  {d.faturamento !== null ? (
                    <span className="text-[var(--painel-texto-fraco)]"> · {dinheiro(d.faturamento)}</span>
                  ) : null}
                </>
              )}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mb-2 mt-6 text-lg font-bold">Dia a dia do período</h2>
      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--painel-texto-fraco)]">
              <th scope="col" className="py-1 font-medium">Dia</th>
              <th scope="col" className="py-1 text-right font-medium">Pedidos</th>
              <th scope="col" className="py-1 text-right font-medium">Faturamento</th>
              <th scope="col" className="py-1 text-right font-medium">Ticket</th>
              <th scope="col" className="py-1 text-right font-medium">Entrega/balcão</th>
            </tr>
          </thead>
          <tbody>
            {dias.map((d) => (
              <tr key={d.data} className="border-t border-[var(--painel-borda)]">
                <th scope="row" className="py-1.5 text-left font-normal">
                  {formatDate(d.data)}{" "}
                  <span className="text-[var(--painel-texto-fraco)]">
                    {NOME_DO_DIA[d.dia].slice(0, 3)}
                  </span>
                </th>
                <td className="py-1.5 text-right tabular-nums">{numero(d.pedidos)}</td>
                <td className="py-1.5 text-right tabular-nums">{dinheiro(d.faturamento)}</td>
                <td className="py-1.5 text-right tabular-nums">{dinheiroExato(d.ticket)}</td>
                <td className="py-1.5 text-right tabular-nums text-[var(--painel-texto-fraco)]">
                  {numero(d.entregas)}/{numero(d.balcao)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
