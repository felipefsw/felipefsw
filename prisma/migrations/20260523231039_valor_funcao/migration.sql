-- CreateTable
CREATE TABLE "ValorFuncao" (
    "id" TEXT NOT NULL,
    "funcao" TEXT NOT NULL,
    "valor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ValorFuncao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ValorFuncao_funcao_key" ON "ValorFuncao"("funcao");
