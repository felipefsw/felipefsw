-- Senha do diarista (hash), definida no primeiro acesso.
ALTER TABLE "Diarista" ADD COLUMN IF NOT EXISTS "senha" TEXT;
