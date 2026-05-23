-- CreateTable
CREATE TABLE "AvaliacaoLoja" (
    "id" TEXT NOT NULL,
    "ambiente" INTEGER NOT NULL,
    "tratamento" INTEGER NOT NULL,
    "pagamentoEmDia" INTEGER NOT NULL,
    "organizacao" INTEGER NOT NULL,
    "seguranca" INTEGER NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escalaId" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "diaristaId" TEXT NOT NULL,

    CONSTRAINT "AvaliacaoLoja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoLoja_escalaId_key" ON "AvaliacaoLoja"("escalaId");

-- CreateIndex
CREATE INDEX "AvaliacaoLoja_lojaId_idx" ON "AvaliacaoLoja"("lojaId");

-- AddForeignKey
ALTER TABLE "AvaliacaoLoja" ADD CONSTRAINT "AvaliacaoLoja_escalaId_fkey" FOREIGN KEY ("escalaId") REFERENCES "Escala"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoLoja" ADD CONSTRAINT "AvaliacaoLoja_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoLoja" ADD CONSTRAINT "AvaliacaoLoja_diaristaId_fkey" FOREIGN KEY ("diaristaId") REFERENCES "Diarista"("id") ON DELETE CASCADE ON UPDATE CASCADE;
