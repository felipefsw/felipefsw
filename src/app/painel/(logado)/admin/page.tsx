import Link from "next/link";
import { CabecalhoPainel, superficie } from "@/components/painel/ui";
import { exigeEditar } from "@/lib/painel/papeis";
import { contextoPainel } from "@/lib/painel/sessao";

export const dynamic = "force-dynamic";

const TELAS = [
  {
    href: "/painel/admin/usuarios",
    nome: "Usuários e acessos",
    descricao: "Quem entra no painel e o papel de cada um em cada loja",
  },
  {
    href: "/painel/admin/parametros",
    nome: "Parâmetros e réguas",
    descricao: "Metas, custos e semáforos, com data de vigência",
  },
];

export default async function AdminPage() {
  const ctx = await contextoPainel();
  exigeEditar(ctx.acesso, ctx.storeId, "usuarios");

  return (
    <>
      <CabecalhoPainel titulo="Administração" subtitulo="Só o administrador da rede vê esta parte." />
      <ul className="space-y-2">
        {TELAS.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className={`${superficie} block p-4 hover:bg-white/5`}>
              <span className="block font-semibold">{t.nome}</span>
              <span className="block text-sm text-[var(--painel-texto-fraco)]">{t.descricao}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
