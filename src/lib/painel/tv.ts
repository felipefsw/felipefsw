// Modo TV (seção 8 do /docs/BUILD_BOOK.md).
//
// A TV da loja abre `/painel/tv/:storeId?token=...` sem ninguém logado. Este
// módulo existe só para TRADUZIR o token em uma loja: ele não expõe nenhuma
// função de escrita, e é o único caminho de leitura sem sessão do Painel.

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/** Quanto tempo um token de TV vale, em dias. */
export const DIAS_DE_VALIDADE_DO_TOKEN = 180;

/**
 * Devolve a loja do token quando ele existe, não expirou e a loja está ativa.
 * Em qualquer outro caso devolve null — a tela mostra "link expirado".
 */
export async function lojaDoTokenTv(
  storeId: string,
  token: string | null | undefined,
): Promise<{ id: string; name: string } | null> {
  if (!token) return null;
  const registro = await prisma.tvToken.findUnique({
    where: { token },
    select: { storeId: true, expires: true, store: { select: { id: true, name: true, active: true } } },
  });
  if (!registro) return null;
  if (registro.storeId !== storeId) return null;
  if (registro.expires.getTime() <= Date.now()) return null;
  if (!registro.store.active) return null;
  return { id: registro.store.id, name: registro.store.name };
}

/** Gera um token novo de TV para a loja. Só quem edita parâmetros pode chamar. */
export async function criarTokenTv(storeId: string, criadoPor?: string) {
  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + DIAS_DE_VALIDADE_DO_TOKEN * 24 * 60 * 60 * 1000);
  return prisma.tvToken.create({
    data: { storeId, token, expires, createdBy: criadoPor ?? null },
    select: { token: true, expires: true },
  });
}
