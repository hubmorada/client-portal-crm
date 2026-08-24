-- AlterEnum
ALTER TYPE "AttachmentEntityType" ADD VALUE 'TASK';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TASK_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_STATUS_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_ASSIGNEE_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_DUE_DATE_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_COMPLETED';

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "authorPortalUserId" UUID;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "createdById" UUID,
ADD COLUMN     "createdByPortalUserId" UUID;

-- CreateIndex
CREATE INDEX "Comment_authorPortalUserId_createdAt_idx" ON "Comment"("authorPortalUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");

-- CreateIndex
CREATE INDEX "Task_createdByPortalUserId_idx" ON "Task"("createdByPortalUserId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdByPortalUserId_fkey" FOREIGN KEY ("createdByPortalUserId") REFERENCES "PortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorPortalUserId_fkey" FOREIGN KEY ("authorPortalUserId") REFERENCES "PortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
