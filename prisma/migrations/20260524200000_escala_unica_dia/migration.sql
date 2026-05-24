-- Trava de furo de escala: 1 diária por diarista por dia.
-- Primeiro remove duplicatas existentes (mantém uma por diarista/dia).
DELETE FROM "Escala" a
USING "Escala" b
WHERE a."diaristaId" = b."diaristaId"
  AND a.data = b.data
  AND a.ctid > b.ctid;

-- O índice simples de diaristaId vira o índice único composto.
DROP INDEX IF EXISTS "Escala_diaristaId_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "Escala_diaristaId_data_key" ON "Escala"("diaristaId", "data");
