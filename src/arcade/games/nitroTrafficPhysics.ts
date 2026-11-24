/**
 * Pure, deterministic collision-free traffic & smart overtaking physics for Nitro Highway (Speed Rush).
 * Guarantees zero player-vs-rival and zero rival-vs-rival bounding-box overlaps across all speeds and events.
 */

export const PLAYER_Y_NORM = 0.72;
export const CAR_HALF_H_NORM = 0.12;
export const MIN_PLAYER_RIVAL_Y_GAP = 0.27; // Strict vertical bumper-to-bumper clearance (> 2 * CAR_HALF_H_NORM)
export const MIN_SAME_LANE_RIVAL_GAP = 0.36; // Strict vertical gap between rivals in the same lane
export const LATERAL_OVERLAP_THRESHOLD = 0.66; // Lane-space distance below which two vehicles overlap horizontally

export interface NitroRival {
  id: number;
  lane: number; // 0, 1, 2
  yNorm: number; // normalized vertical canvas position (0 = top, 1 = bottom)
  color: string;
  accentColor: string;
  speed: number;
  passedByPlayer: boolean;
}

export interface NitroTrafficState {
  carLane: number; // target discrete lane: 0, 1, 2
  carXNorm: number; // smooth continuous lateral position in [-1, 1] (lane - 1)
  carVx: number; // lateral velocity in lane-units/sec
  carTiltRad: number; // realistic chassis steering bank angle in radians
  nitroFlare: number;
  turnSignalDir: -1 | 0 | 1;
  turnSignalTimer: number;
  brakeFlashTimer: number;
  skidTimer: number;
  overtakeFlashTimer: number;
  overtakeCount: number;
  rivals: NitroRival[];
}

const RIVAL_PALETTE: Array<{ body: string; accent: string }> = [
  { body: '#38BDF8', accent: '#BAE6FD' },
  { body: '#94A3B8', accent: '#E2E8F0' },
  { body: '#F43F5E', accent: '#FDA4AF' },
  { body: '#818CF8', accent: '#C7D2FE' },
  { body: '#10B981', accent: '#A7F3D0' },
];

export function createInitialNitroTrafficState(): NitroTrafficState {
  return {
    carLane: 1,
    carXNorm: 0,
    carVx: 0,
    carTiltRad: 0,
    nitroFlare: 0,
    turnSignalDir: 0,
    turnSignalTimer: 0,
    brakeFlashTimer: 0,
    skidTimer: 0,
    overtakeFlashTimer: 0,
    overtakeCount: 0,
    rivals: [
      {
        id: 1,
        lane: 0,
        yNorm: 0.16,
        color: RIVAL_PALETTE[0].body,
        accentColor: RIVAL_PALETTE[0].accent,
        speed: 0.24,
        passedByPlayer: false,
      },
      {
        id: 2,
        lane: 2,
        yNorm: 0.52,
        color: RIVAL_PALETTE[1].body,
        accentColor: RIVAL_PALETTE[1].accent,
        speed: 0.21,
        passedByPlayer: false,
      },
      {
        id: 3,
        lane: 1,
        yNorm: -0.34,
        color: RIVAL_PALETTE[2].body,
        accentColor: RIVAL_PALETTE[2].accent,
        speed: 0.26,
        passedByPlayer: false,
      },
    ],
  };
}

/**
 * Returns true if the given discrete lane has no rival within the player's longitudinal safety band.
 */
export function isLaneClearForPlayer(
  rivals: NitroRival[],
  lane: number,
  playerYNorm: number = PLAYER_Y_NORM,
  aheadBuffer: number = 0.42,
  behindBuffer: number = 0.30
): boolean {
  for (const r of rivals) {
    if (r.lane !== lane) continue;
    if (r.yNorm >= playerYNorm - aheadBuffer && r.yNorm <= playerYNorm + behindBuffer) {
      return false;
    }
  }
  return true;
}

/**
 * Picks a safe, guaranteed-open lane for overtaking.
 * Only moves 1 lane at a time (adjacent step) so the player never cuts across an occupied center lane.
 */
export function pickSafeOvertakeLane(
  rivals: NitroRival[],
  currentLane: number,
  playerYNorm: number = PLAYER_Y_NORM,
  preferChange: boolean = true
): number {
  const adjacentLanes: number[] = [];
  if (currentLane === 1) {
    adjacentLanes.push(0, 2);
  } else {
    adjacentLanes.push(1);
  }

  // Score each adjacent candidate by clearance distance to nearest rival in that lane
  let bestLane = currentLane;
  let bestClearance = -1;

  for (const cand of adjacentLanes) {
    if (!isLaneClearForPlayer(rivals, cand, playerYNorm, 0.40, 0.30)) {
      continue;
    }
    let minDist = 2.0;
    for (const r of rivals) {
      if (r.lane !== cand) continue;
      minDist = Math.min(minDist, Math.abs(r.yNorm - playerYNorm));
    }
    if (minDist > bestClearance) {
      bestClearance = minDist;
      bestLane = cand;
    }
  }

  if (bestLane !== currentLane) {
    return bestLane;
  }

  // If no adjacent lane is open and caller wanted a change, hold current lane safely
  if (!preferChange) return currentLane;
  return currentLane;
}

/**
 * Requests an intentional overtake lane switch (e.g. on word_clear).
 * Returns true if a safe lane switch was initiated, false if holding current lane for turbo surge.
 */
export function requestWordClearOvertake(state: NitroTrafficState): boolean {
  const safeLane = pickSafeOvertakeLane(state.rivals, state.carLane, PLAYER_Y_NORM, true);
  if (safeLane !== state.carLane) {
    const dir = safeLane > state.carLane ? 1 : -1;
    state.carLane = safeLane;
    state.turnSignalDir = dir;
    state.turnSignalTimer = 0.55;
    return true;
  }
  return false;
}

/**
 * Finds a clean respawn lane & yNorm above the viewport that maintains vertical spacing
 * AND never creates an impassable 3-lane horizontal wall.
 */
function respawnRivalSafely(rival: NitroRival, allRivals: NitroRival[], playerLane: number, seed: number) {
  const others = allRivals.filter((o) => o.id !== rival.id);

  // Choose candidate lanes prioritizing lanes with the fewest upper rivals
  const laneOrder = [0, 1, 2].sort((a, b) => {
    const countA = others.filter((o) => o.lane === a).length;
    const countB = others.filter((o) => o.lane === b).length;
    if (countA !== countB) return countA - countB;
    // Slight bias away from spawning immediately in player's lane on tie
    if (a === playerLane) return 1;
    if (b === playerLane) return -1;
    return ((a + seed) % 3) - ((b + seed) % 3);
  });

  const chosenLane = laneOrder[0];
  let spawnY = -0.26 - ((seed * 17) % 24) / 100;

  // Guarantee strict same-lane separation from other rivals
  let adjusted = true;
  let guard = 0;
  while (adjusted && guard < 10) {
    adjusted = false;
    guard++;

    for (const o of others) {
      if (o.lane === chosenLane && Math.abs(o.yNorm - spawnY) < MIN_SAME_LANE_RIVAL_GAP) {
        spawnY = Math.min(spawnY, o.yNorm - MIN_SAME_LANE_RIVAL_GAP - 0.04);
        adjusted = true;
      }
    }

    // Prevent 3-lane horizontal wall: ensure at most 1 other lane has a rival within ±0.34 of spawnY
    const occupiedOtherLanes = new Set<number>();
    for (const o of others) {
      if (o.lane !== chosenLane && Math.abs(o.yNorm - spawnY) < 0.34) {
        occupiedOtherLanes.add(o.lane);
      }
    }
    if (occupiedOtherLanes.size >= 2) {
      spawnY -= 0.34;
      adjusted = true;
    }
  }

  const palette = RIVAL_PALETTE[Math.abs(seed + rival.id) % RIVAL_PALETTE.length];
  rival.lane = chosenLane;
  rival.yNorm = spawnY;
  rival.color = palette.body;
  rival.accentColor = palette.accent;
  rival.speed = 0.20 + ((seed * 7 + rival.id * 3) % 10) * 0.012;
  rival.passedByPlayer = false;
}

/**
 * Advances Nitro Highway traffic & player steering by dt seconds while enforcing strict no-overlap physics.
 */
export function stepNitroTraffic(
  state: NitroTrafficState,
  dt: number,
  wpm: number,
  isPlaying: boolean,
  stepSeed: number = 1
): void {
  const clampedDt = Math.min(0.05, Math.max(0.001, dt));
  const rivalFlow = isPlaying ? 0.55 + Math.min(1.55, wpm / 55) : 0.22;

  // Decay visual timers
  state.nitroFlare = Math.max(0, state.nitroFlare - clampedDt * 1.45);
  state.turnSignalTimer = Math.max(0, state.turnSignalTimer - clampedDt);
  if (state.turnSignalTimer <= 0) state.turnSignalDir = 0;
  state.brakeFlashTimer = Math.max(0, state.brakeFlashTimer - clampedDt);
  state.skidTimer = Math.max(0, state.skidTimer - clampedDt);
  state.overtakeFlashTimer = Math.max(0, state.overtakeFlashTimer - clampedDt);

  // 1. Advance rivals forward down the highway
  for (let i = 0; i < state.rivals.length; i++) {
    const r = state.rivals[i];
    const prevY = r.yNorm;
    r.yNorm += clampedDt * r.speed * rivalFlow * 2.1;

    // Track clean overtakes when a rival in another lane passes behind the player
    if (!r.passedByPlayer && prevY <= PLAYER_Y_NORM + 0.08 && r.yNorm > PLAYER_Y_NORM + 0.08) {
      r.passedByPlayer = true;
      if (isPlaying && Math.abs(state.carXNorm - (r.lane - 1)) >= LATERAL_OVERLAP_THRESHOLD) {
        state.overtakeCount += 1;
        state.overtakeFlashTimer = 0.35;
      }
    }

    if (r.yNorm > 1.24) {
      respawnRivalSafely(r, state.rivals, state.carLane, Math.floor(stepSeed + i * 13));
    }
  }

  // 2. Enforce rival-vs-rival same-lane spacing (sort bottom-most first so trailing cars brake cleanly)
  for (let lane = 0; lane < 3; lane++) {
    const laneRivals = state.rivals
      .filter((r) => r.lane === lane)
      .sort((a, b) => b.yNorm - a.yNorm); // largest yNorm (furthest down) first

    for (let i = 1; i < laneRivals.length; i++) {
      const ahead = laneRivals[i - 1];
      const trailing = laneRivals[i];
      const maxAllowedY = ahead.yNorm - MIN_SAME_LANE_RIVAL_GAP;
      if (trailing.yNorm > maxAllowedY) {
        trailing.yNorm = maxAllowedY;
        trailing.speed = Math.min(trailing.speed, ahead.speed);
      }
    }
  }

  // 3. Proactive Lookahead Overtaking:
  // If a rival in the player's current lane approaches ahead of the player, steer early into a verified open lane
  const approachingAhead = state.rivals.some(
    (r) =>
      r.lane === state.carLane &&
      r.yNorm >= PLAYER_Y_NORM - 0.54 &&
      r.yNorm < PLAYER_Y_NORM - 0.14
  );

  if (approachingAhead) {
    const safeLane = pickSafeOvertakeLane(state.rivals, state.carLane, PLAYER_Y_NORM, true);
    if (safeLane !== state.carLane) {
      const dir = safeLane > state.carLane ? 1 : -1;
      state.carLane = safeLane;
      state.turnSignalDir = dir;
      state.turnSignalTimer = 0.55;
    }
  }

  // 4. Smooth lateral steering with lateral collision guard (never side-swipe a car beside you)
  const targetXNorm = state.carLane - 1;
  const prevX = state.carXNorm;
  let desiredX = prevX + (targetXNorm - prevX) * Math.min(1, clampedDt * 11.5);

  for (const r of state.rivals) {
    if (Math.abs(r.yNorm - PLAYER_Y_NORM) < MIN_PLAYER_RIVAL_Y_GAP + 0.03) {
      const rx = r.lane - 1;
      const distAfter = Math.abs(desiredX - rx);
      if (distAfter < LATERAL_OVERLAP_THRESHOLD + 0.04) {
        // Rival is directly beside the player — hold outside its lateral envelope until clear
        if (prevX <= rx) {
          desiredX = Math.min(desiredX, rx - (LATERAL_OVERLAP_THRESHOLD + 0.04));
        } else {
          desiredX = Math.max(desiredX, rx + (LATERAL_OVERLAP_THRESHOLD + 0.04));
        }
        // Revert discrete target lane to safe side if we haven't crossed yet
        const safeSideLane = Math.max(0, Math.min(2, Math.round(desiredX + 1)));
        state.carLane = safeSideLane;
      }
    }
  }

  state.carXNorm = Math.max(-1, Math.min(1, desiredX));
  state.carVx = (state.carXNorm - prevX) / clampedDt;
  const targetTilt = Math.max(-0.22, Math.min(0.22, state.carVx * 0.065));
  state.carTiltRad += (targetTilt - state.carTiltRad) * Math.min(1, clampedDt * 16);

  // 5. Hard Anti-Overlap Bumper Safety Guard (guarantees 0 overlaps even under extreme speed spikes):
  // If any rival is within the player's lateral envelope, enforce strict bumper-to-bumper clearance
  for (const r of state.rivals) {
    const rx = r.lane - 1;
    if (Math.abs(state.carXNorm - rx) < LATERAL_OVERLAP_THRESHOLD) {
      const dy = r.yNorm - PLAYER_Y_NORM;
      if (Math.abs(dy) < MIN_PLAYER_RIVAL_Y_GAP) {
        if (dy <= 0) {
          // Rival is ahead of the player -> draft safely at clear bumper distance (never clip through!)
          r.yNorm = PLAYER_Y_NORM - MIN_PLAYER_RIVAL_Y_GAP - 0.015;
        } else {
          // Rival is behind the player -> clear safely behind rear bumper
          r.yNorm = PLAYER_Y_NORM + MIN_PLAYER_RIVAL_Y_GAP + 0.015;
        }
      }
    }
  }

  // Re-verify same-lane spacing in case a draft clamp pushed a rival upward near another rival behind it
  for (let lane = 0; lane < 3; lane++) {
    const laneRivals = state.rivals
      .filter((r) => r.lane === lane)
      .sort((a, b) => b.yNorm - a.yNorm);
    for (let i = 1; i < laneRivals.length; i++) {
      const ahead = laneRivals[i - 1];
      const trailing = laneRivals[i];
      if (trailing.yNorm > ahead.yNorm - MIN_SAME_LANE_RIVAL_GAP) {
        trailing.yNorm = ahead.yNorm - MIN_SAME_LANE_RIVAL_GAP;
      }
    }
  }
}

/**
 * Bounding-box overlap detector for QA verification: returns true if player car overlaps ANY rival.
 */
export function hasPlayerRivalOverlap(state: NitroTrafficState): boolean {
  for (const r of state.rivals) {
    const rx = r.lane - 1;
    const dx = Math.abs(state.carXNorm - rx);
    const dy = Math.abs(PLAYER_Y_NORM - r.yNorm);
    if (dx < LATERAL_OVERLAP_THRESHOLD && dy < CAR_HALF_H_NORM * 2) {
      return true;
    }
  }
  return false;
}

/**
 * Bounding-box overlap detector for QA verification: returns true if any two rivals overlap in the same lane.
 */
export function hasRivalRivalOverlap(rivals: NitroRival[]): boolean {
  for (let i = 0; i < rivals.length; i++) {
    for (let j = i + 1; j < rivals.length; j++) {
      if (rivals[i].lane !== rivals[j].lane) continue;
      if (Math.abs(rivals[i].yNorm - rivals[j].yNorm) < CAR_HALF_H_NORM * 2) {
        return true;
      }
    }
  }
  return false;
}
