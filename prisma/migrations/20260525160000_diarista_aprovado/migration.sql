-- Aprovação do RH para autocadastro. Existentes ficam aprovados (default true).
ALTER TABLE "Diarista" ADD COLUMN IF NOT EXISTS "aprovado" BOOLEAN NOT NULL DEFAULT true;
