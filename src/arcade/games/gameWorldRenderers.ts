import {
  GameBridgeEvent,
  GameVisualBridge,
  computeBossHpPercent,
  computeNitroSpeedKmh,
} from './gameWorldTypes';
import {
  SharedVfxState,
  drawTacticalWordTarget,
  getThemeSkyColors,
  spawnBeam,
  spawnBurst,
  spawnCallout,
  spawnShockwave,
  triggerFlash,
  triggerShake,
} from './gameWorldVfx';
import {
  NitroTrafficState,
  PLAYER_Y_NORM,
  createInitialNitroTrafficState,
  requestWordClearOvertake,
  stepNitroTraffic,
} from './nitroTrafficPhysics';

export interface BossDebrisChunk {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  size: number;
  life: number;
  maxLife: number;
}

export interface RhythmNote {
  lane: number;
  progress: number; // 0 (horizon) -> 1 (strike line) -> 1.15 (fade)
  hit: boolean;
  accent: boolean;
}

export interface WorldSimState {
  time: number;
  scroll: number;
  simTick: number;

  // 1. Skyline Runner (Classic)
  runnerJumpTimer: number;
  runnerWasAirborne: boolean;
  runnerLegPhase: number;
  runnerStumbleTimer: number;
  runnerLean: number;

  // 2. Nitro Highway (Speed Rush) — strict collision-free traffic physics
  nitro: NitroTrafficState;

  // 3. Orbital Aegis (Accuracy Master)
  stars: Array<{ x: number; y: number; r: number; spd: number }>;
  droneXNorm: number;
  droneYNorm: number;
  droneTargetX: number;
  droneTargetY: number;
  droneVx: number;
  droneTrail: Array<{ x: number; y: number }>;
  turretAngle: number;
  turretRecoil: number;
  turretMuzzleFlash: number;
  droneHitFlash: number;
  shieldHitSegment: number;
  shieldHitTimer: number;

  // 4. Synthwave Pulse (Rhythm)
  eqBars: number[];
  eqPeaks: number[];
  beatPhase: number;
  activeLane: number;
  syncGlow: number;
  padDepression: number[];
  padFlash: number[];
  rhythmNotes: RhythmNote[];
  noteSpawnTimer: number;

  // 5. Titan Siege (Challenge / Daily)
  bossHitFlash: number;
  bossLastQuarter: number; // 4 -> 3 -> 2 -> 1 -> 0
  bossDestroyed: boolean;
  bossChargeGlow: number;
  railgunRecoil: number;
  railgunHeat: number;
  bossDebris: BossDebrisChunk[];
  embers: Array<{ x: number; y: number; vy: number; r: number }>;
}

export function createWorldSimState(): WorldSimState {
  const stars = Array.from({ length: 82 }, (_, i) => ({
    x: ((i * 137.5) % 100) / 100,
    y: ((i * 73.1) % 100) / 100,
    r: 0.7 + (i % 4) * 0.55,
    spd: 0.012 + (i % 4) * 0.011,
  }));

  const embers = Array.from({ length: 42 }, (_, i) => ({
    x: ((i * 91.3) % 100) / 100,
    y: ((i * 47.7) % 100) / 100,
    vy: 0.055 + (i % 5) * 0.025,
    r: 1.1 + (i % 3) * 0.8,
  }));

  const initialNotes: RhythmNote[] = [
    { lane: 0, progress: 0.18, hit: false, accent: false },
    { lane: 2, progress: 0.44, hit: false, accent: true },
    { lane: 1, progress: 0.72, hit: false, accent: false },
  ];

  return {
    time: 0,
    scroll: 0,
    simTick: 0,

    runnerJumpTimer: 0,
    runnerWasAirborne: false,
    runnerLegPhase: 0,
    runnerStumbleTimer: 0,
    runnerLean: 0.06,

    nitro: createInitialNitroTrafficState(),

    stars,
    droneXNorm: 0.5,
    droneYNorm: 0.28,
    droneTargetX: 0.5,
    droneTargetY: 0.28,
    droneVx: 0,
    droneTrail: [],
    turretAngle: -Math.PI / 2,
    turretRecoil: 0,
    turretMuzzleFlash: 0,
    droneHitFlash: 0,
    shieldHitSegment: -1,
    shieldHitTimer: 0,

    eqBars: Array.from({ length: 24 }, () => 0.16),
    eqPeaks: Array.from({ length: 24 }, () => 0.22),
    beatPhase: 0,
    activeLane: 1,
    syncGlow: 0,
    padDepression: [0, 0, 0, 0],
    padFlash: [0, 0, 0, 0],
    rhythmNotes: initialNotes,
    noteSpawnTimer: 0,

    bossHitFlash: 0,
    bossLastQuarter: 4,
    bossDestroyed: false,
    bossChargeGlow: 0,
    railgunRecoil: 0,
    railgunHeat: 0,
    bossDebris: [],
    embers,
  };
}

export function handleWorldEvent(
  sim: WorldSimState,
  vfx: SharedVfxState,
  bridge: GameVisualBridge,
  evt: GameBridgeEvent,
  w: number,
  h: number,
  reducedMotion: boolean
) {
  const mode = bridge.mode;

  // --------------------------------------------------------------------------
  // 1. SKYLINE RUNNER (CLASSIC)
  // --------------------------------------------------------------------------
  if (mode === 'classic') {
    const runnerX = w * 0.24;
    const groundY = h * 0.74;
    const gateX = w * 0.62;
    const gateY = groundY - 46;

    if (evt.type === 'key_hit') {
      spawnBurst(vfx, runnerX + 14, groundY - 6, '#F59E0B', 4, 95, reducedMotion);
    } else if (evt.type === 'word_clear') {
      sim.runnerJumpTimer = 0.52;
      sim.runnerWasAirborne = true;
      // Takeoff dust + gate burst
      spawnBurst(vfx, runnerX - 4, groundY - 2, '#94A3B8', 8, 95, reducedMotion);
      spawnShockwave(vfx, gateX, gateY, 58, '#10B981', 2.5);
      spawnBurst(vfx, gateX, gateY, '#34D399', 15, 175, reducedMotion);
      spawnCallout(vfx, runnerX + 18, groundY - 76, 'ROOFTOP VAULT', '#34D399');
    } else if (evt.type === 'key_miss') {
      sim.runnerStumbleTimer = 0.28;
      spawnBurst(vfx, runnerX, groundY - 24, '#F43F5E', 10, 120, reducedMotion);
      triggerShake(vfx, 5, reducedMotion);
      triggerFlash(vfx, '#F43F5E', 0.14, reducedMotion);
    } else if (evt.type === 'victory') {
      spawnShockwave(vfx, w * 0.5, h * 0.42, 145, '#F59E0B', 3);
      spawnBurst(vfx, w * 0.5, h * 0.42, '#F59E0B', 36, 240, reducedMotion);
      spawnBurst(vfx, w * 0.5, h * 0.42, '#10B981', 28, 210, reducedMotion);
      spawnCallout(vfx, w * 0.5, h * 0.34, 'EXTRACTION COMPLETE', '#34D399');
    }
    return;
  }

  // --------------------------------------------------------------------------
  // 2. NITRO HIGHWAY (SPEED RUSH)
  // --------------------------------------------------------------------------
  if (mode === 'speed_rush') {
    const roadW = Math.min(w * 0.62, 420);
    const roadLeft = (w - roadW) / 2;
    const laneW = roadW / 3;
    const carX = roadLeft + laneW * 1.5 + sim.nitro.carXNorm * laneW;
    const carY = h * PLAYER_Y_NORM;

    if (evt.type === 'key_hit') {
      sim.nitro.nitroFlare = Math.min(1, sim.nitro.nitroFlare + 0.35);
      const isOverdrive = (evt.combo ?? 0) >= 15;
      spawnBurst(
        vfx,
        carX + (Math.random() - 0.5) * 10,
        carY + 34,
        isOverdrive ? '#38BDF8' : '#F59E0B',
        5,
        115,
        reducedMotion
      );
    } else if (evt.type === 'word_clear') {
      // Strictly verified collision-free open-lane overtake!
      const didSwitch = requestWordClearOvertake(sim.nitro);
      sim.nitro.nitroFlare = 1;
      sim.nitro.overtakeFlashTimer = 0.4;
      spawnShockwave(vfx, carX, carY, 64, didSwitch ? '#38BDF8' : '#F59E0B', 2.4);
      spawnBurst(vfx, carX, carY + 30, '#38BDF8', 16, 195, reducedMotion);
      const combo = evt.combo ?? bridge.combo;
      spawnCallout(
        vfx,
        carX,
        carY - 50,
        combo >= 20
          ? `NITRO OVERDRIVE x${combo}`
          : didSwitch
          ? 'CLEAN OVERTAKE'
          : 'TURBO SURGE',
        combo >= 20 ? '#38BDF8' : '#FBBF24'
      );
    } else if (evt.type === 'key_miss') {
      sim.nitro.nitroFlare = 0;
      sim.nitro.brakeFlashTimer = 0.34;
      sim.nitro.skidTimer = 0.32;
      // Dual rear tire sparks on mistype brake check
      spawnBurst(vfx, carX - 12, carY + 26, '#F43F5E', 6, 120, reducedMotion);
      spawnBurst(vfx, carX + 12, carY + 26, '#F59E0B', 6, 120, reducedMotion);
      triggerShake(vfx, 5.5, reducedMotion);
      triggerFlash(vfx, '#F43F5E', 0.12, reducedMotion);
    } else if (evt.type === 'victory') {
      spawnShockwave(vfx, w * 0.5, h * 0.45, 165, '#F59E0B', 3.5);
      spawnBurst(vfx, w * 0.5, h * 0.45, '#F59E0B', 40, 260, reducedMotion);
      spawnCallout(vfx, w * 0.5, h * 0.36, 'FINISH LINE CROSSED', '#FDE68A');
    }
    return;
  }

  // --------------------------------------------------------------------------
  // 3. ORBITAL AEGIS (ACCURACY MASTER)
  // --------------------------------------------------------------------------
  if (mode === 'accuracy_master') {
    const turretX = w * 0.5;
    const turretY = h * 0.82;
    const droneX = w * sim.droneXNorm;
    const droneY = h * sim.droneYNorm;

    if (evt.type === 'key_hit') {
      sim.droneHitFlash = 0.16;
      sim.turretRecoil = 1;
      sim.turretMuzzleFlash = 0.14;
      spawnBeam(vfx, turretX, turretY - 16, droneX, droneY, '#10B981', 3);
      spawnBurst(vfx, droneX, droneY, '#34D399', 6, 135, reducedMotion);
    } else if (evt.type === 'word_clear') {
      sim.turretRecoil = 1;
      sim.turretMuzzleFlash = 0.22;
      spawnBeam(vfx, turretX, turretY - 16, droneX, droneY, '#34D399', 5.2);
      spawnShockwave(vfx, droneX, droneY, 74, '#10B981', 3);
      spawnBurst(vfx, droneX, droneY, '#34D399', 22, 225, reducedMotion);
      spawnBurst(vfx, droneX, droneY, '#F59E0B', 10, 165, reducedMotion);
      spawnCallout(vfx, droneX, droneY - 26, 'INTERCEPTOR DESTROYED', '#34D399');

      // Launch next orbital interceptor smoothly along a fresh curved upper-sector path
      sim.droneTrail = [];
      const nextSide = bridge.activeWord.wordIndex % 2 === 0 ? 0.14 : 0.86;
      sim.droneXNorm = nextSide;
      sim.droneYNorm = 0.14;
      sim.droneTargetX = 0.24 + ((bridge.activeWord.wordIndex * 37) % 52) / 100;
      sim.droneTargetY = 0.23 + ((bridge.activeWord.wordIndex * 19) % 15) / 100;
    } else if (evt.type === 'key_miss' || evt.type === 'shield_break') {
      const maxShield = bridge.errorBudget ?? 5;
      const impactedSeg = Math.max(0, Math.min(maxShield - 1, maxShield - bridge.errors));
      sim.shieldHitSegment = impactedSeg;
      sim.shieldHitTimer = 0.55;

      // Calculate exact point on the impacted hex-shield arc
      const startAng = Math.PI * 1.12;
      const totalSpan = Math.PI * 0.76;
      const segSpan = totalSpan / maxShield;
      const hitAng = startAng + (impactedSeg + 0.5) * segSpan;
      const impactX = turretX + Math.cos(hitAng) * 44;
      const impactY = turretY + Math.sin(hitAng) * 44;

      spawnBeam(vfx, droneX, droneY + 14, impactX, impactY, '#F43F5E', 3.5);
      spawnShockwave(vfx, impactX, impactY, 54, '#F43F5E', 2.5);
      spawnBurst(vfx, impactX, impactY, '#FB7185', 18, 185, reducedMotion);
      spawnCallout(
        vfx,
        turretX,
        turretY - 64,
        evt.type === 'shield_break' ? 'SHIELD BREACHED!' : 'SHIELD DEFLECTED',
        '#FB7185'
      );
      triggerShake(vfx, evt.type === 'shield_break' ? 12 : 7, reducedMotion);
      triggerFlash(vfx, '#F43F5E', evt.type === 'shield_break' ? 0.28 : 0.16, reducedMotion);
    } else if (evt.type === 'victory') {
      spawnShockwave(vfx, turretX, h * 0.45, 165, '#10B981', 3.5);
      spawnBurst(vfx, turretX, h * 0.45, '#34D399', 42, 250, reducedMotion);
      spawnCallout(vfx, turretX, h * 0.36, 'SECTOR SECURED', '#34D399');
    }
    return;
  }

  // --------------------------------------------------------------------------
  // 4. SYNTHWAVE PULSE (RHYTHM MODE)
  // --------------------------------------------------------------------------
  if (mode === 'rhythm') {
    const laneCount = 4;
    const horizonY = h * 0.34;
    const strikeY = h * 0.78;
    const topTrackW = Math.min(w * 0.24, 180);
    const botTrackW = Math.min(w * 0.66, 540);
    const strikeFrac = (strikeY - horizonY) / (h - horizonY);
    const strikeW = topTrackW + (botTrackW - topTrackW) * strikeFrac;
    const strikeLeft = (w - strikeW) / 2;
    const laneW = strikeW / laneCount;

    if (evt.type === 'key_hit') {
      // Prioritize lane with closest approaching note for realistic rhythm feel
      let targetLane = (sim.activeLane + 1) % laneCount;
      let bestNote: RhythmNote | null = null;
      let bestDist = 99;
      for (const n of sim.rhythmNotes) {
        if (!n.hit && n.progress > 0.55 && n.progress < 1.1) {
          const d = Math.abs(1 - n.progress);
          if (d < bestDist) {
            bestDist = d;
            bestNote = n;
          }
        }
      }
      if (bestNote) {
        bestNote.hit = true;
        targetLane = bestNote.lane;
      }

      sim.activeLane = targetLane;
      sim.syncGlow = 1;
      sim.padDepression[targetLane] = 1;
      sim.padFlash[targetLane] = 1;

      const lx = strikeLeft + laneW * targetLane + laneW / 2;
      const centerBar = Math.floor(((targetLane + 0.5) / laneCount) * sim.eqBars.length);
      for (let i = 0; i < sim.eqBars.length; i++) {
        const dist = Math.abs(i - centerBar);
        const boost = Math.max(0, 0.94 - dist * 0.13);
        sim.eqBars[i] = Math.min(1, Math.max(sim.eqBars[i], boost));
        sim.eqPeaks[i] = Math.max(sim.eqPeaks[i], sim.eqBars[i]);
      }
      spawnShockwave(vfx, lx, strikeY, 36, '#10B981', 2.2);
      spawnBurst(vfx, lx, strikeY, '#34D399', 7, 120, reducedMotion);
    } else if (evt.type === 'word_clear') {
      const cx = w * 0.5;
      for (let i = 0; i < sim.eqBars.length; i++) {
        sim.eqBars[i] = 0.78 + Math.random() * 0.22;
        sim.eqPeaks[i] = Math.max(sim.eqPeaks[i], sim.eqBars[i]);
      }
      for (let l = 0; l < 4; l++) {
        sim.padFlash[l] = 0.9;
        sim.padDepression[l] = 0.8;
      }
      spawnShockwave(vfx, cx, strikeY, 108, '#F59E0B', 2.8);
      spawnBurst(vfx, cx, strikeY, '#FBBF24', 18, 195, reducedMotion);
      spawnCallout(
        vfx,
        cx,
        strikeY - 46,
        bridge.rhythmScore >= 85 ? 'PERFECT HARMONIC' : 'CADENCE LOCK',
        '#34D399'
      );
    } else if (evt.type === 'key_miss') {
      sim.syncGlow = 0;
      const lx = strikeLeft + laneW * sim.activeLane + laneW / 2;
      spawnBurst(vfx, lx, strikeY, '#F43F5E', 10, 125, reducedMotion);
      spawnCallout(vfx, lx, strikeY - 34, 'OFF BEAT', '#FB7185');
      triggerShake(vfx, 5, reducedMotion);
      triggerFlash(vfx, '#F43F5E', 0.12, reducedMotion);
    } else if (evt.type === 'victory') {
      spawnShockwave(vfx, w * 0.5, h * 0.45, 160, '#10B981', 3);
      spawnBurst(vfx, w * 0.5, h * 0.45, '#F59E0B', 38, 230, reducedMotion);
      spawnCallout(vfx, w * 0.5, h * 0.36, 'HARMONIC FINALE', '#FDE68A');
    }
    return;
  }

  // --------------------------------------------------------------------------
  // 5. TITAN SIEGE (CHALLENGE / DAILY BOSS RAID)
  // --------------------------------------------------------------------------
  const cannonX = w * 0.5;
  const cannonY = h * 0.85;
  const bossX = w * 0.5 + Math.sin(sim.time * 1.25) * Math.min(72, w * 0.08);
  const bossY = h * 0.32;

  if (evt.type === 'key_hit') {
    sim.bossHitFlash = 0.14;
    sim.railgunRecoil = 1;
    sim.railgunHeat = Math.min(1, sim.railgunHeat + 0.12);
    const hitX = bossX + (Math.random() - 0.5) * 96;
    const hitY = bossY + 12 + (Math.random() - 0.5) * 20;
    spawnBeam(vfx, cannonX, cannonY - 14, hitX, hitY, '#F59E0B', 3.2);
    spawnBurst(vfx, hitX, hitY, '#FBBF24', 7, 155, reducedMotion);
  } else if (evt.type === 'word_clear') {
    sim.bossHitFlash = 0.28;
    sim.railgunRecoil = 1;
    sim.railgunHeat = Math.min(1, sim.railgunHeat + 0.28);
    spawnBeam(vfx, cannonX, cannonY - 14, bossX, bossY + 6, '#FDE68A', 5.8);
    spawnShockwave(vfx, bossX, bossY + 6, 84, '#F59E0B', 3);
    spawnBurst(vfx, bossX, bossY + 6, '#F59E0B', 20, 220, reducedMotion);
    spawnCallout(vfx, bossX, bossY - 46, 'RAILGUN SALVO', '#FDE68A');
    triggerShake(vfx, 4.5, reducedMotion);

    // Progressive armor shatter at 75%, 50%, 25% HP with tumbling physical debris chunks!
    const hp = computeBossHpPercent(bridge.progress);
    const quarter = Math.ceil(hp / 25);
    if (quarter < sim.bossLastQuarter && quarter > 0) {
      sim.bossLastQuarter = quarter;
      spawnShockwave(vfx, bossX, bossY, 136, '#F43F5E', 3.5);
      spawnBurst(vfx, bossX, bossY, '#FB7185', 32, 260, reducedMotion);
      spawnCallout(vfx, bossX, bossY - 68, 'ARMOR PLATE SHATTERED!', '#F59E0B');
      triggerShake(vfx, 9.5, reducedMotion);

      if (!reducedMotion) {
        for (let d = 0; d < 7; d++) {
          const dir = d % 2 === 0 ? -1 : 1;
          sim.bossDebris.push({
            x: bossX + dir * (25 + Math.random() * 55),
            y: bossY + (Math.random() - 0.5) * 22,
            vx: dir * (55 + Math.random() * 90),
            vy: -45 - Math.random() * 60,
            rot: Math.random() * Math.PI,
            vrot: (Math.random() - 0.5) * 9,
            size: 7 + Math.random() * 7,
            life: 1.4,
            maxLife: 1.4,
          });
        }
      }
    }
  } else if (evt.type === 'key_miss') {
    sim.bossChargeGlow = 1;
    sim.railgunHeat = Math.max(0, sim.railgunHeat - 0.25);
    const podX = Math.random() > 0.5 ? bossX - 60 : bossX + 60;
    spawnBeam(vfx, podX, bossY + 14, cannonX, cannonY - 12, '#F43F5E', 3.2);
    spawnBurst(vfx, cannonX, cannonY - 14, '#F43F5E', 14, 150, reducedMotion);
    triggerShake(vfx, 6, reducedMotion);
    triggerFlash(vfx, '#F43F5E', 0.14, reducedMotion);
  } else if (evt.type === 'victory') {
    sim.bossDestroyed = true;
    spawnShockwave(vfx, bossX, bossY, 195, '#F59E0B', 4);
    spawnShockwave(vfx, bossX - 42, bossY + 10, 128, '#F43F5E', 3);
    spawnBurst(vfx, bossX, bossY, '#F59E0B', 52, 290, reducedMotion);
    spawnBurst(vfx, bossX, bossY, '#F43F5E', 36, 240, reducedMotion);
    spawnCallout(vfx, bossX, bossY - 10, 'DREADNOUGHT DESTROYED!', '#FDE68A');
    triggerShake(vfx, 12, reducedMotion);
    triggerFlash(vfx, '#F59E0B', 0.22, reducedMotion);
  }
}

export function updateWorldSim(
  sim: WorldSimState,
  bridge: GameVisualBridge,
  dt: number
) {
  const isPlaying = bridge.gameState === 'playing' && !bridge.waitingFirstKey;
  const speedScale = isPlaying ? 1 + Math.min(2.6, bridge.wpm / 45) : 0.35;

  sim.time += dt;
  sim.simTick += 1;
  sim.scroll += dt * 118 * speedScale;

  // 1. Skyline Runner kinematics
  if (sim.runnerJumpTimer > 0) {
    sim.runnerJumpTimer = Math.max(0, sim.runnerJumpTimer - dt);
  } else if (sim.runnerWasAirborne) {
    sim.runnerWasAirborne = false;
  }
  if (sim.runnerStumbleTimer > 0) {
    sim.runnerStumbleTimer = Math.max(0, sim.runnerStumbleTimer - dt);
  }
  const targetLean = isPlaying
    ? 0.14 + Math.min(0.24, bridge.wpm / 340) - (sim.runnerStumbleTimer > 0 ? 0.2 : 0)
    : 0.05;
  sim.runnerLean += (targetLean - sim.runnerLean) * Math.min(1, dt * 8);
  if (isPlaying) {
    sim.runnerLegPhase += dt * (9.5 + Math.min(13, bridge.wpm * 0.13));
  } else {
    sim.runnerLegPhase += dt * 2.4;
  }

  // 2. Nitro Highway — pure collision-free overtaking physics
  stepNitroTraffic(sim.nitro, dt, bridge.wpm, isPlaying, sim.simTick);

  // 3. Orbital Aegis starfield, curved drone flight & recoil decay
  for (const s of sim.stars) {
    s.y += dt * s.spd * (isPlaying ? 1.85 : 0.65);
    if (s.y > 1) {
      s.y = 0;
      s.x = Math.random();
    }
  }
  const prevDroneX = sim.droneXNorm;
  const hoverTargetX = sim.droneTargetX + Math.sin(sim.time * 1.9) * 0.045;
  const hoverTargetY = sim.droneTargetY + Math.cos(sim.time * 1.5) * 0.025;
  sim.droneXNorm += (hoverTargetX - sim.droneXNorm) * Math.min(1, dt * 4.5);
  sim.droneYNorm += (hoverTargetY - sim.droneYNorm) * Math.min(1, dt * 4.5);
  sim.droneVx = (sim.droneXNorm - prevDroneX) / Math.max(0.001, dt);
  sim.droneTrail.push({ x: sim.droneXNorm, y: sim.droneYNorm });
  if (sim.droneTrail.length > 14) sim.droneTrail.shift();

  sim.droneHitFlash = Math.max(0, sim.droneHitFlash - dt);
  sim.turretRecoil = Math.max(0, sim.turretRecoil - dt * 8.5);
  sim.turretMuzzleFlash = Math.max(0, sim.turretMuzzleFlash - dt);
  sim.shieldHitTimer = Math.max(0, sim.shieldHitTimer - dt);

  // 4. Synthwave Pulse — 3D scrolling notes, spring-damped EQ peaks & receptor pads
  const beatRate = isPlaying ? 1.8 + Math.min(1.8, bridge.wpm / 55) : 0.9;
  sim.beatPhase = (sim.beatPhase + dt * beatRate) % 1;
  sim.syncGlow = Math.max(0, sim.syncGlow - dt * 2.5);

  for (let l = 0; l < 4; l++) {
    sim.padDepression[l] = Math.max(0, sim.padDepression[l] - dt * 6.5);
    sim.padFlash[l] = Math.max(0, sim.padFlash[l] - dt * 4.2);
  }

  sim.noteSpawnTimer += dt * beatRate;
  if (sim.noteSpawnTimer >= 0.52) {
    sim.noteSpawnTimer = 0;
    const lane = (sim.simTick * 7 + Math.floor(sim.time * 10)) % 4;
    sim.rhythmNotes.push({
      lane,
      progress: 0,
      hit: false,
      accent: sim.simTick % 4 === 0,
    });
  }

  for (let i = sim.rhythmNotes.length - 1; i >= 0; i--) {
    const n = sim.rhythmNotes[i];
    n.progress += dt * (isPlaying ? 0.65 + Math.min(0.55, bridge.wpm / 140) : 0.32);
    if (n.progress > 1.15 || (n.hit && n.progress > 0.96)) {
      sim.rhythmNotes.splice(i, 1);
    }
  }

  for (let i = 0; i < sim.eqBars.length; i++) {
    const floor = 0.12 + 0.055 * Math.sin(sim.time * 3.2 + i * 0.55);
    sim.eqBars[i] = Math.max(floor, sim.eqBars[i] - dt * 1.9);
    sim.eqPeaks[i] = Math.max(sim.eqBars[i], sim.eqPeaks[i] - dt * 0.55);
  }

  // 5. Titan Siege — embers, recoil, heat dissipation & tumbling armor debris
  sim.bossHitFlash = Math.max(0, sim.bossHitFlash - dt);
  sim.bossChargeGlow = Math.max(0, sim.bossChargeGlow - dt * 2.2);
  sim.railgunRecoil = Math.max(0, sim.railgunRecoil - dt * 7.5);
  sim.railgunHeat = Math.max(0, sim.railgunHeat - dt * 0.35);

  for (let i = sim.bossDebris.length - 1; i >= 0; i--) {
    const d = sim.bossDebris[i];
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.vy += 260 * dt;
    d.rot += d.vrot * dt;
    d.life -= dt;
    if (d.life <= 0) sim.bossDebris.splice(i, 1);
  }

  for (const e of sim.embers) {
    e.y -= dt * e.vy * (isPlaying ? 1.65 : 0.7);
    if (e.y < 0) {
      e.y = 1.05;
      e.x = Math.random();
    }
  }
}

export function renderGameWorld(
  ctx: CanvasRenderingContext2D,
  sim: WorldSimState,
  bridge: GameVisualBridge,
  w: number,
  h: number
) {
  const sky = getThemeSkyColors(bridge.arenaTheme);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, sky.top);
  bg.addColorStop(1, sky.bottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  switch (bridge.mode) {
    case 'classic':
      renderSkylineRunner(ctx, sim, bridge, w, h);
      break;
    case 'speed_rush':
      renderNitroHighway(ctx, sim, bridge, w, h);
      break;
    case 'accuracy_master':
      renderOrbitalAegis(ctx, sim, bridge, w, h);
      break;
    case 'rhythm':
      renderSynthwavePulse(ctx, sim, bridge, w, h);
      break;
    case 'challenge':
      renderTitanSiege(ctx, sim, bridge, w, h);
      break;
  }
}

/* ============================================================================
 * 1. CLASSIC -> SKYLINE RUNNER (ARCHITECTURAL ROOFTOPS & ARTICULATED VAULTS)
 * ============================================================================ */
function renderSkylineRunner(
  ctx: CanvasRenderingContext2D,
  sim: WorldSimState,
  bridge: GameVisualBridge,
  w: number,
  h: number
) {
  const groundY = h * 0.74;

  // Atmospheric city twilight glow
  const glow = ctx.createRadialGradient(w * 0.78, h * 0.24, 10, w * 0.78, h * 0.24, 150);
  glow.addColorStop(0, 'rgba(245, 158, 11, 0.24)');
  glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Sweeping atmospheric skyline searchlights
  for (let s = 0; s < 2; s++) {
    ctx.save();
    const baseX = s === 0 ? w * 0.22 : w * 0.72;
    const sweep = Math.sin(sim.time * (0.45 + s * 0.22) + s * 2.1) * 0.35;
    ctx.translate(baseX, groundY);
    ctx.rotate(sweep);
    const beam = ctx.createLinearGradient(0, 0, 0, -groundY);
    beam.addColorStop(0, 'rgba(245, 158, 11, 0.08)');
    beam.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-42, -groundY);
    ctx.lineTo(42, -groundY);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Multi-layer parallax skyline with antennas & warm window grids
  const drawLayer = (
    speedMult: number,
    color: string,
    baseH: number,
    widthStep: number,
    winColor?: string
  ) => {
    ctx.fillStyle = color;
    const offset = (sim.scroll * speedMult) % widthStep;
    const cols = Math.ceil(w / widthStep) + 3;
    for (let i = -1; i < cols; i++) {
      const worldIdx = Math.floor((sim.scroll * speedMult) / widthStep) + i;
      const bh = baseH + Math.abs(Math.sin(worldIdx * 1.7) * 62);
      const bx = i * widthStep - offset;
      const by = groundY - bh;
      ctx.fillRect(bx, by, widthStep - 6, bh + (h - groundY));

      // Subtle rooftop antenna & blinking red beacon on taller towers
      if (worldIdx % 3 === 0) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(bx + (widthStep - 6) * 0.5, by - 16, 2, 16);
        const blink = Math.sin(sim.time * 4 + worldIdx) > 0.2;
        if (blink) {
          ctx.fillStyle = '#F43F5E';
          ctx.beginPath();
          ctx.arc(bx + (widthStep - 6) * 0.5 + 1, by - 17, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = color;
      }

      if (winColor && worldIdx % 2 === 0) {
        ctx.fillStyle = winColor;
        for (let wy = by + 12; wy < groundY - 18; wy += 14) {
          ctx.fillRect(bx + 8, wy, widthStep - 24, 3);
        }
        ctx.fillStyle = color;
      }
    }
  };

  drawLayer(0.16, '#0C1322', 68, 76);
  drawLayer(0.38, '#131D31', 46, 60, 'rgba(245, 158, 11, 0.16)');

  // Segmented foreground rooftop buildings with real glowing chasm gaps
  const deckPeriod = 260;
  const gapWidth = 44;
  const deckOffset = (sim.scroll * 1.35) % deckPeriod;
  const segments = Math.ceil(w / deckPeriod) + 2;

  for (let i = -1; i < segments; i++) {
    const sx = i * deckPeriod - deckOffset;
    const roofW = deckPeriod - gapWidth;

    // Glowing chasm abyss mist between roofs
    const abyssX = sx + roofW;
    const abyssGrad = ctx.createLinearGradient(abyssX, groundY, abyssX, h);
    abyssGrad.addColorStop(0, 'rgba(16, 185, 129, 0.16)');
    abyssGrad.addColorStop(1, 'rgba(7, 10, 18, 0.95)');
    ctx.fillStyle = abyssGrad;
    ctx.fillRect(abyssX, groundY, gapWidth, h - groundY);

    // Concrete rooftop slab
    ctx.fillStyle = '#1B253A';
    ctx.fillRect(sx, groundY, roofW, h - groundY);

    // Architectural side bevel & warm amber safety trim
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(sx, groundY + 12, roofW, 4);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(sx, groundY, roofW, 3);

    // Rooftop skylight / HVAC detail
    ctx.fillStyle = '#25334F';
    ctx.fillRect(sx + 28, groundY - 9, 26, 9);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.fillRect(sx + 32, groundY - 6, 18, 3);
  }

  // Holographic Word Checkpoint Gate ahead
  const gateX = w * 0.62;
  const gateHeight = 70;
  ctx.save();
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.78)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(gateX - 24, groundY);
  ctx.lineTo(gateX - 24, groundY - gateHeight);
  ctx.moveTo(gateX + 24, groundY);
  ctx.lineTo(gateX + 24, groundY - gateHeight);
  ctx.stroke();

  const beamGrad = ctx.createLinearGradient(gateX, groundY - gateHeight, gateX, groundY);
  beamGrad.addColorStop(0, 'rgba(16, 185, 129, 0.26)');
  beamGrad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
  ctx.fillStyle = beamGrad;
  ctx.fillRect(gateX - 23, groundY - gateHeight, 46, gateHeight);
  ctx.restore();

  if (bridge.activeWord.currentWord) {
    drawTacticalWordTarget(ctx, gateX, groundY - gateHeight - 24, bridge.activeWord, '#10B981');
  }

  // Articulated Multi-Joint Cyber-Courier Runner
  const runnerX = w * 0.24;
  const jumpNorm = sim.runnerJumpTimer / 0.52;
  const jumpHeight = jumpNorm > 0 ? Math.sin(jumpNorm * Math.PI) * 64 : 0;
  const ry = groundY - jumpHeight;
  const isAirborne = jumpHeight > 4;

  // Dynamic ground shadow scaling with vault height
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(runnerX, groundY + 4, Math.max(7, 19 - jumpHeight * 0.16), 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flowing amber kinetic scarf
  ctx.strokeStyle = sim.runnerStumbleTimer > 0 ? '#F43F5E' : '#F59E0B';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(runnerX - 2, ry - 33);
  ctx.quadraticCurveTo(
    runnerX - 24,
    ry - 35 + Math.sin(sim.time * 18) * 5,
    runnerX - 46,
    ry - 26 + Math.cos(sim.time * 15) * 4
  );
  ctx.stroke();

  // Articulated 2-segment legs (hip -> knee -> foot)
  const drawLeg = (phase: number, color: string) => {
    const hipX = runnerX;
    const hipY = ry - 21;
    const kneeAngle = isAirborne ? -0.55 : Math.sin(phase) * 0.72;
    const shinAngle = isAirborne ? 0.85 : kneeAngle + Math.max(0, -Math.cos(phase)) * 0.9;
    const thighLen = 11;
    const shinLen = 11;
    const kneeX = hipX + Math.sin(kneeAngle) * thighLen;
    const kneeY = hipY + Math.cos(kneeAngle) * thighLen;
    const footX = kneeX + Math.sin(shinAngle) * shinLen;
    const footY = Math.min(ry, kneeY + Math.cos(shinAngle) * shinLen);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(footX, footY);
    ctx.stroke();
  };

  drawLeg(sim.runnerLegPhase + Math.PI, '#94A3B8'); // back leg
  drawLeg(sim.runnerLegPhase, '#F1F5F9'); // front leg

  // Torso, pumping arm & helmeted visor head
  ctx.save();
  ctx.translate(runnerX, ry - 21);
  ctx.rotate(sim.runnerLean);

  // Back pumping arm
  const armSwing = Math.sin(sim.runnerLegPhase + Math.PI) * 9;
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(armSwing, -4);
  ctx.stroke();

  // Torso jacket
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 5.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -17);
  ctx.stroke();

  // Front pumping arm
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(-armSwing, -5);
  ctx.stroke();

  // Helmet + glowing emerald visor
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.arc(1, -24, 6.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#10B981';
  ctx.fillRect(3, -26, 6, 3);
  ctx.restore();

  drawWorldCornerTelemetry(
    ctx,
    w,
    'SKYLINE RUNNER',
    `DISTANCE ${Math.round(bridge.progress * 100)}%`
  );
}

/* ============================================================================
 * 2. SPEED RUSH -> NITRO HIGHWAY (ZERO-OVERLAP OVERTAKING & REALISTIC CARS)
 * ============================================================================ */
function renderNitroHighway(
  ctx: CanvasRenderingContext2D,
  sim: WorldSimState,
  bridge: GameVisualBridge,
  w: number,
  h: number
) {
  const isPlaying = bridge.gameState === 'playing' && !bridge.waitingFirstKey;
  const speedKmh = computeNitroSpeedKmh(bridge.wpm, bridge.combo, isPlaying);
  const roadW = Math.min(w * 0.62, 420);
  const roadLeft = (w - roadW) / 2;
  const laneW = roadW / 3;

  // Textured highway shoulders
  ctx.fillStyle = '#090D16';
  ctx.fillRect(0, 0, roadLeft - 10, h);
  ctx.fillRect(roadLeft + roadW + 10, 0, w - (roadLeft + roadW + 10), h);

  // Asphalt deck with subtle center tire-wear shading
  const asphaltGrad = ctx.createLinearGradient(roadLeft, 0, roadLeft + roadW, 0);
  asphaltGrad.addColorStop(0, '#0C111C');
  asphaltGrad.addColorStop(0.5, '#121929');
  asphaltGrad.addColorStop(1, '#0C111C');
  ctx.fillStyle = asphaltGrad;
  ctx.fillRect(roadLeft, 0, roadW, h);

  // Scrolling roadside streetlamp poles casting warm amber pools onto the asphalt
  const poleSpacing = 150;
  const poleOff = (sim.scroll * 2.2) % poleSpacing;
  for (let py = -poleOff; py < h + poleSpacing; py += poleSpacing) {
    // Left & right warm road glow pools
    for (const side of [0, 1]) {
      const gx = side === 0 ? roadLeft + 18 : roadLeft + roadW - 18;
      const pool = ctx.createRadialGradient(gx, py, 4, gx, py, 64);
      pool.addColorStop(0, 'rgba(245, 158, 11, 0.14)');
      pool.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = pool;
      ctx.fillRect(gx - 64, py - 64, 128, 128);

      // Lamp post housing outside guardrail
      const px = side === 0 ? roadLeft - 18 : roadLeft + roadW + 12;
      ctx.fillStyle = '#334155';
      ctx.fillRect(px, py - 2, 6, 4);
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(side === 0 ? roadLeft - 12 : roadLeft + roadW + 12, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Outer metallic guardrails with reflector chevrons
  ctx.fillStyle = '#253147';
  ctx.fillRect(roadLeft - 10, 0, 10, h);
  ctx.fillRect(roadLeft + roadW, 0, 10, h);
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(roadLeft - 2, 0, 2, h);
  ctx.fillRect(roadLeft + roadW, 0, 2, h);

  // Scrolling dashed lane markings
  const dashPeriod = 54;
  const dashOff = (sim.scroll * 2.25) % dashPeriod;
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.32)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([24, 30]);
  ctx.lineDashOffset = -dashOff;
  for (let l = 1; l <= 2; l++) {
    const lx = roadLeft + laneW * l;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, h);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // High-speed slipstream wind lines along shoulders
  if (speedKmh > 110) {
    ctx.strokeStyle =
      bridge.combo >= 15 ? 'rgba(56, 189, 248, 0.32)' : 'rgba(245, 158, 11, 0.22)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const sideX = i % 2 === 0 ? roadLeft - 28 - i * 11 : roadLeft + roadW + 28 + i * 11;
      const sy = ((sim.scroll * 3.6 + i * 79) % (h + 80)) - 40;
      ctx.beginPath();
      ctx.moveTo(sideX, sy);
      ctx.lineTo(sideX, sy + 38);
      ctx.stroke();
    }
  }

  // Rival traffic vehicles (strictly spaced, zero overlap)
  for (const r of sim.nitro.rivals) {
    const rx = roadLeft + laneW * r.lane + laneW / 2;
    const ry = r.yNorm * h;
    drawRealisticCarSprite(ctx, {
      x: rx,
      y: ry,
      tiltRad: 0,
      bodyColor: r.color,
      accentColor: r.accentColor,
      isPlayer: false,
      nitroPower: 0,
      overdrive: false,
      braking: false,
      turnSignalDir: 0,
      time: sim.time,
    });
  }

  // Player Turbo Coupe with realistic steering tilt, turn signals & brake/skid VFX
  const carX = roadLeft + laneW * 1.5 + sim.nitro.carXNorm * laneW;
  const carY = h * PLAYER_Y_NORM;
  const isOverdrive = bridge.combo >= 15;

  // Dual tire skid marks trailing behind rear wheels on mistype brake check
  if (sim.nitro.skidTimer > 0) {
    ctx.save();
    ctx.strokeStyle = `rgba(15, 23, 42, ${Math.min(0.85, sim.nitro.skidTimer * 2.5)})`;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(carX - 12, carY + 24);
    ctx.lineTo(carX - 12, carY + 56);
    ctx.moveTo(carX + 12, carY + 24);
    ctx.lineTo(carX + 12, carY + 56);
    ctx.stroke();
    ctx.restore();
  }

  // Aerodynamic overtake slipstream ribbons flanking fenders on clean pass
  if (sim.nitro.overtakeFlashTimer > 0) {
    ctx.save();
    ctx.strokeStyle = `rgba(56, 189, 248, ${sim.nitro.overtakeFlashTimer * 1.4})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(carX - 24, carY - 18);
    ctx.lineTo(carX - 26, carY + 34);
    ctx.moveTo(carX + 24, carY - 18);
    ctx.lineTo(carX + 26, carY + 34);
    ctx.stroke();
    ctx.restore();
  }

  drawRealisticCarSprite(ctx, {
    x: carX,
    y: carY,
    tiltRad: sim.nitro.carTiltRad,
    bodyColor: '#F59E0B',
    accentColor: '#FEF3C7',
    isPlayer: true,
    nitroPower: Math.max(sim.nitro.nitroFlare, isOverdrive ? 0.85 : 0.28),
    overdrive: isOverdrive,
    braking: sim.nitro.brakeFlashTimer > 0,
    turnSignalDir: sim.nitro.turnSignalTimer > 0 ? sim.nitro.turnSignalDir : 0,
    time: sim.time,
  });

  // Active target word floating cleanly ahead of player lane
  if (bridge.activeWord.currentWord) {
    drawTacticalWordTarget(
      ctx,
      carX,
      Math.max(54, carY - 82),
      bridge.activeWord,
      isOverdrive ? '#38BDF8' : '#F59E0B'
    );
  }

  drawWorldCornerTelemetry(
    ctx,
    w,
    'NITRO HIGHWAY',
    `${speedKmh} KM/H · PASSES ${sim.nitro.overtakeCount} · x${bridge.combo}`
  );
}

interface CarSpriteParams {
  x: number;
  y: number;
  tiltRad: number;
  bodyColor: string;
  accentColor: string;
  isPlayer: boolean;
  nitroPower: number;
  overdrive: boolean;
  braking: boolean;
  turnSignalDir: -1 | 0 | 1;
  time: number;
}

function drawRealisticCarSprite(ctx: CanvasRenderingContext2D, p: CarSpriteParams) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.tiltRad);

  // Soft ground drop shadow (offsets subtly with steering tilt for grounded depth)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.roundRect(-20 + p.tiltRad * 14, -27, 40, 62, 12);
  ctx.fill();

  // Headlight beams
  if (p.isPlayer) {
    const cone = ctx.createLinearGradient(0, -30, 0, -118);
    cone.addColorStop(0, 'rgba(254, 243, 199, 0.30)');
    cone.addColorStop(1, 'rgba(254, 243, 199, 0)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(-14, -28);
    ctx.lineTo(-36, -116);
    ctx.lineTo(36, -116);
    ctx.lineTo(14, -28);
    ctx.closePath();
    ctx.fill();
  } else {
    const rivalGlow = ctx.createLinearGradient(0, -28, 0, -64);
    rivalGlow.addColorStop(0, 'rgba(226, 232, 240, 0.14)');
    rivalGlow.addColorStop(1, 'rgba(226, 232, 240, 0)');
    ctx.fillStyle = rivalGlow;
    ctx.beginPath();
    ctx.moveTo(-12, -26);
    ctx.lineTo(-22, -62);
    ctx.lineTo(22, -62);
    ctx.lineTo(12, -26);
    ctx.closePath();
    ctx.fill();
  }

  // Twin afterburner exhaust plumes for player coupe
  if (p.isPlayer && p.nitroPower > 0.05 && !p.braking) {
    const flicker = 0.88 + Math.sin(p.time * 48) * 0.14;
    const flameH = (16 + p.nitroPower * 28) * flicker;
    ctx.fillStyle = p.overdrive ? '#38BDF8' : '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(-10, 29);
    ctx.lineTo(-6, 29 + flameH);
    ctx.lineTo(-2, 29);
    ctx.moveTo(2, 29);
    ctx.lineTo(6, 29 + flameH);
    ctx.lineTo(10, 29);
    ctx.fill();

    // Hot white-gold inner core
    ctx.fillStyle = '#FEF9C3';
    ctx.beginPath();
    ctx.moveTo(-8, 29);
    ctx.lineTo(-6, 29 + flameH * 0.52);
    ctx.lineTo(-4, 29);
    ctx.moveTo(4, 29);
    ctx.lineTo(6, 29 + flameH * 0.52);
    ctx.lineTo(8, 29);
    ctx.fill();
  }

  // Rubber tires tucked into wheel arches
  ctx.fillStyle = '#090D16';
  ctx.fillRect(-19, -20, 4, 13);
  ctx.fillRect(15, -20, 4, 13);
  ctx.fillRect(-19, 10, 4, 13);
  ctx.fillRect(15, 10, 4, 13);

  // Sculpted sports-coupe body with subtle metallic shading
  const bodyGrad = ctx.createLinearGradient(-18, 0, 18, 0);
  bodyGrad.addColorStop(0, p.bodyColor);
  bodyGrad.addColorStop(0.5, p.accentColor);
  bodyGrad.addColorStop(1, p.bodyColor);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(-14, -30);
  ctx.quadraticCurveTo(0, -34, 14, -30);
  ctx.lineTo(18, -14);
  ctx.lineTo(18, 22);
  ctx.quadraticCurveTo(18, 30, 12, 30);
  ctx.lineTo(-12, 30);
  ctx.quadraticCurveTo(-18, 30, -18, 22);
  ctx.lineTo(-18, -14);
  ctx.closePath();
  ctx.fill();

  // Center racing stripe & hood aero vents
  ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
  ctx.fillRect(-3.5, -31, 7, 61);

  // Tinted panoramic windshield + rear glass
  ctx.fillStyle = '#0B1120';
  ctx.beginPath();
  ctx.roundRect(-12, -14, 24, 26, 6);
  ctx.fill();

  // Subtle roof reflection highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.beginPath();
  ctx.roundRect(-9, -6, 18, 11, 3);
  ctx.fill();

  // Side mirrors
  ctx.fillStyle = p.bodyColor;
  ctx.fillRect(-21, -8, 4, 5);
  ctx.fillRect(17, -8, 4, 5);

  // Rear carbon spoiler wing on player coupe
  if (p.isPlayer) {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-17, 23, 34, 4);
  }

  // Headlight LEDs
  ctx.fillStyle = '#FEF9C3';
  ctx.fillRect(-13, -30, 6, 2.5);
  ctx.fillRect(7, -30, 6, 2.5);

  // Taillights (intensify & cast red glow when braking)
  ctx.fillStyle = p.braking ? '#FF1E42' : '#F43F5E';
  ctx.fillRect(-14, 27, 9, 3);
  ctx.fillRect(5, 27, 9, 3);
  if (p.braking) {
    ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 32, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Blinking amber turn-signal indicator during lane changes
  if (p.turnSignalDir !== 0 && Math.floor(p.time * 14) % 2 === 0) {
    const sx = p.turnSignalDir > 0 ? 15 : -19;
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(sx, -25, 4, 5);
    ctx.fillRect(sx, 22, 4, 5);
  }

  ctx.restore();
}

/* ============================================================================
 * 3. ACCURACY MASTER -> ORBITAL AEGIS (CURVED INTERCEPTORS & TURRET RECOIL)
 * ============================================================================ */
function renderOrbitalAegis(
  ctx: CanvasRenderingContext2D,
  sim: WorldSimState,
  bridge: GameVisualBridge,
  w: number,
  h: number
) {
  // Multi-layer starfield
  for (const s of sim.stars) {
    ctx.fillStyle = s.r > 1.5 ? 'rgba(226, 232, 240, 0.78)' : 'rgba(148, 163, 184, 0.44)';
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Curved planetary atmosphere arc along bottom
  const planetGrad = ctx.createRadialGradient(
    w * 0.5,
    h * 1.48,
    h * 0.52,
    w * 0.5,
    h * 1.48,
    h * 0.72
  );
  planetGrad.addColorStop(0, 'rgba(16, 185, 129, 0.24)');
  planetGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = planetGrad;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);

  ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 1.65, h * 0.85, Math.PI * 1.25, Math.PI * 1.75);
  ctx.stroke();

  const turretX = w * 0.5;
  const turretY = h * 0.82;
  const droneX = w * sim.droneXNorm;
  const droneY = h * sim.droneYNorm;

  // Curved glowing ion thruster trail behind interceptor
  if (sim.droneTrail.length > 2) {
    for (let i = 1; i < sim.droneTrail.length; i++) {
      const frac = i / sim.droneTrail.length;
      ctx.strokeStyle = `rgba(244, 63, 94, ${frac * 0.35})`;
      ctx.lineWidth = 1.5 + frac * 3;
      ctx.beginPath();
      ctx.moveTo(sim.droneTrail[i - 1].x * w, sim.droneTrail[i - 1].y * h);
      ctx.lineTo(sim.droneTrail[i].x * w, sim.droneTrail[i].y * h);
      ctx.stroke();
    }
  }

  // Target lock-on interceptor
  const wordLen = Math.max(1, bridge.activeWord.currentWord.length);
  const droneHpFrac = Math.max(0, 1 - bridge.activeWord.currentWordTyped.length / wordLen);

  // Rotating emerald targeting reticle
  ctx.save();
  ctx.translate(droneX, droneY);
  ctx.rotate(sim.time * 0.9);
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.58)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Banking swept-wing Orbital Interceptor
  const bankAngle = Math.max(-0.28, Math.min(0.28, sim.droneVx * 0.65));
  ctx.save();
  ctx.translate(droneX, droneY);
  ctx.rotate(bankAngle);

  ctx.fillStyle = sim.droneHitFlash > 0 ? '#FFFFFF' : '#1E293B';
  ctx.strokeStyle = sim.droneHitFlash > 0 ? '#34D399' : '#F43F5E';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 18); // nose pointing downward toward turret
  ctx.lineTo(10, 4);
  ctx.lineTo(28, -8); // right swept wing
  ctx.lineTo(22, -16);
  ctx.lineTo(8, -10);
  ctx.lineTo(0, -18);
  ctx.lineTo(-8, -10);
  ctx.lineTo(-22, -16);
  ctx.lineTo(-28, -8); // left swept wing
  ctx.lineTo(-10, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing reactor eye + twin rear thruster ports
  ctx.fillStyle = '#F43F5E';
  ctx.beginPath();
  ctx.arc(0, 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(-7, -16, 4, 3);
  ctx.fillRect(3, -16, 4, 3);

  ctx.restore();

  // Mini HP bar below interceptor
  ctx.fillStyle = '#090C12';
  ctx.fillRect(droneX - 22, droneY + 24, 44, 4);
  ctx.fillStyle = '#10B981';
  ctx.fillRect(droneX - 22, droneY + 24, 44 * droneHpFrac, 4);

  if (bridge.activeWord.currentWord) {
    drawTacticalWordTarget(ctx, droneX, droneY - 40, bridge.activeWord, '#10B981');
  }

  // 5-Segment Orbital Integrity Shield Arc with directional impact ripple
  const maxShield = bridge.errorBudget ?? 5;
  const remaining = Math.max(0, maxShield - bridge.errors);
  const startAng = Math.PI * 1.12;
  const totalSpan = Math.PI * 0.76;
  const segSpan = totalSpan / maxShield;

  for (let i = 0; i < maxShield; i++) {
    const a1 = startAng + i * segSpan + 0.04;
    const a2 = startAng + (i + 1) * segSpan - 0.04;
    const intact = i < remaining;
    const justHit = i === sim.shieldHitSegment && sim.shieldHitTimer > 0;

    if (justHit) {
      ctx.strokeStyle = `rgba(244, 63, 94, ${Math.min(1, sim.shieldHitTimer * 2)})`;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(turretX, turretY, 44 + (0.55 - sim.shieldHitTimer) * 14, a1, a2);
      ctx.stroke();
    }

    ctx.strokeStyle = intact ? '#10B981' : 'rgba(244, 63, 94, 0.25)';
    ctx.lineWidth = intact ? 5.5 : 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(turretX, turretY, 44, a1, a2);
    ctx.stroke();
  }

  // Orbital Turret tracking active interceptor with physical barrel recoil & muzzle flash
  const angle = Math.atan2(droneY - turretY, droneX - turretX);
  const recoilPx = sim.turretRecoil * 6.5;

  ctx.save();
  ctx.translate(turretX, turretY);
  ctx.rotate(angle + Math.PI / 2);

  // Twin recoiling laser barrels
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(-7.5, -29 + recoilPx, 4.5, 22);
  ctx.fillRect(3, -29 + recoilPx, 4.5, 22);

  // Muzzle flash flare on fire
  if (sim.turretMuzzleFlash > 0) {
    ctx.fillStyle = 'rgba(52, 211, 153, 0.85)';
    ctx.beginPath();
    ctx.arc(-5, -31 + recoilPx, 5.5, 0, Math.PI * 2);
    ctx.arc(5, -31 + recoilPx, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Armored turret housing
  ctx.fillStyle = '#1E293B';
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawWorldCornerTelemetry(
    ctx,
    w,
    'ORBITAL AEGIS',
    `SHIELD ${remaining}/${maxShield} · ACC ${bridge.accuracy.toFixed(1)}%`
  );
}

/* ============================================================================
 * 4. RHYTHM MODE -> SYNTHWAVE PULSE (3D PERSPECTIVE NOTES & RECEPTOR PADS)
 * ============================================================================ */
function renderSynthwavePulse(
  ctx: CanvasRenderingContext2D,
  sim: WorldSimState,
  bridge: GameVisualBridge,
  w: number,
  h: number
) {
  const horizonY = h * 0.34;
  const strikeY = h * 0.78;

  // 24-Bar Reactive Audio Equalizer Skyline with glowing peak-hold pips
  const eqWidth = Math.min(w * 0.72, 580);
  const eqLeft = (w - eqWidth) / 2;
  const barStep = eqWidth / sim.eqBars.length;

  for (let i = 0; i < sim.eqBars.length; i++) {
    const val = sim.eqBars[i];
    const peak = sim.eqPeaks[i];
    const bh = val * (horizonY * 0.78);
    const peakY = horizonY - peak * (horizonY * 0.78);
    const bx = eqLeft + i * barStep + 2;
    const bw = Math.max(4, barStep - 4);
    const grad = ctx.createLinearGradient(bx, horizonY - bh, bx, horizonY);
    grad.addColorStop(0, '#F59E0B');
    grad.addColorStop(1, '#10B981');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, horizonY - bh, bw, bh);

    // Peak-hold cap indicator
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(bx, peakY - 3, bw, 2.5);
  }

  // Horizon baseline
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(w, horizonY);
  ctx.stroke();

  // Perspective 4-lane beat highway
  const topTrackW = Math.min(w * 0.24, 180);
  const botTrackW = Math.min(w * 0.66, 540);
  const topLeft = (w - topTrackW) / 2;
  const botLeft = (w - botTrackW) / 2;

  ctx.fillStyle = 'rgba(11, 16, 28, 0.86)';
  ctx.beginPath();
  ctx.moveTo(topLeft, horizonY);
  ctx.lineTo(topLeft + topTrackW, horizonY);
  ctx.lineTo(botLeft + botTrackW, h);
  ctx.lineTo(botLeft, h);
  ctx.closePath();
  ctx.fill();

  // Vertical translucent light column flashes per active lane
  for (let l = 0; l < 4; l++) {
    const flash = sim.padFlash[l];
    if (flash <= 0.02) continue;
    const tL = topLeft + (topTrackW / 4) * l;
    const tR = topLeft + (topTrackW / 4) * (l + 1);
    const bL = botLeft + (botTrackW / 4) * l;
    const bR = botLeft + (botTrackW / 4) * (l + 1);
    const colGrad = ctx.createLinearGradient(0, horizonY, 0, strikeY);
    colGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
    colGrad.addColorStop(1, `rgba(16, 185, 129, ${flash * 0.26})`);
    ctx.fillStyle = colGrad;
    ctx.beginPath();
    ctx.moveTo(tL, horizonY);
    ctx.lineTo(tR, horizonY);
    ctx.lineTo(bR, h);
    ctx.lineTo(bL, h);
    ctx.closePath();
    ctx.fill();
  }

  // Converging lane rails
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.26)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 4; i++) {
    const tx = topLeft + (topTrackW / 4) * i;
    const bx = botLeft + (botTrackW / 4) * i;
    ctx.beginPath();
    ctx.moveTo(tx, horizonY);
    ctx.lineTo(bx, h);
    ctx.stroke();
  }

  // Scrolling horizontal beat bars
  for (let b = 0; b < 5; b++) {
    const p = (b / 5 + sim.beatPhase * 0.2) % 1;
    const y = horizonY + p * p * (h - horizonY);
    const frac = (y - horizonY) / (h - horizonY);
    const curW = topTrackW + (botTrackW - topTrackW) * frac;
    ctx.strokeStyle = `rgba(16, 185, 129, ${0.12 + frac * 0.22})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo((w - curW) / 2, y);
    ctx.lineTo((w + curW) / 2, y);
    ctx.stroke();
  }

  // Real 3D-perspective scrolling beat note blocks gliding down the 4 lanes
  for (const n of sim.rhythmNotes) {
    if (n.hit) continue;
    const persp = n.progress * n.progress;
    const ny = horizonY + persp * (strikeY - horizonY);
    const frac = Math.max(0, (ny - horizonY) / (h - horizonY));
    const trackWAtY = topTrackW + (botTrackW - topTrackW) * frac;
    const leftAtY = (w - trackWAtY) / 2;
    const laneWAtY = trackWAtY / 4;
    const noteW = laneWAtY * 0.68;
    const noteH = 4 + frac * 9;
    const nx = leftAtY + laneWAtY * n.lane + (laneWAtY - noteW) / 2;
    const alpha = n.progress > 1 ? Math.max(0, 1 - (n.progress - 1) * 6) : Math.min(1, n.progress * 3);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = n.accent ? '#F59E0B' : '#10B981';
    ctx.beginPath();
    ctx.roundRect(nx, ny - noteH / 2, noteW, noteH, 3);
    ctx.fill();
    ctx.fillStyle = '#FEF9C3';
    ctx.fillRect(nx + 4, ny - 1, noteW - 8, 2);
    ctx.restore();
  }

  // Strike Line & 4 Physically Depressing Receptor Pads
  const strikeFrac = (strikeY - horizonY) / (h - horizonY);
  const strikeW = topTrackW + (botTrackW - topTrackW) * strikeFrac;
  const strikeLeft = (w - strikeW) / 2;
  const padStep = strikeW / 4;

  ctx.strokeStyle = sim.syncGlow > 0.1 ? '#34D399' : 'rgba(16, 185, 129, 0.65)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(strikeLeft, strikeY);
  ctx.lineTo(strikeLeft + strikeW, strikeY);
  ctx.stroke();

  for (let i = 0; i < 4; i++) {
    const px = strikeLeft + padStep * i + padStep / 2;
    const press = sim.padDepression[i];
    const flash = sim.padFlash[i];
    const py = strikeY + press * 4.5;

    ctx.fillStyle = flash > 0.1 ? '#10B981' : '#182234';
    ctx.strokeStyle = flash > 0.1 ? '#FDE68A' : '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(px, py, padStep * 0.28, 8 - press * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Pulsing Tempo Metronome Ring at center track
  const pulseRadius = 18 + Math.sin(sim.beatPhase * Math.PI) * 14;
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.48)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w * 0.5, horizonY + (strikeY - horizonY) * 0.45, pulseRadius, 0, Math.PI * 2);
  ctx.stroke();

  if (bridge.activeWord.currentWord) {
    drawTacticalWordTarget(
      ctx,
      w * 0.5,
      horizonY + (strikeY - horizonY) * 0.45,
      bridge.activeWord,
      '#10B981'
    );
  }

  drawWorldCornerTelemetry(
    ctx,
    w,
    'SYNTHWAVE PULSE',
    `SYNC ${bridge.rhythmScore}% · ${bridge.wpm.toFixed(0)} WPM`
  );
}

/* ============================================================================
 * 5. CHALLENGE & DAILY -> TITAN SIEGE (PROGRESSIVE HULL DAMAGE & RAILGUN HEAT)
 * ============================================================================ */
function renderTitanSiege(
  ctx: CanvasRenderingContext2D,
  sim: WorldSimState,
  bridge: GameVisualBridge,
  w: number,
  h: number
) {
  // Rising volcanic embers
  for (const e of sim.embers) {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.beginPath();
    ctx.arc(e.x * w, e.y * h, e.r, 0, Math.PI * 2);
    ctx.fill();
  }

  const hpPct = computeBossHpPercent(bridge.progress);
  const bossX = w * 0.5 + Math.sin(sim.time * 1.25) * Math.min(72, w * 0.08);
  const bossY = h * 0.32 + Math.cos(sim.time * 2.1) * 5;

  // Boss HP Header Bar with 25% armor-plate segment ticks
  const barW = Math.min(340, w * 0.56);
  const barX = (w - barW) / 2;
  const barY = 18;

  ctx.fillStyle = '#090C12';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, 12, 6);
  ctx.fill();
  ctx.stroke();

  const hpColor = hpPct > 50 ? '#F59E0B' : hpPct > 25 ? '#FB7185' : '#F43F5E';
  ctx.fillStyle = hpColor;
  ctx.beginPath();
  ctx.roundRect(barX + 1.5, barY + 1.5, Math.max(0, (barW - 3) * (hpPct / 100)), 9, 4.5);
  ctx.fill();

  // Segment notches at 25%, 50%, 75%
  ctx.strokeStyle = 'rgba(9, 12, 18, 0.75)';
  ctx.lineWidth = 1.5;
  for (const frac of [0.25, 0.5, 0.75]) {
    const tx = barX + barW * frac;
    ctx.beginPath();
    ctx.moveTo(tx, barY + 1);
    ctx.lineTo(tx, barY + 11);
    ctx.stroke();
  }

  ctx.font = '700 10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = '#E2E8F0';
  ctx.textAlign = 'center';
  ctx.fillText(`TITAN DREADNOUGHT HULL: ${hpPct}%`, w * 0.5, barY + 24);

  // Render Armored Boss Dreadnought with progressive physical damage states
  if (!sim.bossDestroyed) {
    ctx.save();
    ctx.translate(bossX, bossY);

    // Outer armored wings
    ctx.fillStyle = sim.bossHitFlash > 0 ? '#FEF3C7' : '#1E293B';
    ctx.strokeStyle = sim.bossHitFlash > 0 ? '#F59E0B' : '#475569';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(96, -8);
    ctx.lineTo(114, 16);
    ctx.lineTo(52, 26);
    ctx.lineTo(0, 34);
    ctx.lineTo(-52, 26);
    ctx.lineTo(-114, 16);
    ctx.lineTo(-96, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Progressive hull damage fractures & glowing molten vents (<75%, <50%, <25%)
    if (hpPct <= 75) {
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-72, -2);
      ctx.lineTo(-54, 10);
      ctx.lineTo(-42, 6);
      ctx.stroke();
    }
    if (hpPct <= 50) {
      ctx.strokeStyle = '#FB7185';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(74, -1);
      ctx.lineTo(56, 12);
      ctx.lineTo(40, 8);
      ctx.stroke();
      // Rising smoke plume from right wing bay
      const smokeY = -12 - ((sim.time * 28) % 24);
      ctx.fillStyle = 'rgba(100, 116, 139, 0.38)';
      ctx.beginPath();
      ctx.arc(58, smokeY, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    if (hpPct <= 25) {
      // Critical flickering electric hull arcs across core
      if (Math.floor(sim.time * 16) % 2 === 0) {
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-24, -10);
        ctx.lineTo(-8, 2);
        ctx.lineTo(12, -6);
        ctx.lineTo(28, 12);
        ctx.stroke();
      }
      const smokeY2 = -14 - ((sim.time * 34 + 10) % 26);
      ctx.fillStyle = 'rgba(244, 63, 94, 0.32)';
      ctx.beginPath();
      ctx.arc(-52, smokeY2, 11, 0, Math.PI * 2);
      ctx.fill();
    }

    // Inner Reactor Core
    const corePulse = 0.65 + 0.35 * Math.sin(sim.time * (hpPct <= 25 ? 14 : 6));
    ctx.fillStyle = `rgba(244, 63, 94, ${corePulse})`;
    ctx.beginPath();
    ctx.arc(0, 6, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.arc(0, 6, 6, 0, Math.PI * 2);
    ctx.fill();

    // Twin side weapon pods with charging crimson plasma glow on counter-fire
    const podColor = sim.bossChargeGlow > 0.1 ? '#F43F5E' : '#F59E0B';
    ctx.fillStyle = podColor;
    ctx.fillRect(-68, 4, 14, 8);
    ctx.fillRect(54, 4, 14, 8);
    if (sim.bossChargeGlow > 0.1) {
      ctx.fillStyle = `rgba(244, 63, 94, ${sim.bossChargeGlow * 0.6})`;
      ctx.beginPath();
      ctx.arc(-61, 10, 12 * sim.bossChargeGlow, 0, Math.PI * 2);
      ctx.arc(61, 10, 12 * sim.bossChargeGlow, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    if (bridge.activeWord.currentWord) {
      drawTacticalWordTarget(ctx, bossX, bossY + 56, bridge.activeWord, '#F59E0B');
    }
  }

  // Tumbling broken armor debris chunks
  for (const d of sim.bossDebris) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, d.life / d.maxLife);
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size * 0.7);
    ctx.strokeRect(-d.size / 2, -d.size / 2, d.size, d.size * 0.7);
    ctx.restore();
  }

  // Player Railgun Battery with physical barrel recoil & thermal coil glow
  const cannonX = w * 0.5;
  const cannonY = h * 0.85;
  const aimAngle = Math.atan2(bossY - cannonY, bossX - cannonX);
  const recoilPx = sim.railgunRecoil * 7;

  ctx.save();
  ctx.translate(cannonX, cannonY);
  ctx.rotate(aimAngle + Math.PI / 2);

  // Recoiling twin railgun rails
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(-6.5, -32 + recoilPx, 4, 24);
  ctx.fillRect(2.5, -32 + recoilPx, 4, 24);

  // Thermal accelerator core glowing amber/white as combo builds
  ctx.fillStyle = sim.railgunHeat > 0.55 ? '#FDE68A' : '#F59E0B';
  ctx.fillRect(-2, -30 + recoilPx, 4, 22);

  // Armored turret base
  ctx.fillStyle = '#1E293B';
  ctx.strokeStyle = sim.railgunHeat > 0.6 ? '#FDE68A' : '#F59E0B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-21, -10, 42, 22, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  drawWorldCornerTelemetry(ctx, w, 'TITAN SIEGE', `BOSS HULL ${hpPct}%`);
}

function drawWorldCornerTelemetry(
  ctx: CanvasRenderingContext2D,
  w: number,
  worldTitle: string,
  metric: string
) {
  ctx.save();
  ctx.font = '700 11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(226, 232, 240, 0.76)';
  ctx.fillText(worldTitle, 16, 22);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(245, 158, 11, 0.92)';
  ctx.fillText(metric, w - 16, 22);
  ctx.restore();
}
