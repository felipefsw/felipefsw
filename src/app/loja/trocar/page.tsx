import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { getSessao } from "@/lib/auth";
import { trocarLoja } from "../actions";

export const dynamic = "force-dynamic";

export default async function TrocarLojaPage() {
  const sessao = await getSessao();
  if (!sessao || sessao.tipo !== "gestor") redirect("/entrar");

  const lojas = await prisma.loja.findMany({
    where: { gestores: { some: { id: sessao.gestorId } }, ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, bairro: true, cidade: true },
  });

  return (
    <div>
      <PageHeader title="Trocar loja" subtitle="Escolha em qual loja você quer operar" />
      <div className="space-y-2">
        {lojas.map((l) => (
          <form key={l.id} action={trocarLoja}>
            <input type="hidden" name="lojaId" value={l.id} />
            <button type="submit" className="w-full text-left">
              <Card
                className={`hover:bg-gray-50 ${l.id === sessao.lojaId ? "border-orange-400" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{l.nome}</p>
                    {(l.bairro || l.cidade) && (
                      <p className="text-sm text-gray-500">
                        {[l.bairro, l.cidade].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  {l.id === sessao.lojaId && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      atual
                    </span>
                  )}
                </div>
              </Card>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
