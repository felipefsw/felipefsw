import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const opcoes = [
  {
    href: "/lojas/nova",
    emoji: "🏪",
    titulo: "Lojista (loja)",
    desc: "Cadastra uma loja. Ela entra clicando no nome e cria a senha no 1º acesso.",
  },
  {
    href: "/gestores",
    emoji: "🧑‍💼",
    titulo: "Gestor",
    desc: "Cadastra um gestor (sócio) e vincula as lojas dele.",
  },
  {
    href: "/equipe",
    emoji: "🛠️",
    titulo: "RH / TI",
    desc: "Cadastra alguém da equipe de gestão (acesso completo).",
  },
  {
    href: "/diaristas/nova",
    emoji: "🧑‍🍳",
    titulo: "Diarista",
    desc: "Cadastra um diarista — ou use 'Convidar diarista' para o link de WhatsApp.",
  },
];

export default async function UsuariosPage() {
  const pendentes = await prisma.gestor.count({ where: { aprovado: false } });
  return (
    <div>
      <PageHeader title="Criar usuário" subtitle="Cadastre quem vai acessar o app" />

      <Link
        href="/solicitacoes"
        className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 hover:bg-amber-100"
      >
        <span>📥 Pedidos de acesso (autocadastro)</span>
        {pendentes > 0 && (
          <span className="rounded-full bg-amber-600 px-2 py-0.5 text-xs font-bold text-white">
            {pendentes}
          </span>
        )}
      </Link>

      <div className="space-y-3">
        {opcoes.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm hover:border-orange-300"
          >
            <span className="text-2xl">{o.emoji}</span>
            <span className="min-w-0">
              <span className="block font-semibold text-gray-900">{o.titulo}</span>
              <span className="block text-sm text-gray-500">{o.desc}</span>
            </span>
            <span className="ml-auto text-gray-400">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
