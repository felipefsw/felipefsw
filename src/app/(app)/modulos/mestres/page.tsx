import { redirect } from "next/navigation";
import ModuloEmMigracao from "@/components/ModuloEmMigracao";
import { moduloAtivo } from "@/lib/modulos-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!(await moduloAtivo("mestres"))) redirect("/modulos");
  return <ModuloEmMigracao titulo="Cadastros mestres" fase={2} origem="edit-login.php, lojas, roles_acess" />;
}
