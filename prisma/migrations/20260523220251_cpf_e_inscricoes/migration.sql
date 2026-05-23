-- AlterTable
ALTER TABLE "Diarista" ADD COLUMN     "cpf" TEXT;

-- CreateTable
CREATE TABLE "Inscricao" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requisicaoId" TEXT NOT NULL,
    "diaristaId" TEXT NOT NULL,

    CONSTRAINT "Inscricao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inscricao_diaristaId_idx" ON "Inscricao"("diaristaId");

-- CreateIndex
CREATE UNIQUE INDEX "Inscricao_requisicaoId_diaristaId_key" ON "Inscricao"("requisicaoId", "diaristaId");

-- AddForeignKey
ALTER TABLE "Inscricao" ADD CONSTRAINT "Inscricao_requisicaoId_fkey" FOREIGN KEY ("requisicaoId") REFERENCES "Requisicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscricao" ADD CONSTRAINT "Inscricao_diaristaId_fkey" FOREIGN KEY ("diaristaId") REFERENCES "Diarista"("id") ON DELETE CASCADE ON UPDATE CASCADE;
