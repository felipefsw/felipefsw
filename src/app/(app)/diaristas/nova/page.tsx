import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import DiaristaForm from "../DiaristaForm";
import { createDiarista } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovaDiaristaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const lojas = await prisma.loja.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return (
    <div>
      <PageHeader title="Nova diarista" subtitle="Cadastre uma pessoa" />
      {erro === "cpf" && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          CPF inválido. Confira os números e tente novamente.
        </p>
      )}
      {erro === "cpfdup" && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          Já existe uma diarista cadastrada com esse CPF.
        </p>
      )}
      <DiaristaForm action={createDiarista} lojas={lojas} submitLabel="Salvar diarista" />
    </div>
  );
}
