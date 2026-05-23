import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import DiaristaForm from "../DiaristaForm";
import { createDiarista } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovaDiaristaPage() {
  const lojas = await prisma.loja.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return (
    <div>
      <PageHeader title="Nova diarista" subtitle="Cadastre uma pessoa" />
      <DiaristaForm action={createDiarista} lojas={lojas} submitLabel="Salvar diarista" />
    </div>
  );
}
