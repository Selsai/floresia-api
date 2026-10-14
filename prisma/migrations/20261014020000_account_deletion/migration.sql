ALTER TABLE "User"
ADD COLUMN "deletionRequestedAt" TIMESTAMP(3),
ADD COLUMN "deletionDeadline" TIMESTAMP(3),
ADD COLUMN "deletionTokenHash" TEXT,
ADD COLUMN "accountErasedAt" TIMESTAMP(3),
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "pendingMediaDeletion" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE UNIQUE INDEX "User_deletionTokenHash_key" ON "User"("deletionTokenHash");
CREATE INDEX "User_deletionDeadline_accountErasedAt_idx" ON "User"("deletionDeadline", "accountErasedAt");
