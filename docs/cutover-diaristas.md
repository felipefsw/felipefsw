# Checklist de cutover — Diaristas (Fase 1)

## Antes

- [ ] `npx tsx scripts/rederwp-inventario.ts` — contagens de `diaristas` / `diarias`
- [ ] `npx tsx scripts/rederwp-sync-diaristas.ts --dry` sem erros
- [ ] Sync real: diaristas com `rederwpId` no Postgres
- [ ] Lojas com `rederwpId` mapeadas (Fase 2 kickoff ou planilha manual)
- [ ] Amostragem: 20 diaristas (nome, CPF, Pix) conferidos RH
- [ ] Escalas futuras só no felipefsw (congelar criação no rederwp)
- [ ] Login com senha ativo (sem `*Direto` passwordless)
- [ ] `SESSION_SECRET` definido na Vercel

## Cutover

- [ ] Comunicar lojas/RH: URL do felipefsw é a oficial
- [ ] Menu `diarias-*` no rederwp → banner/redirect para felipefsw
- [ ] `api/app` diárias: proxy ou 410 com mensagem de migração
- [ ] App `ppf-diaria`: apontar `environment.prod.ts` para APIs novas (quando existirem) **ou** descontinuar em favor do PWA `/d/[token]`
- [ ] Monitorar SyncRun e tickets 48h

## Rollback (&lt; 1h)

- [ ] Remover redirect no rederwp; religar viewers `diarias-*`
- [ ] Manter Postgres intacto (não apagar `rederwpId`)
- [ ] Apps mobile voltam à base URL antiga

## Depois

- [ ] Importar `EscalaRederwpMap` pendentes → `Escala` onde houver loja mapeada
- [ ] Marcar `ModuloFlag.diaristas` ativo (já é sempre)
- [ ] Atualizar status na matriz em `docs/migracao-rederwp.md`
