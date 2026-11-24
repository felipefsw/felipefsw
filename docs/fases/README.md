# Fases 2–10 — scaffolds

Cada domínio tem:

1. Entrada em `/modulos/<slug>` (feature-flagged)
2. Linha na matriz `docs/migracao-rederwp.md`
3. Flag `ModuloFlag` / `MODULES_ENABLED`

## Como avançar uma fase

1. Ativar flag só em staging: `MODULES_ENABLED=rh` ou `UPDATE ModuloFlag SET ativo=true WHERE slug='rh'`
2. Implementar Prisma models + UI sob `/modulos/<slug>/...`
3. Sync/import scripts em `scripts/rederwp-sync-<dominio>.ts`
4. Checklist de cutover (copiar `docs/cutover-diaristas.md`)
5. Cutover produção + atualizar matriz

## Mapa rápido

| Fase | Slug | App mobile |
|------|------|------------|
| 2 | mestres | — |
| 3 | rh | ppf-funcionarios |
| 4 | ponto | ppf-app-ponto |
| 5 | tecnologia | ppf-app-ti |
| 6 | operacional | ppf-app-check |
| 7 | nutricao | ppf-app-nutri |
| 8 | cd / frotas | ppf-app-estoque / ppf-app-driver |
| 9 | financeiro | — |
| 10 | espacos / marketing / recepcao | agent / TVs |
