import { redirect } from "next/navigation";
import ModuloEmMigracao from "@/components/ModuloEmMigracao";
import { moduloAtivo } from "@/lib/modulos-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!(await moduloAtivo("recepcao"))) redirect("/modulos");
  return <ModuloEmMigracao titulo="Recepção" fase={10} origem="recep-dashboard, recep-entradas" />;
}
