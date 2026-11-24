# Migração rederwp → felipefsw

Documento vivo. Destino: este repositório. Modo: domínio a domínio (dois sistemas vivos até o cutover).

## Decisões

- Destino: **felipefsw** (Next.js + Prisma/Postgres).
- Não quebrar: escala, lojas, diaristas, pagamentos, check-in, auth.
- Apps mobile (`ppf-*`) só mudam de base URL quando a API do domínio existir aqui.

## Matriz domínio → artefatos

| Fase | Domínio | rederwp viewers | runs/API | Tabelas MySQL (principais) | felipefsw alvo | Status |
|------|---------|-----------------|----------|----------------------------|----------------|--------|
| 0 | Fundação | — | — | — | RBAC, ModuloFlag, SyncRun, `lib/rederwp` | em curso |
| 1 | Diaristas | `diarias-*` | `diarias_*.php`, `api/app/diarias*` | `diaristas`, `diarias`, `diaria_avaliacoes` | `Diarista`, `Escala`, `BancoLoja`, `EscalaRederwpMap` | kickoff |
| 2 | Mestres | `edit-login`, lojas | `roles_lib`, `acesso_lojas` | `acesso`, `roles_acess`, `lojas` | `Loja.rederwpId`, `Membro.permissoes` | scaffold |
| 3 | RH | `funcionarios`, seletivos, fardamento | `db_*funcionario*`, `api/app/funcionarios` | `funcionarios`, `processos_seletivos` | `/modulos/rh` | scaffold |
| 4 | Ponto | `dashboard-ponto`, cartão, Fortes | `cron_ponto_*`, `api/app/ponto` | `ponto_registros`, `cartao_ponto_dia` | `/modulos/ponto` | scaffold |
| 5 | TI | `gestao-os`, chamados, estoque-ti | `os_ti_*`, `api/app/ti` | `chamados`, `os_ti` | `/modulos/tecnologia` | scaffold |
| 6 | Operacional | tarefas, checking, reclamações, iFood | `tarefas/*`, `api/app/check` | `tarefas_instancias`, `gestao_reclamacoes` | `/modulos/operacional` | scaffold |
| 7 | Nutrição | inspeção, planos | `db_*inspecao*`, `api/app/nutri` | `inspecao_nutricional_*` | `/modulos/nutricao` | scaffold |
| 8 | CD / Frota | estoque, KDS, carros | `compras_cd_*`, `api/app/estoque`, `driver` | `centros_distribuicao`, `frotas_*` | `/modulos/cd`, `/modulos/frotas` | scaffold |
| 9 | Financeiro | caixa, boletos, NF-e | `financeiro_*`, nfephp | `financeiro_*`, boletos | `/modulos/financeiro` | scaffold |
| 10 | Extras | workspaces, marketing, recepção, TVs | `workspaces_lib`, `api/agent` | `workspaces`, `cw_*`, `recep_*` | `/modulos/espacos` etc. | scaffold |
| 11 | Desligar | redirects | crons `caminhos/` | MySQL read-only | remover `lib/rederwp` | pendente |

## Scripts

```bash
# Inventário MySQL (precisa REDERWP_DB_*)
npx tsx scripts/rederwp-inventario.ts

# Sync diaristas (idempotente; --dry só imprime)
npx tsx scripts/rederwp-sync-diaristas.ts --dry
npx tsx scripts/rederwp-sync-diaristas.ts

# Seed das flags de módulo
npx tsx scripts/seed-modulos.ts
```

## Feature flags

- Tabela `ModuloFlag` + env `MODULES_ENABLED=rh,ponto,...`
- `diaristas` é sempre ativo.
- Hub: `/modulos`

## Critério de cutover (todo domínio)

Ver também [cutover-diaristas.md](./cutover-diaristas.md).

1. Paridade mínima acordada  
2. Dados reconciliados  
3. Permissões testadas  
4. App mobile em staging (se houver)  
5. Crons/webhooks no novo host  
6. Rollback &lt; 1h (religar menu no rederwp)

## Env novas

```
REDERWP_DB_HOST=
REDERWP_DB_PORT=3306
REDERWP_DB_USER=
REDERWP_DB_PASSWORD=
REDERWP_DB_NAME=
MODULES_ENABLED=
SESSION_SECRET=  # obrigatório em produção
```
