export const ASSETS = {
  board: {
    background: '/assets/board/space-background.png',
  },
  ui: {
    crown: '/assets/ui/crown.png',
    gold: '/assets/ui/gold.png',
  },
  planets: [
    '',
    '/assets/planets/tier-1-moon.png',
    '/assets/planets/tier-2-mars.png',
    '/assets/planets/tier-3-venus.png',
    '/assets/planets/tier-4-earth.png',
    '/assets/planets/tier-5-neptune.png',
    '/assets/planets/tier-6-uranus.png',
    '/assets/planets/tier-7-saturn.png',
    '/assets/planets/tier-8-jupiter.png',
    '/assets/planets/tier-9-sun.png',
  ],
} as const;

export const ASSET_SIZES = {
  boardBackground: { w: 376, h: 606 },
  uiIcon: { w: 192, h: 192 },
} as const;

export function planetAsset(tier: number): string {
  const url = ASSETS.planets[tier];
  if (!url) throw new Error(`Missing planet asset for tier ${tier}`);
  return url;
}
