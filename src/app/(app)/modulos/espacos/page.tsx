import { redirect } from "next/navigation";
import ModuloEmMigracao from "@/components/ModuloEmMigracao";
import { moduloAtivo } from "@/lib/modulos-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!(await moduloAtivo("espacos"))) redirect("/modulos");
  return <ModuloEmMigracao titulo="Espaços de trabalho" fase={10} origem="espacos-trabalho, api/agent" />;
}
