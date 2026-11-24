import { redirect } from "next/navigation";
import ModuloEmMigracao from "@/components/ModuloEmMigracao";
import { moduloAtivo } from "@/lib/modulos-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!(await moduloAtivo("marketing"))) redirect("/modulos");
  return <ModuloEmMigracao titulo="Marketing" fase={10} origem="marketing-campanhas, cupons-cw, informativos" />;
}
