import { ArenaThemeId } from '../arcadeTypes';
import {
  AggressionIntensityTier,
  FightingAttackMove,
  OpponentProfile,
  OpponentStyleId,
} from './fightingCombatEngine';
import {
  SharedVfxState,
  getThemeSkyColors,
  spawnBurst,
  spawnCallout,
  spawnShockwave,
  triggerFlash,
  triggerShake,
} from './gameWorldVfx';

export type FighterAnimState =
  | 'idle'
  | 'advancing'
  | 'punching'
  | 'kicking'
  | 'combo_attack'
  | 'blocking'
  | 'taking_damage'
  | 'knockback'
  | 'victory'
  | 'defeat';

export interface FighterVisualEntity {
  side: 'player' | 'opponent';
  state: FighterAnimState;
  stateTime: number;
  stateDuration: number;
  xNorm: number; // horizontal arena coordinate in [0.16, 0.84]
  baseXNorm: number;
  vx: number;
  hitFlash: number;
  auraIntensity: number;
  attackSequenceIndex: number;
}

export interface StrikeArcVfx {
  x: number;
  y: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  color: string;
  life: number;
  maxLife: number;
  lineWidth: number;
}

export interface FightingStageSim {
  time: number;
  player: FighterVisualEntity;
  opponent: FighterVisualEntity;
  bubbleXNorm: number;
  strikeArcs: StrikeArcVfx[];
  lanternSway: number;
}

export interface FightingRenderSnapshot {
  arenaTheme: ArenaThemeId;
  opponent: OpponentProfile;
  targetWord: string;
  typedBuffer: string;
  upcomingWords?: string[];
  wordCombo: number;
  aiPressureRatio: number; // 0..1 mirrored opponent attack charge gauge
  aiHasAdvantage: boolean;
  hasErrorLock?: boolean;
  aggressionMultiplier?: number;
  intensityTier?: AggressionIntensityTier;
  isPlaying: boolean;
  waitingFirstKey: boolean;
  outcome: 'ongoing' | 'victory' | 'defeat';
}

const STATE_PRIORITY: Record<FighterAnimState, number> = {
  idle: 0,
  advancing: 1,
  blocking: 2,
  punching: 3,
  kicking: 3,
  combo_attack: 4,
  taking_damage: 5,
  knockback: 6,
  victory: 10,
  defeat: 10,
};

const DEFAULT_STATE_DURATIONS: Record<FighterAnimState, number> = {
  idle: 999,
  advancing: 0.34,
  punching: 0.32,
  kicking: 0.38,
  combo_attack: 0.56,
  blocking: 0.36,
  taking_damage: 0.28,
  knockback: 0.44,
  victory: 999,
  defeat: 999,
};

export function createFightingStageSim(): FightingStageSim {
  return {
    time: 0,
    player: {
      side: 'player',
      state: 'idle',
      stateTime: 0,
      stateDuration: 999,
      xNorm: 0.31,
      baseXNorm: 0.31,
      vx: 0,
      hitFlash: 0,
      auraIntensity: 0,
      attackSequenceIndex: 0,
    },
    opponent: {
      side: 'opponent',
      state: 'idle',
      stateTime: 0,
      stateDuration: 999,
      xNorm: 0.69,
      baseXNorm: 0.69,
      vx: 0,
      hitFlash: 0,
      auraIntensity: 0,
      attackSequenceIndex: 0,
    },
    bubbleXNorm: 0.69,
    strikeArcs: [],
    lanternSway: 0,
  };
}

/**
 * Transitions a fighter cleanly between combat animation states without jarringly restarting
 * an already-running strike mid-swing on rapid keystrokes.
 */
export function transitionFighterState(
  fighter: FighterVisualEntity,
  nextState: FighterAnimState,
  opts?: { force?: boolean; duration?: number }
): boolean {
  if (fighter.state === 'victory' || fighter.state === 'defeat') {
    if (!opts?.force) return false;
  }

  const currentPriority = STATE_PRIORITY[fighter.state];
  const nextPriority = STATE_PRIORITY[nextState];

  // Avoid restarting an active attack/advance mid-swing when same/lower priority arrives
  if (
    !opts?.force &&
    fighter.state === nextState &&
    nextState !== 'idle' &&
    fighter.stateTime < fighter.stateDuration * 0.68
  ) {
    return false;
  }

  if (!opts?.force && nextPriority < currentPriority && fighter.stateTime < fighter.stateDuration * 0.78) {
    return false;
  }

  fighter.state = nextState;
  fighter.stateTime = 0;
  fighter.stateDuration = opts?.duration ?? DEFAULT_STATE_DURATIONS[nextState];

  if (nextState === 'punching' || nextState === 'kicking' || nextState === 'combo_attack') {
    fighter.attackSequenceIndex = (fighter.attackSequenceIndex + 1) % 4;
  }

  return true;
}

export function triggerPlayerKeyMomentum(sim: FightingStageSim, wordCombo: number) {
  // Smoothly step forward into fighting range without restarting active punch/kick animations
  if (sim.player.state === 'idle') {
    transitionFighterState(sim.player, 'advancing', { duration: 0.28 });
  }
  sim.player.auraIntensity = Math.min(1, Math.max(sim.player.auraIntensity, 0.25 + wordCombo * 0.08));
}

export function triggerPlayerWordAttackVisuals(
  sim: FightingStageSim,
  vfx: SharedVfxState,
  params: {
    move: FightingAttackMove;
    damage: number;
    isCritical: boolean;
    interruptedEnemyAttack?: boolean;
    wordCombo: number;
    opponentDefeated: boolean;
    w: number;
    h: number;
    reducedMotion: boolean;
    shakeEnabled: boolean;
  }
) {
  const {
    move,
    damage,
    isCritical,
    interruptedEnemyAttack,
    wordCombo,
    opponentDefeated,
    w,
    h,
    reducedMotion,
    shakeEnabled,
  } = params;

  transitionFighterState(sim.player, move, { force: true });
  sim.player.auraIntensity = Math.min(1, 0.45 + wordCombo * 0.12);

  // Lunge player toward opponent into striking distance
  sim.player.xNorm = Math.min(sim.opponent.xNorm - 0.16, Math.max(sim.player.xNorm, 0.46));

  if (opponentDefeated) {
    transitionFighterState(sim.opponent, 'defeat', { force: true });
    transitionFighterState(sim.player, 'victory', { force: true });
  } else if (move === 'combo_attack' || isCritical || interruptedEnemyAttack) {
    transitionFighterState(sim.opponent, 'knockback', { force: true });
    sim.opponent.vx = interruptedEnemyAttack ? 0.65 : 0.58;
  } else {
    transitionFighterState(sim.opponent, 'taking_damage', { force: true });
    sim.opponent.vx = 0.26;
  }
  sim.opponent.hitFlash = 0.22;

  const impactX = sim.opponent.xNorm * w - 20;
  const impactY = h * 0.58;
  const arcColor =
    interruptedEnemyAttack || move === 'combo_attack'
      ? '#F59E0B'
      : move === 'kicking'
      ? '#34D399'
      : '#38BDF8';

  sim.strikeArcs.push({
    x: impactX - 10,
    y: impactY,
    radius: move === 'combo_attack' || interruptedEnemyAttack ? 60 : move === 'kicking' ? 46 : 36,
    startAngle: -Math.PI * 0.65,
    endAngle: Math.PI * 0.48,
    color: arcColor,
    life: 0.22,
    maxLife: 0.22,
    lineWidth: move === 'combo_attack' || interruptedEnemyAttack ? 6 : 4,
  });

  spawnBurst(
    vfx,
    impactX,
    impactY,
    arcColor,
    move === 'combo_attack' || interruptedEnemyAttack ? 24 : 14,
    move === 'combo_attack' ? 230 : 175,
    reducedMotion
  );
  spawnShockwave(
    vfx,
    impactX,
    impactY,
    move === 'combo_attack' || interruptedEnemyAttack ? 88 : 52,
    arcColor,
    move === 'combo_attack' || interruptedEnemyAttack ? 3.2 : 2.2
  );

  const label = opponentDefeated
    ? `K.O.! -${damage}`
    : interruptedEnemyAttack
    ? `INTERRUPT! -${damage}`
    : move === 'combo_attack'
    ? `SPECIAL -${damage}!`
    : isCritical
    ? `CRIT -${damage}`
    : `-${damage}`;

  spawnCallout(
    vfx,
    impactX + 12,
    impactY - 38,
    label,
    interruptedEnemyAttack || move === 'combo_attack' ? '#FDE68A' : '#34D399'
  );

  if (shakeEnabled && !reducedMotion) {
    triggerShake(
      vfx,
      opponentDefeated ? 11 : move === 'combo_attack' || interruptedEnemyAttack ? 8 : 4.5,
      false
    );
  }
  if (opponentDefeated) {
    triggerFlash(vfx, '#F59E0B', 0.24, reducedMotion);
  }
}

export function triggerOpponentReactionVisuals(
  sim: FightingStageSim,
  vfx: SharedVfxState,
  params: {
    type: 'block' | 'light_counter' | 'heavy_counter' | 'pause_pressure' | 'tempo_strike';
    damage: number;
    callout: string;
    playerDefeated: boolean;
    w: number;
    h: number;
    reducedMotion: boolean;
    shakeEnabled: boolean;
  }
) {
  const { type, damage, callout, playerDefeated, w, h, reducedMotion, shakeEnabled } = params;

  const playerImpactX = sim.player.xNorm * w + 18;
  const impactY = h * 0.58;

  if (type === 'block') {
    transitionFighterState(sim.opponent, 'blocking', { force: true });
    const oppX = sim.opponent.xNorm * w - 18;
    spawnShockwave(vfx, oppX, impactY, 34, '#94A3B8', 2);
    spawnCallout(vfx, oppX, impactY - 34, 'GUARDED', '#CBD5E1');
    return;
  }

  const isHeavyImpact = type === 'heavy_counter' || type === 'pause_pressure' || type === 'tempo_strike';
  const aiMove: FighterAnimState = isHeavyImpact ? 'kicking' : 'punching';
  transitionFighterState(sim.opponent, aiMove, { force: true });
  sim.opponent.xNorm = Math.max(sim.player.xNorm + 0.16, Math.min(sim.opponent.xNorm, 0.54));

  if (playerDefeated) {
    transitionFighterState(sim.player, 'defeat', { force: true });
    transitionFighterState(sim.opponent, 'victory', { force: true });
  } else if (isHeavyImpact) {
    transitionFighterState(sim.player, 'knockback', { force: true });
    sim.player.vx = -0.52;
  } else {
    transitionFighterState(sim.player, 'taking_damage', { force: true });
    sim.player.vx = -0.22;
  }

  sim.player.hitFlash = 0.22;
  sim.player.auraIntensity = 0;

  sim.strikeArcs.push({
    x: playerImpactX + 12,
    y: impactY,
    radius: isHeavyImpact ? 50 : 36,
    startAngle: Math.PI * 0.52,
    endAngle: Math.PI * 1.65,
    color: '#F43F5E',
    life: 0.22,
    maxLife: 0.22,
    lineWidth: isHeavyImpact ? 5 : 3.5,
  });

  spawnBurst(
    vfx,
    playerImpactX,
    impactY,
    '#F43F5E',
    isHeavyImpact ? 20 : 12,
    185,
    reducedMotion
  );
  spawnShockwave(vfx, playerImpactX, impactY, isHeavyImpact ? 66 : 44, '#F43F5E', 2.4);
  spawnCallout(vfx, playerImpactX - 6, impactY - 40, callout || `-${damage}`, '#FB7185');

  if (shakeEnabled && !reducedMotion) {
    triggerShake(vfx, playerDefeated ? 11 : isHeavyImpact ? 7.5 : 4.5, false);
  }
  triggerFlash(vfx, '#F43F5E', isHeavyImpact ? 0.18 : 0.11, reducedMotion);
}

export function updateFightingStageSim(
  sim: FightingStageSim,
  snapshot: FightingRenderSnapshot,
  dt: number
) {
  const clampedDt = Math.min(0.05, Math.max(0.001, dt));
  sim.time += clampedDt;
  sim.lanternSway = Math.sin(sim.time * 1.4) * 0.08;

  const updateFighter = (f: FighterVisualEntity, other: FighterVisualEntity, homeX: number) => {
    f.stateTime += clampedDt;
    f.hitFlash = Math.max(0, f.hitFlash - clampedDt);
    f.auraIntensity = Math.max(0, f.auraIntensity - clampedDt * 0.45);

    // Expire transient animation states smoothly back to idle
    if (
      f.state !== 'idle' &&
      f.state !== 'victory' &&
      f.state !== 'defeat' &&
      f.stateTime >= f.stateDuration
    ) {
      f.state = 'idle';
      f.stateTime = 0;
      f.stateDuration = 999;
    }

    // Apply velocity + smooth spring return to fighting stance position
    if (Math.abs(f.vx) > 0.005) {
      f.xNorm += f.vx * clampedDt;
      f.vx *= Math.pow(0.05, clampedDt);
    }

    let desiredX = homeX;
    if (f.state === 'advancing') {
      desiredX = f.side === 'player' ? homeX + 0.07 : homeX - 0.07;
    } else if (f.state === 'punching' || f.state === 'kicking' || f.state === 'combo_attack') {
      const strikeReach = f.state === 'combo_attack' ? 0.14 : 0.11;
      desiredX = f.side === 'player' ? Math.min(0.49, other.xNorm - 0.15) : Math.max(0.51, other.xNorm + 0.15);
      if (f.stateTime > f.stateDuration * 0.65) {
        desiredX = homeX + (f.side === 'player' ? strikeReach * 0.35 : -strikeReach * 0.35);
      }
    } else if (f.side === 'opponent' && snapshot.aiPressureRatio > 0.55 && snapshot.outcome === 'ongoing') {
      // Opponent visibly creeps forward as pause pressure builds
      desiredX = homeX - (snapshot.aiPressureRatio - 0.55) * 0.16;
    }

    const springRate = f.state === 'knockback' ? 3.5 : 8.5;
    f.xNorm += (desiredX - f.xNorm) * Math.min(1, clampedDt * springRate);
    f.xNorm = Math.max(0.16, Math.min(0.84, f.xNorm));
  };

  updateFighter(sim.player, sim.opponent, 0.31);
  updateFighter(sim.opponent, sim.player, 0.69);

  // Enforce minimum fighter separation so fighters never overlap bodies
  const minSep = 0.15;
  if (sim.opponent.xNorm - sim.player.xNorm < minSep) {
    const mid = (sim.player.xNorm + sim.opponent.xNorm) / 2;
    sim.player.xNorm = Math.max(0.16, mid - minSep / 2);
    sim.opponent.xNorm = Math.min(0.84, mid + minSep / 2);
  }

  // Heavily damped bubble horizontal anchor so the typing word stays rock-steady and easy to read!
  sim.bubbleXNorm += (sim.opponent.xNorm - sim.bubbleXNorm) * Math.min(1, clampedDt * 2.6);

  // Update strike arcs
  for (let i = sim.strikeArcs.length - 1; i >= 0; i--) {
    sim.strikeArcs[i].life -= clampedDt;
    if (sim.strikeArcs[i].life <= 0) sim.strikeArcs.splice(i, 1);
  }
}

// ============================================================================
// CYBER-DOJO 2D ARENA & ARTICULATED FIGHTERS RENDERER
// ============================================================================
export function renderFightingStage(
  ctx: CanvasRenderingContext2D,
  sim: FightingStageSim,
  snapshot: FightingRenderSnapshot,
  w: number,
  h: number
) {
  const sky = getThemeSkyColors(snapshot.arenaTheme);
  const floorY = h * 0.80;

  // 1. Twilight Cyber-Dojo Sky Backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, sky.top);
  bg.addColorStop(0.74, sky.bottom);
  bg.addColorStop(1, '#090D16');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle radial dojo arena moon / spotlight glow behind center stage
  const moonGrad = ctx.createRadialGradient(w * 0.5, floorY - 88, 12, w * 0.5, floorY - 88, Math.min(w * 0.42, 260));
  moonGrad.addColorStop(0, 'rgba(245, 158, 11, 0.14)');
  moonGrad.addColorStop(0.55, 'rgba(16, 185, 129, 0.05)');
  moonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = moonGrad;
  ctx.fillRect(0, 0, w, floorY);

  // 2. Architectural Dojo Hall Pillars & Shoji Wall Panels
  const panelTop = h * 0.16;
  const panelH = floorY - panelTop;
  const panelCount = 6;
  const panelW = w / panelCount;

  for (let i = 0; i < panelCount; i++) {
    const px = i * panelW;
    ctx.fillStyle = 'rgba(18, 25, 42, 0.55)';
    ctx.fillRect(px + 8, panelTop, panelW - 16, panelH);

    // Subtle shoji lattice horizontal mullions
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let row = 1; row <= 3; row++) {
      const ly = panelTop + (panelH / 4) * row;
      ctx.beginPath();
      ctx.moveTo(px + 8, ly);
      ctx.lineTo(px + panelW - 8, ly);
      ctx.stroke();
    }

    // Structural wooden-slate dojo pillar
    ctx.fillStyle = '#0D1320';
    ctx.fillRect(px - 4, panelTop - 16, 8, panelH + 16);
  }

  // Top Dojo Eaves Beam
  ctx.fillStyle = '#0B101C';
  ctx.fillRect(0, panelTop - 18, w, 14);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.fillRect(0, panelTop - 5, w, 1.5);

  // Twin Swaying Cyber-Dojo Lanterns (Left & Right flanks — never obstruct overhead bubble)
  drawDojoLantern(ctx, w * 0.10, panelTop - 4, sim.lanternSway, '#10B981');
  drawDojoLantern(ctx, w * 0.90, panelTop - 4, -sim.lanternSway, snapshot.opponent.palette.secondary);

  // 3. Polished Reflective Cyber-Dojo Floor Deck
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
  floorGrad.addColorStop(0, '#182238');
  floorGrad.addColorStop(0.35, '#101726');
  floorGrad.addColorStop(1, '#070A12');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, w, h - floorY);

  // Subtle floor reflections of lantern glow & arena moon
  const centerReflect = ctx.createRadialGradient(w * 0.5, floorY + 12, 8, w * 0.5, floorY + 12, w * 0.34);
  centerReflect.addColorStop(0, 'rgba(245, 158, 11, 0.08)');
  centerReflect.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = centerReflect;
  ctx.fillRect(0, floorY, w, h - floorY);

  for (const [lx, col] of [
    [w * 0.12, 'rgba(16, 185, 129, 0.10)'],
    [w * 0.88, 'rgba(244, 63, 94, 0.08)'],
  ] as [number, string][]) {
    const lRef = ctx.createRadialGradient(lx, floorY + 8, 2, lx, floorY + 8, 84);
    lRef.addColorStop(0, col);
    lRef.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lRef;
    ctx.fillRect(lx - 84, floorY, 168, h - floorY);
  }

  // Perspective floor planks radiating from center vanish point
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 1;
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(w * 0.5 + i * (w * 0.08), floorY);
    ctx.lineTo(w * 0.5 + i * (w * 0.17), h);
    ctx.stroke();
  }
  // Horizontal floor horizon line & combat ring accent strip
  ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.fillRect(w * 0.12, floorY, w * 0.76, 2);

  // Floating ambient dojo dust motes in the moonlight
  ctx.fillStyle = 'rgba(254, 243, 199, 0.22)';
  for (let m = 0; m < 12; m++) {
    const mx = ((m * 137 + sim.time * (10 + (m % 3) * 4)) % (w * 0.8)) + w * 0.1;
    const my = panelTop + 20 + ((m * 53 + Math.sin(sim.time * 0.9 + m) * 14) % Math.max(40, panelH - 30));
    ctx.beginPath();
    ctx.arc(mx, my, 1.1 + (m % 2) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Render Fighters (Player Left, Opponent Right)
  const playerX = sim.player.xNorm * w;
  const opponentX = sim.opponent.xNorm * w;

  drawCyberDojoFighter(ctx, {
    entity: sim.player,
    x: playerX,
    floorY,
    facing: 1,
    primaryColor: '#13222A',
    secondaryColor: '#10B981',
    accentColor: '#F59E0B',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    skinColor: '#F2C5A0',
    style: 'player',
    time: sim.time,
    hasAdvantageAura: snapshot.wordCombo >= 3,
  });

  drawCyberDojoFighter(ctx, {
    entity: sim.opponent,
    x: opponentX,
    floorY,
    facing: -1,
    primaryColor: snapshot.opponent.palette.primary,
    secondaryColor: snapshot.opponent.palette.secondary,
    accentColor: snapshot.opponent.palette.accent,
    glowColor: snapshot.opponent.palette.glow,
    skinColor: snapshot.opponent.palette.skin,
    style: snapshot.opponent.style,
    time: sim.time * (snapshot.aggressionMultiplier ?? 1),
    hasAdvantageAura:
      snapshot.aiHasAdvantage || (snapshot.aggressionMultiplier ?? 1) >= 1.55,
  });

  // 5. Kinetic Martial Arts Strike Arcs
  for (const arc of sim.strikeArcs) {
    const alpha = Math.max(0, arc.life / arc.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha * 0.88;
    ctx.strokeStyle = arc.color;
    ctx.lineWidth = arc.lineWidth * (0.5 + 0.5 * alpha);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(arc.x, arc.y, arc.radius, arc.startAngle, arc.endAngle);
    ctx.stroke();
    ctx.restore();
  }

  // 6. Crisp Overhead Word Bubble Directly Above the Opponent's Head
  if (snapshot.targetWord && snapshot.outcome === 'ongoing') {
    drawOpponentWordBubble(ctx, {
      anchorX: sim.bubbleXNorm * w,
      headY: floorY - 134,
      canvasW: w,
      canvasH: h,
      targetWord: snapshot.targetWord,
      typedBuffer: snapshot.typedBuffer,
      wordCombo: snapshot.wordCombo,
      pressureRatio: snapshot.aiPressureRatio,
      hasErrorLock: Boolean(snapshot.hasErrorLock),
      aggressionMultiplier: snapshot.aggressionMultiplier ?? 1,
      intensityTier: snapshot.intensityTier ?? 'Calm',
      opponentAccent: snapshot.opponent.palette.secondary,
      waitingFirstKey: snapshot.waitingFirstKey,
    });

    // Subtle in-stage lookahead line tucked cleanly near bottom floor edge (zero overlap with fighters)
    if (snapshot.upcomingWords && snapshot.upcomingWords.length > 0 && snapshot.isPlaying) {
      const lookahead = `NEXT  ${snapshot.upcomingWords.slice(0, 3).join('  ·  ')}`;
      ctx.save();
      ctx.font = '600 12px "JetBrains Mono", ui-monospace, monospace';
      const lw = ctx.measureText(lookahead).width;
      const pillW = lw + 24;
      const pillH = 22;
      const px = w / 2 - pillW / 2;
      const py = h - 30;
      ctx.fillStyle = 'rgba(7, 10, 18, 0.72)';
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(px, py, pillW, pillH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.92)';
      ctx.fillText(lookahead, w / 2, py + pillH / 2 + 0.5);
      ctx.restore();
    }
  }
}

function drawDojoLantern(
  ctx: CanvasRenderingContext2D,
  x: number,
  topY: number,
  swayRad: number,
  glowHex: string
) {
  ctx.save();
  ctx.translate(x, topY);
  ctx.rotate(swayRad);

  // Cord
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 14);
  ctx.stroke();

  // Soft ambient halo
  const halo = ctx.createRadialGradient(0, 28, 4, 0, 28, 34);
  halo.addColorStop(0, `${glowHex}44`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 28, 34, 0, Math.PI * 2);
  ctx.fill();

  // Lantern capsule
  ctx.fillStyle = '#0F172A';
  ctx.strokeStyle = glowHex;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-9, 14, 18, 28, 7);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = glowHex;
  ctx.globalAlpha = 0.65;
  ctx.fillRect(-5, 20, 10, 16);
  ctx.restore();
}

interface DrawFighterParams {
  entity: FighterVisualEntity;
  x: number;
  floorY: number;
  facing: 1 | -1;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowColor: string;
  skinColor: string;
  style: 'player' | OpponentStyleId;
  time: number;
  hasAdvantageAura: boolean;
}

function drawCyberDojoFighter(ctx: CanvasRenderingContext2D, p: DrawFighterParams) {
  const { entity, x, floorY, facing, time } = p;
  const st = entity.state;
  const prog = Math.min(1, entity.stateTime / Math.max(0.01, entity.stateDuration));
  const strikeCurve = Math.sin(prog * Math.PI); // 0 -> 1 -> 0 smooth arc
  const idleBob = Math.sin(time * 5.2 + (facing > 0 ? 0 : 1.7)) * 3.2;

  ctx.save();
  ctx.translate(x, floorY);

  // Ground shadow
  const shadowW = st === 'defeat' ? 46 : st === 'combo_attack' ? 28 : 34;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, 4, shadowW, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Combo / Advantage energy ground ring
  if (p.hasAdvantageAura || entity.auraIntensity > 0.25) {
    const auraAlpha = Math.max(entity.auraIntensity * 0.45, p.hasAdvantageAura ? 0.35 : 0);
    ctx.strokeStyle = p.secondaryColor;
    ctx.globalAlpha = auraAlpha;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 3, 38 + Math.sin(time * 9) * 3, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.scale(facing, 1);

  // Compute dynamic body transforms for all 10 explicit states
  let bodyOffsetY = idleBob;
  let bodyLean = 0.08;
  let frontArmExt = 0; // 0..1 punch extension
  let backArmExt = 0;
  let kickExt = 0; // 0..1 high kick extension
  let guardPose = 0; // 0..1 raised defensive guard
  let victoryRaise = 0;
  let defeatDrop = 0;

  switch (st) {
    case 'advancing':
      bodyLean = 0.22;
      bodyOffsetY = -Math.abs(Math.sin(time * 16)) * 5;
      break;
    case 'punching':
      bodyLean = 0.24 * strikeCurve;
      frontArmExt = strikeCurve;
      backArmExt = 0.15;
      break;
    case 'kicking':
      bodyLean = -0.26 * strikeCurve;
      bodyOffsetY = -8 * strikeCurve;
      kickExt = strikeCurve;
      break;
    case 'combo_attack': {
      const flurry = Math.sin(prog * Math.PI * 3);
      bodyLean = 0.28;
      bodyOffsetY = -16 * strikeCurve;
      frontArmExt = Math.max(0, flurry);
      kickExt = Math.max(0, -flurry) * 0.95;
      break;
    }
    case 'blocking':
      bodyLean = -0.1;
      guardPose = 1;
      break;
    case 'taking_damage':
      bodyLean = -0.32 * strikeCurve;
      bodyOffsetY = -4 * strikeCurve;
      break;
    case 'knockback':
      bodyLean = -0.52 * strikeCurve;
      bodyOffsetY = -14 * strikeCurve;
      break;
    case 'victory':
      bodyLean = -0.05;
      bodyOffsetY = -Math.abs(Math.sin(time * 6)) * 10;
      victoryRaise = 1;
      break;
    case 'defeat':
      defeatDrop = Math.min(1, entity.stateTime / 0.35);
      bodyLean = -1.25 * defeatDrop;
      bodyOffsetY = 38 * defeatDrop;
      break;
    case 'idle':
    default:
      break;
  }

  const hipX = 0;
  const hipY = -48 + bodyOffsetY;
  const flashWhite = entity.hitFlash > 0.04;
  const giColor = flashWhite ? '#FEF3C7' : p.primaryColor;
  const trimColor = flashWhite ? '#FFFFFF' : p.secondaryColor;

  // --- BACK LEG ---
  const strideWave = st === 'advancing' ? Math.sin(time * 16) * 14 : 0;
  drawLimb(ctx, hipX - 6, hipY, hipX - 18 - strideWave * 0.5, hipY + 24, hipX - 24 - strideWave, -2, '#0F172A', trimColor, 9);

  // --- FRONT LEG (OR HIGH KICK) ---
  if (kickExt > 0.08) {
    const kneeX = hipX + 18 * kickExt + 10;
    const kneeY = hipY - 18 * kickExt + 8;
    const footX = hipX + 58 * kickExt + 12;
    const footY = hipY - 26 * kickExt + 4;
    drawLimb(ctx, hipX + 6, hipY, kneeX, kneeY, footX, footY, giColor, p.accentColor, 9.5);
    // Glowing cyber kick-boot energy tip
    ctx.fillStyle = p.accentColor;
    ctx.beginPath();
    ctx.arc(footX, footY, 6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    drawLimb(
      ctx,
      hipX + 6,
      hipY,
      hipX + 16 + strideWave * 0.5,
      hipY + 24,
      hipX + 20 + strideWave,
      -2,
      giColor,
      trimColor,
      9.5
    );
  }

  // --- TORSO, HEAD, ARMS (ROTATED BY BODY LEAN) ---
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(bodyLean);

  // Flowing cyber-belt / sash trailing behind waist
  ctx.strokeStyle = p.accentColor;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.quadraticCurveTo(
    -24,
    2 + Math.sin(time * 10) * 5,
    -36,
    12 + Math.cos(time * 8) * 4
  );
  ctx.stroke();

  // Back arm
  const shoulderY = -36;
  const backElbowX = guardPose ? 10 : -14 + backArmExt * 16;
  const backElbowY = guardPose ? -24 : -18 - victoryRaise * 26;
  const backHandX = guardPose ? 22 : victoryRaise ? -6 : 12 + backArmExt * 24;
  const backHandY = guardPose ? -36 : victoryRaise ? -66 : -26;
  drawLimb(ctx, -6, shoulderY, backElbowX, backElbowY, backHandX, backHandY, '#1E293B', trimColor, 7.5);

  // Torso Cyber-Gi / Armor Silhouette
  ctx.fillStyle = giColor;
  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-13, -40);
  ctx.lineTo(14, -40);
  ctx.lineTo(11, 2);
  ctx.lineTo(-11, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Diagonal martial-arts lapel & chest core accent
  ctx.strokeStyle = p.accentColor;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-10, -38);
  ctx.lineTo(8, -14);
  ctx.stroke();

  // Waist cyber-belt
  ctx.fillStyle = p.accentColor;
  ctx.fillRect(-12, -5, 24, 5);

  // Shoulder pauldron for Champion / Elite opponents
  if (p.style === 'champion' || p.style === 'elite') {
    ctx.fillStyle = trimColor;
    ctx.beginPath();
    ctx.roundRect(-17, -44, 14, 10, 4);
    ctx.roundRect(5, -44, 14, 10, 4);
    ctx.fill();
  }

  // Head & Signature Cyber-Dojo Headgear per Fighter Level
  const headY = -54;
  ctx.fillStyle = flashWhite ? '#FFFFFF' : p.skinColor;
  ctx.beginPath();
  ctx.arc(2, headY, 12.5, 0, Math.PI * 2);
  ctx.fill();

  // Headgear styling by fighter identity
  if (p.style === 'player') {
    // Sleek cyber-dojo emerald headband with streaming ribbons + visor
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(1, headY - 3, 12.8, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10B981';
    ctx.fillRect(-10, headY - 6, 24, 4.5);
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(5, headY - 3, 9, 3.5); // glowing visor
    // Headband tails
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, headY - 4);
    ctx.quadraticCurveTo(-24, headY - 8 + Math.sin(time * 12) * 4, -34, headY + 2);
    ctx.stroke();
  } else if (p.style === 'champion') {
    // Horned Gold-Obsidian Cyber Samurai Helm
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(1, headY - 2, 13.5, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(4, headY - 12);
    ctx.lineTo(14, headY - 24);
    ctx.moveTo(2, headY - 12);
    ctx.lineTo(-8, headY - 22);
    ctx.stroke();
    ctx.fillStyle = '#FB7185';
    ctx.fillRect(4, headY - 3, 10, 4);
  } else if (p.style === 'elite') {
    // Floating Elite Halo + Plasma Visor
    ctx.strokeStyle = p.accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(2, headY - 20, 14, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = p.secondaryColor;
    ctx.fillRect(3, headY - 4, 11, 4.5);
  } else {
    // Distinct colored headband / street bandana / boxer visor
    ctx.fillStyle = p.secondaryColor;
    ctx.fillRect(-10, headY - 7, 24, 5);
    ctx.fillStyle = p.accentColor;
    ctx.fillRect(5, headY - 2, 9, 3.5);
  }

  // --- FRONT ATTACK ARM ---
  const frontElbowX = guardPose ? 14 : victoryRaise ? 12 : 12 + frontArmExt * 20;
  const frontElbowY = guardPose ? -22 : victoryRaise ? -54 : -20 - frontArmExt * 12;
  const frontHandX = guardPose ? 22 : victoryRaise ? 18 : 26 + frontArmExt * 36;
  const frontHandY = guardPose ? -40 : victoryRaise ? -78 : -28 - frontArmExt * 8;
  drawLimb(ctx, 8, shoulderY, frontElbowX, frontElbowY, frontHandX, frontHandY, giColor, trimColor, 8.2);

  // Cyber-Gauntlet / Oversized Boxer Glove
  const gloveRadius = p.style === 'boxer' ? 9.5 : 6.5;
  ctx.fillStyle = frontArmExt > 0.25 ? p.accentColor : trimColor;
  ctx.beginPath();
  ctx.arc(frontHandX, frontHandY, gloveRadius, 0, Math.PI * 2);
  ctx.fill();

  // Hexagonal Energy Shield Visual when Blocking
  if (st === 'blocking') {
    ctx.strokeStyle = '#38BDF8';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(28, -28, 28, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore();
}

function drawLimb(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  baseColor: string,
  accentColor: string,
  width: number
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = baseColor;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Subtle glowing kinetic joint highlight
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

interface OverheadBubbleParams {
  anchorX: number;
  headY: number;
  canvasW: number;
  canvasH: number;
  targetWord: string;
  typedBuffer: string;
  wordCombo: number;
  pressureRatio: number;
  hasErrorLock: boolean;
  aggressionMultiplier: number;
  intensityTier: AggressionIntensityTier;
  opponentAccent: string;
  waitingFirstKey: boolean;
}

function drawOpponentWordBubble(ctx: CanvasRenderingContext2D, b: OverheadBubbleParams) {
  ctx.save();
  const isLargeStage = b.canvasH >= 480;
  ctx.font = `700 ${isLargeStage ? 25 : 22}px "JetBrains Mono", ui-monospace, monospace`;

  const textWidth = ctx.measureText(b.targetWord).width;
  const padX = isLargeStage ? 28 : 24;
  const boxW = Math.max(isLargeStage ? 148 : 132, textWidth + padX * 2);
  const boxH = isLargeStage ? 58 : 54;

  const clampedCenterX = Math.max(boxW / 2 + 16, Math.min(b.canvasW - boxW / 2 - 16, b.anchorX));
  const boxX = clampedCenterX - boxW / 2;
  const boxY = Math.max(22, b.headY - boxH - 18);

  let hasError = b.hasErrorLock;
  if (!hasError) {
    for (let i = 0; i < b.typedBuffer.length; i++) {
      if (b.typedBuffer[i] !== b.targetWord[i]) {
        hasError = true;
        break;
      }
    }
  }

  const borderColor = hasError
    ? '#F43F5E'
    : b.pressureRatio >= 0.72
    ? '#FB7185'
    : b.wordCombo >= 3
    ? '#F59E0B'
    : '#10B981';

  // Soft outer shadow for legibility over combat VFX
  ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
  ctx.beginPath();
  ctx.roundRect(boxX + 2, boxY + 4, boxW, boxH, 12);
  ctx.fill();

  // High-contrast dark frosted bubble plate
  ctx.fillStyle = 'rgba(9, 12, 18, 0.96)';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = hasError ? 2.4 : 2;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 12);
  ctx.fill();
  ctx.stroke();

  // Speech pointer triangle aimed at opponent's head
  const tipX = Math.max(boxX + 18, Math.min(boxX + boxW - 18, b.anchorX));
  ctx.fillStyle = 'rgba(9, 12, 18, 0.96)';
  ctx.beginPath();
  ctx.moveTo(tipX - 8, boxY + boxH - 1);
  ctx.lineTo(tipX + 8, boxY + boxH - 1);
  ctx.lineTo(tipX, boxY + boxH + 9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(tipX - 8, boxY + boxH);
  ctx.lineTo(tipX, boxY + boxH + 9);
  ctx.lineTo(tipX + 8, boxY + boxH);
  ctx.stroke();

  // Character-by-character typing status
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cursorX = clampedCenterX - textWidth / 2;
  const textY = boxY + boxH / 2 - 2;

  for (let i = 0; i < b.targetWord.length; i++) {
    const ch = b.targetWord[i];
    const chW = ctx.measureText(ch).width;

    if (i < b.typedBuffer.length) {
      const ok = b.typedBuffer[i] === ch;
      if (ok) {
        ctx.fillStyle = '#34D399'; // Green correct
        ctx.fillText(ch, cursorX, textY);
      } else {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.32)';
        ctx.fillRect(cursorX - 1, textY - 13, chW + 2, 26);
        ctx.fillStyle = '#FB7185'; // Red incorrect (locked until Backspace)
        ctx.fillText(ch === ' ' ? '␣' : ch, cursorX, textY);
        ctx.fillStyle = '#F43F5E';
        ctx.fillRect(cursorX - 1, textY + 12, chW + 2, 2.5);
      }
    } else if (i === b.typedBuffer.length && !hasError) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.24)';
      ctx.fillRect(cursorX - 1, textY - 13, chW + 2, 26);
      ctx.fillStyle = '#FDE68A';
      ctx.fillText(ch, cursorX, textY);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(cursorX, textY + 12, chW, 2.5);
    } else {
      ctx.fillStyle = '#CBD5E1'; // Neutral remaining
      ctx.fillText(ch, cursorX, textY);
    }

    cursorX += chW;
  }

  // Mirrored Opponent Attack Charge Gauge along bottom edge of bubble
  if (!b.waitingFirstKey && b.pressureRatio > 0.02) {
    const trackW = boxW - 18;
    const fillW = trackW * Math.min(1, b.pressureRatio);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.fillRect(boxX + 9, boxY + boxH - 6, trackW, 3);
    ctx.fillStyle =
      b.pressureRatio >= 0.72
        ? '#F43F5E'
        : b.pressureRatio >= 0.45
        ? '#F59E0B'
        : '#38BDF8';
    ctx.fillRect(boxX + 9, boxY + boxH - 6, fillW, 3);
  }

  // Crisp non-hue-only status header above bubble
  ctx.font = '700 10px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = hasError
    ? '#FB7185'
    : b.pressureRatio >= 0.72
    ? '#FB7185'
    : b.waitingFirstKey
    ? '#FDE68A'
    : 'rgba(148, 163, 184, 0.9)';

  const hint = hasError
    ? 'BACKSPACE TO FIX'
    : b.waitingFirstKey
    ? 'TYPE TO STRIKE'
    : b.pressureRatio >= 0.72
    ? 'INCOMING! FINISH WORD TO INTERRUPT'
    : `${b.intensityTier.toUpperCase()} · ${b.aggressionMultiplier.toFixed(2)}x TEMPO`;
  ctx.fillText(hint, clampedCenterX, boxY - 8);

  ctx.restore();
}
