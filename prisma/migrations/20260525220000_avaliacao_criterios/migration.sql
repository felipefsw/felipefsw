-- Critérios pedidos pelo RH para avaliar o diarista (1 a 5). Pontualidade e
-- limpeza já existem; o resto é novo.
ALTER TABLE "Avaliacao" ADD COLUMN IF NOT EXISTS "assiduidade" INTEGER;
ALTER TABLE "Avaliacao" ADD COLUMN IF NOT EXISTS "padrao" INTEGER;
ALTER TABLE "Avaliacao" ADD COLUMN IF NOT EXISTS "organizacao" INTEGER;
ALTER TABLE "Avaliacao" ADD COLUMN IF NOT EXISTS "qualidade" INTEGER;
ALTER TABLE "Avaliacao" ADD COLUMN IF NOT EXISTS "comunicacao" INTEGER;
