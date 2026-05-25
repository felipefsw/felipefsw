import { prisma } from "./prisma";
import { mediaDaAvaliacao } from "./bonificacoes";

export type Medalha = { emoji: string; nome: string };

// Patentes por nº de diárias realizadas. A diarista fica na maior patente que alcançou.
export type Patente = { min: number; emoji: string; nome: string };

export const PATENTES: Patente[] = [
  { min: 5, emoji: "🥉", nome: "Bronze" },
  { min: 10, emoji: "🥈", nome: "Prata" },
  { min: 20, emoji: "🥇", nome: "Ouro" },
  { min: 50, emoji: "💎", nome: "Platina" },
  { min: 100, emoji: "💠", nome: "Diamante" },
  { min: 200, emoji: "🏆", nome: "Mestre" },
  { min: 500, emoji: "👑", nome: "Lenda" },
  { min: 1000, emoji: "🔥", nome: "Imortal" },
];

/** Maior patente alcançada com o nº de diárias (null se ainda não atingiu 5). */
export function patenteDeDiarias(diarias: number): Patente | null {
  let atual: Patente | null = null;
  for (const p of PATENTES) if (diarias >= p.min) atual = p;
  return atual;
}

/** Próxima patente a alcançar (null se já está na máxima). */
export function proximaPatente(diarias: number): Patente | null {
  return PATENTES.find((p) => diarias < p.min) ?? null;
}

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
      ? avals.reduce((s, a) => s + mediaDaAvaliacao(a), 0) / avals.length
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
  if (presentes >= 50) m.push({ emoji: "🏅", nome: "Veterano" });
  else if (presentes >= 30) m.push({ emoji: "🎖️", nome: "Experiente" });
  if (media !== null && media >= 4.5) m.push({ emoji: "⭐", nome: "Super bem avaliado" });
  if (total >= 10 && faltas / total <= 0.05) m.push({ emoji: "✅", nome: "Presença certa" });
  if (diarista?.funcao === "Pizzaiolo" && presentes >= 10 && (media ?? 0) >= 4.5)
    m.push({ emoji: "🍕", nome: "Mestre da Massa" });
  if (comCheckin >= 5 && pontuais / comCheckin >= 0.9)
    m.push({ emoji: "⏱️", nome: "Sempre no horário" });
  return m;
}
