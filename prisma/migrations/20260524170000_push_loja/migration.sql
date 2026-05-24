-- Inscrição de push da loja/gestor (lembrete de pagamento).
CREATE TABLE IF NOT EXISTS "PushLoja" (
  "id" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lojaId" TEXT NOT NULL,
  CONSTRAINT "PushLoja_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PushLoja_endpoint_key" ON "PushLoja"("endpoint");
CREATE INDEX IF NOT EXISTS "PushLoja_lojaId_idx" ON "PushLoja"("lojaId");

DO $$
BEGIN
  ALTER TABLE "PushLoja"
    ADD CONSTRAINT "PushLoja_lojaId_fkey"
    FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
