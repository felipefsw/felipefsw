import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  PageHeader,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
} from "@/components/ui";
import { formatDateWithWeekday } from "@/lib/format";
import EstrelasInput from "@/components/EstrelasInput";
import { salvarAvaliacao } from "../../actions";

export const dynamic = "force-dynamic";

const CRITERIOS = [
  { campo: "assiduidade", label: "Assiduidade" },
  { campo: "pontualidade", label: "Pontualidade" },
  { campo: "padrao", label: "Padrão" },
  { campo: "organizacao", label: "Organização" },
  { campo: "qualidade", label: "Qualidade" },
  { campo: "limpeza", label: "Limpeza" },
  { campo: "comunicacao", label: "Comunicação" },
] as const;

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

  const a = escala.avaliacao;

  return (
    <div className="space-y-4">
      <PageHeader
        title={a ? "Editar avaliação" : "Avaliar diária"}
        subtitle={escala.diarista.nome}
      />

      <Card>
        <p className="text-sm text-gray-600">{escala.loja.nome}</p>
        <p className="text-sm capitalize text-gray-500">{formatDateWithWeekday(escala.data)}</p>
      </Card>

      <Card>
        <form action={salvarAvaliacao} className="space-y-5">
          <input type="hidden" name="escalaId" value={escala.id} />

          <EstrelasInput
            name="estrelas"
            defaultValue={a?.estrelas ?? 0}
            label="Nota geral (obrigatória)"
            size="lg"
          />

          <div className="border-t border-gray-100 pt-4">
            <p className={labelClass}>Detalhes (opcional)</p>
            <p className="-mt-1 mb-3 text-xs text-gray-400">
              Avalie cada critério de 1 a 5 — ajuda a entender o motivo da nota.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CRITERIOS.map((c) => (
                <EstrelasInput
                  key={c.campo}
                  name={c.campo}
                  label={c.label}
                  size="sm"
                  defaultValue={(a?.[c.campo as keyof typeof a] as number | null) ?? 0}
                />
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
              defaultValue={a?.comentario ?? ""}
              className={inputClass}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className={btnPrimary}>
              Salvar avaliação
            </button>
            <Link href="/escala" className={btnSecondary}>
              Voltar
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
