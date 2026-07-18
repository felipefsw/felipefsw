/*
  Dados de EXEMPLO do Dashboard de Ponto Eletrônico (prévia). Fictícios.
  Foco pedido: quem está trabalhando hoje, quem faltou e quem ainda vai entrar.
*/
import type { Faixa } from "@/lib/site/portal";

export type StatusPonto = "Trabalhando" | "Almoço" | "A entrar" | "Atrasado" | "Faltou" | "Saiu";

export type ColaboradorPonto = {
  nome: string;
  cargo: string;
  previsto: string; // janela prevista
  entrada: string; // marcação real ou "—"
  status: StatusPonto;
  faixa: Faixa;
};

export const PONTO_HOJE: ColaboradorPonto[] = [
  { nome: "Marina Souza", cargo: "Gerente", previsto: "10:00 – 18:00", entrada: "09:58", status: "Trabalhando", faixa: "saudavel" },
  { nome: "Rafael Lima", cargo: "Pizzaiolo", previsto: "17:00 – 23:00", entrada: "—", status: "A entrar", faixa: "atencao" },
  { nome: "Carla Nunes", cargo: "Atendente", previsto: "11:00 – 19:00", entrada: "11:00", status: "Almoço", faixa: "saudavel" },
  { nome: "Diego Alves", cargo: "Motoboy", previsto: "18:00 – 00:00", entrada: "—", status: "A entrar", faixa: "atencao" },
  { nome: "Paula Reis", cargo: "Atendente", previsto: "10:00 – 18:00", entrada: "10:23", status: "Atrasado", faixa: "atencao" },
  { nome: "Tiago Melo", cargo: "Pizzaiolo", previsto: "10:00 – 18:00", entrada: "—", status: "Faltou", faixa: "critico" },
  { nome: "Bianca Rocha", cargo: "Caixa", previsto: "09:00 – 15:00", entrada: "08:57", status: "Saiu", faixa: "saudavel" },
];

export const PONTO_RESUMO = {
  trabalhando: 2,
  almoco: 1,
  aEntrar: 2,
  atrasos: 1,
  faltas: 1,
  justificativasPendentes: 3,
  bancoHorasSaldo: "+12h30",
};
