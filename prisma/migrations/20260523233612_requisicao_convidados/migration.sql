-- CreateTable
CREATE TABLE "_ConvidadosRequisicao" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ConvidadosRequisicao_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ConvidadosRequisicao_B_index" ON "_ConvidadosRequisicao"("B");

-- AddForeignKey
ALTER TABLE "_ConvidadosRequisicao" ADD CONSTRAINT "_ConvidadosRequisicao_A_fkey" FOREIGN KEY ("A") REFERENCES "Diarista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConvidadosRequisicao" ADD CONSTRAINT "_ConvidadosRequisicao_B_fkey" FOREIGN KEY ("B") REFERENCES "Requisicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
