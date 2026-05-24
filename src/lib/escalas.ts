import { prisma } from "./prisma";

// Quando um diarista é escalado (aceito) num dia, remove as candidaturas
// pendentes dele para OUTRAS vagas do mesmo dia. Assim a primeira loja que
// aceita "trava" o diarista naquele dia (ele só volta a se candidatar se desistir).
export async function limparOutrasInscricoesDoDia(
  diaristaId: string,
  data: string,
  excetoRequisicaoId?: string,
): Promise<void> {
  await prisma.inscricao.deleteMany({
    where: {
      diaristaId,
      ...(excetoRequisicaoId ? { requisicaoId: { not: excetoRequisicaoId } } : {}),
      requisicao: { data },
    },
  });
}
