import { redirect } from "next/navigation";
import ModuloEmMigracao from "@/components/ModuloEmMigracao";
import { moduloAtivo } from "@/lib/modulos-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!(await moduloAtivo("cd"))) redirect("/modulos");
  return <ModuloEmMigracao titulo="Centro de Distribuição" fase={8} origem="estoque, pedidos-cd, api/app/estoque" />;
}
