import { redirect } from "next/navigation";
import ModuloEmMigracao from "@/components/ModuloEmMigracao";
import { moduloAtivo } from "@/lib/modulos-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!(await moduloAtivo("financeiro"))) redirect("/modulos");
  return <ModuloEmMigracao titulo="Financeiro" fase={9} origem="caixa, boletos, gerar-nota" />;
}
