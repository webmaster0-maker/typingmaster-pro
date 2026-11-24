import { ArenaThemeId } from '../arcadeTypes';
import { ActiveWordState } from './gameWorldTypes';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity?: number;
}

export interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
  lineWidth: number;
}

export interface ProjectileBeam {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  maxLife: number;
  color: string;
  width: number;
}

export interface FloatingCallout {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface SharedVfxState {
  particles: Particle[];
  shockwaves: ShockwaveRing[];
  beams: ProjectileBeam[];
  callouts: FloatingCallout[];
  shakeIntensity: number;
  flashAlpha: number;
  flashColor: string;
}

export function createSharedVfxState(): SharedVfxState {
  return {
    particles: [],
    shockwaves: [],
    beams: [],
    callouts: [],
    shakeIntensity: 0,
    flashAlpha: 0,
    flashColor: '#F43F5E',
  };
}

export function spawnBurst(
  vfx: SharedVfxState,
  x: number,
  y: number,
  color: string,
  count: number,
  speed: number,
  reducedMotion: boolean
) {
  const actualCount = reducedMotion ? Math.max(2, Math.floor(count / 3)) : count;
  for (let i = 0; i < actualCount; i++) {
    const angle = (Math.PI * 2 * i) / actualCount + (Math.random() - 0.5) * 0.5;
    const spd = speed * (0.45 + Math.random() * 0.75);
    vfx.particles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 0.45 + Math.random() * 0.3,
      maxLife: 0.75,
      size: 2 + Math.random() * 3,
      color,
      gravity: 90,
    });
  }
}

export function spawnShockwave(
  vfx: SharedVfxState,
  x: number,
  y: number,
  maxRadius: number,
  color: string,
  lineWidth: number = 2.5
) {
  vfx.shockwaves.push({
    x,
    y,
    radius: 8,
    maxRadius,
    life: 0.42,
    maxLife: 0.42,
    color,
    lineWidth,
  });
}

export function spawnBeam(
  vfx: SharedVfxState,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number = 3
) {
  vfx.beams.push({
    x1,
    y1,
    x2,
    y2,
    life: 0.14,
    maxLife: 0.14,
    color,
    width,
  });
}

export function spawnCallout(
  vfx: SharedVfxState,
  x: number,
  y: number,
  text: string,
  color: string
) {
  vfx.callouts.push({
    x,
    y,
    vy: -42,
    text,
    color,
    life: 0.85,
    maxLife: 0.85,
  });
}

export function triggerShake(vfx: SharedVfxState, intensity: number, reducedMotion: boolean) {
  if (reducedMotion) return;
  vfx.shakeIntensity = Math.min(14, Math.max(vfx.shakeIntensity, intensity));
}

export function triggerFlash(vfx: SharedVfxState, color: string, alpha: number, reducedMotion: boolean) {
  if (reducedMotion) return;
  vfx.flashColor = color;
  vfx.flashAlpha = Math.max(vfx.flashAlpha, alpha);
}

export function updateSharedVfx(vfx: SharedVfxState, dt: number) {
  for (let i = vfx.particles.length - 1; i >= 0; i--) {
    const p = vfx.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.gravity) p.vy += p.gravity * dt;
    p.life -= dt;
    if (p.life <= 0) vfx.particles.splice(i, 1);
  }
  if (vfx.particles.length > 260) {
    vfx.particles.splice(0, vfx.particles.length - 260);
  }

  for (let i = vfx.shockwaves.length - 1; i >= 0; i--) {
    const sw = vfx.shockwaves[i];
    sw.life -= dt;
    const progress = 1 - Math.max(0, sw.life / sw.maxLife);
    sw.radius = 8 + (sw.maxRadius - 8) * (1 - (1 - progress) ** 2);
    if (sw.life <= 0) vfx.shockwaves.splice(i, 1);
  }

  for (let i = vfx.beams.length - 1; i >= 0; i--) {
    vfx.beams[i].life -= dt;
    if (vfx.beams[i].life <= 0) vfx.beams.splice(i, 1);
  }

  for (let i = vfx.callouts.length - 1; i >= 0; i--) {
    const c = vfx.callouts[i];
    c.y += c.vy * dt;
    c.life -= dt;
    if (c.life <= 0) vfx.callouts.splice(i, 1);
  }

  if (vfx.shakeIntensity > 0) {
    vfx.shakeIntensity = Math.max(0, vfx.shakeIntensity - dt * 36);
  }
  if (vfx.flashAlpha > 0) {
    vfx.flashAlpha = Math.max(0, vfx.flashAlpha - dt * 2.2);
  }
}

export function renderSharedVfx(ctx: CanvasRenderingContext2D, vfx: SharedVfxState, w: number, h: number) {
  // Laser / Railgun beams
  for (const b of vfx.beams) {
    const alpha = Math.max(0, b.life / b.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = b.color;
    ctx.lineWidth = b.width * 2.4;
    ctx.lineCap = 'round';
    ctx.globalAlpha = alpha * 0.35;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();

    ctx.globalAlpha = alpha;
    ctx.lineWidth = b.width;
    ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();
    ctx.restore();
  }

  // Shockwaves
  for (const sw of vfx.shockwaves) {
    const alpha = Math.max(0, sw.life / sw.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = sw.lineWidth;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Particles
  for (const p of vfx.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.45 + 0.55 * alpha), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Floating tactical callouts
  for (const c of vfx.callouts) {
    const alpha = Math.max(0, Math.min(1, (c.life / c.maxLife) * 1.4));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '700 12px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = c.color;
    ctx.fillText(c.text, c.x, c.y);
    ctx.restore();
  }

  // Subtle screen flash on shield hit or boss impact
  if (vfx.flashAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = vfx.flashAlpha;
    ctx.fillStyle = vfx.flashColor;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

export function getThemeSkyColors(theme: ArenaThemeId): { top: string; bottom: string } {
  switch (theme) {
    case 'theme_carbon_amber':
      return { top: '#110E0A', bottom: '#1F1810' };
    case 'theme_emerald_vault':
      return { top: '#06110E', bottom: '#0D211B' };
    case 'theme_midnight_slate':
      return { top: '#080C16', bottom: '#131C2E' };
    case 'theme_obsidian':
    default:
      return { top: '#070A12', bottom: '#111829' };
  }
}

/**
 * Draws a crisp, high-legibility tactical word lock-on tag inside the 2D canvas
 * with per-character green/red accuracy, spacebar cue, and upcoming word lookahead.
 */
export function drawTacticalWordTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  activeWord: ActiveWordState,
  accentColor: string
) {
  if (!activeWord.currentWord) return;

  ctx.save();
  const fontSize = 19;
  ctx.font = `700 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;

  const fullText = activeWord.currentWord;
  const typedSeg = activeWord.typedSegment ?? activeWord.currentWordTyped;
  const typedLen = typedSeg.length;
  const awaitingSpace = Boolean(activeWord.awaitingSpace);
  const hasMistype = Boolean(activeWord.hasMistype);

  const spaceCueWidth = awaitingSpace ? ctx.measureText(' ␣').width : 0;
  const textWidth = ctx.measureText(fullText).width + spaceCueWidth;
  const boxW = Math.max(96, textWidth + 32);
  const boxH = 38;
  const bx = x - boxW / 2;
  const by = y - boxH / 2;

  const borderStroke = hasMistype
    ? '#F43F5E'
    : awaitingSpace
    ? '#F59E0B'
    : accentColor;

  // Soft shadow plate for crisp legibility over rich 2D canvas worlds
  ctx.fillStyle = 'rgba(0, 0, 0, 0.56)';
  ctx.beginPath();
  ctx.roundRect(bx + 2, by + 3, boxW, boxH, 9);
  ctx.fill();

  // Translucent dark plate
  ctx.fillStyle = 'rgba(9, 12, 18, 0.94)';
  ctx.strokeStyle = borderStroke;
  ctx.lineWidth = hasMistype || awaitingSpace ? 2 : 1.6;
  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, 9);
  ctx.fill();
  ctx.stroke();

  // Render character-by-character: emerald (correct), crimson (mistyped), amber (active), slate (remaining)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cursorX = x - textWidth / 2;

  for (let i = 0; i < fullText.length; i++) {
    const ch = fullText[i];
    const chW = ctx.measureText(ch).width;

    if (i < typedLen) {
      const ok = typedSeg[i] === ch;
      if (ok) {
        ctx.fillStyle = '#34D399';
        ctx.fillText(ch, cursorX, y + 0.5);
      } else {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.30)';
        ctx.fillRect(cursorX - 1, y - 11, chW + 2, 22);
        ctx.fillStyle = '#FB7185';
        ctx.fillText(ch, cursorX, y + 0.5);
        ctx.fillStyle = '#F43F5E';
        ctx.fillRect(cursorX - 1, y + 10, chW + 2, 2.2);
      }
    } else if (i === typedLen && !awaitingSpace) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
      ctx.fillRect(cursorX - 1, y - 11, chW + 2, 22);
      ctx.fillStyle = '#FDE68A';
      ctx.fillText(ch, cursorX, y + 0.5);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(cursorX, y + 10, chW, 2.2);
    } else {
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(ch, cursorX, y + 0.5);
    }

    cursorX += chW;
  }

  // Highlighted trailing space indicator so typists transition effortlessly without a paragraph box
  if (awaitingSpace) {
    const spGap = ctx.measureText(' ').width;
    const symW = ctx.measureText('␣').width;
    cursorX += spGap * 0.5;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.30)';
    ctx.fillRect(cursorX - 2, y - 11, symW + 4, 22);
    ctx.fillStyle = '#FDE68A';
    ctx.fillText('␣', cursorX, y + 0.5);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(cursorX - 1, y + 10, symW + 2, 2.2);
  }

  // Subtle integrated lookahead line right beneath the target plate
  const upcoming =
    activeWord.upcomingWords && activeWord.upcomingWords.length > 0
      ? activeWord.upcomingWords
      : activeWord.nextWord
      ? [activeWord.nextWord]
      : [];

  if (upcoming.length > 0 || awaitingSpace) {
    const previewText = awaitingSpace
      ? `SPACE → ${upcoming.join('  ')}`
      : `NEXT: ${upcoming.join('  ·  ')}`;
    ctx.font = '600 11px "JetBrains Mono", ui-monospace, monospace';
    const prevW = ctx.measureText(previewText).width;
    const pillW = prevW + 16;
    const pillH = 18;
    const py = by + boxH + 5;

    ctx.fillStyle = 'rgba(9, 12, 18, 0.80)';
    ctx.beginPath();
    ctx.roundRect(x - pillW / 2, py, pillW, pillH, 5);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = awaitingSpace ? '#FDE68A' : 'rgba(203, 213, 225, 0.85)';
    ctx.fillText(previewText, x, py + pillH / 2 + 0.5);
  }

  ctx.restore();
}
