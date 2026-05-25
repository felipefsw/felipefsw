import { prisma } from "./prisma";

// Quando uma vaga é preenchida, "desconvoca" quem foi convidado e não foi
// escolhido: marca as convocações pendentes daquela requisição como CANCELADA,
// para sumir do app do diarista e não ficar como possibilidade na loja.
export async function cancelarConvocacoesPendentes(
  requisicaoId: string,
  exceto?: string,
): Promise<void> {
  await prisma.convocacao.updateMany({
    where: {
      requisicaoId,
      status: "PENDENTE",
      ...(exceto ? { diaristaId: { not: exceto } } : {}),
    },
    data: { status: "CANCELADA" },
  });
}

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
