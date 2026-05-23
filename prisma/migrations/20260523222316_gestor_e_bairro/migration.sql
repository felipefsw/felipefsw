-- AlterTable
ALTER TABLE "Loja" ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "gestorId" TEXT;

-- CreateTable
CREATE TABLE "Gestor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "senha" TEXT NOT NULL DEFAULT '123456',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gestor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gestor_usuario_key" ON "Gestor"("usuario");

-- AddForeignKey
ALTER TABLE "Loja" ADD CONSTRAINT "Loja_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "Gestor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
