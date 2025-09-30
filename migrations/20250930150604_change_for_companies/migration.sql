/*
  Warnings:

  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."Company";

-- CreateTable
CREATE TABLE "public"."Companies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "representant" TEXT,
    "rep_num" TEXT,
    "rep_email" TEXT NOT NULL,
    "cnpj" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Companies_name_key" ON "public"."Companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Companies_rep_email_key" ON "public"."Companies"("rep_email");

-- CreateIndex
CREATE UNIQUE INDEX "Companies_cnpj_key" ON "public"."Companies"("cnpj");
