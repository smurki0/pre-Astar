-- Snapshot the chosen colour/size on each order line so the admin order
-- details always show what the customer actually ordered, even if the
-- ProductVariant is later edited or deleted.
ALTER TABLE "OrderItem" ADD COLUMN     "variantColor" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN     "variantColorHex" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN     "variantSize" TEXT;

-- Explicit per-variant availability flag so the admin can toggle a size's
-- status (متوفر / غير متوفر) in the size guide from every product add/edit,
-- independent of the raw stock quantity.
ALTER TABLE "ProductVariant" ADD COLUMN     "available" BOOLEAN NOT NULL DEFAULT true;
