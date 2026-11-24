// RBAC leve espelhando roles_permissions_config.php do rederwp.
// Não remove os logins atuais (gestao/loja/gestor/diarista); só adiciona flags.

import type { Sessao } from "@/lib/auth";

/** Pacote padrão por perfil de gestão (enquanto Membro.permissoes estiver vazio). */
export const PERMISSOES_PADRAO: Record<"rh" | "ti", string[]> = {
  rh: [
    "diarista_escalas",
    "diarista_pedidos",
    "diarista_diaristas",
    "diarista_ava_lojas",
    "diarista_ava_diaristas",
    "diarista_blocklist",
    "rh_funcionarios",
    "rh_aniversarios",
    "rh_seletivos",
    "rh_indicadores",
    "rh_fardamento",
    "rh_cargos",
    "ponto_dashboard",
    "ponto_cartao",
    "ponto_banco_hora",
    "ponto_ajustes",
    "ponto_folha_ponto",
  ],
  ti: [
    "diarista_escalas",
    "diarista_pedidos",
    "diarista_diaristas",
    "diarista_blocklist",
    "add_usuarios",
    "tec_dashboard",
    "tec_gestaoos",
    "tec_minhasos",
    "tec_itens",
    "tec_estoque",
    "tec_deslocamentos",
    "tec_config_ifood",
    "tec_config_ia",
    "espaco_trabalho_dashboard",
  ],
};

/** Todas as flags conhecidas (espelho do rederwp). */
export const TODAS_PERMISSOES: { grupo: string; flag: string; label: string }[] = [
  { grupo: "diaristas", flag: "diarista_escalas", label: "Escalas" },
  { grupo: "diaristas", flag: "diarista_pedidos", label: "Pedidos" },
  { grupo: "diaristas", flag: "diarista_diaristas", label: "Diaristas" },
  { grupo: "diaristas", flag: "diarista_ava_lojas", label: "Avaliação de lojas" },
  { grupo: "diaristas", flag: "diarista_ava_diaristas", label: "Avaliar diaristas" },
  { grupo: "diaristas", flag: "diarista_blocklist", label: "Blocklist" },
  { grupo: "rh", flag: "rh_funcionarios", label: "Funcionários" },
  { grupo: "rh", flag: "rh_aniversarios", label: "Aniversariantes" },
  { grupo: "rh", flag: "rh_seletivos", label: "Processos seletivos" },
  { grupo: "rh", flag: "rh_indicadores", label: "Indicadores RH" },
  { grupo: "rh", flag: "rh_fardamento", label: "Fardamento" },
  { grupo: "rh", flag: "rh_cargos", label: "Cargos" },
  { grupo: "ponto", flag: "ponto_dashboard", label: "Dashboard ponto" },
  { grupo: "ponto", flag: "ponto_cartao", label: "Cartão de ponto" },
  { grupo: "ponto", flag: "ponto_banco_hora", label: "Banco de horas" },
  { grupo: "ponto", flag: "ponto_ajustes", label: "Ajustes de ponto" },
  { grupo: "ponto", flag: "ponto_folha_ponto", label: "Folhas de ponto" },
  { grupo: "tecnologia", flag: "tec_dashboard", label: "Dashboard TI" },
  { grupo: "tecnologia", flag: "tec_gestaoos", label: "Gestão de OS" },
  { grupo: "tecnologia", flag: "tec_minhasos", label: "Minhas OS" },
  { grupo: "tecnologia", flag: "tec_itens", label: "Itens / patrimônio" },
  { grupo: "tecnologia", flag: "tec_estoque", label: "Estoque TI" },
  { grupo: "tecnologia", flag: "tec_deslocamentos", label: "Deslocamentos" },
  { grupo: "tecnologia", flag: "tec_config_ifood", label: "Lojas iFood" },
  { grupo: "tecnologia", flag: "tec_config_ia", label: "Configuração IA" },
  { grupo: "cadastro", flag: "add_usuarios", label: "Usuários e acessos" },
  { grupo: "espacos", flag: "espaco_trabalho_dashboard", label: "Espaços de trabalho" },
  { grupo: "financeiro", flag: "fin_caixa", label: "Caixa" },
  { grupo: "cd", flag: "cd_estoque", label: "Estoque CD" },
  { grupo: "nutricao", flag: "nut_inspecao", label: "Inspeção nutricional" },
  { grupo: "frotas", flag: "frota_dashboard", label: "Dashboard frota" },
  { grupo: "operacional", flag: "operacional_tarefas", label: "Tarefas" },
  { grupo: "operacional", flag: "operacional_chamados", label: "Chamados" },
];

export function permissoesEfetivas(
  sessao: Sessao | null,
  extras: string[] = [],
): Set<string> {
  if (!sessao || sessao.tipo !== "gestao") return new Set();
  const base = extras.length > 0 ? extras : PERMISSOES_PADRAO[sessao.perfil] ?? [];
  return new Set(base);
}

export function pode(flags: Set<string>, flag: string): boolean {
  return flags.has(flag);
}
