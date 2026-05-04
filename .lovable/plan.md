

## Problem

The preview is blank because `src/lib/supabase.ts` references an environment variable (`VITE_SUPABASE_ANON_KEY`) that doesn't exist. The auto-generated `.env` uses `VITE_SUPABASE_PUBLISHABLE_KEY` instead. This causes the Supabase client initialization to fail, crashing the `AuthProvider` and preventing the app from rendering.

## Fix

1. **Update `src/hooks/useAuth.tsx`** to import from `@/integrations/supabase/client` (the auto-generated, correctly configured client) instead of `@/lib/supabase`.

2. **Delete `src/lib/supabase.ts`** — it's a duplicate client with the wrong env variable. All Supabase imports should use `@/integrations/supabase/client`.

3. **Update any other files** importing from `@/lib/supabase` (e.g., `Auth.tsx`, other pages) to use `@/integrations/supabase/client` instead.

## Technical Details

- The auto-generated client at `src/integrations/supabase/client.ts` correctly uses `VITE_SUPABASE_PUBLISHABLE_KEY` and includes proper TypeScript typing with the `Database` type.
- The custom `src/lib/supabase.ts` uses the non-existent `VITE_SUPABASE_ANON_KEY`, producing an `undefined` value that crashes `createClient`.

