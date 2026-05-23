import { PageHeader } from "@/components/ui";
import LojaForm from "../LojaForm";
import { createLoja } from "../actions";

export default function NovaLojaPage() {
  return (
    <div>
      <PageHeader title="Nova loja" subtitle="Cadastre um local de trabalho" />
      <LojaForm action={createLoja} submitLabel="Salvar loja" />
    </div>
  );
}
