import { Container, Graphics, type FederatedPointerEvent } from 'pixi.js';
import { JUICE, COLORS } from '../data/config';
import { sound } from '../SoundManager';

// Common pressable-button feedback (docs/50-art-ux/feedback-effects §5). Every tappable control —
// Title lobby buttons, HUD corner buttons, the unlock-modal OK — runs through this one helper so the
// press feel is identical everywhere: pointerdown dips to downScale, release springs to upScale then
// eases back to 1.0 over `ms`. The spring is driven by requestAnimationFrame (not a Pixi ticker) so it
// keeps animating even while the game loop is paused (e.g. the unlock modal pauses GameScene.tick).
//
// The target must be drawn CENTERED on its own origin (scale pivots at 0,0), e.g. a Container whose
// children are laid out around (0,0), so it scales in place rather than toward a corner.
export function attachButtonFeedback(target: Container, onTap: () => void): Container {
  const { downScale, upScale, ms } = JUICE.buttonPress;
  target.eventMode = 'static';
  target.cursor = 'pointer';
  let raf = 0;
  let pressed = false; // true only between a pointerdown ON this button and its release — a tap needs both

  const settle = () => {
    cancelAnimationFrame(raf);
    const t0 = performance.now();
    const step = () => {
      const k = (performance.now() - t0) / ms;
      if (k >= 1) {
        target.scale.set(1);
        return;
      }
      target.scale.set(upScale + (1 - upScale) * k); // upScale → 1.0
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  target.on('pointerdown', (e: FederatedPointerEvent) => {
    e.stopPropagation(); // swallow so the tap never reaches the board/launcher behind it
    pressed = true;
    sound.play('uiPress'); // common UI press SFX (docs/50-art-ux/sound-design)
    cancelAnimationFrame(raf);
    target.scale.set(downScale);
  });
  target.on('pointerup', (e: FederatedPointerEvent) => {
    // Only a press that BEGAN on this button counts as a tap. A pointer pressed elsewhere (e.g. a launch
    // drag from the board) that just happens to release over the button must NOT trigger it, nor be
    // swallowed — let it fall through to the launcher so the shot still fires (docs/50-art-ux/feedback-effects §5).
    if (!pressed) return;
    pressed = false;
    e.stopPropagation();
    settle();
    onTap();
  });
  target.on('pointerupoutside', (e: FederatedPointerEvent) => {
    if (!pressed) return;
    pressed = false;
    e.stopPropagation();
    settle(); // released off the button → spring back, no action
  });
  return target;
}

// Red-dot "받을 보상 있음" badge: white-rimmed red dot centred on the origin (docs/50-art-ux/title-screen
// §2-3 · layout §2-c). Caller positions it at a button's top-right and toggles `.visible`.
export function redDot(): Graphics {
  const g = new Graphics();
  g.beginFill(COLORS.white);
  g.drawCircle(0, 0, 8);
  g.endFill();
  g.beginFill(COLORS.redDot);
  g.drawCircle(0, 0, 6);
  g.endFill();
  return g;
}

// Multiply a hex colour's channels by `f` (>1 lighten, <1 darken), clamped to [0,255].
function shade(color: number, f: number): number {
  const r = Math.min(255, Math.round(((color >> 16) & 0xff) * f));
  const g = Math.min(255, Math.round(((color >> 8) & 0xff) * f));
  const b = Math.min(255, Math.round((color & 0xff) * f));
  return (r << 16) | (g << 8) | b;
}

// Shared 3D button face (docs/50-art-ux/popup-system 버튼 입체감 규칙): drop shadow + dark bottom edge +
// body + top gloss + outline, centred on the origin. `disabled` desaturates to a flat grey-blue so an
// unusable button (e.g. insufficient coins) reads as inactive. Caller adds content (text/icons) on top
// around y = BUTTON3D_DY (the body sits a few px above centre so the bottom edge shows).
export const BUTTON3D_DY = -3;
export function button3D(w: number, h: number, base: number, radius = 14, disabled = false): Graphics {
  const g = new Graphics();
  const body = disabled ? COLORS.btnDisabled : base;
  const dark = shade(body, 0.72);
  const light = shade(body, 1.28);
  const x = -w / 2;
  const top = -h / 2;
  g.beginFill(COLORS.btnShadow, disabled ? 0.28 : 0.45); // drop shadow
  g.drawRoundedRect(x, top + 7, w, h - 4, radius);
  g.endFill();
  g.beginFill(dark); // dark bottom edge (the 3D side)
  g.drawRoundedRect(x, top + 5, w, h - 5, radius);
  g.endFill();
  g.beginFill(body); // body face (sits a few px above → bottom edge shows)
  g.drawRoundedRect(x, top, w, h - 6, radius);
  g.endFill();
  g.beginFill(light, 0.85); // top gloss
  g.drawRoundedRect(x + 5, top + 4, w - 10, (h - 6) * 0.42, Math.max(4, radius - 5));
  g.endFill();
  g.lineStyle(2, COLORS.white, disabled ? 0.15 : 0.32); // outline
  g.drawRoundedRect(x, top, w, h - 6, radius);
  return g;
}
