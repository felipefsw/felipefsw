-- Permite à loja (ou ao RH) liberar mais de 2 diárias por semana para o mesmo diarista.
ALTER TABLE "Loja" ADD COLUMN IF NOT EXISTS "permiteMais2Semana" BOOLEAN NOT NULL DEFAULT false;
