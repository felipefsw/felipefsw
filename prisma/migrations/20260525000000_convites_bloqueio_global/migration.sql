-- Bloqueio global da diarista (RH), confirmação que não marca presença,
-- e convocações enriquecidas (viram convite que, ao ser aceito, gera a escala).

ALTER TABLE "Diarista" ADD COLUMN IF NOT EXISTS "bloqueadoAte" TIMESTAMP(3);

ALTER TABLE "Escala" ADD COLUMN IF NOT EXISTS "confirmadaEm" TIMESTAMP(3);

ALTER TABLE "Convocacao" ADD COLUMN IF NOT EXISTS "horaInicio" TEXT;
ALTER TABLE "Convocacao" ADD COLUMN IF NOT EXISTS "horaFim" TEXT;
ALTER TABLE "Convocacao" ADD COLUMN IF NOT EXISTS "valor" INTEGER;
ALTER TABLE "Convocacao" ADD COLUMN IF NOT EXISTS "requisicaoId" TEXT;

CREATE INDEX IF NOT EXISTS "Convocacao_requisicaoId_idx" ON "Convocacao"("requisicaoId");

DO $$ BEGIN
  ALTER TABLE "Convocacao"
    ADD CONSTRAINT "Convocacao_requisicaoId_fkey"
    FOREIGN KEY ("requisicaoId") REFERENCES "Requisicao"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
