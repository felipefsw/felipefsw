# Checklists de cutover (Fases 2–10)

Copiar o padrão de [cutover-diaristas.md](../cutover-diaristas.md).

## Fase 2 — Mestres

- [ ] `npm run rederwp:sync-lojas`
- [ ] `npm run rederwp:sync-usuarios`
- [ ] Conferir `Loja.rederwpId` e `Membro.rederwpAcessoId`
- [ ] UI usuários/permissoes em `/modulos/mestres` (implementar além do scaffold)
- [ ] Cutover: cadastro de login só no felipefsw

## Fase 3 — RH

- [ ] Models Funcionario + documentos
- [ ] Portal colaborador
- [ ] API compatível `api/app/funcionarios`
- [ ] Cutover `ppf-funcionarios`

## Fase 4 — Ponto

- [ ] Models ponto + webhooks
- [ ] Preservar `caminhos/cron_ponto_*` e `rwp-ponto`
- [ ] Cutover `ppf-app-ponto`

## Fase 5 — TI

- [ ] Chamados/OS/patrimônio
- [ ] Cutover `ppf-app-ti` + WhatsApp bridge

## Fase 6 — Operacional

- [ ] Tarefas/checking/reclamações/iFood gestão
- [ ] Cutover `ppf-app-check`

## Fase 7 — Nutrição

- [ ] Inspeções + planos
- [ ] Cutover `ppf-app-nutri`

## Fase 8 — CD / Frotas

- [ ] CD multi + frota
- [ ] Cutover estoque + driver

## Fase 9 — Financeiro

- [ ] Caixa/boletos/conciliação
- [ ] NF-e: worker PHP híbrido se necessário

## Fase 10 — Extras

- [ ] Workspaces, marketing, recepção, TVs, `api/agent`

## Fase 11

Ver [cutover-desligar-rederwp.md](../cutover-desligar-rederwp.md).
