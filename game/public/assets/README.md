# Planet Pool Merge Generated Assets

Generated from the provided reference screenshot and the `docs/` art direction.

## Planets

| Tier | File | Size | Notes |
|---|---|---:|---|
| 1 | `planets/tier-1-asteroid.png` | 256x256 | Gray-brown rocky asteroid |
| 2 | `planets/tier-2-mercury.png` | 256x256 | Gray cratered Mercury |
| 3 | `planets/tier-3-mars.png` | 256x256 | Orange rocky planet |
| 4 | `planets/tier-4-venus.png` | 256x256 | Beige dotted planet |
| 5 | `planets/tier-5-earth.png` | 256x256 | Green/blue earth-like planet; queue cap |
| 6 | `planets/tier-6-neptune.png` | 256x256 | Deep blue wavy planet |
| 7 | `planets/tier-7-uranus.png` | 256x256 | Pale cyan Uranus with thin ring and broad teal bands |
| 8 | `planets/tier-8-saturn.png` | 256x256 | Golden ringed planet |
| 9 | `planets/tier-9-jupiter.png` | 256x256 | Orange-brown striped planet |
| 10 | `planets/tier-10-sun.png` | 256x256 | Yellow/orange sun |
| 11 | `planets/tier-11-black-hole.png` | 256x256 | Purple/navy terminal black hole |

## Board

| File | Size | Notes |
|---|---:|---|
| `board/space-background-cover-16x9.png` | 1920x1080 | Runtime shared cover background for title and board; denser wavy bands |
| `board/space-background.png` | 376x606 | Legacy portrait background kept for reference; baked star marks removed |

## UI

| File | Size | Notes |
|---|---:|---|
| `ui/crown.png` | 192x192 | Best-score crown icon |
| `ui/gold.png` | 192x192 | Gold game-money icon |
| `ui/settings.png` | 192x192 | Title settings icon |
| `ui/daily-mission.png` | 192x192 | Title daily mission icon |
| `ui/check-in.png` | 192x192 | Title attendance check-in icon |
| `ui/lucky-wheel.png` | 192x192 | Title lucky wheel icon |
| `ui/shop.png` | 192x192 | Title shop icon |
| `ui/play-button.png` | 224x100 | Title play button body, 9-slice source |
| `ui/exit.png` | 192x192 | In-game HUD exit/back icon |
| `ui/menu.png` | 192x192 | In-game HUD hamburger menu icon |

## Metadata

- `generated-assets.json` stores the source generated-image path, final project path,
  final size, original generated size, and alpha metadata.
- `resource-preview.png` is a quick visual contact sheet for the final project assets.

## Prompt Records

- `prompts/planet-sprite-canonical.md` stores the canonical planet style, final prompts,
  source generated-image paths, post-processing steps, and final output paths.
- `prompts/galaxy-background.md` stores the background style rule, rejected photorealistic
  generation note, source image, post-processing steps, and final output path.
- `prompts/title-icons.md` stores the title UI icon style rule, final prompts, source
  generated-image paths, post-processing steps, and final output paths. These icons must
  stay in the existing crown/gold casual 2.5D style, not a photorealistic style.
- Future generated assets must update the relevant prompt record before being accepted.
