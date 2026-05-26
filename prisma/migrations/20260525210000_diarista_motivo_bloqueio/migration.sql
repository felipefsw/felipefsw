-- Motivo do bloqueio global da diarista (lista negra), para o RH lembrar do que aconteceu.
ALTER TABLE "Diarista" ADD COLUMN IF NOT EXISTS "motivoBloqueio" TEXT;
