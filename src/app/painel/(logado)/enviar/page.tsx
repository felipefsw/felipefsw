import {
  CabecalhoPainel,
  CardPainel,
  ErroPainel,
  NadaAindaPainel,
  Pendencia,
  botaoPrimario,
  inputPainel,
  labelPainel,
  superficie,
} from "@/components/painel/ui";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { textoDaData } from "@/lib/painel/opsDate";
import { NOME_DO_TIPO, TIPOS_DE_ARQUIVO, type TipoDeArquivo } from "@/lib/painel/ingestao/tipos";
import { TIPOS_COM_LEITOR } from "@/lib/painel/ingestao";
import { exigeEditar } from "@/lib/painel/papeis";
import { contextoPainel } from "@/lib/painel/sessao";
import { apagarEnvioAction, enviarArquivos } from "./actions";

export const dynamic = "force-dynamic";

const CORES_DO_STATUS: Record<string, string> = {
  processado: "var(--painel-verde)",
  alerta: "var(--painel-dourado)",
  rejeitado: "var(--painel-vermelho)",
  recebido: "var(--painel-texto-fraco)",
};

const ERROS: Record<string, string> = {
  vazio: "Escolha pelo menos um arquivo.",
  muitos: "Envie no máximo 20 arquivos de uma vez.",
};

export default async function EnviarPage({
  searchParams,
}: {
  searchParams: Promise<{ enviados?: string; repetidos?: string; erro?: string; ok?: string }>;
}) {
  const { enviados, repetidos, erro, ok } = await searchParams;
  const ctx = await contextoPainel();
  exigeEditar(ctx.acesso, ctx.storeId, "operacao");

  const recemEnviados = new Set((enviados ?? "").split(",").filter(Boolean));

  const uploads = await prisma.upload.findMany({
    where: { storeId: ctx.storeId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, kind: true, status: true, summary: true, error: true,
      periodStart: true, periodEnd: true, createdAt: true,
    },
  });

  return (
    <>
      <CabecalhoPainel
        titulo="Enviar relatórios"
        subtitulo="O painel lê o arquivo e calcula sozinho. Mandar o mesmo arquivo duas vezes não duplica nada."
      />

      {erro ? <ErroPainel>{ERROS[erro] ?? "Não deu certo."}</ErroPainel> : null}
      {repetidos ? (
        <Pendencia>
          Já processado antes, nada foi gravado de novo:{" "}
          <strong>{repetidos.split("|").join(", ")}</strong>. Para ler o arquivo outra vez,
          apague o envio antigo no histórico abaixo e mande de novo.
        </Pendencia>
      ) : null}
      {ok === "apagado" ? (
        <CardPainel>Envio apagado. Agora dá para mandar o mesmo arquivo de novo.</CardPainel>
      ) : null}

      <CardPainel className="mt-3">
        <form action={enviarArquivos} className="space-y-3">
          <div>
            <label className={labelPainel} htmlFor="arquivos">
              Arquivos (dá para escolher vários)
            </label>
            <input
              id="arquivos"
              name="arquivos"
              type="file"
              multiple
              required
              accept=".xlsx,.xls,.xlsm,.csv,.tsv,.txt"
              className={inputPainel}
            />
          </div>
          <div>
            <label className={labelPainel} htmlFor="tipo">
              Tipo do arquivo
            </label>
            <select id="tipo" name="tipo" className={inputPainel} defaultValue="">
              <option value="">Descobrir sozinho (recomendado)</option>
              {TIPOS_DE_ARQUIVO.filter((t) => TIPOS_COM_LEITOR.includes(t)).map((t) => (
                <option key={t} value={t}>{NOME_DO_TIPO[t]}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--painel-texto-fraco)]">
              Só escolha à mão se o painel não reconhecer o arquivo.
            </p>
          </div>
          <button type="submit" className={botaoPrimario}>Enviar</button>
        </form>
      </CardPainel>

      <CardPainel className="mt-3">
        <h2 className="mb-2 font-bold">O que o painel já sabe ler</h2>
        <ul className="space-y-1 text-sm">
          {TIPOS_DE_ARQUIVO.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  background: TIPOS_COM_LEITOR.includes(t)
                    ? "var(--painel-verde)"
                    : "var(--painel-borda)",
                }}
              />
              <span className={TIPOS_COM_LEITOR.includes(t) ? "" : "text-[var(--painel-texto-fraco)]"}>
                {NOME_DO_TIPO[t]}
                {TIPOS_COM_LEITOR.includes(t) ? "" : " · ainda não"}
              </span>
            </li>
          ))}
        </ul>
      </CardPainel>

      <h2 className="mb-2 mt-6 text-lg font-bold">Histórico</h2>
      {uploads.length === 0 ? (
        <NadaAindaPainel>
          Nada enviado ainda. Comece pelo <strong>Vendas por período</strong> do Saipos: é
          dele que saem o faturamento, os pedidos por hora e a previsão do dia.
        </NadaAindaPainel>
      ) : (
        <ul className="space-y-2">
          {uploads.map((u) => {
            const s = u.summary as { resumo?: string; avisos?: string[] } | null;
            const novo = recemEnviados.has(u.id);
            return (
              <li
                key={u.id}
                className={`${superficie} p-4 ${novo ? "border-[var(--painel-laranja)]" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: CORES_DO_STATUS[u.status] }}
                        aria-label={u.status}
                      />
                      <span className="truncate">
                        {NOME_DO_TIPO[u.kind as TipoDeArquivo] ?? u.kind}
                      </span>
                    </p>
                    {s?.resumo ? <p className="mt-1 text-sm">{s.resumo}</p> : null}
                    {u.periodStart && u.periodEnd ? (
                      <p className="mt-1 text-xs text-[var(--painel-texto-fraco)]">
                        Período: {formatDate(textoDaData(u.periodStart))} a{" "}
                        {formatDate(textoDaData(u.periodEnd))}
                      </p>
                    ) : null}
                  </div>
                  <form action={apagarEnvioAction}>
                    <input type="hidden" name="uploadId" value={u.id} />
                    <button type="submit" className="shrink-0 text-xs underline">
                      apagar
                    </button>
                  </form>
                </div>

                {s?.avisos?.length ? (
                  <div className="mt-2 space-y-1">
                    {s.avisos.map((a) => (
                      <Pendencia key={a}>{a}</Pendencia>
                    ))}
                  </div>
                ) : null}

                {u.error ? (
                  <div className="mt-2">
                    <ErroPainel>{u.error}</ErroPainel>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
