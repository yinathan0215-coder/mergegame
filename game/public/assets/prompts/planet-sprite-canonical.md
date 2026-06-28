# Planet Sprite Canonical Prompt Record

This file is the required record for generated planet sprites. Add the final prompt,
source image path, post-processing steps, and final asset path whenever a generated
planet asset is accepted into `game/public/assets/planets/`.

## Canonical Style

- Reference target: `game/public/assets/resource-preview.png`.
- Shape language: flat 2D circular mobile-game icons with a thick dark chocolate outline.
- Rendering: simple cel shading, clean vector-like edges, 2-3 dominant color regions.
- Asset handling: generate each planet as an individual image, not as a cropped sprite sheet.
- Canvas: centered square canvas with generous padding; final normalization resizes the full
  canvas to 256x256 without cropping.
- Transparency: use a flat chroma-key background, remove it locally, and validate transparent
  corners before writing the project asset.
- Board assets: planet prompts do not alter board background or board frame assets.

## Tier 6 Uranus - 2026-06-28

Final asset: `game/public/assets/planets/tier-6-uranus.png`

Generated source:
`C:\Users\USER\.codex\generated_images\019f0ca6-00e8-7ce3-903b-468b431305cb\ig_079b0a67d6bf83ed016a40c873658081919b23b242f2315129.png`

Post-processing:

1. Remove flat `#ff00ff` chroma key with
   `C:\Users\USER\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py`.
2. Use `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`.
3. Resize the full alpha canvas to 256x256 without cropping.
4. Center-scale the full alpha canvas by `1.24x` so the visible silhouette matches the
   existing planet set (`227x235` alpha bounds).
5. Validate transparent corners and subject bounds.

Final prompt:

```text
Use case: stylized-concept
Asset type: Planet Pool Merge tier 6 Uranus PNG sprite; one standalone asset, not a cropped sprite sheet.
Primary request: Create a single Uranus sprite that matches the visible project planet set: bold dark chocolate/black outline, flat 2D mobile game icon, simple cel-shaded fills, clean vector-like edges.
Subject: Uranus as a pale cyan / mint-blue gas giant, circular body, no photorealism. Use 2-3 broad horizontal curved bands in slightly lighter/darker cyan/teal only. Include a subtle icy blue rim/highlight as a flat shape, not glossy.
Style/medium: flat 2D cartoon sprite for a casual merge game; thick dark outline about 5% of diameter; simple shapes, no texture noise.
Composition/framing: centered in a square canvas, full body visible with generous padding, no crop. Keep the silhouette mostly circular; do not use large external rings so it remains different from Saturn.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for background removal. Background must be one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Color palette: dark outline #2a1717, body cyan/mint/teal only; no pink, red, or purple stripes.
Constraints: individual image, not a sprite sheet; no board frame; no text; no watermark; transparent-ready crisp edges; no cast shadow; no contact shadow.
Avoid: photorealistic 3D render, glossy sphere, realistic NASA texture, thin realistic rings, gradients beyond simple cel shading, detailed atmospheric streaks, cropped edges.
```

## Tier 6 Uranus Ring Revision - 2026-06-28

Final asset: `game/public/assets/planets/tier-6-uranus.png`

Generated source:
`C:\Users\USER\.codex\generated_images\019f0ca6-00e8-7ce3-903b-468b431305cb\ig_0c7f848d54dc3032016a40cbe65a4481918e2bf6c18424904b.png`

Post-processing:

1. Remove flat `#ff00ff` chroma key with
   `C:\Users\USER\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py`.
2. Use `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`.
3. Resize the full alpha canvas to 256x256 without cropping.
4. Center-scale the full alpha canvas by `1.12x` so the ring remains fully visible while
   the planet body reads at the same scale family as the existing set.
5. Validate transparent corners and total subject bounds (`169x243` alpha bounds).
6. Runtime scale basis for tier 6 is the visible planet body diameter (`168px`), not the
   full ring height, so the physical body matches the collision radius.

Final prompt:

```text
Use case: stylized-concept
Asset type: Planet Pool Merge tier 6 Uranus PNG sprite; one standalone asset, not a cropped sprite sheet.
Primary request: Create a single Uranus sprite that matches the visible project planet set: bold dark chocolate/black outline, flat 2D mobile game icon, simple cel-shaded fills, clean vector-like edges. Uranus must include a visible thin ring.
Subject: Uranus as a pale cyan / mint-blue gas giant with a circular body. Add 2-3 broad curved horizontal bands in slightly darker/lighter cyan and teal. Add a thin tilted icy cyan/teal ring crossing behind and in front of the planet, like Uranus's ring system, but keep it much thinner and less prominent than Saturn's big golden ring.
Style/medium: flat 2D cartoon sprite for a casual merge game; thick dark outline about 5% of diameter around the planet body and clean dark outline on the thin ring; simple cel shading, no texture noise, no photorealism.
Composition/framing: centered in a square canvas, full body and full ring visible with generous padding, no crop. Ring should be diagonal/tilted, narrow, and fit inside the square canvas.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for background removal. Background must be one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Color palette: dark outline #2a1717, body cyan/mint/teal, ring pale icy cyan/teal; no pink, red, or purple stripes; no yellow/gold ring.
Constraints: individual image, not a sprite sheet; no board frame; no text; no watermark; transparent-ready crisp edges; no cast shadow; no contact shadow.
Avoid: photorealistic 3D render, glossy NASA-style planet, huge Saturn-like golden ring, detailed atmospheric streaks, cropped edges, extra planets or stars.
```
