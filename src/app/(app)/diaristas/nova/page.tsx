import { PageHeader } from "@/components/ui";
import DiaristaForm from "../DiaristaForm";
import { createDiarista } from "../actions";

export default function NovaDiaristaPage() {
  return (
    <div>
      <PageHeader title="Nova diarista" subtitle="Cadastre uma pessoa" />
      <DiaristaForm action={createDiarista} submitLabel="Salvar diarista" />
    </div>
  );
}
