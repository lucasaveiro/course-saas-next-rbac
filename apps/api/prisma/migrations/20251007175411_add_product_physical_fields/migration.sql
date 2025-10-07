-- AlterTable
ALTER TABLE "products" ADD COLUMN "depth" DECIMAL;
ALTER TABLE "products" ADD COLUMN "length" DECIMAL;
ALTER TABLE "products" ADD COLUMN "quantity_per_pallet" INTEGER;
ALTER TABLE "products" ADD COLUMN "weight" DECIMAL;
ALTER TABLE "products" ADD COLUMN "width" DECIMAL;

-- CreateTable
CREATE TABLE "customer_credentials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "password_hash" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "customer_id" TEXT NOT NULL,
    CONSTRAINT "customer_credentials_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customer_refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token_hash" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "revoked_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" TEXT NOT NULL,
    CONSTRAINT "customer_refresh_tokens_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "checkout_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "customer_email" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "tax_amount" DECIMAL NOT NULL,
    "shipping_amount" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "payment_intent_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "organization_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    CONSTRAINT "checkout_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "checkout_sessions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "checkout_sessions_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_credentials_customer_id_key" ON "customer_credentials"("customer_id");

-- CreateIndex
CREATE INDEX "customer_refresh_tokens_customer_id_idx" ON "customer_refresh_tokens"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_sessions_cart_id_key" ON "checkout_sessions"("cart_id");
