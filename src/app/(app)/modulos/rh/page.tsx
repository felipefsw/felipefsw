import { redirect } from "next/navigation";
import ModuloEmMigracao from "@/components/ModuloEmMigracao";
import { moduloAtivo } from "@/lib/modulos-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!(await moduloAtivo("rh"))) redirect("/modulos");
  return <ModuloEmMigracao titulo="RH / DP" fase={3} origem="funcionarios/, processos-seletivos-rh" />;
}
