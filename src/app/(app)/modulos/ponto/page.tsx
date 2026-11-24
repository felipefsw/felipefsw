import { redirect } from "next/navigation";
import ModuloEmMigracao from "@/components/ModuloEmMigracao";
import { moduloAtivo } from "@/lib/modulos-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!(await moduloAtivo("ponto"))) redirect("/modulos");
  return <ModuloEmMigracao titulo="Ponto" fase={4} origem="dashboard-ponto, cartao-ponto, api/app/ponto" />;
}
