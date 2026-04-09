# Shared Error & Retry UI Update
**Date**: April 7, 2026  
**Branch**: `fix/shared-error-retry`  

## What changed
I added a shared error state component so data pages now show a consistent error message and allow users to retry loading content.

### Files changed
- `src/components/ErrorState.jsx`
- `src/pages/HomePage.jsx`
- `src/pages/LessonsPage.jsx`
- `src/pages/CategoriesPage.jsx`
- `src/pages/LessonPage.jsx`

## Why this was needed
Previously, pages showed a plain error message with no consistent styling or retry option. That made temporary failures harder to recover from and gave users a worse experience.

## What is now different
- Error messages are rendered through a shared `ErrorState` component.
- Each page now offers a `Try again` button when content fails to load.
- The UI is consistent across the homepage, lessons list, categories list, and lesson detail page.

## Why this is better
- Users can recover from transient failures without refreshing the browser.
- Error behavior is consistent across pages.
- Maintenance is easier because the error UI lives in one component.

## Next step
Create a PR from branch `fix/shared-error-retry` and merge once reviewed.
