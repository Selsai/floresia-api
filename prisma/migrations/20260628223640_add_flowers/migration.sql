/*
  Warnings:

  - Added the required column `description` to the `Flower` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Flower` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Flower" ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "price" DROP DEFAULT;
