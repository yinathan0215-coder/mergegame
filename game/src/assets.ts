export const ASSETS = {
  board: {
    background: '/assets/board/space-background-cover-16x9.png',
    legacyBackground: '/assets/board/space-background.png',
  },
  ui: {
    crown: '/assets/ui/crown.png',
    gold: '/assets/ui/gold.png',
    settings: '/assets/ui/settings.png',
    dailyMission: '/assets/ui/daily-mission.png',
    checkIn: '/assets/ui/check-in.png',
    luckyWheel: '/assets/ui/lucky-wheel.png',
    shop: '/assets/ui/shop.png',
    playButton: '/assets/ui/play-button.png',
    exit: '/assets/ui/exit.png',
    menu: '/assets/ui/menu.png',
  },
  planets: [
    '',
    '/assets/planets/tier-1-asteroid.png',
    '/assets/planets/tier-2-mercury.png',
    '/assets/planets/tier-3-mars.png',
    '/assets/planets/tier-4-venus.png',
    '/assets/planets/tier-5-earth.png',
    '/assets/planets/tier-6-neptune.png',
    '/assets/planets/tier-7-uranus.png',
    '/assets/planets/tier-8-saturn.png',
    '/assets/planets/tier-9-jupiter.png',
    '/assets/planets/tier-10-sun.png',
    '/assets/planets/tier-11-black-hole.png',
  ],
} as const;

export const ASSET_SIZES = {
  boardBackground: { w: 1920, h: 1080 },
  legacyBoardBackground: { w: 376, h: 606 },
  uiIcon: { w: 192, h: 192 },
  playButtonSource: { w: 224, h: 100 },
  playButton: { w: 224, h: 100 },
} as const;

export function planetAsset(tier: number): string {
  const url = ASSETS.planets[tier];
  if (!url) throw new Error(`Missing planet asset for tier ${tier}`);
  return url;
}
