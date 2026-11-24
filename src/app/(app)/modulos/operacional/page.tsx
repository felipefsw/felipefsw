import { redirect } from "next/navigation";
import ModuloEmMigracao from "@/components/ModuloEmMigracao";
import { moduloAtivo } from "@/lib/modulos-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!(await moduloAtivo("operacional"))) redirect("/modulos");
  return <ModuloEmMigracao titulo="Operacional" fase={6} origem="tarefas, checking, gestao-ifood" />;
}
