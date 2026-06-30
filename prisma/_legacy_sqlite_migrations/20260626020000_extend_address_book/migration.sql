-- Extend Address book to support the customer profile UI fields and keep
-- the data in sync with the admin account. Existing rows keep working.
ALTER TABLE "Address" ADD COLUMN "label" TEXT;
ALTER TABLE "Address" ADD COLUMN "firstName" TEXT;
ALTER TABLE "Address" ADD COLUMN "lastName" TEXT;

-- Speed up per-user address lookups.
CREATE INDEX "Address_userId_idx" ON "Address"("userId");
