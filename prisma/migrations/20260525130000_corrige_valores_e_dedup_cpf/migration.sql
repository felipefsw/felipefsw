-- Limpeza de dados (uma vez):
-- 1) Corrige diárias com valor R$ 0,00 (convocações/escalas antigas sem valor).
-- 2) Desativa cadastros duplicados por CPF que não têm histórico (mantém o original).

-- (1a) Diárias zeradas vinculadas a uma requisição → usa o valor da requisição.
UPDATE "Escala" e
SET "valor" = r."valorDiaria"
FROM "Requisicao" r
WHERE e."requisicaoId" = r."id"
  AND e."valor" = 0
  AND r."valorDiaria" > 0;

-- (1b) Diárias zeradas SEM requisição vinculada → casa por loja + data
--      (cobre convocações antigas da loja, feitas antes de levar o valor).
UPDATE "Escala" e
SET "valor" = r."valorDiaria"
FROM "Requisicao" r
WHERE e."requisicaoId" IS NULL
  AND e."valor" = 0
  AND e."lojaId" = r."lojaId"
  AND e."data" = r."data"
  AND r."valorDiaria" > 0;

-- (1c) Sobra zerada → usa o valor padrão da diarista, quando houver.
UPDATE "Escala" e
SET "valor" = d."valorDiaria"
FROM "Diarista" d
WHERE e."diaristaId" = d."id"
  AND e."valor" = 0
  AND d."valorDiaria" > 0;

-- (2) Desativa diaristas duplicados pelo MESMO CPF (só dígitos) que foram criados
--     depois e NÃO têm histórico (sem escalas, candidaturas ou convocações).
--     Mantém o cadastro mais antigo ativo. Reversível (apenas marca ativo=false).
UPDATE "Diarista" d
SET "ativo" = false
WHERE d."cpf" IS NOT NULL
  AND regexp_replace(d."cpf", '\D', '', 'g') <> ''
  AND EXISTS (
    SELECT 1 FROM "Diarista" o
    WHERE o."id" <> d."id"
      AND regexp_replace(o."cpf", '\D', '', 'g') = regexp_replace(d."cpf", '\D', '', 'g')
      AND o."criadoEm" < d."criadoEm"
  )
  AND NOT EXISTS (SELECT 1 FROM "Escala" x WHERE x."diaristaId" = d."id")
  AND NOT EXISTS (SELECT 1 FROM "Inscricao" x WHERE x."diaristaId" = d."id")
  AND NOT EXISTS (SELECT 1 FROM "Convocacao" x WHERE x."diaristaId" = d."id");
