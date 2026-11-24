import { redirect } from "next/navigation";
import ModuloEmMigracao from "@/components/ModuloEmMigracao";
import { moduloAtivo } from "@/lib/modulos-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!(await moduloAtivo("tecnologia"))) redirect("/modulos");
  return <ModuloEmMigracao titulo="Tecnologia" fase={5} origem="gestao-os, chamados, api/app/ti" />;
}
