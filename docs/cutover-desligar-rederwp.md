# Fase 11 — Desligar rederwp

Só executar quando **todas** as fases 1–10 estiverem em cutover.

## Checklist

- [ ] Matriz em `docs/migracao-rederwp.md` com todos os domínios em status "cortado"
- [ ] Nenhum app `ppf-*` apontando para `rederwp.com/api/app`
- [ ] Crons em `caminhos/` migrados ou desligados
- [ ] Webhooks (ponto, WhatsApp, Saipos, CW) no felipefsw / workers novos
- [ ] DNS / redirects: `rederwp.com` → domínio do felipefsw (ou página de aviso)
- [ ] MySQL rederwp em read-only + backup completo
- [ ] Remover `src/lib/rederwp/` e scripts `rederwp:*` (ou arquivar em branch)
- [ ] Remover env `REDERWP_DB_*` da Vercel após período de retenção
- [ ] Comunicar rede (lojas, RH, TI, franqueados)

## Rollback de emergência

Manter snapshot MySQL + deploy PHP do rederwp por pelo menos 30 dias após o desligamento.
