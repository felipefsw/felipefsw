import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import MarkdownView from "@/components/MarkdownView";

export const dynamic = "force-dynamic";

function formatHora(d: Date) {
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ResultadoAuditoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exec = await prisma.execAgente.findUnique({
    where: { id },
    include: {
      agente: { select: { nome: true } },
      loja: { select: { nome: true } },
    },
  });
  if (!exec) notFound();

  const tokensTotal =
    (exec.inputTokens ?? 0) +
    (exec.outputTokens ?? 0) +
    (exec.cacheCreate ?? 0) +
    (exec.cacheRead ?? 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title={exec.titulo || "Auditoria"}
        subtitle={`${exec.agente.nome}${exec.loja ? ` · ${exec.loja.nome}` : ""} · ${formatHora(exec.criadoEm)}`}
      />

      {exec.status === "PROCESSANDO" && (
        <Card>
          <p className="text-sm text-gray-700">⏳ Processando… recarregue em alguns segundos.</p>
        </Card>
      )}

      {exec.status === "ERRO" && (
        <Card className="border-red-200 bg-red-50">
          <p className="mb-1 text-sm font-semibold text-red-800">Erro ao executar o agente</p>
          <p className="font-mono text-xs text-red-700">{exec.erro || "Erro desconhecido"}</p>
        </Card>
      )}

      {exec.status === "CONCLUIDA" && exec.saida && (
        <Card>
          <MarkdownView>{exec.saida}</MarkdownView>
        </Card>
      )}

      <details className="rounded-xl border border-gray-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700">
          Métricas
        </summary>
        <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500">Modelo:</span>{" "}
              <span className="font-mono">{exec.modelo || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500">Duração:</span>{" "}
              {exec.duracaoMs ? `${(exec.duracaoMs / 1000).toFixed(1)}s` : "—"}
            </div>
            <div>
              <span className="text-gray-500">Input:</span> {exec.inputTokens ?? "—"} tokens
            </div>
            <div>
              <span className="text-gray-500">Output:</span> {exec.outputTokens ?? "—"} tokens
            </div>
            <div>
              <span className="text-gray-500">Cache write:</span> {exec.cacheCreate ?? 0} tokens
            </div>
            <div>
              <span className="text-gray-500">Cache read:</span> {exec.cacheRead ?? 0} tokens
            </div>
            <div className="col-span-2 border-t border-gray-100 pt-2">
              <span className="text-gray-500">Total:</span>{" "}
              <strong className="text-gray-900">{tokensTotal} tokens</strong>
              {(exec.cacheRead ?? 0) > 0 && (
                <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  cache hit ✓
                </span>
              )}
            </div>
          </div>
        </div>
      </details>

      <details className="rounded-xl border border-gray-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700">
          Entrada bruta
        </summary>
        <pre className="overflow-x-auto border-t border-gray-100 bg-gray-50 px-4 py-3 font-mono text-[11px] leading-relaxed text-gray-700">
          {exec.entrada}
        </pre>
      </details>

      <div className="flex justify-between gap-2">
        <Link href="/os" className="text-sm text-gray-500 hover:underline">
          ← Dashboard
        </Link>
        <Link href="/os/auditoria" className="text-sm font-medium text-orange-700 hover:underline">
          Nova auditoria →
        </Link>
      </div>
    </div>
  );
}
