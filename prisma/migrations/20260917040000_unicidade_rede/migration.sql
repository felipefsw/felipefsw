-- Unicidade das linhas "da rede" (store_id IS NULL) do Painel do Gestor.
--
-- O book pede `unique(store_id, key, valid_from)` em `params`, mas no Postgres
-- NULL nunca é igual a NULL: sem estes índices parciais dava para cadastrar o
-- mesmo parâmetro da rede duas vezes, e o cálculo passaria a depender de sorte.
-- O mesmo vale para os modelos de checklist da rede e os turnos da rede.
--
-- ATENÇÃO: o Prisma não sabe declarar índice parcial no schema.prisma. Se um dia
-- `prisma migrate dev` acusar estes índices como "drift", a resposta é mantê-los.

CREATE UNIQUE INDEX "params_rede_key_valid_from_key"
  ON "params" ("key", "valid_from") WHERE "store_id" IS NULL;

CREATE UNIQUE INDEX "checklist_templates_rede_name_key"
  ON "checklist_templates" ("name") WHERE "store_id" IS NULL;

CREATE UNIQUE INDEX "shifts_rede_code_key"
  ON "shifts" ("code") WHERE "store_id" IS NULL;
