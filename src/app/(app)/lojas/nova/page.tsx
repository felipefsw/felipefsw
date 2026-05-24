import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import LojaForm from "../LojaForm";
import { createLoja } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovaLojaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const gestores = await prisma.gestor.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return (
    <div>
      <PageHeader title="Nova loja" subtitle="Cadastre um local de trabalho" />
      <LojaForm action={createLoja} gestores={gestores} submitLabel="Salvar loja" erro={erro} />
    </div>
  );
}
