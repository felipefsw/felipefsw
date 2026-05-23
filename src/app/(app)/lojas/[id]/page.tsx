import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { ASPECTOS_LOJA } from "@/lib/aspectosLoja";
import LojaForm from "../LojaForm";
import { updateLoja } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditarLojaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [loja, avaliacoes] = await Promise.all([
    prisma.loja.findUnique({ where: { id } }),
    prisma.avaliacaoLoja.findMany({
      where: { lojaId: id },
      include: { diarista: { select: { nome: true } }, escala: { select: { data: true } } },
      orderBy: { criadoEm: "desc" },
    }),
  ]);
  if (!loja) notFound();

  const total = avaliacoes.length;
  const mediaDe = (key: string) =>
    total
      ? avaliacoes.reduce((s, a) => s + (a as unknown as Record<string, number>)[key], 0) / total
      : 0;
  const mediaGeral = total
    ? ASPECTOS_LOJA.reduce((s, a) => s + mediaDe(a.key), 0) / ASPECTOS_LOJA.length
    : 0;

  return (
    <div className="space-y-4">
      <PageHeader title="Editar loja" subtitle={loja.nome} />
      <LojaForm action={updateLoja} loja={loja} submitLabel="Salvar alterações" />

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Avaliações da loja</h2>
          {total > 0 && (
            <span className="text-sm text-gray-500">
              média <strong className="text-teal-700">{mediaGeral.toFixed(1)}</strong> · {total}{" "}
              diária(s)
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Feedback dos diaristas sobre a loja. Visível apenas aqui (RH/gestão).
        </p>

        {total === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            Ainda sem avaliações dos diaristas.
          </p>
        ) : (
          <>
            <ul className="mt-3 space-y-1.5">
              {ASPECTOS_LOJA.map((a) => (
                <li key={a.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-600">{a.label}</span>
                  <span className="font-medium text-gray-900">{mediaDe(a.key).toFixed(1)}</span>
                </li>
              ))}
            </ul>

            <h3 className="mb-2 mt-4 text-sm font-semibold text-gray-700">Comentários recentes</h3>
            <ul className="divide-y divide-gray-100">
              {avaliacoes.slice(0, 8).map((a) => (
                <li key={a.id} className="py-2">
                  <p className="text-sm text-gray-600">
                    {formatDate(a.escala.data)} · {a.diarista.nome}
                  </p>
                  {a.comentario && (
                    <p className="mt-0.5 text-sm text-gray-500">{a.comentario}</p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
