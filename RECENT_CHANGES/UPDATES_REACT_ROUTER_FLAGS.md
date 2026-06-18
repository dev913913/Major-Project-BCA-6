# React Router Future Flags Update
**Date**: April 7, 2026  
**Branch**: `feat/lessons-filter-count`  

## What changed
I enabled React Router future flags in `src/main.jsx` to align the app with upcoming v7 behavior.

### Files changed
- `src/main.jsx`

## Why this was needed
React Router emits runtime warnings when an app is not using the newer future flag behavior. Enabling these flags reduces upgrade risk and keeps route handling consistent with the next major version.

## What is now different
- `BrowserRouter` is configured with future flags:
  - `v7_prependBasename`
  - `v7_startTransition`

## Why this is better
- The app is now closer to React Router v7 semantics.
- It reduces the chance of future breaking changes when upgrading.
- It addresses the current technical debt warning without changing app behavior.

## Next step
Create a PR from this branch and merge it once reviewed.
