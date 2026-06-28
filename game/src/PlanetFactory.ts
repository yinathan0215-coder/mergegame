import { Container, Sprite } from 'pixi.js';
import { planetAsset } from './assets';
import { tierData } from './data/planets';

const PLANET_VISIBLE_DIAMETER: Record<number, number> = {
  1: 222,
  2: 235,
  3: 235,
  4: 234,
  5: 235,
  6: 235,
  7: 168,
  8: 172,
  9: 236,
  10: 234,
  11: 218,
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
