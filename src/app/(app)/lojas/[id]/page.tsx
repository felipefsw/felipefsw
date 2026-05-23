import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import LojaForm from "../LojaForm";
import { updateLoja } from "../actions";

export default async function EditarLojaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loja = await prisma.loja.findUnique({ where: { id } });
  if (!loja) notFound();

  return (
    <div>
      <PageHeader title="Editar loja" subtitle={loja.nome} />
      <LojaForm action={updateLoja} loja={loja} submitLabel="Salvar alterações" />
    </div>
  );
}
