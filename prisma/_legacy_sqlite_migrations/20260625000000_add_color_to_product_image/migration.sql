-- Add optional per-color tag to product images.
-- NULL means the image is shared across all colors, which preserves
-- the behaviour of every product created before this migration.
ALTER TABLE "ProductImage" ADD COLUMN "color" TEXT;

-- Speed up gallery lookups that filter images by product + color.
CREATE INDEX "ProductImage_productId_color_idx" ON "ProductImage"("productId", "color");
