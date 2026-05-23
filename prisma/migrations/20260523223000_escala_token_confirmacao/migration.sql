-- AlterTable
ALTER TABLE "Escala" ADD COLUMN "tokenConfirmacao" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Escala_tokenConfirmacao_key" ON "Escala"("tokenConfirmacao");
