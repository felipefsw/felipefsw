-- AlterTable
ALTER TABLE "Escala" ADD COLUMN     "requisicaoId" TEXT;

-- CreateTable
CREATE TABLE "Requisicao" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "funcao" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lojaId" TEXT NOT NULL,

    CONSTRAINT "Requisicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL,
    "pontualidade" INTEGER NOT NULL,
    "limpeza" INTEGER NOT NULL,
    "educacao" INTEGER NOT NULL,
    "rapidez" INTEGER NOT NULL,
    "habilidadeTecnica" INTEGER NOT NULL,
    "respeito" INTEGER NOT NULL,
    "espiritoEquipe" INTEGER NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escalaId" TEXT NOT NULL,
    "diaristaId" TEXT NOT NULL,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Requisicao_status_idx" ON "Requisicao"("status");

-- CreateIndex
CREATE INDEX "Requisicao_data_idx" ON "Requisicao"("data");

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_escalaId_key" ON "Avaliacao"("escalaId");

-- CreateIndex
CREATE INDEX "Avaliacao_diaristaId_idx" ON "Avaliacao"("diaristaId");

-- AddForeignKey
ALTER TABLE "Escala" ADD CONSTRAINT "Escala_requisicaoId_fkey" FOREIGN KEY ("requisicaoId") REFERENCES "Requisicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requisicao" ADD CONSTRAINT "Requisicao_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_escalaId_fkey" FOREIGN KEY ("escalaId") REFERENCES "Escala"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_diaristaId_fkey" FOREIGN KEY ("diaristaId") REFERENCES "Diarista"("id") ON DELETE CASCADE ON UPDATE CASCADE;
