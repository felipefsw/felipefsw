-- Avaliação passa a ser uma nota única de 1 a 5 estrelas (estilo iFood).
ALTER TABLE "Avaliacao" ADD COLUMN IF NOT EXISTS "estrelas" INTEGER NOT NULL DEFAULT 0;

-- Aspectos antigos viram opcionais (mantidos só para histórico).
ALTER TABLE "Avaliacao" ALTER COLUMN "pontualidade" DROP NOT NULL;
ALTER TABLE "Avaliacao" ALTER COLUMN "limpeza" DROP NOT NULL;
ALTER TABLE "Avaliacao" ALTER COLUMN "educacao" DROP NOT NULL;
ALTER TABLE "Avaliacao" ALTER COLUMN "rapidez" DROP NOT NULL;
ALTER TABLE "Avaliacao" ALTER COLUMN "habilidadeTecnica" DROP NOT NULL;
ALTER TABLE "Avaliacao" ALTER COLUMN "respeito" DROP NOT NULL;
ALTER TABLE "Avaliacao" ALTER COLUMN "espiritoEquipe" DROP NOT NULL;

-- Converte avaliações antigas (média 0-10 dos 7 aspectos) para 1-5 estrelas.
UPDATE "Avaliacao"
SET "estrelas" = GREATEST(1, LEAST(5, ROUND(
  (COALESCE("pontualidade", 0) + COALESCE("limpeza", 0) + COALESCE("educacao", 0)
   + COALESCE("rapidez", 0) + COALESCE("habilidadeTecnica", 0) + COALESCE("respeito", 0)
   + COALESCE("espiritoEquipe", 0)) / 7.0 / 2.0
)))
WHERE "estrelas" = 0 AND "pontualidade" IS NOT NULL;
