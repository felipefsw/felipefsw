import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import CopyLink from "@/components/CopyLink";
import { formatDate } from "@/lib/format";
import { ASPECTOS } from "@/lib/aspectos";
import DiaristaForm from "../DiaristaForm";
import { updateDiarista } from "../actions";

export default async function EditarDiaristaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [diarista, lojas] = await Promise.all([
    prisma.diarista.findUnique({
      where: { id },
      include: { lojasPreferidas: { select: { id: true } } },
    }),
    prisma.loja.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);
  if (!diarista) notFound();

  const avaliacoes = await prisma.avaliacao.findMany({
    where: { diaristaId: id },
    include: { escala: { include: { loja: true } } },
    orderBy: { criadoEm: "desc" },
  });
  const total = avaliacoes.length;
  const mediaDe = (key: string) =>
    total
      ? avaliacoes.reduce((s, a) => s + (a as unknown as Record<string, number>)[key], 0) / total
      : 0;
  const mediaGeral = total
    ? ASPECTOS.reduce((s, a) => s + mediaDe(a.key), 0) / ASPECTOS.length
    : 0;
  const mediaDaAvaliacao = (a: (typeof avaliacoes)[number]) =>
    ASPECTOS.reduce((s, asp) => s + (a as unknown as Record<string, number>)[asp.key], 0) /
    ASPECTOS.length;

  return (
    <div className="space-y-4">
      <PageHeader title="Editar diarista" subtitle={diarista.nome} />
      <DiaristaForm
        action={updateDiarista}
        diarista={diarista}
        lojas={lojas}
        submitLabel="Salvar alterações"
      />

      <Card>
        <h2 className="font-semibold text-gray-900">Link pessoal</h2>
        <p className="mb-3 mt-1 text-sm text-gray-500">
          Envie este link para a diarista (por WhatsApp, por exemplo). Com ele, ela vê a
          própria escala e confirma presença — sem precisar de senha.
        </p>
        <CopyLink path={`/d/${diarista.token}`} />
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Avaliações</h2>
          {total > 0 && (
            <span className="text-sm text-gray-500">
              média <strong className="text-teal-700">{mediaGeral.toFixed(1)}</strong> · {total}{" "}
              diária(s)
            </span>
          )}
        </div>

        {total === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            Ainda sem avaliações. Avalie pela tela de <strong>Escala</strong>, em cada diária.
          </p>
        ) : (
          <>
            <ul className="mt-3 space-y-1.5">
              {ASPECTOS.map((a) => (
                <li key={a.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-600">{a.label}</span>
                  <span className="font-medium text-gray-900">{mediaDe(a.key).toFixed(1)}</span>
                </li>
              ))}
            </ul>

            <h3 className="mb-2 mt-4 text-sm font-semibold text-gray-700">Últimas diárias</h3>
            <ul className="divide-y divide-gray-100">
              {avaliacoes.slice(0, 5).map((a) => (
                <li key={a.id} className="py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600">
                      {formatDate(a.escala.data)} · {a.escala.loja.nome}
                    </span>
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                      {mediaDaAvaliacao(a).toFixed(1)}
                    </span>
                  </div>
                  {a.comentario && (
                    <p className="mt-1 text-sm text-gray-500">{a.comentario}</p>
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
