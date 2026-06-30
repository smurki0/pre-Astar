-- Persisted shipping zones managed from the Admin Dashboard (Settings -> Shipping).
-- Previously zones lived only in React state and were lost on refresh.
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cost" REAL NOT NULL DEFAULT 0,
    "freeShippingMin" REAL NOT NULL DEFAULT 0,
    "estimatedDays" TEXT,
    "countries" TEXT NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Speed up the public checkout query (active zones, ordered).
CREATE INDEX "ShippingZone_active_order_idx" ON "ShippingZone"("active", "order");

-- Persist the selected shipping zone with each order.
ALTER TABLE "Order" ADD COLUMN "shippingZoneId" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingZoneName" TEXT;
