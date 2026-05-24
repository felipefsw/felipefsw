-- Link secreto para definir/resetar senha (1º acesso) - loja, gestor e membro.
ALTER TABLE "Loja"   ADD COLUMN IF NOT EXISTS "tokenSenha" TEXT;
ALTER TABLE "Gestor" ADD COLUMN IF NOT EXISTS "tokenSenha" TEXT;
ALTER TABLE "Membro" ADD COLUMN IF NOT EXISTS "tokenSenha" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Loja_tokenSenha_key"   ON "Loja"("tokenSenha");
CREATE UNIQUE INDEX IF NOT EXISTS "Gestor_tokenSenha_key" ON "Gestor"("tokenSenha");
CREATE UNIQUE INDEX IF NOT EXISTS "Membro_tokenSenha_key" ON "Membro"("tokenSenha");

-- Gera um link inicial de 1º acesso para quem ainda não tem senha real (hash com ":").
-- (necessário para a equipe semeada e lojas/gestores já existentes conseguirem entrar)
UPDATE "Membro"
  SET "tokenSenha" = replace(gen_random_uuid()::text, '-', '')
  WHERE "tokenSenha" IS NULL AND ("senha" IS NULL OR position(':' in "senha") = 0);
UPDATE "Gestor"
  SET "tokenSenha" = replace(gen_random_uuid()::text, '-', '')
  WHERE "tokenSenha" IS NULL AND position(':' in "senha") = 0;
UPDATE "Loja"
  SET "tokenSenha" = replace(gen_random_uuid()::text, '-', '')
  WHERE "tokenSenha" IS NULL AND position(':' in "senha") = 0;
