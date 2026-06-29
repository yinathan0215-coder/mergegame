# Title Icon Prompt Record

This file records generated title UI icons. Add the prompt, source image path,
post-processing steps, and final asset path whenever a generated title icon is
accepted into `game/public/assets/ui/`.

## Canonical Style

- Reference target: `game/public/assets/ui/crown.png`, `game/public/assets/ui/gold.png`,
  and `game/public/assets/resource-preview.png`.
- Rendering: casual mobile game 2.5D icon, thick dark brown outline, rounded chunky
  forms, saturated blue/gold/orange/red accents, simple cel shading, clean vector-like
  edges.
- Avoid: photorealistic render, product render, realistic metal/glass/paper/building
  texture, detailed material noise, text, numbers, emoji, font glyphs, extra stars or
  sparkle marks.
- Asset handling: generate each icon as an individual image, not as a cropped sprite sheet.
- Canvas: centered square canvas with generous padding; final normalization resizes the
  full alpha canvas to 192x192 without cropping.
- Transparency: generate on a flat `#00ff00` chroma-key background, remove it locally, and
  validate transparent corners before writing the project asset.

## Accepted Title Icons - 2026-06-28

Post-processing for all five icons:

1. Remove flat chroma-key background with
   `C:\Users\USER\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py`.
2. Use `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`.
3. Resize the full alpha canvas to 192x192 without cropping.
4. Validate transparent corners and subject bounds.

### Settings

Final asset: `game/public/assets/ui/settings.png`

Generated source:
`C:\Users\USER\.codex\generated_images\019f0ca6-00e8-7ce3-903b-468b431305cb\ig_0021b6a718388ada016a40fc0f8a70819185ada4fd5f5ae7a1.png`

Final prompt:

```text
Use case: stylized-concept
Asset type: Planet Pool Merge title UI icon, one standalone 192x192 casual mobile game PNG asset.
Style target: match the existing Planet Pool Merge crown and gold coin icons: cute casual 2.5D mobile game icon, bold dark brown outline, rounded chunky shapes, saturated blue and gold accents, simple cel shading, clean vector-like edges, hand-painted cartoon polish. This must look like a casual mobile game icon, not a realistic object.
Primary request: create a settings icon: a friendly rounded blue gear with a gold rim and a small cyan/white circular center, readable at small UI size.
Composition: centered single icon, full object visible, generous padding, no crop, no extra object.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background only, uniform edge to edge.
Constraints: no text, no numbers, no watermark, no emoji, no font glyphs, no extra stars, no sparkle marks, no photorealism, no realistic metal, no glass, no product render, no detailed texture, no cast shadow on the background, do not use #00ff00 or green inside the object.
```

### Daily Mission

Final asset: `game/public/assets/ui/daily-mission.png`

Generated source:
`C:\Users\USER\.codex\generated_images\019f0ca6-00e8-7ce3-903b-468b431305cb\ig_0021b6a718388ada016a40fc4fd5e48191ab590f6f8538ff93.png`

Final prompt:

```text
Use case: stylized-concept
Asset type: Planet Pool Merge title UI icon, one standalone 192x192 casual mobile game PNG asset.
Style target: match the existing Planet Pool Merge crown and gold coin icons: cute casual 2.5D mobile game icon, bold dark brown outline, rounded chunky shapes, saturated blue/gold/orange accents, simple cel shading, clean vector-like edges. This must be a casual mobile game icon, not a realistic object.
Primary request: create a daily mission icon: a rounded blue clipboard or task board with two simple checklist rows and a gold star medal badge. The check marks should be gold or white, not green.
Composition: centered single icon, full object visible, generous padding, no crop, no extra object.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background only, uniform edge to edge.
Constraints: no text, no numbers, no watermark, no emoji, no font glyphs, no extra stars except the single badge star, no sparkle marks, no photorealism, no realistic paper texture, no product render, no detailed material texture, no cast shadow on the background, do not use #00ff00 or green inside the object.
```

### Check-In

Final asset: `game/public/assets/ui/check-in.png`

Generated source:
`C:\Users\USER\.codex\generated_images\019f0ca6-00e8-7ce3-903b-468b431305cb\ig_0021b6a718388ada016a40fc8426388191b0ef4abde5fe9adf.png`

Final prompt:

```text
Use case: stylized-concept
Asset type: Planet Pool Merge title UI icon, one standalone 192x192 casual mobile game PNG asset.
Style target: match the existing Planet Pool Merge crown and gold coin icons: cute casual 2.5D mobile game icon, bold dark brown outline, rounded chunky shapes, saturated blue/gold/orange accents, simple cel shading, clean vector-like edges. This must be a casual mobile game icon, not a realistic object.
Primary request: create a check-in attendance icon: a rounded blue calendar page with a gold top bar and one large gold-and-white check badge in front. The calendar must have simple blank date squares only, with no numbers or letters.
Composition: centered single icon, full object visible, generous padding, no crop, no extra object.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background only, uniform edge to edge.
Constraints: no text, no numbers, no watermark, no emoji, no font glyphs, no extra stars, no sparkle marks, no photorealism, no realistic paper texture, no product render, no detailed material texture, no cast shadow on the background, do not use #00ff00 or green inside the object.
```

### Lucky Wheel

Final asset: `game/public/assets/ui/lucky-wheel.png`

Generated source:
`C:\Users\USER\.codex\generated_images\019f0ca6-00e8-7ce3-903b-468b431305cb\ig_0021b6a718388ada016a40fcc219c48191af601e28bee196e6.png`

Final prompt:

```text
Use case: stylized-concept
Asset type: Planet Pool Merge title UI icon, one standalone 192x192 casual mobile game PNG asset.
Style target: match the existing Planet Pool Merge crown and gold coin icons: cute casual 2.5D mobile game icon, bold dark brown outline, rounded chunky shapes, saturated blue/gold/orange/red accents, simple cel shading, clean vector-like edges. This must be a casual mobile game icon, not a realistic object.
Primary request: create a lucky wheel icon: a colorful prize wheel with wedge segments in blue, cyan, gold, orange, and red, a small gold center cap, and a gold pointer at the top. Keep it simple and readable.
Composition: centered single icon, full wheel visible, generous padding, no crop, no extra object.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background only, uniform edge to edge.
Constraints: no text, no numbers, no watermark, no emoji, no font glyphs, no extra stars, no sparkle marks, no photorealism, no realistic casino object, no product render, no detailed material texture, no cast shadow on the background, do not use #00ff00 or green inside the object.
```

### Shop

Final asset: `game/public/assets/ui/shop.png`

Generated source:
`C:\Users\USER\.codex\generated_images\019f0ca6-00e8-7ce3-903b-468b431305cb\ig_0021b6a718388ada016a40fd00148c819180d6abbd2639f4db.png`

Final prompt:

```text
Use case: stylized-concept
Asset type: Planet Pool Merge title UI icon, one standalone 192x192 casual mobile game PNG asset.
Style target: match the existing Planet Pool Merge crown and gold coin icons: cute casual 2.5D mobile game icon, bold dark brown outline, rounded chunky shapes, saturated blue/gold/orange/red accents, simple cel shading, clean vector-like edges. This must be a casual mobile game icon, not a realistic object.
Primary request: create a shop icon: a cute small storefront with a blue shop body, red-and-gold striped awning, and a gold coin or small gold sign badge without text. Rounded toy-like proportions.
Composition: centered single icon, full storefront visible, generous padding, no crop, no extra object.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background only, uniform edge to edge.
Constraints: no text, no numbers, no watermark, no emoji, no font glyphs, no extra stars, no sparkle marks, no photorealism, no realistic building texture, no product render, no detailed material texture, no cast shadow on the background, do not use #00ff00 or green inside the object.
```

## Accepted Play Button 9-Slice Body - 2026-06-28

Post-processing for the button-body image:

1. Remove flat chroma-key background with
   `C:\Users\USER\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py`.
2. Use `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`.
3. Crop the individual alpha object bounds with 24px padding, then resize to a 224x100
   9-slice source canvas.
4. Validate transparent corners and subject bounds.

The generated image contains only the button body. Runtime code renders it as a 9-slice
surface, overlays the white play triangle and Korean label, and uses common button feedback
for the pressed state. The source canvas and title screen button area stay 224x100; runtime
overlay placement keeps the text and play triangle inside the blue button face, above the
gold lower bevel. If the label drifts low, correct the runtime overlay position rather than
shrinking or regenerating the button image.
`play-button-pressed.png` was discarded and is not a project asset.

### Play Button 9-Slice Body

Final asset: `game/public/assets/ui/play-button.png`

Generated source:
`C:\Users\USER\.codex\generated_images\019f0ca6-00e8-7ce3-903b-468b431305cb\ig_0f4765686cd82928016a41080f31c08191b905a37151a817c2.png`

Final prompt:

```text
Use case: stylized-concept
Asset type: Planet Pool Merge main play button body image, default unpressed state, project UI asset.
Primary request: create one wide horizontal rounded rectangular main CTA button body, no text and no play triangle, in the same casual mobile game 2.5D style as the existing crown and gold coin icons. This is the default unpressed state.
Style target: cute casual mobile game UI, bold dark brown outline, chunky rounded shape, saturated bright blue body, cyan top highlight, subtle gold lower trim, clean cel-shaded edges, toy-like polished button. Not realistic.
Composition: one centered wide pill-rounded rectangle button, about 2.25:1 aspect ratio, full button visible with generous padding, no crop. The top face should be raised with a clear lower bevel and soft dark underside shadow. Empty center area reserved for crisp runtime text.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background only, uniform edge to edge.
Constraints: no text, no letters, no numbers, no play icon, no watermark, no emoji, no extra stars or sparkles, no photorealism, no realistic glass or metal, no detailed material texture, no cast shadow on the green background, do not use #00ff00 or green inside the button.
```

## Accepted Stage Play Button Purple Variant - 2026-06-28

Final asset: `game/public/assets/ui/play-button-stage.png`

Generated color-reference source:
`C:\Users\USER\.codex\generated_images\019f0ca6-00e8-7ce3-903b-468b431305cb\ig_06afaf6043c05d87016a412fdcb458819187175d97792d1386.png`

Post-processing:

1. Use `$imagegen` to request a purple recolor of the existing button.
2. Preserve the accepted 224x100 alpha canvas and 9-slice geometry from `play-button.png`.
3. Apply the generated deep-purple color direction to the button face only; keep the gold lower trim, dark outline, shadow, shape, and transparent bounds unchanged.
4. Validate both `play-button.png` and `play-button-stage.png` as RGBA 224x100 assets.

Runtime usage:

- Infinite Play body: `play-button.png`.
- Stage Play body: `play-button-stage.png`.
- Bottom toggle keeps its existing pill design. It only samples the button-face colors for the active highlight: Infinite `#1f8efa`, Stage `#4e1da9`; it does not replace the toggle with button images.

Final prompt:

```text
Use case: precise-object-edit
Asset type: Planet Pool Merge Stage mode play button 9-slice body PNG variant.
Input image: the visible blue play-button.png is the edit target.
Primary request: recolor the same button body for Stage mode. Keep the exact same silhouette, rounded rectangle shape, alpha/transparent background, bevel structure, dark outline, lower gold trim, underside shadow, padding, and 9-slice-friendly geometry. Change only the main blue button face and cyan highlight into a deep purple/violet palette that harmonizes with a dark navy galaxy background.
Color direction: rich dark violet face, brighter purple top highlight, subtle blue-purple midtones, retain the gold lower trim and dark brown outline.
Constraints: no text, no letters, no numbers, no play triangle, no sparkles, no extra decoration, no crop, no resized canvas, no changed shape, no photorealism, no realistic glass/metal. Preserve casual mobile game 2.5D cel-shaded style.
```

## Accepted HUD Icons - 2026-06-28

Post-processing for both HUD icons:

1. Remove flat chroma-key background with
   `C:\Users\USER\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py`.
2. Use `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`.
3. Resize the full alpha canvas to 192x192 without cropping.
4. Validate transparent corners and subject bounds.

### HUD Exit

Final asset: `game/public/assets/ui/exit.png`

Generated source:
`C:\Users\USER\.codex\generated_images\019f0ca6-00e8-7ce3-903b-468b431305cb\ig_0268db3682ae3893016a410ad65e6881918e562ae5c6df41fd.png`

Final prompt:

```text
Use case: stylized-concept
Asset type: Planet Pool Merge in-game HUD exit/back icon, one standalone 192x192 casual mobile game PNG asset.
Primary request: create a back-to-title / exit icon for the in-game HUD: a rounded blue door or exit arrow symbol with gold trim, clearly readable as leaving/back, no text.
Style target: match the existing Planet Pool Merge crown, gold coin, and title UI icons: cute casual 2.5D mobile game icon, bold dark brown outline, rounded chunky shapes, saturated blue/gold/orange accents, simple cel shading, clean vector-like edges. This must be a casual mobile game icon, not a realistic object.
Composition: centered single icon, full object visible, generous padding, no crop, no extra object, readable at small HUD size.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background only, uniform edge to edge.
Constraints: no text, no letters, no numbers, no watermark, no emoji, no font glyphs, no extra stars or sparkle marks, no photorealism, no realistic material texture, no product render, no cast shadow on the background, do not use #00ff00 or green inside the object.
```

### HUD Menu

Final asset: `game/public/assets/ui/menu.png`

Generated source:
`C:\Users\USER\.codex\generated_images\019f0ca6-00e8-7ce3-903b-468b431305cb\ig_0268db3682ae3893016a410afe7ed481918c24fba344bf04f4.png`

Final prompt:

```text
Use case: stylized-concept
Asset type: Planet Pool Merge in-game HUD hamburger menu icon, one standalone 192x192 casual mobile game PNG asset.
Primary request: create a hamburger menu icon for the in-game HUD: three chunky horizontal blue/cyan menu bars inside or over a small gold-trimmed rounded badge, no text.
Style target: match the existing Planet Pool Merge crown, gold coin, and title UI icons: cute casual 2.5D mobile game icon, bold dark brown outline, rounded chunky shapes, saturated blue/gold/orange accents, simple cel shading, clean vector-like edges. This must be a casual mobile game icon, not a realistic object.
Composition: centered single icon, full object visible, generous padding, no crop, no extra object, readable at small HUD size.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background only, uniform edge to edge.
Constraints: no text, no letters, no numbers, no watermark, no emoji, no font glyphs, exactly three menu bars, no extra stars or sparkle marks, no photorealism, no realistic material texture, no product render, no cast shadow on the background, do not use #00ff00 or green inside the object.
```
