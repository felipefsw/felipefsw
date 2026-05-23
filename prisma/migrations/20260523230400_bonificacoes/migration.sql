-- CreateTable
CREATE TABLE "Bonificacao" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" INTEGER NOT NULL DEFAULT 10000,
    "referencia" TEXT,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "pagoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diaristaId" TEXT NOT NULL,

    CONSTRAINT "Bonificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bonificacao_diaristaId_idx" ON "Bonificacao"("diaristaId");

-- AddForeignKey
ALTER TABLE "Bonificacao" ADD CONSTRAINT "Bonificacao_diaristaId_fkey" FOREIGN KEY ("diaristaId") REFERENCES "Diarista"("id") ON DELETE CASCADE ON UPDATE CASCADE;
