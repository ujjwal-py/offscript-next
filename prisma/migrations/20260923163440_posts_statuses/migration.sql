/*
  Warnings:

  - You are about to drop the column `published` on the `Posts` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'REMOVED');

-- AlterTable
ALTER TABLE "Posts" DROP COLUMN "published",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'DRAFT';
