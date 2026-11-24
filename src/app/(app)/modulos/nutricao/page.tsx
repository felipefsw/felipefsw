import { redirect } from "next/navigation";
import ModuloEmMigracao from "@/components/ModuloEmMigracao";
import { moduloAtivo } from "@/lib/modulos-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!(await moduloAtivo("nutricao"))) redirect("/modulos");
  return <ModuloEmMigracao titulo="Nutrição" fase={7} origem="inspecao-nutricional, api/app/nutri" />;
}
