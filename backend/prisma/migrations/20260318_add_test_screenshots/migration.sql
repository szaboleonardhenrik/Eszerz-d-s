-- AlterTable
ALTER TABLE "test_results" ADD COLUMN "screenshots" TEXT[] DEFAULT ARRAY[]::TEXT[];
