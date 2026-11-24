import { useCallback, useEffect, useState } from 'react';

export interface FullscreenControl {
  isBrowserFullscreen: boolean;
  isFullscreenSupported: boolean;
  toggleBrowserFullscreen: () => void;
  exitBrowserFullscreen: () => void;
}

/**
 * Coordinates body scroll locking during immersive full-viewport gameplay and provides
 * an optional Browser Fullscreen API toggle with safe fallback for restricted iframes.
 */
export function useFullscreenControl(isImmersive: boolean): FullscreenControl {
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(false);

  const isFullscreenSupported =
    typeof document !== 'undefined' &&
    Boolean(document.fullscreenEnabled && document.documentElement?.requestFullscreen);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleChange = () => {
      setIsBrowserFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleChange);
    handleChange();
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
    };
  }, []);

  // Lock page scrolling cleanly while immersive full-viewport game shell is active
  useEffect(() => {
    if (typeof document === 'undefined' || !isImmersive) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isImmersive]);

  const exitBrowserFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {
        // Ignore if browser already exited or sandboxed
      });
    }
  }, []);

  const toggleBrowserFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      return;
    }
    const target = document.documentElement;
    if (target?.requestFullscreen) {
      target.requestFullscreen().catch(() => {
        // Gracefully keep full-viewport overlay if native fullscreen is blocked
      });
    }
  }, []);

  // Ensure native browser fullscreen cleans up if user leaves the game view completely
  useEffect(() => {
    if (!isImmersive) {
      exitBrowserFullscreen();
    }
  }, [isImmersive, exitBrowserFullscreen]);

  return {
    isBrowserFullscreen,
    isFullscreenSupported,
    toggleBrowserFullscreen,
    exitBrowserFullscreen,
  };
}
