-- Banco/pool de diaristas por loja: cada loja tem suas próprias diaristas.
-- Só as lojas listadas em BancoLoja podem alocar/convocar a diarista
-- (RH/TI continuam vendo todas).

CREATE TABLE IF NOT EXISTS "BancoLoja" (
  "lojaId"     TEXT NOT NULL,
  "diaristaId" TEXT NOT NULL,
  "criadoEm"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BancoLoja_pkey" PRIMARY KEY ("lojaId", "diaristaId")
);

CREATE INDEX IF NOT EXISTS "BancoLoja_lojaId_idx" ON "BancoLoja"("lojaId");
CREATE INDEX IF NOT EXISTS "BancoLoja_diaristaId_idx" ON "BancoLoja"("diaristaId");

DO $$ BEGIN
  ALTER TABLE "BancoLoja"
    ADD CONSTRAINT "BancoLoja_lojaId_fkey"
    FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "BancoLoja"
    ADD CONSTRAINT "BancoLoja_diaristaId_fkey"
    FOREIGN KEY ("diaristaId") REFERENCES "Diarista"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Seed: liga cada diarista às lojas em que ela já trabalhou (tem escala).
-- Isso preserva o que cada loja "já tinha" e dá uma base pra começar.
INSERT INTO "BancoLoja" ("lojaId", "diaristaId", "criadoEm")
SELECT DISTINCT e."lojaId", e."diaristaId", NOW()
  FROM "Escala" e
ON CONFLICT ("lojaId", "diaristaId") DO NOTHING;

-- Endereço do CD (Centro de Distribuição).
UPDATE "Loja" SET
  "endereco" = 'Rua Pedro Estanislau, 31',
  "bairro"   = 'Messejana',
  "cidade"   = 'Fortaleza'
WHERE "nome" ~* '^cd(\s+rwp)?$' OR "nome" ~* 'centro\s+de\s+distribui[cç][aã]o';
