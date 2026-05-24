-- Autocadastro de gestor/lojista com aprovação do RH/TI.
ALTER TABLE "Gestor" ADD COLUMN IF NOT EXISTS "telefone" TEXT;
ALTER TABLE "Gestor" ADD COLUMN IF NOT EXISTS "aprovado" BOOLEAN NOT NULL DEFAULT true;
