-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "darkMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "neutralColor" TEXT NOT NULL DEFAULT '#787868',
ALTER COLUMN "primaryColor" SET DEFAULT '#B07D45';
