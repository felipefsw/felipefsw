import { redirect } from "next/navigation";
import ModuloEmMigracao from "@/components/ModuloEmMigracao";
import { moduloAtivo } from "@/lib/modulos-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!(await moduloAtivo("frotas"))) redirect("/modulos");
  return <ModuloEmMigracao titulo="Frotas" fase={8} origem="dashboard-frota, mapa-frota, api/app/driver" />;
}
