-- AlterTable
ALTER TABLE "Escala" ADD COLUMN     "checkinEm" TIMESTAMP(3),
ADD COLUMN     "checkinLat" DOUBLE PRECISION,
ADD COLUMN     "checkinLng" DOUBLE PRECISION,
ADD COLUMN     "checkoutAuto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "checkoutEm" TIMESTAMP(3),
ADD COLUMN     "valorPago" INTEGER;

-- AlterTable
ALTER TABLE "Loja" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
