-- AlterTable
ALTER TABLE "store_settings" ADD COLUMN "cost_per_km" REAL DEFAULT 0;
ALTER TABLE "store_settings" ADD COLUMN "max_truck_pallets" INTEGER DEFAULT 10;
ALTER TABLE "store_settings" ADD COLUMN "qt_per_pallet" INTEGER DEFAULT 100;
ALTER TABLE "store_settings" ADD COLUMN "store_address" TEXT;
