-- Align DB constraints with apartment form validation rules.
ALTER TABLE "Apartment"
  ALTER COLUMN "city" SET NOT NULL,
  ALTER COLUMN "bookingUrl" SET NOT NULL,
  ALTER COLUMN "guests" SET DEFAULT 1;

ALTER TABLE "Apartment" DROP CONSTRAINT IF EXISTS "apartment_title_not_blank_check";
ALTER TABLE "Apartment" ADD CONSTRAINT "apartment_title_not_blank_check"
  CHECK (btrim("title") <> '');

ALTER TABLE "Apartment" DROP CONSTRAINT IF EXISTS "apartment_description_not_blank_check";
ALTER TABLE "Apartment" ADD CONSTRAINT "apartment_description_not_blank_check"
  CHECK (btrim("description") <> '');

ALTER TABLE "Apartment" DROP CONSTRAINT IF EXISTS "apartment_city_not_blank_check";
ALTER TABLE "Apartment" ADD CONSTRAINT "apartment_city_not_blank_check"
  CHECK (btrim("city") <> '');

ALTER TABLE "Apartment" DROP CONSTRAINT IF EXISTS "apartment_booking_url_not_blank_check";
ALTER TABLE "Apartment" ADD CONSTRAINT "apartment_booking_url_not_blank_check"
  CHECK (btrim("bookingUrl") <> '');

ALTER TABLE "Apartment" DROP CONSTRAINT IF EXISTS "apartment_booking_url_format_check";
ALTER TABLE "Apartment" ADD CONSTRAINT "apartment_booking_url_format_check"
  CHECK ("bookingUrl" ~* '^https?://');

ALTER TABLE "Apartment" DROP CONSTRAINT IF EXISTS "apartment_guests_min_check";
ALTER TABLE "Apartment" ADD CONSTRAINT "apartment_guests_min_check"
  CHECK ("guests" >= 1);

ALTER TABLE "Apartment" DROP CONSTRAINT IF EXISTS "apartment_beds_min_check";
ALTER TABLE "Apartment" ADD CONSTRAINT "apartment_beds_min_check"
  CHECK ("beds" >= 1);

ALTER TABLE "Apartment" DROP CONSTRAINT IF EXISTS "apartment_bathrooms_min_check";
ALTER TABLE "Apartment" ADD CONSTRAINT "apartment_bathrooms_min_check"
  CHECK ("bathrooms" >= 0);

ALTER TABLE "Apartment" DROP CONSTRAINT IF EXISTS "apartment_reviews_count_check";
ALTER TABLE "Apartment" ADD CONSTRAINT "apartment_reviews_count_check"
  CHECK ("reviewsCount" IS NULL OR "reviewsCount" >= 0);

ALTER TABLE "Apartment" DROP CONSTRAINT IF EXISTS "apartment_rating_average_check";
ALTER TABLE "Apartment" ADD CONSTRAINT "apartment_rating_average_check"
  CHECK ("ratingAverage" IS NULL OR ("ratingAverage" >= 0 AND "ratingAverage" <= 5));
