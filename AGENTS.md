# Pixel Studio agent guide

This file is the handoff document for future coding agents working in this repository. Keep it synchronized with `app.js`, `index.html`, `styles.css`, and `studio-ui.css`. The user-facing overview and JSON formats live in `README.md`; local example artwork is kept in the ignored asset archive.

## Project purpose and boundaries

Pixel Studio is a local, browser-based pixel editor. A person can draw on the canvas, import and quantize a reference image, or paste structured JSON commands that an AI generated. It does not call an AI model or server. Do not describe the JSON editor as a live AI connection.

The project is deliberately buildless: open `index.html` in a browser. There is no package manager manifest, framework, backend, network API, or test runner. Keep dependencies out unless the user asks for a larger architectural change. Shared visual rules are authored in local CSS, and fonts use system stacks without a runtime download.

## Source map

| File | Responsibility |
| --- | --- |
| `index.html` | Static page structure, side panels, drawing tools, canvas element, JSON editor and independent batch-conversion panel |
| `app.js` | All application state, dynamic toolbar controls, canvas pixels/rendering, drawing tools, presets, history, local persistence, image conversion, batch PNG/ZIP export, JSON formats, and `window.pixelArtCanvas` |
| `styles.css` | Pixel editor layout, responsive rules, canvas stage and batch-conversion panel |
| `studio-ui.css` | Shared Pixel Studio family design tokens and components; canonical source for the identical Motion Studio copy |
| `STUDIO_UI_SYSTEM.md` | Cross-studio UI rules, layout contract, tokens and copy-sync guidance |
| `favicon.svg` | Lightweight vector favicon used by the static page |
| `robots.txt` | Allows public crawling and points crawlers to the deployed sitemap |
| `sitemap.xml` | Sitemap for the single public application URL |
| `README.md` | User setup, behavior, JSON format reference, API examples and file map |
| `SubProjects/private-image-assets-saver/` | Local, Git-ignored asset archive for original images, generated previews, pixel-art JSON, and animation frames. This is data storage, not an application project. |
| `.gitignore` | Excludes the private asset archive and independent `SubProjects/` area from this repository. |
| `SubProjects/PixelMotionStudio/` | Independent GIF maker project. Keep its code separate from Pixel Studio; generated example frames are archived beside it under `private-image-assets-saver/`. |

The JavaScript is one IIFE in `app.js`; it has no module imports. Some toolbar controls are created dynamically near the top of that file and then wired to events later in the same IIFE. Keep IDs and selectors synchronized if relocating those controls into static HTML.

## Canvas model

- `DISPLAY` is fixed at 400. The visible `#artCanvas` backing canvas is 400×400.
- `gridWidth` and `gridHeight` are the logical drawing dimensions. Each axis must be an integer from 16 through 512. Default is 128×128 (16,384 logical pixels).
- `buffer` is the logical-resolution offscreen canvas. `pixels` is its row-major RGBA `Uint8ClampedArray`, exactly `gridWidth * gridHeight * 4` bytes.
- Pixels are addressed from top-left: x increases rightward, y downward. Valid point coordinates are `0 <= x < gridWidth`, `0 <= y < gridHeight`.
- `getDrawBounds()` fits the logical canvas inside the square display while preserving its aspect ratio. Pointer mapping rejects clicks in the remaining letterbox.
- Both art and offscreen canvas contexts preserve alpha. `render()` scales RGBA pixels with smoothing disabled. Pixel boundary lines are drawn on the separate `#gridOverlay` canvas using the same `getDrawBounds()` and logical grid dimensions as the editable/exported raster; never draw guides into `#artCanvas` or the RGBA buffer. The visible backplate is fixed white and guide lines are black in either theme. The guide toggle affects only that overlay. The white backplate and grid are display-only; transparent pixels remain alpha-zero in project data and PNG exports.
- `resizeGrid()` validates dimensions and resamples existing artwork with nearest-neighbor scaling. It records one history entry unless called with `record=false` as part of a larger transaction.

Preset keys and values are defined in `densityPresets` in `app.js`:

| Key | Dimensions |
| --- | ---: |
| `coarse32` | 32×32 |
| `small64` | 64×64 |
| `classic128` | 128×128 |
| `detail192` | 192×192 |
| `fine256` | 256×256 |
| `veryFine384` | 384×384 |
| `ultra512` | 512×512 |

Non-preset or rectangular sizes are represented with preset `custom`. When both a preset and `settings.canvas` dimensions are provided, explicit canvas width/height win.

## Application state and history

`state` contains the selected color/tool, pixel-guide visibility, zoom, image import color count and fit, theme, active preset, pointer-drawing state, and history stacks. `paletteColors` is a separate array with at most 24 six-digit hex colors.

Each undo snapshot stores logical dimensions, a pixel copy, palette, pixel-guide visibility, active color, image-import options and preset. History is capped at 50 entries. Resize, image import, drawing gestures, clear, API edits, project import and a valid JSON command document are committed as single edits. Undo uses `Ctrl+Z`; redo uses `Ctrl+Shift+Z` or `Ctrl+Y`. Textareas and inputs retain their browser-native text undo behavior because application shortcuts are ignored while they are focused.

Theme, zoom and selected tool are saved in projects but are not part of the art-history snapshot. Do not assume undo restores those view preferences.

## Persistence and compatibility

- Main key: `pixel-atelier-art-v1` in `localStorage`.
- Palette migration key: `pixel-atelier-palette-v1`.
- Current autosave uses the `pixel-studio-project` v1 object described below.
- `restore()` also accepts the previous raw 128×128 RGBA numeric array and the earlier `{width,height,pixels:[...]}` object.
- Bare arrays of operations remain a supported legacy command format; the example JSON file itself is stored in the private asset archive.
- Artwork, original images, previews, and animation frames belong in `SubProjects/private-image-assets-saver/`, organized by type. Do not add these binary or example artwork assets back to the application tree unless the user asks for distributable samples.
- Pixel-art project and command JSON examples are also archived locally and are not tracked by this application repository.
- Large project data is Base64 in local storage. A 512×512 RGBA project is about 1.4 MB before JSON/localStorage overhead; `save()` handles storage quota errors by updating the save status.

## JSON contracts

### Full project: `pixel-studio-project` v1

`getProjectDocument()` returns:

```json
{
  "format": "pixel-studio-project",
  "version": 1,
  "settings": {
    "preset": "classic128",
    "canvas": { "width": 128, "height": 128 },
    "display": { "width": 400, "height": 400 },
    "pixelDensity": { "width": 128, "height": 128, "total": 16384 },
    "grid": { "visible": true },
    "imageImport": { "colorCount": 32, "fit": "contain" },
    "editor": {
      "theme": "dark",
      "zoom": 1,
      "tool": "pencil",
      "activeColor": "#273b3a"
    },
    "palette": ["#273b3a", "#819783"]
  },
  "pixels": { "encoding": "base64-rgba", "data": "..." }
}
```

`pixels.data` decodes to exactly `width * height * 4` bytes in row-major RGBA order. Projects import through the header JSON picker, the AI editor, or `installProject()` via `applyStudioCommands()`.

Project JSON preserves per-pixel alpha. Both canvas contexts must remain alpha-enabled, and the fixed white backplate belongs to CSS behind the canvas rather than the raster. Command colors remain opaque six-digit hex; don't claim command documents can encode transparency.

Fresh pixel memory starts transparent. The eraser and clear button set RGBA to zero. `restore()` migrates an autosaved solid opaque black canvas to a transparent blank canvas, which fixes blank data saved before alpha rendering; preserve all other saved projects.

### AI commands: `pixel-studio-commands` v1

The command document is `{format, version, settings?, commands}`. Settings are applied before operations and the full document is one transaction. `settings` accepts:

- `preset`: a key from `densityPresets`, or `custom`.
- `canvas.width` and `canvas.height`: integers 16–512.
- `pixelDensity.width` and `.height`: dimension fallback if a corresponding `canvas` dimension is absent.
- `display`: exported metadata only; the actual display stays fixed at 400×400.
- `grid.visible`: boolean.
- `imageImport.colorCount`: 16, 32 or 64; `fit`: `contain`, `cover` or `stretch`.
- `editor.theme`: `light` or `dark`; `zoom`: clamped to 0.7–1.5; `tool`: one of `pencil`, `eraser`, `fill`, `line`, `rect`, `eyedropper`; `activeColor`: hex color.
- `palette`: one to 24 six-digit hex colors.

Operations accepted by `normalizeOp()`:

| Operation | Validation/behavior |
| --- | --- |
| `setPixel` | x/y integer coordinates in current bounds; set one color |
| `fillRect` | integer x/y, positive integer width/height; clipped at canvas edges |
| `drawLine` | both integer endpoints inside current bounds; Bresenham line |
| `fillPolygon` | 3–512 `[x,y]` points inside bounds; scanline fill |
| `clear` | fills all pixels; optional color defaults to `#ffffff` |

Colors are accepted by `hexToRgb()` in `#RGB` or `#RRGGBB` form. A command document may contain at most 20,000 operations. All operations are normalized/validated before any drawing operations run. A failed wrapped command document restores the previous canvas/settings snapshot and the separately saved theme/zoom/tool preferences. Bare operation arrays remain supported for old content.

Project and command format changes must update all of these together: `getProjectDocument()`, `getStudioSettings()`, `installProject()`, `applyStudioSettings()`, `applyStudioCommands()`, `pixelArtCanvas.getJSONFormatHelp()`, and the corresponding README examples. Keep the `version` at 1 for compatible additions; bump it and add migration logic for breaking changes.

## Image import behavior

`importPixelImage(file)` uses `createImageBitmap`, renders the source to the current logical dimensions, then quantizes using median cut to the selected 16/32/64 colors. The import fit modes are:

- `contain`: preserve aspect ratio; center the image and leave white margins.
- `cover`: preserve aspect ratio; crop overflow to fill the canvas.
- `stretch`: scale independently to target width and height.

Transparent source pixels remain transparent; visible pixels are quantized and made opaque at an alpha threshold of 128. `contain` leaves transparent margins, and import replaces the current canvas in one undo step. Keep source dimensions independent from target grid dimensions.

### Advanced batch conversion

- The full-width `#batchStudio` panel below the existing workspace is separate from the editor canvas. Do not route batch imports through `importPixelImage()` because that function intentionally replaces the current art and commits history.
- Batch preset dimensions mirror `densityPresets`; `custom` accepts integer width/height 16–512. Batch color count and fit options mirror the existing 16/32/64 and `contain`/`cover`/`stretch` controls.
- `pixelizeBatchImage()` processes one file at a time through `createImageBitmap`, the selected fit mode and the shared `quantizePixels()` routine. It preserves alpha and emits each result as a target-resolution PNG.
- Export packs the PNGs into a dependency-free, UTF-8 ZIP32 archive using stored entries and CRC32. Keep filenames sanitized and unique. The current queue limit is 200 images; surface processing progress and errors in `#batchStatus`.
- Batch preset controls and queue state are independent from the main canvas and are not part of project JSON/local storage. Keep this separation unless the user asks to persist batch settings.

## Public browser API

`window.pixelArtCanvas` is constructed in `app.js`. Current methods/properties:

- `width`, `height`: live logical dimensions; `displayWidth`, `displayHeight`: fixed 400.
- `resize(width,height)`, `getPixel(x,y)`, `setPixel(x,y,color)`.
- `fillRect(x,y,width,height,color)`, `drawLine(x1,y1,x2,y2,color)`, `fillPolygon(points,color)`.
- `replacePixels(rgbaBytes)`: exact current-size RGBA length required.
- `applyCommands(documentOrArray)`, `getState()`, `exportProject()`, `exportPNG()`.
- `getCommandsHelp()`, `getJSONFormatHelp()`.

The top PNG button exports the logical buffer at current grid dimensions. API `exportPNG()` exports the 400×400 art canvas without the separate grid overlay. Both exports are independent of the grid visibility toggle.

## Editing guidance for future agents

1. Read this file and the affected functions before changing the model.
2. Keep `gridWidth`, `gridHeight`, `pixels`, `buffer`, pointer mapping, JSON validation and displayed dimensions in sync.
3. For a new command, implement normalization, execution, help/schema, UI feedback and README documentation. Keep wrapped command application transactional.
4. For persisted settings or format changes, verify project import/export, local restore, command JSON, undo/redo behavior, and legacy bare arrays.
5. Keep the default project buildless. Do not add dependencies or imply model connectivity unless requested.
6. Keep UI labels and user-facing explanations in Korean; retain stable JSON keys in English.
7. Keep shared CSS changes synchronized with `SubProjects/PixelMotionStudio/studio-ui.css`; that copy must remain self-contained for independent deployment. Reuse shared tokens and shell rules while preserving product-specific panel content and editor behavior.

There is no configured automated test command or browser preview harness in this repository. If a change needs runtime QA, use an available browser directly and report when the environment cannot provide one; do not invent a test command.
