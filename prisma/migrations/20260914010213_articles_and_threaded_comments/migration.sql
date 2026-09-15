/*
  Warnings:

  - Added the required column `displayAuthorName` to the `Article` table without a default value. This is not possible if the table is not empty.
  - Added the required column `excerpt` to the `Article` table without a default value. This is not possible if the table is not empty.
  - Added the required column `readTime` to the `Article` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "displayAuthorBio" TEXT,
ADD COLUMN     "displayAuthorName" TEXT NOT NULL,
ADD COLUMN     "excerpt" TEXT NOT NULL,
ADD COLUMN     "readTime" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "taggedUserId" TEXT;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_taggedUserId_fkey" FOREIGN KEY ("taggedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
