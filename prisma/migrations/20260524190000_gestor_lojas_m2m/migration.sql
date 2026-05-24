-- Loja <-> Gestor agora é muitos-para-muitos (uma loja pode ter vários sócios/gestores).
CREATE TABLE IF NOT EXISTS "_GestorLojas" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_GestorLojas_AB_unique" ON "_GestorLojas"("A", "B");
CREATE INDEX IF NOT EXISTS "_GestorLojas_B_index" ON "_GestorLojas"("B");

DO $$
BEGIN
  ALTER TABLE "_GestorLojas"
    ADD CONSTRAINT "_GestorLojas_A_fkey" FOREIGN KEY ("A") REFERENCES "Gestor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "_GestorLojas"
    ADD CONSTRAINT "_GestorLojas_B_fkey" FOREIGN KEY ("B") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Migra os vínculos existentes (Loja.gestorId) para a tabela de junção.
INSERT INTO "_GestorLojas" ("A", "B")
SELECT "gestorId", "id" FROM "Loja" WHERE "gestorId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Remove a coluna antiga de gestor único.
ALTER TABLE "Loja" DROP CONSTRAINT IF EXISTS "Loja_gestorId_fkey";
ALTER TABLE "Loja" DROP COLUMN IF EXISTS "gestorId";
