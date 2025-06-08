-- AlterTable
ALTER TABLE "equity_events" ALTER COLUMN "previousPercentage" SET DATA TYPE DECIMAL(6,4),
ALTER COLUMN "newPercentage" SET DATA TYPE DECIMAL(6,4);

-- AlterTable
ALTER TABLE "members" ALTER COLUMN "equityPercentage" SET DATA TYPE DECIMAL(6,4);
