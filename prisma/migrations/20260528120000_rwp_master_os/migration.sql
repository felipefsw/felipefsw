-- RWP Master OS: tabelas para definição e execução de Agentes de IA
-- (Auditor Financeiro, Mentor RH, P&D etc.).

-- CreateTable
CREATE TABLE "Agente" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "modelo" TEXT NOT NULL DEFAULT 'claude-opus-4-7',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecAgente" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "titulo" TEXT,
    "entrada" TEXT NOT NULL,
    "saida" TEXT,
    "erro" TEXT,
    "modelo" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "cacheCreate" INTEGER,
    "cacheRead" INTEGER,
    "duracaoMs" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluidoEm" TIMESTAMP(3),
    "agenteId" TEXT NOT NULL,
    "lojaId" TEXT,

    CONSTRAINT "ExecAgente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agente_slug_key" ON "Agente"("slug");

-- CreateIndex
CREATE INDEX "ExecAgente_agenteId_idx" ON "ExecAgente"("agenteId");

-- CreateIndex
CREATE INDEX "ExecAgente_lojaId_idx" ON "ExecAgente"("lojaId");

-- CreateIndex
CREATE INDEX "ExecAgente_criadoEm_idx" ON "ExecAgente"("criadoEm");

-- AddForeignKey
ALTER TABLE "ExecAgente" ADD CONSTRAINT "ExecAgente_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecAgente" ADD CONSTRAINT "ExecAgente_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
