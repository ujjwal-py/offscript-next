-- AlterTable
ALTER TABLE "Posts" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
