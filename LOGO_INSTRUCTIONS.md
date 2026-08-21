# Logo and favicon instructions

The site uses one shared logo file for both the browser tab favicon and the logo shown beside the `Codev` title in the header.

## Replace the logo

1. Create or export your logo as an SVG file.
2. Name the file `brand-logo.svg`.
3. Upload or copy it into the `public/` folder, replacing `public/brand-logo.svg`.
4. Restart the development server if it is already running.
5. Hard refresh the browser if the old favicon is still cached.

## Use a PNG instead

If your logo is a PNG, place it in `public/` and update these references:

- In `index.html`, change the favicon `href` from `/brand-logo.svg` to your PNG file name, and change `type="image/svg+xml"` to `type="image/png"` or remove the `type` attribute.
- In `index.html`, change the `apple-touch-icon` `href` from `/brand-logo.svg` to your PNG file name.
- In `src/components/Header.jsx`, change the image `src` from `/brand-logo.svg` to your PNG file name.

Recommended sizes:

- SVG: preferred, because it stays sharp at every size.
- PNG: export at least `512x512` pixels with a transparent background.

## Prompt for Gemini logo generation

Use this prompt in Gemini:

> Create a modern, professional logo for a coding education website named "Codev" by Dev Kumar. The brand should feel friendly, smart, and beginner-friendly for students learning programming. Design a simple icon that combines code brackets, a forward slash, or a subtle letter C/D concept. Use an indigo and white color palette, with optional light blue accents. The logo must be clean, minimal, readable at favicon size, and work on both light and dark backgrounds. Provide a square app-icon version with transparent background, an SVG/vector style, and no tiny text except an optional simple "C" or code-symbol mark. Avoid complex gradients, clutter, and photorealistic effects.
