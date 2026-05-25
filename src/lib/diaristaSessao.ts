import { notFound, redirect } from "next/navigation";
import { prisma } from "./prisma";
import { acessoSemSenha, getSessao } from "./auth";

export type DiaristaChrome = { id: string; nome: string; fotoUrl: string | null };

// Carrega a diarista pelo token e aplica as mesmas regras de acesso do app:
// link inválido → 404; sem senha (1º acesso) → tela de criar senha;
// sem sessão deste diarista → login. Devolve dados básicos quando autorizado.
export async function exigirDiarista(token: string): Promise<DiaristaChrome> {
  const diarista = await prisma.diarista.findUnique({
    where: { token },
    select: { id: true, nome: true, fotoUrl: true, senha: true },
  });
  if (!diarista) notFound();

  const sessao = await getSessao();
  const sessaoDoDiarista = sessao?.tipo === "diarista" && sessao.diaristaId === diarista.id;

  if (!diarista.senha && !(acessoSemSenha() && sessaoDoDiarista)) {
    redirect(`/d/${token}/criar-senha`);
  }
  if (!sessaoDoDiarista) {
    redirect("/entrar?perfil=diarista");
  }

  return { id: diarista.id, nome: diarista.nome, fotoUrl: diarista.fotoUrl };
}

// Versão sem redirecionar, para o layout decidir se mostra a "moldura" (menu/topo).
export async function diaristaAutenticado(
  token: string,
): Promise<DiaristaChrome | null> {
  const diarista = await prisma.diarista.findUnique({
    where: { token },
    select: { id: true, nome: true, fotoUrl: true, senha: true },
  });
  if (!diarista) return null;

  const sessao = await getSessao();
  const sessaoDoDiarista = sessao?.tipo === "diarista" && sessao.diaristaId === diarista.id;
  if (!sessaoDoDiarista) return null;
  if (!diarista.senha && !acessoSemSenha()) return null;

  return { id: diarista.id, nome: diarista.nome, fotoUrl: diarista.fotoUrl };
}
