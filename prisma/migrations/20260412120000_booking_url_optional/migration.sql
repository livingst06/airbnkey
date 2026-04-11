-- Make booking URL optional while preserving URL format checks when provided.
ALTER TABLE "Apartment" DROP CONSTRAINT IF EXISTS "apartment_booking_url_not_blank_check";
ALTER TABLE "Apartment" DROP CONSTRAINT IF EXISTS "apartment_booking_url_format_check";

ALTER TABLE "Apartment"
  ALTER COLUMN "bookingUrl" DROP NOT NULL;

ALTER TABLE "Apartment"
  ADD CONSTRAINT "apartment_booking_url_not_blank_check"
  CHECK ("bookingUrl" IS NULL OR btrim("bookingUrl") <> '');

ALTER TABLE "Apartment"
  ADD CONSTRAINT "apartment_booking_url_format_check"
  CHECK ("bookingUrl" IS NULL OR "bookingUrl" ~* '^https?://');
