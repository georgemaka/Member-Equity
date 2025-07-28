-- CreateEnum
CREATE TYPE "BoardApprovalType" AS ENUM ('ANNUAL_EQUITY_UPDATE', 'MID_YEAR_ADJUSTMENT', 'SPECIAL_ALLOCATION', 'RETIREMENT_ADJUSTMENT', 'TERMINATION_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "BoardApprovalStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'APPLIED', 'REJECTED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EquityEventType" ADD VALUE 'BOARD_APPROVED_UPDATE';
ALTER TYPE "EquityEventType" ADD VALUE 'PRO_RATA_ADJUSTMENT';

-- AlterTable
ALTER TABLE "equity_events" ADD COLUMN     "boardApprovalId" TEXT;

-- CreateTable
CREATE TABLE "board_approvals" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "approvalType" "BoardApprovalType" NOT NULL,
    "approvalDate" TIMESTAMP(3) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "status" "BoardApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "totalEquityBefore" DECIMAL(6,4) NOT NULL,
    "totalEquityAfter" DECIMAL(6,4) NOT NULL,
    "documentUrls" TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equity_updates" (
    "id" TEXT NOT NULL,
    "boardApprovalId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "previousPercentage" DECIMAL(6,4) NOT NULL,
    "newPercentage" DECIMAL(6,4) NOT NULL,
    "changePercentage" DECIMAL(6,4) NOT NULL,
    "changeReason" TEXT,
    "warnings" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equity_updates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "equity_events" ADD CONSTRAINT "equity_events_boardApprovalId_fkey" FOREIGN KEY ("boardApprovalId") REFERENCES "board_approvals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_approvals" ADD CONSTRAINT "board_approvals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equity_updates" ADD CONSTRAINT "equity_updates_boardApprovalId_fkey" FOREIGN KEY ("boardApprovalId") REFERENCES "board_approvals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equity_updates" ADD CONSTRAINT "equity_updates_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
