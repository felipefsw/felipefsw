-- CreateTable
CREATE TABLE "Convocacao" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lojaId" TEXT NOT NULL,
    "diaristaId" TEXT NOT NULL,

    CONSTRAINT "Convocacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Convocacao_lojaId_idx" ON "Convocacao"("lojaId");

-- CreateIndex
CREATE INDEX "Convocacao_diaristaId_idx" ON "Convocacao"("diaristaId");

-- AddForeignKey
ALTER TABLE "Convocacao" ADD CONSTRAINT "Convocacao_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convocacao" ADD CONSTRAINT "Convocacao_diaristaId_fkey" FOREIGN KEY ("diaristaId") REFERENCES "Diarista"("id") ON DELETE CASCADE ON UPDATE CASCADE;
