import { Container, Sprite } from 'pixi.js';
import { planetAsset } from './assets';
import { tierData } from './data/planets';

const PLANET_VISIBLE_DIAMETER: Record<number, number> = {
  1: 235,
  2: 235,
  3: 234,
  4: 235,
  5: 235,
  6: 168,
  7: 172,
  8: 236,
  9: 234,
};

export function makePlanetSprite(tier: number): Container {
  const d = tierData(tier);
  const c = new Container();
  const sprite = Sprite.from(planetAsset(tier));
  sprite.anchor.set(0.5);
  sprite.scale.set((d.radius * 2) / (PLANET_VISIBLE_DIAMETER[tier] ?? 235));
  c.addChild(sprite);
  return c;
}
