import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { garantirAgentes } from "@/lib/agentesDb";
import {
  Card,
  PageHeader,
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
} from "@/components/ui";
import { salvarAgente } from "./actions";

export const dynamic = "force-dynamic";

export default async function EditarAgentePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await garantirAgentes();
  const { slug } = await params;

  const agente = await prisma.agente.findUnique({ where: { slug } });
  if (!agente) notFound();

  const salvar = salvarAgente.bind(null, slug);

  return (
    <div className="space-y-4">
      <PageHeader title={agente.nome} subtitle={`Slug: ${agente.slug}`} />

      <Card>
        <form action={salvar} className="space-y-3">
          <div>
            <label htmlFor="nome" className={labelClass}>
              Nome
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              defaultValue={agente.nome}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="descricao" className={labelClass}>
              Descrição
            </label>
            <input
              id="descricao"
              name="descricao"
              type="text"
              defaultValue={agente.descricao}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="modelo" className={labelClass}>
              Modelo
            </label>
            <select
              id="modelo"
              name="modelo"
              defaultValue={agente.modelo}
              className={inputClass}
            >
              <option value="claude-opus-4-7">
                claude-opus-4-7 (mais capaz — recomendado)
              </option>
              <option value="claude-sonnet-4-6">
                claude-sonnet-4-6 (rápido, ótimo custo-benefício)
              </option>
              <option value="claude-haiku-4-5">
                claude-haiku-4-5 (mais barato e rápido)
              </option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="ativo"
              name="ativo"
              type="checkbox"
              defaultChecked={agente.ativo}
              className="h-4 w-4 rounded border-gray-300 text-orange-700"
            />
            <label htmlFor="ativo" className="text-sm text-gray-700">
              Ativo
            </label>
          </div>

          <div>
            <label htmlFor="systemPrompt" className={labelClass}>
              System Prompt
            </label>
            <textarea
              id="systemPrompt"
              name="systemPrompt"
              defaultValue={agente.systemPrompt}
              required
              rows={22}
              className={`${inputClass} font-mono text-xs leading-relaxed`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Este texto é enviado como System Prompt em <strong>toda</strong> execução do agente
              e fica em cache no Claude (prompt caching) — mudanças invalidam o cache, custando
              ~1.25× nos primeiros tokens da próxima execução.
            </p>
          </div>

          <div className="flex justify-between gap-2 pt-2">
            <Link href="/os/agentes" className={btnSecondary}>
              Cancelar
            </Link>
            <button type="submit" className={btnPrimary}>
              Salvar
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
