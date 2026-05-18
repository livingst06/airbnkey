-- Keep RLS enabled for Supabase Data API roles, but do not force it on the
-- direct database owner role used by Prisma.
--
-- The previous hardening migration intentionally created no public policies.
-- With FORCE ROW LEVEL SECURITY, a table-owner connection without BYPASSRLS
-- is also subject to the default-deny policy, which makes the public listing
-- read as empty and blocks admin writes.
ALTER TABLE public."Apartment" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."_prisma_migrations" NO FORCE ROW LEVEL SECURITY;
