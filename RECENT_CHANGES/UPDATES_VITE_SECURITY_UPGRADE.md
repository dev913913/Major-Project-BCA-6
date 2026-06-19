# Vite Security Upgrade
**Date**: April 7, 2026  
**Branch**: `fix/vite-security-upgrade`  

## What changed
I upgraded Vite and the React plugin to resolve remaining npm audit vulnerabilities.

### Files changed
- `package.json`
- `package-lock.json`

## Why this was needed
The previous dependency tree had two moderate vulnerabilities related to `esbuild` and `vite`. These vulnerabilities could allow unsafe development server behavior if left unpatched.

## What is now different
- `vite` was upgraded to `8.0.5`
- `@vitejs/plugin-react` was upgraded to a version compatible with Vite 8
- `npm audit` now reports 0 vulnerabilities

## Why this is better
- The project dependency stack is now up-to-date with the secure Vite version.
- This reduces security risk from known `esbuild`/`vite` vulnerabilities.
- The build was validated successfully after the upgrade.

## Next step
Create a PR from branch `fix/vite-security-upgrade` and merge it once reviewed.
