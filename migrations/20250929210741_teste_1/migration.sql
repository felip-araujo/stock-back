-- CreateEnum
CREATE TYPE "public"."user_profile" AS ENUM ('admin', 'employee');

-- CreateTable
CREATE TABLE "public"."Companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "representant" TEXT NOT NULL,
    "rep_num" TEXT NOT NULL,
    "rep_email" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Test" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Companies_name_key" ON "public"."Companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Test_name_key" ON "public"."Test"("name");
