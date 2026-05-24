-- Fotos do ambiente e texto de vantagens da loja.
ALTER TABLE "Loja" ADD COLUMN IF NOT EXISTS "fotos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Loja" ADD COLUMN IF NOT EXISTS "vantagens" TEXT;
