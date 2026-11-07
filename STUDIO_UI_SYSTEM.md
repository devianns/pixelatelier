# Pixel Studio Family UI System

Version: `1.0`  
Runtime: plain HTML and CSS; no framework, package manager, remote stylesheet, or component library.

This document and the root `studio-ui.css` are the canonical visual contract for the Pixel Studio family. The standalone Motion Studio includes an identical local copy at `SubProjects/PixelMotionStudio/studio-ui.css` so it still works when deployed by itself. When changing shared rules, update both copies and keep them byte-for-byte identical.

## Shared visual language

- **Canvas/background:** muted neutral green-gray in light mode; deep charcoal-green in dark mode.
- **Panels:** clear raised surfaces with consistent 10px corners, thin borders, and restrained shadows.
- **Accent:** sage/teal for active tools, primary actions, focus, and progress. Warm gold is a small highlight only; red signals an error.
- **Typography:** system UI fonts with a system monospace stack for coordinates, filenames, and code. Do not download fonts at runtime.
- **Spacing:** use the `--ui-space-*` scale (4, 8, 12, 16, 20, 24px) for new shared patterns.
- **Controls:** shared 36px standard control height, 6px control corners, visibly distinct hover/disabled/focus states. Compact canvas controls may be 28px when the tool layout requires them.
- **Shell:** consistent centered app width, header scale, panel separation, and mobile page gutters. Keep each product's work surface and specialist tools in its own layout.

## Layout contract

Use the same studio page rhythm: top bar for identity and global actions; a short page introduction/status; a work area with tool or asset controls, central preview/canvas, and settings; then a concise status/footer. Pixel Studio keeps its drawing tools and AI JSON panel. Motion Studio keeps its ordered frame list, preview, and GIF export settings. Their panel contents and workflows remain product-specific.

At narrower widths, preserve all operations and stack the panels in a usable order. Avoid hiding core actions, shrinking helper text below readable sizes, or using color alone to indicate selection or errors.

## CSS tokens

Use the `--ui-*` custom properties in `studio-ui.css` for shared components. Existing aliases (`--ink`, `--muted`, `--line`, `--paper`, `--panel`, `--accent`, and `--accent-deep`) map legacy product styles to the shared light/dark palette. App styles load first; the shared stylesheet loads after them to apply the contract. Product-specific canvas/preview rendering can keep its own checkerboard and image-stage treatment.

## Component rules

- `.app-shell`, `.topbar`, `.intro`, `.workspace`, and `.panel` form the common page shell.
- `.button`, `.button-primary`, `.button-secondary`, `.button-muted`, and `.icon-button` describe action priority and common sizing.
- Inputs, selects, and textareas use shared surface, border, text, and focus tokens. Use labels and inline help for settings.
- Keep keyboard focus visible with `:focus-visible`; respect `prefers-reduced-motion`.
- Theme controls continue to set `document.documentElement.dataset.theme` to `light` or `dark`; the common stylesheet provides both palettes and does not own application state.
- Do not use global selectors to alter canvas pixels, image assets, export dimensions, shortcuts, queues, or other editor behavior.

## Adding another studio

Copy the canonical CSS into the new standalone project, link it after the app stylesheet, and use the common shell/control classes. Keep app-specific behavior in that app's JavaScript. Update the canonical copy and all standalone copies together. This local-copy approach avoids runtime links to a parent directory that would break independent deployment.
