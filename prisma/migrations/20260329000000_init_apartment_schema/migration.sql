-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Apartment" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "street" TEXT,
    "guests" INTEGER NOT NULL DEFAULT 1,
    "beds" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "reviewsCount" INTEGER,
    "ratingAverage" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "advantages" JSONB NOT NULL,
    "images" JSONB NOT NULL,
    "bookingUrl" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Apartment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_slug_key" ON "Apartment"("slug");

-- CreateIndex
CREATE INDEX "Apartment_position_idx" ON "Apartment"("position");

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_position_key" ON "Apartment"("position");

