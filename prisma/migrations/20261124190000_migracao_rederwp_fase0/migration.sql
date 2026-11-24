-- Fase 0: vínculos rederwp + feature flags + sync log (sem quebrar diaristas).

ALTER TABLE "Loja" ADD COLUMN "rederwpId" INTEGER;
CREATE UNIQUE INDEX "Loja_rederwpId_key" ON "Loja"("rederwpId");

ALTER TABLE "Diarista" ADD COLUMN "rederwpId" INTEGER;
CREATE UNIQUE INDEX "Diarista_rederwpId_key" ON "Diarista"("rederwpId");

ALTER TABLE "Membro" ADD COLUMN "permissoes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Membro" ADD COLUMN "rederwpAcessoId" INTEGER;
CREATE UNIQUE INDEX "Membro_rederwpAcessoId_key" ON "Membro"("rederwpAcessoId");

CREATE TABLE "ModuloFlag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "fase" INTEGER NOT NULL DEFAULT 0,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModuloFlag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ModuloFlag_slug_key" ON "ModuloFlag"("slug");

CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "dominio" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'rodando',
    "resumo" TEXT,
    "erro" TEXT,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminadoEm" TIMESTAMP(3),
    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SyncRun_dominio_iniciadoEm_idx" ON "SyncRun"("dominio", "iniciadoEm");

CREATE TABLE "EscalaRederwpMap" (
    "id" TEXT NOT NULL,
    "rederwpDiariaId" INTEGER NOT NULL,
    "escalaId" TEXT,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EscalaRederwpMap_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EscalaRederwpMap_rederwpDiariaId_key" ON "EscalaRederwpMap"("rederwpDiariaId");
CREATE INDEX "EscalaRederwpMap_status_idx" ON "EscalaRederwpMap"("status");
