-- WhatsApp Chat Button analytics.
-- Each row is a single click on the floating WhatsApp button, capturing the
-- device type and the storefront view where it happened. The button's
-- configuration itself is stored as a JSON blob in the existing "Setting"
-- table (key = 'whatsapp_settings'), so no schema change is needed for that.

-- CreateTable
CREATE TABLE "WhatsAppClick" (
    "id" TEXT NOT NULL,
    "device" TEXT NOT NULL DEFAULT 'desktop',
    "page" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsAppClick_createdAt_idx" ON "WhatsAppClick"("createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppClick_device_idx" ON "WhatsAppClick"("device");
