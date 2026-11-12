/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MODERATOR';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL;
