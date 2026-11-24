import React, { useEffect, useRef } from 'react';
import { GameVisualBridge } from '../games/gameWorldTypes';
import {
  createSharedVfxState,
  renderSharedVfx,
  updateSharedVfx,
} from '../games/gameWorldVfx';
import {
  createWorldSimState,
  handleWorldEvent,
  renderGameWorld,
  updateWorldSim,
} from '../games/gameWorldRenderers';

interface ArcadeGameCanvasProps {
  bridgeRef: React.MutableRefObject<GameVisualBridge>;
  worldKey: string;
  fullscreen?: boolean;
}

export const ArcadeGameCanvas: React.FC<ArcadeGameCanvasProps> = ({
  bridgeRef,
  worldKey,
  fullscreen = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const sim = createWorldSimState();
    const vfx = createSharedVfxState();

    let width = container.clientWidth || 860;
    let height = container.clientHeight || 310;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      width = Math.max(320, container.clientWidth || 860);
      height = Math.max(220, container.clientHeight || 310);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    let rafId = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const bridge = bridgeRef.current;

      // Consume queued keystroke/game events synchronously
      while (bridge.events.length > 0) {
        const evt = bridge.events.shift()!;
        handleWorldEvent(sim, vfx, bridge, evt, width, height, reducedMotion);
      }

      if (bridge.gameState !== 'paused') {
        updateWorldSim(sim, bridge, dt);
        updateSharedVfx(vfx, dt);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Subtle damped screen shake on impacts
      if (vfx.shakeIntensity > 0.1 && !reducedMotion) {
        const sx = (Math.random() - 0.5) * vfx.shakeIntensity;
        const sy = (Math.random() - 0.5) * vfx.shakeIntensity;
        ctx.translate(sx, sy);
      }

      renderGameWorld(ctx, sim, bridge, width, height);
      renderSharedVfx(ctx, vfx, width, height);
      ctx.restore();

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [bridgeRef, worldKey]);

  return (
    <div
      ref={containerRef}
      className={
        fullscreen
          ? 'relative w-full h-full flex-1 min-h-0 overflow-hidden bg-[#070A12]'
          : 'relative w-full h-[300px] sm:h-[360px] rounded-xl overflow-hidden border border-[#232C40] bg-[#070A12]'
      }
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        aria-label="Interactive 2D Typing Arcade Game World"
      />
    </div>
  );
};
