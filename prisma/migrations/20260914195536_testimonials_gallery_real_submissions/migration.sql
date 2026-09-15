-- AlterTable
ALTER TABLE "GalleryPhoto" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "instagramHandle" TEXT;

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "occasion" TEXT,
ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 5;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
