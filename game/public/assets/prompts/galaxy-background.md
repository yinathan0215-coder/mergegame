# Galaxy Background Prompt and Edit Record

## Canonical Style

- Runtime final asset: `game/public/assets/board/space-background-cover-16x9.png`
- Legacy portrait asset: `game/public/assets/board/space-background.png`
- Runtime use: Pool In-Game board interior and Title background.
- Style: flat casual mobile game background matching the planet sprites, with dark navy space
  and large soft vertical galaxy bands.
- Do not bake cross stars, dot marks, speckles, sparkle marks, planets, UI, board frame, or text
  into the static image.
- Stars and dots are runtime effects, not static bitmap details.

## Cover 16x9 2026-06-28

- Source: `C:\Users\USER\.codex\generated_images\019f0dd5-64b8-7b82-a830-3aa8924d0623\ig_06f61525b1828cdc016a41151644dc8191ab59d57b3dafeacf.png`
- Source size: `1672x941`
- Final size: `1920x1080`
- Method: built-in image generation from the existing `space-background.png` style reference; center-cropped by one pixel row equivalent and resized to exact 16:9.
- Preserved: dark navy flat casual style, broad vertical wavy galaxy bands, no baked stars or UI.
- Changed: denser wave-band spacing so 9:16 and 1:2 cover crops still show a visible pattern.
- Final path: `game/public/assets/board/space-background-cover-16x9.png`

### Cover 16x9 Prompt

```text
Use Image #1 as the visual reference. Create a 16:9 landscape game background resource for a casual 2D space merge game, designed to be used with cover scaling on 16:9, 9:16, and very tall 1:2 screens.

Primary request: a wider, larger 16:9 version of the existing dark navy wavy galaxy background, with a denser repeating wave-band pattern than the reference so the pattern remains visible after center-cropping to portrait.
Composition/framing: true 16:9 landscape canvas. Fill the whole canvas with many broad but closer-spaced vertical wavy nebula bands, flowing top to bottom with gentle S-curves. Keep the central vertical crop visually rich because portrait cover crops will show the center area. No single focal point, no empty center.
Style/medium: flat casual mobile game background, clean 2D painted look, matching the provided reference image exactly in mood and simplicity.
Color palette: dark navy base with muted indigo and blue wave bands, low contrast, similar to Image #1.
Constraints: no stars, no sparkles, no dots, no planets, no UI, no board frame, no text, no watermark, no borders. Not photorealistic. No noisy dust, no realistic nebula, no high-contrast bright glow. Do not stretch the reference; create a new native 16:9 cover-safe background with denser wavy bands.
```

## Final 2026-06-28 Edit

- Source: `git:HEAD:game/public/assets/board/space-background.png`
- Source size: `376x606`
- Final size: `376x606`
- Method: OpenCV inpaint on the existing casual background, masking baked yellow cross stars and
  small blue dot marks only.
- Preserved: original dark navy palette, flat 2D style, and broad vertical wavy galaxy bands.
- Removed: five yellow cross-star marks and small fixed dot marks.
- Final path: `game/public/assets/board/space-background.png`

## Rejected Generation

- Source: `C:\Users\USER\.codex\generated_images\019f0ca6-00e8-7ce3-903b-468b431305cb\ig_0d8b06aa8e0afc21016a40def2585c819196ce7e8c27589af0.png`
- Reason: too photorealistic/nebula-like; does not match the existing casual planet sprite art style.
- Status: not used by runtime or manifest.

## Rejected Prompt

```text
Use case: stylized-concept
Asset type: vertical mobile game board background for Planet Pool Merge, final crop/aspect target 376:606 portrait.
Primary request: a dark Milky Way / galaxy haze background only, for a casual 2D planet merge game.
Scene/backdrop: deep space with smooth nebula clouds and a soft diagonal Milky Way band, low contrast and readable behind colorful planet sprites.
Subject: no foreground object; the entire image is a swappable background texture.
Style/medium: polished casual mobile game illustration, painterly 2D texture, not photorealistic.
Composition/framing: tall portrait composition, important galaxy haze centered and balanced from top to bottom, usable across the full frame.
Lighting/mood: dark, calm, cosmic, subtle glow.
Color palette: deep navy, blue-black, muted teal, restrained violet highlights, low saturation.
Materials/textures: soft gaseous nebula gradients and faint dust lanes only.
Constraints: create a complete standalone portrait asset, no cropping sheet, no frame, no board outline, no planets, no UI, no text, no watermark.
Avoid: stars, star dots, speckles, sparkle marks, point lights, constellations, bokeh dots, grid marks, dust particles that read as stars, bright white points, high contrast busy details.
```
