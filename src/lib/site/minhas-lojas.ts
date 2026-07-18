/*
  Dados de EXEMPLO da visão "Minhas Lojas" do gestor (prévia). Fictícios.
  Resume, por loja, a saúde, a equipe do dia, vagas em andamento e pendências.
*/
export type ResumoLoja = {
  id: string;
  nome: string;
  gestorId: string;
  nota: number;
  tendencia: number;
  equipe: string; // presentes/escalados
  vagas: number; // vagas em andamento
  pendenciasCriticas: number;
};

export const MINHAS_LOJAS: ResumoLoja[] = [
  { id: "l1", nome: "Pizza Pizza — Aldeota", gestorId: "g1", nota: 82, tendencia: +3, equipe: "8/9", vagas: 1, pendenciasCriticas: 2 },
  { id: "l2", nome: "We Love Pizza — Cocó", gestorId: "g1", nota: 68, tendencia: -4, equipe: "6/7", vagas: 1, pendenciasCriticas: 3 },
  { id: "l5", nome: "Pizza Pizza — Messejana", gestorId: "g1", nota: 71, tendencia: +5, equipe: "7/7", vagas: 0, pendenciasCriticas: 1 },
  { id: "l3", nome: "Rei da Pizza — Maracanaú", gestorId: "g2", nota: 54, tendencia: -6, equipe: "5/7", vagas: 2, pendenciasCriticas: 4 },
  { id: "l4", nome: "Royal Pizza — Meireles", gestorId: "g2", nota: 88, tendencia: +1, equipe: "9/9", vagas: 0, pendenciasCriticas: 0 },
];
