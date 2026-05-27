-- Limpa a base de diaristas: desativa todos, exceto:
--   - Daniel Nogueira, Aline Gonçalves, Felipe teste, Sydnaria
--   - Cadastros feitos nos últimos 7 dias (criadoEm)
-- Desativar (ativo=false) é reversível — o RH pode reativar pela tela.

UPDATE "Diarista"
SET "ativo" = false
WHERE "ativo" = true
  AND NOT (
    "nome" ~* 'daniel.*nogueira'
    OR "nome" ~* 'aline.*gon[cç]alves'
    OR "nome" ~* 'felipe.*teste'
    OR "nome" ~* 'sydn[aá]ria'
    OR "criadoEm" > (NOW() - INTERVAL '7 days')
  );
