import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, btnSecondary, inputClass, labelClass } from "@/components/ui";
import { formatDateWithWeekday } from "@/lib/format";
import { salvarAvaliacao } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AvaliarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const escala = await prisma.escala.findUnique({
    where: { id },
    include: { diarista: true, loja: true, avaliacao: true },
  });
  if (!escala) notFound();

  const atual = escala.avaliacao?.estrelas ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title={escala.avaliacao ? "Editar avaliação" : "Avaliar diária"}
        subtitle={escala.diarista.nome}
      />

      <Card>
        <p className="text-sm text-gray-600">{escala.loja.nome}</p>
        <p className="text-sm capitalize text-gray-500">{formatDateWithWeekday(escala.data)}</p>
      </Card>

      <Card>
        <form action={salvarAvaliacao} className="space-y-4">
          <input type="hidden" name="escalaId" value={escala.id} />

          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">
              Nota (toque numa estrela para salvar)
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="submit"
                  name="estrelas"
                  value={n}
                  aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                  className="p-0.5 text-3xl leading-none transition-transform active:scale-90"
                >
                  <span className={n <= atual ? "text-amber-500" : "text-gray-300"}>★</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="comentario">
              Comentário (opcional)
            </label>
            <textarea
              id="comentario"
              name="comentario"
              rows={3}
              defaultValue={escala.avaliacao?.comentario ?? ""}
              className={inputClass}
            />
          </div>

          <Link href="/escala" className={btnSecondary}>
            Voltar
          </Link>
        </form>
      </Card>
    </div>
  );
}
