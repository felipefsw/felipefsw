import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import CopyLink from "@/components/CopyLink";
import DiaristaForm from "../DiaristaForm";
import { updateDiarista } from "../actions";

export default async function EditarDiaristaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const diarista = await prisma.diarista.findUnique({ where: { id } });
  if (!diarista) notFound();

  return (
    <div className="space-y-4">
      <PageHeader title="Editar diarista" subtitle={diarista.nome} />
      <DiaristaForm
        action={updateDiarista}
        diarista={diarista}
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
    </div>
  );
}
