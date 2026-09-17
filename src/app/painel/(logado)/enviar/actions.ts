"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigeEditar } from "@/lib/painel/papeis";
import { contextoPainel } from "@/lib/painel/sessao";
import { FUSO_LOJA_HORAS } from "@/lib/painel/opsDate";
import { TIPOS_DE_ARQUIVO, type TipoDeArquivo } from "@/lib/painel/ingestao/tipos";
import { apagarEnvio, receberArquivo } from "@/lib/painel/ingestao";

const DESTINO = "/painel/enviar";

/** Quantos arquivos por vez. Evita uma requisição gigante travar o servidor. */
const MAXIMO_DE_ARQUIVOS = 20;

export async function enviarArquivos(formData: FormData) {
  const ctx = await contextoPainel();
  // Enviar relatório é operação do dia a dia: gerente para cima (seção 3).
  exigeEditar(ctx.acesso, ctx.storeId, "operacao");

  const escolhido = String(formData.get("tipo") ?? "");
  const tipoManual = (TIPOS_DE_ARQUIVO as readonly string[]).includes(escolhido)
    ? (escolhido as TipoDeArquivo)
    : null;

  const arquivos = formData
    .getAll("arquivos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (arquivos.length === 0) redirect(`${DESTINO}?erro=vazio`);
  if (arquivos.length > MAXIMO_DE_ARQUIVOS) redirect(`${DESTINO}?erro=muitos`);

  const loja = await prisma.store.findUnique({
    where: { id: ctx.storeId },
    select: { tz: true },
  });

  const ids: string[] = [];
  const repetidos: string[] = [];
  for (const arquivo of arquivos) {
    const r = await receberArquivo({
      storeId: ctx.storeId,
      fusoHoras: fusoDaLoja(loja?.tz),
      nomeArquivo: arquivo.name,
      bytes: Buffer.from(await arquivo.arrayBuffer()),
      tipoManual,
      criadoPor: ctx.userId,
    });
    ids.push(r.uploadId);
    // Arquivo que já tinha vindo antes: nada foi regravado, e a tela precisa
    // dizer isso, senão parece que o envio não funcionou.
    if (r.jaExistia) repetidos.push(arquivo.name);
  }

  revalidatePath(DESTINO);
  const params = new URLSearchParams({ enviados: ids.join(",") });
  if (repetidos.length > 0) params.set("repetidos", repetidos.join("|"));
  redirect(`${DESTINO}?${params}`);
}

export async function apagarEnvioAction(formData: FormData) {
  const ctx = await contextoPainel();
  exigeEditar(ctx.acesso, ctx.storeId, "operacao");

  await apagarEnvio(String(formData.get("uploadId") ?? ""), ctx.storeId);

  revalidatePath(DESTINO);
  redirect(`${DESTINO}?ok=apagado`);
}

/**
 * Fuso da loja em horas. Hoje todas as lojas da rede ficam em Fortaleza, que
 * não tem horário de verão; se entrar loja em outro fuso, esta função é o
 * único lugar a mudar.
 */
function fusoDaLoja(tz: string | undefined): number {
  if (!tz || tz === "America/Fortaleza") return FUSO_LOJA_HORAS;
  const agora = new Date();
  const local = new Date(agora.toLocaleString("en-US", { timeZone: tz }));
  const utc = new Date(agora.toLocaleString("en-US", { timeZone: "UTC" }));
  return Math.round((local.getTime() - utc.getTime()) / 3_600_000);
}
