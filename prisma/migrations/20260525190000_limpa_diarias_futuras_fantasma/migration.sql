-- Limpeza (uma vez): remove diárias FUTURAS marcadas como presente/falta sem
-- nenhum check-in — dado antigo impossível (não dá pra "comparecer" no futuro).
-- Isso destrava a aceitação de convites para esses dias.
DELETE FROM "Escala"
WHERE "checkinEm" IS NULL
  AND "presenca" IN ('PRESENTE', 'FALTOU')
  AND "data" > to_char(CURRENT_DATE, 'YYYY-MM-DD');
