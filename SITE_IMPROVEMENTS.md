# Site Improvement Review (ProgLearn)

## What needs improvement

1. **Graceful startup when environment variables are missing**
   - Right now the app throws at import-time when Supabase env vars are absent, which can render the app unusable instead of showing a guided setup/error screen.
   - Recommendation: render a friendly configuration page and keep public shell/UI visible.

2. **Error handling consistency across pages**
   - `HomePage` and `LessonsPage` show fetch errors, but `CategoriesPage` currently has no error state and can silently fail into empty UI.
   - Recommendation: add explicit error state + retry action to all data pages.

3. **Navigation parity on mobile**
   - Desktop header includes Login/Logout and conditional Admin entry, while mobile menu omits login/logout actions.
   - Recommendation: add auth actions and clear active states in mobile nav.

4. **Footer link visibility / access control**
   - Footer always shows an Admin link even for unauthenticated users, causing avoidable redirects/friction.
   - Recommendation: hide admin footer link unless user is admin or replace with "Admin Login".

5. **Search/filter UX for lessons**
   - Lessons filtering supports title + category only; no sort controls, no result count, and no clear-all reset shortcut.
   - Recommendation: add sort (newest/popular), result counter, and one-click filter reset.

6. **Category-to-lessons journey**
   - Category cards route to generic `/lessons` rather than prefiltered by selected category.
   - Recommendation: deep-link to lessons with query param (e.g., `/lessons?category=...`) and hydrate filters from URL.

7. **Content loading resilience / empty states**
   - Several pages default to empty layouts when backend is unreachable or dataset is empty.
   - Recommendation: standardize skeleton, empty, and error components with actionable copy.

8. **Technical debt warning from React Router**
   - Runtime shows future-flag warnings for Router v7 behavior changes.
   - Recommendation: adopt future flags now and test route behavior to reduce upgrade risk.

## Quick wins (highest impact first)

1. Add a non-crashing env-missing setup screen.
2. Add shared error/retry component and use on Categories/Home/Lessons.
3. Improve mobile menu with auth actions.
4. Pass selected category through URL and pre-apply filters.
