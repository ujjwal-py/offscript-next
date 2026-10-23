/*
  Warnings:

  - The values [REMOVED] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Posts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `description` on table `Posts` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED');
ALTER TABLE "public"."Posts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Posts" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "public"."Status_old";
ALTER TABLE "Posts" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "Likes" DROP CONSTRAINT "Likes_postId_fkey";

-- AlterTable
ALTER TABLE "Likes" ALTER COLUMN "postId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Posts" DROP CONSTRAINT "Posts_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "description" SET NOT NULL,
ADD CONSTRAINT "Posts_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Posts_id_seq";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Likes" ADD CONSTRAINT "Likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
