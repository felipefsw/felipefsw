/*
  Warnings:

  - Added the required column `horaFim` to the `Requisicao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `horaInicio` to the `Requisicao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valorDiaria` to the `Requisicao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Escala" ADD COLUMN     "horaFim" TEXT,
ADD COLUMN     "horaInicio" TEXT;

-- AlterTable
ALTER TABLE "Requisicao" ADD COLUMN     "horaFim" TEXT NOT NULL,
ADD COLUMN     "horaInicio" TEXT NOT NULL,
ADD COLUMN     "valorDiaria" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "_LojaPreferida" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LojaPreferida_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_LojaPreferida_B_index" ON "_LojaPreferida"("B");

-- AddForeignKey
ALTER TABLE "_LojaPreferida" ADD CONSTRAINT "_LojaPreferida_A_fkey" FOREIGN KEY ("A") REFERENCES "Diarista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LojaPreferida" ADD CONSTRAINT "_LojaPreferida_B_fkey" FOREIGN KEY ("B") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
