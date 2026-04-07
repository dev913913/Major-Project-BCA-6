# Environment Variable Handling Update
**Date**: April 7, 2026  
**Branch**: `fix/env-var-handling`  

## What changed
I added a safe startup path for the app when Supabase environment variables are missing.

### Files changed
- `src/services/supabaseClient.js`
- `src/context/AuthContext.jsx`
- `src/App.jsx`

## Why this was needed
Previously, the app would crash before it even loaded if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` were missing.
That meant the website could not show a usable message or let users know what was wrong.

## What is now different
- The app no longer throws a fatal error during startup when Supabase is not configured.
- Instead, it shows a friendly message explaining which env vars are missing.
- The auth context now avoids calling Supabase when the configuration is unavailable.

## Why this is better
- The site fails gracefully instead of crashing.
- Developers see a clear error message with next steps.
- It reduces the chance of unexpected blank pages or hard-to-debug startup failures.

## Next step
Create a PR from branch `fix/env-var-handling` and merge it once the change is reviewed.
