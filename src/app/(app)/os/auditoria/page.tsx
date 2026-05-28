import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, inputClass, labelClass, btnPrimary } from "@/components/ui";
import { executarAuditoriaSaipos } from "./actions";

export const dynamic = "force-dynamic";

export default async function NovaAuditoriaPage() {
  const lojas = await prisma.loja.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  const semChave = !process.env.ANTHROPIC_API_KEY;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Auditoria Financeira"
        subtitle="Cole o relatório bruto do Saipos para o Auditor analisar"
      />

      {semChave && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          ⚠️ <strong>ANTHROPIC_API_KEY</strong> não está definida. Configure no Vercel
          (Settings → Environment Variables) e faça redeploy antes de tentar executar.
        </div>
      )}

      <Card>
        <form action={executarAuditoriaSaipos} className="space-y-3">
          <div>
            <label htmlFor="titulo" className={labelClass}>
              Título (opcional)
            </label>
            <input
              id="titulo"
              name="titulo"
              type="text"
              placeholder="ex.: Centro — 28/05"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="lojaId" className={labelClass}>
              Loja (opcional)
            </label>
            <select id="lojaId" name="lojaId" className={inputClass} defaultValue="">
              <option value="">— Não especificar —</option>
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="entrada" className={labelClass}>
              Relatório bruto do Saipos
            </label>
            <textarea
              id="entrada"
              name="entrada"
              required
              minLength={20}
              rows={14}
              placeholder="Cole aqui o texto do fechamento do dia (formas de pagamento, vendas, motoboys, sangria, etc.)"
              className={`${inputClass} font-mono text-xs leading-relaxed`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Tudo o que você colar vai direto para o Auditor Financeiro. Tolerância de
              divergência: <strong>R$ 2,00</strong>.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <Link href="/os" className="text-sm text-gray-500 hover:underline">
              ← Voltar
            </Link>
            <button type="submit" className={btnPrimary}>
              Auditar
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
