# Pixel Studio JSON Interface Specification

Version 1.0 · portable drawing protocol for Pixel Studio command documents

This document defines how an AI agent or another web application can produce a pixel drawing that Pixel Studio can import. The protocol is deliberately self-contained: a compatible client can use the schema and examples below without access to this repository. The current implementation is a browser-based JavaScript editor with a fixed 400 × 400 display and an adjustable pixel grid.

## 1. Two JSON formats

Pixel Studio uses two distinct JSON documents:

- **Command document** (`pixel-studio-commands`): drawing instructions plus optional canvas and editor settings. This is the recommended format for AI-generated art because it is compact and editable.
- **Project document** (`pixel-studio-project`): exact saved RGBA pixels plus settings. Use it to preserve and share a finished raster exactly.

The editor also accepts a legacy bare array of drawing commands. New integrations should always write the versioned command document.

## 2. Canvas, grid and coordinates

- The displayed work area is 400 × 400 CSS pixels in the current studio.
- The logical drawing grid has integer width and height from 16 through 512. Width and height may differ.
- Pixel density is `width × height` (for example, 128 × 128 = 16,384 logical pixels). Density describes the artwork grid, not the display size.
- Coordinates are integer grid indices, with `(0, 0)` at the upper-left. The valid range is `x: 0..width-1`, `y: 0..height-1`.
- Every color is an opaque six-digit hex string such as `#72b9e8`. Use uppercase or lowercase hex.
- Draw commands are applied in array order. Later commands cover earlier pixels. Plan broad background shapes first, then silhouettes, interior colors, and highlights/details.

The built-in named presets are:

| Preset | Grid | Pixels | Typical use |
| --- | ---: | ---: | --- |
| `coarse32` | 32 × 32 | 1,024 | bold, chunky icons |
| `small64` | 64 × 64 | 4,096 | simple sprites |
| `classic128` | 128 × 128 | 16,384 | standard pixel art |
| `detail192` | 192 × 192 | 36,864 | character art with readable details |
| `fine256` | 256 × 256 | 65,536 | fine pixel illustrations |
| `veryFine384` | 384 × 384 | 147,456 | high-detail art |
| `ultra512` | 512 × 512 | 262,144 | maximum supported grid |

Use explicit `canvas.width` and `canvas.height` for a custom size. Grid dimensions must be integers between 16 and 512 inclusive.

## 3. Command document schema

The outer shape is:

```json
{
  "format": "pixel-studio-commands",
  "version": 1,
  "settings": {},
  "commands": []
}
```

`settings` is optional. `commands` is required and may contain no more than 20,000 operations. The application validates the full command list before drawing; an invalid document is rejected as a whole. Settings, when present, are applied before coordinate validation, so operations use the dimensions declared in that document.

### Supported settings

All settings are optional. Unspecified settings retain the current editor value.

```json
{
  "preset": "detail192",
  "canvas": { "width": 192, "height": 192 },
  "pixelDensity": { "width": 192, "height": 192, "total": 36864 },
  "display": { "width": 400, "height": 400 },
  "grid": { "visible": false },
  "imageImport": { "colorCount": 32, "fit": "contain" },
  "editor": {
    "theme": "dark",
    "zoom": 1,
    "tool": "pencil",
    "activeColor": "#294476"
  },
  "palette": ["#07163d", "#eff7ff", "#63d1e5"]
}
```

Supported values and behavior:

- `preset`: one of the names in the preset table, or `custom`. A named preset supplies the initial width and height. Explicit `canvas.width`/`height` and then `pixelDensity.width`/`height` override preset dimensions.
- `canvas.width`, `canvas.height`: integer 16..512. These determine the command coordinate range.
- `pixelDensity.width`, `height`: compatibility aliases for the grid dimensions when the corresponding `canvas` field is absent. `total` is descriptive; clients should keep it equal to width × height.
- `display.width`, `height`: descriptive metadata. The current editor display is 400 × 400 and does not resize from this setting.
- `grid.visible`: boolean.
- `imageImport.colorCount`: 16, 32 or 64. `imageImport.fit`: `contain`, `cover` or `stretch`.
- `editor.theme`: `light` or `dark`. `zoom`: number clamped by the app to 0.7..1.5. `tool`: `pencil`, `eraser`, `fill`, `line`, `rect` or `eyedropper`. `activeColor`: `#RRGGBB`.
- `palette`: up to 24 `#RRGGBB` colors. An empty or invalid palette is not applied.

### Drawing operations

Each command has an `op` string. `color` is optional and defaults to the editor's current active color. Colors must be valid `#RRGGBB` values.

| Operation | Fields | Behavior |
| --- | --- | --- |
| `setPixel` | `x`, `y`, `color` | Set one pixel. Both coordinates must be integers within the grid. |
| `fillRect` | `x`, `y`, `width`, `height`, `color` | Fill an axis-aligned rectangle. Width and height must be positive integers. Rectangle portions outside the canvas are clipped; x and y themselves may be outside. |
| `drawLine` | `x1`, `y1`, `x2`, `y2`, `color` | Draw a line between two in-range integer points. |
| `fillPolygon` | `points`, `color` | Fill a polygon defined by 3..512 `[x, y]` integer points. Every point must be inside the grid. |
| `clear` | `color` (optional) | Fill the whole grid. Missing color defaults to white (`#ffffff`). |

Unknown operations, malformed points, invalid colors, and out-of-range point coordinates are errors. To avoid ambiguity, generate polygons with simple non-self-intersecting outlines and avoid duplicate consecutive points.

### Minimal command example

```json
{
  "format": "pixel-studio-commands",
  "version": 1,
  "settings": {
    "preset": "classic128",
    "canvas": { "width": 128, "height": 128 },
    "pixelDensity": { "width": 128, "height": 128, "total": 16384 },
    "display": { "width": 400, "height": 400 },
    "grid": { "visible": false },
    "palette": ["#102653", "#eff7ff", "#63d1e5"]
  },
  "commands": [
    { "op": "clear", "color": "#102653" },
    { "op": "fillPolygon", "points": [[24, 56], [64, 24], [104, 56], [95, 108], [64, 118], [33, 108]], "color": "#eff7ff" },
    { "op": "fillRect", "x": 48, "y": 62, "width": 12, "height": 8, "color": "#63d1e5" },
    { "op": "fillRect", "x": 72, "y": 62, "width": 12, "height": 8, "color": "#63d1e5" },
    { "op": "drawLine", "x1": 57, "y1": 91, "x2": 70, "y2": 94, "color": "#d78d9a" }
  ]
}
```

## 4. Project document schema

Project documents preserve the exact raster rather than a drawing history:

```json
{
  "format": "pixel-studio-project",
  "version": 1,
  "settings": {
    "preset": "classic128",
    "canvas": { "width": 128, "height": 128 },
    "display": { "width": 400, "height": 400 },
    "pixelDensity": { "width": 128, "height": 128, "total": 16384 }
  },
  "pixels": {
    "encoding": "base64-rgba",
    "data": "<base64 bytes>"
  }
}
```

`pixels.data` is Base64 of row-major RGBA8 bytes: for each pixel in y-major then x-major order, store red, green, blue, alpha bytes. The decoded byte count must equal `canvas.width × canvas.height × 4`. Project files require valid dimensions and pixel data. Prefer the editor's project export when exact data is needed; AI agents should usually author command documents instead of hand-writing Base64.

## 5. AI drawing workflow

For readable character pixel art:

1. Choose the smallest grid that can support the requested detail. `detail192` is a useful starting point for a full character; use 128 for bold sprites or 256 when face, costume and wings need more pixel clusters.
2. Use a deliberate palette (often 12–32 colors). Assign related light, midtone and shadow colors to each major material instead of adding unrelated colors.
3. Establish composition in layers: background, distant effects, silhouette, large color masses, face and costume features, then highlights.
4. Keep the subject silhouette distinct from the background. At small sizes, prioritize head shape, hair mass, eyes, outfit silhouette and signature accessories over tiny isolated details.
5. Use polygons for silhouettes and angular forms, rectangles for blocky clusters, and lines for short contours or stars. Keep coordinates integer and check all points against the selected grid.
6. Return only valid JSON, without Markdown fences or explanatory text, when the output is intended for direct import.

### Reusable instruction for another AI

Copy the following instruction together with this document and the image/reference description:

> Create an original, polished pixel-art interpretation of the requested subject for Pixel Studio. Follow the “Pixel Studio JSON Interface Specification” exactly. Return one `pixel-studio-commands` version 1 JSON document and no Markdown. Choose a suitable named preset or an explicit 16..512 grid, declare consistent canvas and pixelDensity settings, and include a restrained hex palette. Use only `clear`, `setPixel`, `fillRect`, `drawLine`, and `fillPolygon`. Keep every setPixel, line endpoint and polygon point integer and inside `[0,width-1] × [0,height-1]`; rectangles may extend off-canvas but use clipping intentionally. Use a layered sequence from background through silhouette, forms, face and details. Make the character readable at native pixel scale, use clustered shading rather than scattered noise, and keep the total command count at or below 20,000. Before returning, check JSON syntax, operation names, color format, required fields, and coordinate bounds.

## 6. Importing and applying

In Pixel Studio, open the AI Studio panel, choose **JSON 파일 열기** to load a `.json` command document, then choose **명령 실행하기** to apply it. A command document can also be pasted into the JSON editor and run. Applying a command document is an editor action and can be undone with the studio's undo control. The app checks the whole input before drawing.

Other web UIs can implement this protocol by parsing the versioned wrapper, applying settings, validating every operation against the resulting grid dimensions, then executing operations in order on an RGBA pixel buffer. Match the operation semantics above, including rectangle clipping, line rasterization, polygon filling, and clear-to-white default, for best visual compatibility.

## 7. Current implementation limits

The current Pixel Studio command runner supports exactly the version 1 operations and settings documented here. It does not execute JavaScript embedded in JSON, arbitrary scripts, layers, transparency per command, gradients, text, masks or animation. Each command uses an opaque hex color. Do not add undocumented operation fields expecting them to render. Increase detail by using a finer grid and thoughtfully composed clusters, not by using unsupported drawing features.

