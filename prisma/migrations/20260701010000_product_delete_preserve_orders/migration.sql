-- Allow products to be deleted without destroying order history.
-- OrderItem keeps a full snapshot (productName + variant colour/size/price),
-- so when a product is removed we detach the reference instead of blocking
-- the delete or wiping the order line.
ALTER TABLE "OrderItem" ALTER COLUMN "productId" DROP NOT NULL;

ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Reviews belong to the product, so they are removed with it.
ALTER TABLE "Review" DROP CONSTRAINT "Review_productId_fkey";
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
