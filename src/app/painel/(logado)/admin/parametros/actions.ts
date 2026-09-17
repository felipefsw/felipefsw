"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigeEditar } from "@/lib/painel/papeis";
import { contextoPainel } from "@/lib/painel/sessao";
import { dataDoTexto } from "@/lib/painel/opsDate";
import { TODAS_AS_CHAVES, type ChaveParametro } from "@/lib/painel/parametros";

const DESTINO = "/painel/admin/parametros";

function chaveValida(v: string): v is ChaveParametro {
  return (TODAS_AS_CHAVES as string[]).includes(v);
}

/**
 * Grava um valor novo para um parâmetro.
 *
 * O book é explícito (seção 7.1): alterar um parâmetro CRIA UMA LINHA NOVA com
 * `valid_from`, e cálculos anteriores continuam com o valor antigo. Por isso
 * aqui só se cria linha; a única atualização possível é corrigir uma linha da
 * MESMA data de vigência, que ainda não valeu para nenhum dia anterior a ela.
 */
export async function salvarParametro(formData: FormData) {
  const ctx = await contextoPainel();
  exigeEditar(ctx.acesso, ctx.storeId, "parametros");

  const key = String(formData.get("key") ?? "");
  const escopo = String(formData.get("escopo") ?? "loja");
  const valorTexto = String(formData.get("valor") ?? "").trim().replace(",", ".");
  const vigenciaTexto = String(formData.get("vigencia") ?? "").trim();

  if (!chaveValida(key)) redirect(`${DESTINO}?erro=chave`);

  const valueNum = Number(valorTexto);
  if (valorTexto === "" || Number.isNaN(valueNum)) redirect(`${DESTINO}?erro=valor`);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(vigenciaTexto)) redirect(`${DESTINO}?erro=vigencia`);
  const validFrom = dataDoTexto(vigenciaTexto);

  // Parâmetro da rede só o admin da rede mexe; o gestor mexe nos da loja dele.
  const daRede = escopo === "rede";
  if (daRede) exigeEditar(ctx.acesso, ctx.storeId, "usuarios");
  const storeId = daRede ? null : ctx.storeId;

  const existente = await prisma.param.findFirst({
    where: { storeId, key, validFrom },
    select: { id: true },
  });

  if (existente) {
    await prisma.param.update({ where: { id: existente.id }, data: { valueNum } });
  } else {
    await prisma.param.create({
      data: { storeId, key, valueNum, validFrom, createdBy: ctx.userId },
    });
  }

  revalidatePath(DESTINO);
  redirect(`${DESTINO}?ok=1`);
}
