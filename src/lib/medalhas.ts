import { prisma } from "./prisma";
import { mediaDaAvaliacao } from "./bonificacoes";

export type Medalha = { emoji: string; nome: string };

function horaDe(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Calcula as medalhas conquistadas por um diarista a partir do histórico.
export async function medalhasDoDiarista(diaristaId: string): Promise<Medalha[]> {
  const [escalas, avals, diarista] = await Promise.all([
    prisma.escala.findMany({
      where: { diaristaId },
      select: { presenca: true, horaInicio: true, checkinEm: true },
    }),
    prisma.avaliacao.findMany({ where: { diaristaId } }),
    prisma.diarista.findUnique({ where: { id: diaristaId }, select: { funcao: true } }),
  ]);

  const presentes = escalas.filter((e) => e.presenca === "PRESENTE").length;
  const faltas = escalas.filter((e) => e.presenca === "FALTOU").length;
  const total = presentes + faltas;
  const media =
    avals.length >= 5
      ? avals.reduce((s, a) => s + mediaDaAvaliacao(a as unknown as Record<string, number>), 0) /
        avals.length
      : null;

  let pontuais = 0;
  let comCheckin = 0;
  for (const e of escalas) {
    if (e.checkinEm && e.horaInicio) {
      comCheckin++;
      if (horaDe(e.checkinEm) <= e.horaInicio) pontuais++;
    }
  }

  const m: Medalha[] = [];
  if (presentes >= 20) m.push({ emoji: "🏅", nome: "Veterano" });
  else if (presentes >= 10) m.push({ emoji: "🎖️", nome: "Experiente" });
  if (media !== null && media >= 9) m.push({ emoji: "⭐", nome: "Super bem avaliado" });
  if (total >= 10 && faltas / total <= 0.05) m.push({ emoji: "✅", nome: "Presença certa" });
  if (diarista?.funcao === "Pizzaiolo" && presentes >= 10 && (media ?? 0) >= 9)
    m.push({ emoji: "🍕", nome: "Mestre da Massa" });
  if (comCheckin >= 5 && pontuais / comCheckin >= 0.9)
    m.push({ emoji: "⏱️", nome: "Sempre no horário" });
  return m;
}
