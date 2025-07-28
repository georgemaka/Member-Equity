-- CreateTable
CREATE TABLE "status_history" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "previousStatus" "MemberStatus" NOT NULL,
    "newStatus" "MemberStatus" NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "fiscalYear" INTEGER,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "status_history_memberId_effectiveDate_idx" ON "status_history"("memberId", "effectiveDate");

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
