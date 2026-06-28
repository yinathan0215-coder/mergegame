import { Sprite } from 'pixi.js';
import { ASSETS, ASSET_SIZES } from '../assets';

// The real coin icon (/assets/ui/gold.png), centred and normalised to a target diameter. Every coin
// shown in the meta UI (Title pill, mission/attendance/wheel rewards) uses this one asset.
export function coinSprite(diameter: number): Sprite {
  const s = Sprite.from(ASSETS.ui.gold);
  s.anchor.set(0.5);
  s.scale.set(diameter / ASSET_SIZES.uiIcon.w);
  return s;
}
