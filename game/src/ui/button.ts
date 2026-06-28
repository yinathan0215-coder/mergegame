import { Container, type FederatedPointerEvent } from 'pixi.js';
import { JUICE } from '../data/config';

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
    cancelAnimationFrame(raf);
    target.scale.set(downScale);
  });
  target.on('pointerup', (e: FederatedPointerEvent) => {
    e.stopPropagation();
    settle();
    onTap();
  });
  target.on('pointerupoutside', (e: FederatedPointerEvent) => {
    e.stopPropagation();
    settle(); // released off the button → spring back, no action
  });
  return target;
}
