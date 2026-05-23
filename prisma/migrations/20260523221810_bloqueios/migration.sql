-- CreateTable
CREATE TABLE "Bloqueio" (
    "id" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "ate" TIMESTAMP(3),
    "motivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lojaId" TEXT NOT NULL,
    "diaristaId" TEXT NOT NULL,

    CONSTRAINT "Bloqueio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bloqueio_lojaId_idx" ON "Bloqueio"("lojaId");

-- CreateIndex
CREATE INDEX "Bloqueio_diaristaId_idx" ON "Bloqueio"("diaristaId");

-- AddForeignKey
ALTER TABLE "Bloqueio" ADD CONSTRAINT "Bloqueio_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bloqueio" ADD CONSTRAINT "Bloqueio_diaristaId_fkey" FOREIGN KEY ("diaristaId") REFERENCES "Diarista"("id") ON DELETE CASCADE ON UPDATE CASCADE;
