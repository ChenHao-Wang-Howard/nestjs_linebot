/*
  Warnings:

  - You are about to drop the column `Line_user_Id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `Line_user_Name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `already_highfive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `notyet_highfive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `reject_highfive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `request_highfive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[Line_Id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_Line_user_Id_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "Line_user_Id",
DROP COLUMN "Line_user_Name",
DROP COLUMN "already_highfive",
DROP COLUMN "createdAt",
DROP COLUMN "notyet_highfive",
DROP COLUMN "reject_highfive",
DROP COLUMN "request_highfive",
DROP COLUMN "updatedAt",
ADD COLUMN     "Line_Id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" SERIAL NOT NULL,
ADD COLUMN     "username" TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("user_id");

-- CreateTable
CREATE TABLE "HighFive" (
    "highfive_id" SERIAL NOT NULL,
    "requester_id" INTEGER NOT NULL,
    "responder_id" INTEGER NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT '未擊掌',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HighFive_pkey" PRIMARY KEY ("highfive_id")
);

-- CreateTable
CREATE TABLE "Friend" (
    "user_id" INTEGER NOT NULL,
    "friend_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("user_id","friend_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_Line_Id_key" ON "User"("Line_Id");

-- AddForeignKey
ALTER TABLE "HighFive" ADD CONSTRAINT "HighFive_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighFive" ADD CONSTRAINT "HighFive_responder_id_fkey" FOREIGN KEY ("responder_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
