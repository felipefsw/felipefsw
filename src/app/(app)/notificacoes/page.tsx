import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

type Item = {
  emoji: string;
  titulo: string;
  desc: string;
  href: string;
  count: number;
  cor: string;
};

export default async function NotificacoesPage() {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 2);

  const [cadastrosPend, inscricoesPend, requisicoesAbertas, aceitesRecentes, mensagensNL] =
    await Promise.all([
      prisma.diarista.count({ where: { aprovado: false, ativo: true } }),
      prisma.inscricao.count({ where: { status: "PENDENTE" } }),
      prisma.requisicao.count({ where: { status: "ABERTA" } }),
      prisma.convocacao.count({ where: { status: "ACEITA", criadoEm: { gte: ontem } } }),
      prisma.mensagem.count({ where: { autor: "DIARISTA", lida: false } }),
    ]);

  const itens: Item[] = [
    {
      emoji: "✋",
      titulo: "Cadastros aguardando aprovação",
      desc: "Diaristas que se cadastraram pelo link e precisam do seu OK.",
      href: "/diaristas",
      count: cadastrosPend,
      cor: "border-amber-200 bg-amber-50 text-amber-900",
    },
    {
      emoji: "📋",
      titulo: "Solicitações de diaristas",
      desc: "Quem se candidatou às vagas e ainda não foi alocado.",
      href: "/sugestoes",
      count: inscricoesPend,
      cor: "border-orange-200 bg-orange-50 text-orange-900",
    },
    {
      emoji: "🏪",
      titulo: "Vagas em aberto",
      desc: "Pedidos das lojas esperando ser preenchidos.",
      href: "/requisicoes",
      count: requisicoesAbertas,
      cor: "border-red-200 bg-red-50 text-red-900",
    },
    {
      emoji: "✅",
      titulo: "Convites aceitos (últimas 48h)",
      desc: "Diaristas que confirmaram a diária recentemente.",
      href: "/escala",
      count: aceitesRecentes,
      cor: "border-green-200 bg-green-50 text-green-900",
    },
    {
      emoji: "💬",
      titulo: "Mensagens não lidas",
      desc: "Diaristas falando com você.",
      href: "/mensagens",
      count: mensagensNL,
      cor: "border-blue-200 bg-blue-50 text-blue-900",
    },
  ];

  const total = itens.reduce((s, i) => s + i.count, 0);

  return (
    <div className="space-y-4">
      <PageHeader title="Notificações" subtitle="O que precisa da sua atenção" />

      {total === 0 ? (
        <EmptyState>Tudo em dia! 🎉 Nada precisa de atenção agora.</EmptyState>
      ) : (
        <div className="space-y-2">
          {itens
            .filter((i) => i.count > 0)
            .map((i) => (
              <Link
                key={i.titulo}
                href={i.href}
                className={`flex items-center gap-3 rounded-xl border p-3 shadow-sm transition hover:opacity-90 ${i.cor}`}
              >
                <span className="text-2xl">{i.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{i.titulo}</span>
                  <span className="block text-xs opacity-80">{i.desc}</span>
                </span>
                <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-sm font-bold">
                  {i.count}
                </span>
                <span className="text-xl opacity-60">›</span>
              </Link>
            ))}
        </div>
      )}

      {/* Itens zerados em cinza para o RH saber que existe a seção */}
      {total > 0 && itens.some((i) => i.count === 0) && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Sem novidades
          </p>
          <div className="grid grid-cols-2 gap-2">
            {itens
              .filter((i) => i.count === 0)
              .map((i) => (
                <Link
                  key={i.titulo}
                  href={i.href}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-500"
                >
                  <span>{i.emoji}</span>
                  <span className="min-w-0 truncate">{i.titulo}</span>
                </Link>
              ))}
          </div>
        </div>
      )}

      <Card>
        <p className="text-xs text-gray-500">
          A contagem do sininho 🔔 é a soma de <strong>cadastros pendentes</strong>,{" "}
          <strong>solicitações de diaristas</strong> e <strong>mensagens não lidas</strong>.
        </p>
      </Card>
    </div>
  );
}
