-- Security hardening for Supabase Data API exposure on public schema tables.
-- This addresses Supabase advisor issues:
-- - rls_disabled_in_public on public."Apartment"
-- - rls_disabled_in_public on public."_prisma_migrations"
--
-- 1) Stop default auto-exposure for future objects created in public.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM public;

-- 2) Existing tables in public: revoke direct Data API role access.
REVOKE ALL PRIVILEGES ON TABLE public."Apartment" FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."_prisma_migrations" FROM anon, authenticated;

-- 3) Enforce row-level security on exposed public tables.
ALTER TABLE public."Apartment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Force policies even for table owner to avoid accidental broad reads via owner role.
ALTER TABLE public."Apartment" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."_prisma_migrations" FORCE ROW LEVEL SECURITY;

-- 4) Deliberately no public policies yet:
-- - Current app reads/writes apartments via Prisma direct DB connection on the app server.
-- - If/when exposing these tables through Supabase Data API, add explicit GRANT + RLS policies.
