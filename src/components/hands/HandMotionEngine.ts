import { useState, useEffect, useRef } from 'react';
import {
  FINGER_ANCHORS,
  HAND_GEOMETRY,
  FingerRenderPose,
  HandRenderPose,
  AnimationSpeedProfile,
  JointPositions,
} from './HandArchitectureTypes';

export interface KeyDef {
  id: string;
  char: string;
  displayTop?: string;
  displayMain: string;
  row: number;
  x: number;
  y: number;
  w: number;
  h: number;
  finger: string;
  hand: 'left' | 'right' | 'both';
  isModifier?: boolean;
}

export interface ComputeHandPoseParams {
  activeFinger: string | 'none';
  targetKeyDef: KeyDef | null;
  requiresShift?: boolean;
  shiftFinger?: string | 'none';
  shiftKeyDef?: KeyDef | null;
  pressedKey: string | null;
  lastResult?: 'correct' | 'incorrect' | null;
  speedProfile?: AnimationSpeedProfile;
  keyStrokeCount?: number;
  keys?: KeyDef[];
  enabled?: boolean;
}

interface ActiveStrike {
  finger: string;
  targetX: number;
  targetY: number;
  startTime: number;
  durationMs: number;
  isCorrect: boolean;
}

// Biological tendon coupling matrix (gentle adjacent-finger sympathy)
const TENDON_COUPLING: Record<string, Record<string, number>> = {
  left_index: { left_middle: 0.16, left_ring: 0.05 },
  left_middle: { left_index: 0.14, left_ring: 0.18, left_pinky: 0.04 },
  left_ring: { left_middle: 0.20, left_pinky: 0.22 },
  left_pinky: { left_ring: 0.24, left_middle: 0.08 },
  left_thumb: { left_index: 0.04 },

  right_index: { right_middle: 0.16, right_ring: 0.05 },
  right_middle: { right_index: 0.14, right_ring: 0.18, right_pinky: 0.04 },
  right_ring: { right_middle: 0.20, right_pinky: 0.22 },
  right_pinky: { right_ring: 0.24, right_middle: 0.08 },
  right_thumb: { right_index: 0.04 },
};

interface FingerMassProfile {
  mTip: number;
}

const FINGER_MASS: Record<string, FingerMassProfile> = {
  left_pinky: { mTip: 0.80 },
  left_ring: { mTip: 0.92 },
  left_middle: { mTip: 1.05 },
  left_index: { mTip: 0.96 },
  left_thumb: { mTip: 1.15 },
  right_thumb: { mTip: 1.15 },
  right_index: { mTip: 0.96 },
  right_middle: { mTip: 1.05 },
  right_ring: { mTip: 0.92 },
  right_pinky: { mTip: 0.80 },
};

interface FingerPhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  elevation: number;
  vElevation: number;
  squash: number;
  vSquash: number;
}

interface HandPhysicsState {
  tilt: number;
  vTilt: number;
  palmDx: number;
  palmDy: number;
  vPalmDx: number;
  vPalmDy: number;
}

/**
 * Helper to compute the natural target strike point on a keycap
 * (inner half for wide Shift keys, ergonomic thumb spots on Spacebar)
 */
export function getKeyTargetPoint(keyDef: KeyDef, fingerKey?: string): { x: number; y: number } {
  if (keyDef.id === ' ') {
    const isLeftThumb = fingerKey === 'left_thumb';
    return {
      x: isLeftThumb ? 352.0 : 421.5,
      y: keyDef.y + 22,
    };
  }
  if (keyDef.id === 'shift_l') {
    return { x: keyDef.x + keyDef.w - 30, y: keyDef.y + keyDef.h / 2 };
  }
  if (keyDef.id === 'shift_r') {
    return { x: keyDef.x + 34, y: keyDef.y + keyDef.h / 2 };
  }
  if (keyDef.id === 'enter') {
    return { x: keyDef.x + 36, y: keyDef.y + keyDef.h / 2 };
  }
  if (keyDef.id === 'backspace') {
    return { x: keyDef.x + 34, y: keyDef.y + keyDef.h / 2 };
  }
  return {
    x: keyDef.x + keyDef.w / 2,
    y: keyDef.y + keyDef.h / 2,
  };
}

/**
 * Calculates natural multi-joint finger kinematics (MCP -> PIP -> DIP -> Tip)
 */
export function calculateJointKinematics(
  mcpX: number,
  mcpY: number,
  tipX: number,
  tipY: number,
  baseLength: number,
  elevation: number = 0,
  isThumb: boolean = false,
  dynamicFlexionOffset: number = 0,
  hand: 'left' | 'right' = mcpX < 400 ? 'left' : 'right'
): JointPositions {
  const dx = tipX - mcpX;
  const dy = tipY - mcpY;
  const dist = Math.hypot(dx, dy) || 1;
  const dirX = dx / dist;
  const dirY = dy / dist;
  const normalX = -dirY;
  const normalY = dirX;
  const sideSign = hand === 'left' ? 1 : -1;

  if (isThumb) {
    // Gentle outward-curving ergonomic thumb arc
    const thumbBow = (3.5 + dynamicFlexionOffset * 4.0) * sideSign;
    const ipX = mcpX + dx * 0.54 + normalX * thumbBow;
    const ipY = mcpY + dy * 0.54 + normalY * thumbBow;
    const tipMidX = mcpX + dx * 0.80 + normalX * (thumbBow * 0.45);
    const tipMidY = mcpY + dy * 0.80 + normalY * (thumbBow * 0.45);
    return {
      mcp: { x: mcpX, y: mcpY },
      pip: { x: ipX, y: ipY },
      dip: { x: tipMidX, y: tipMidY },
      tip: { x: tipX, y: tipY },
    };
  }

  const compressionRatio = Math.max(0, 1 - Math.min(1.15, dist / baseLength));
  const totalFlexion = compressionRatio * 4.5 + dynamicFlexionOffset * 7.5;
  const arcLiftOffset = elevation * 2.2;
  const lateralDeflection = totalFlexion * 0.45 * sideSign;

  const pipX = mcpX + dx * 0.48 + normalX * lateralDeflection - dirX * (arcLiftOffset * 0.18);
  const pipY = mcpY + dy * 0.48 + normalY * lateralDeflection - dirY * (arcLiftOffset * 0.18);

  const dipX = mcpX + dx * 0.76 + normalX * (lateralDeflection * 0.45);
  const dipY = mcpY + dy * 0.76 + normalY * (lateralDeflection * 0.45);

  return {
    mcp: { x: mcpX, y: mcpY },
    pip: { x: pipX, y: pipY },
    dip: { x: dipX, y: dipY },
    tip: { x: tipX, y: tipY },
  };
}

/**
 * Generates a clean, smooth anatomical finger silhouette (pixel-matched to unified hand contour)
 */
export function generateSculptedFingerPath(
  mcpX: number,
  mcpY: number,
  tipX: number,
  tipY: number,
  width: number,
  squashFactor: number = 1,
  elevation: number = 0,
  joints?: JointPositions,
  rootDepth: number = 16
): string {
  const elevationScale = 1 - Math.max(-0.35, Math.min(0.45, elevation)) * 0.05;
  const effW = width * elevationScale;

  const halfRoot = (effW * 1.06) / 2;
  const halfMcp = (effW * 1.02) / 2;
  const halfPip = (effW * 0.93) / 2;
  const halfDip = (effW * 0.86) / 2;
  const halfTip = (effW * 0.80 * squashFactor) / 2;

  const dx = tipX - mcpX;
  const dy = tipY - mcpY;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;
  const ux = dx / dist;
  const uy = dy / dist;

  const pipX = joints?.pip.x ?? mcpX + dx * 0.48;
  const pipY = joints?.pip.y ?? mcpY + dy * 0.48;
  const dipX = joints?.dip.x ?? mcpX + dx * 0.76;
  const dipY = joints?.dip.y ?? mcpY + dy * 0.76;

  const rootCenterX = mcpX - ux * rootDepth;
  const rootCenterY = mcpY - uy * rootDepth;

  const lRoot = { x: rootCenterX - nx * halfRoot, y: rootCenterY - ny * halfRoot };
  const lMcp = { x: mcpX - nx * halfMcp, y: mcpY - ny * halfMcp };
  const lPip = { x: pipX - nx * halfPip, y: pipY - ny * halfPip };
  const lDip = { x: dipX - nx * halfDip, y: dipY - ny * halfDip };
  const lTip = { x: tipX - nx * halfTip, y: tipY - ny * halfTip };

  const rTip = { x: tipX + nx * halfTip, y: tipY + ny * halfTip };
  const rDip = { x: dipX + nx * halfDip, y: dipY + ny * halfDip };
  const rPip = { x: pipX + nx * halfPip, y: pipY + ny * halfPip };
  const rMcp = { x: mcpX + nx * halfMcp, y: mcpY + ny * halfMcp };
  const rRoot = { x: rootCenterX + nx * halfRoot, y: rootCenterY + ny * halfRoot };

  const apexDist = halfTip * 1.32;
  const cp1X = (lTip.x + ux * apexDist).toFixed(1);
  const cp1Y = (lTip.y + uy * apexDist).toFixed(1);
  const cp2X = (rTip.x + ux * apexDist).toFixed(1);
  const cp2Y = (rTip.y + uy * apexDist).toFixed(1);

  return `
    M ${lRoot.x.toFixed(1)} ${lRoot.y.toFixed(1)}
    L ${lMcp.x.toFixed(1)} ${lMcp.y.toFixed(1)}
    Q ${lPip.x.toFixed(1)} ${lPip.y.toFixed(1)} ${lDip.x.toFixed(1)} ${lDip.y.toFixed(1)}
    L ${lTip.x.toFixed(1)} ${lTip.y.toFixed(1)}
    C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${rTip.x.toFixed(1)} ${rTip.y.toFixed(1)}
    L ${rDip.x.toFixed(1)} ${rDip.y.toFixed(1)}
    Q ${rPip.x.toFixed(1)} ${rPip.y.toFixed(1)} ${rMcp.x.toFixed(1)} ${rMcp.y.toFixed(1)}
    L ${rRoot.x.toFixed(1)} ${rRoot.y.toFixed(1)}
    Q ${rootCenterX.toFixed(1)} ${(rootCenterY - uy * 5).toFixed(1)} ${lRoot.x.toFixed(1)} ${lRoot.y.toFixed(1)}
    Z
  `;
}

/**
 * Generates an open lateral stroke along a finger (no line cutting across the palm)
 */
export function generateSculptedFingerStroke(
  mcpX: number,
  mcpY: number,
  tipX: number,
  tipY: number,
  width: number,
  squashFactor: number = 1,
  elevation: number = 0,
  joints?: JointPositions
): string {
  const elevationScale = 1 - Math.max(-0.35, Math.min(0.45, elevation)) * 0.05;
  const effW = width * elevationScale;

  const halfMcp = (effW * 1.02) / 2;
  const halfPip = (effW * 0.93) / 2;
  const halfDip = (effW * 0.86) / 2;
  const halfTip = (effW * 0.80 * squashFactor) / 2;

  const dx = tipX - mcpX;
  const dy = tipY - mcpY;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;
  const ux = dx / dist;
  const uy = dy / dist;

  const pipX = joints?.pip.x ?? mcpX + dx * 0.48;
  const pipY = joints?.pip.y ?? mcpY + dy * 0.48;
  const dipX = joints?.dip.x ?? mcpX + dx * 0.76;
  const dipY = joints?.dip.y ?? mcpY + dy * 0.76;

  const lMcp = { x: mcpX - nx * halfMcp, y: mcpY - ny * halfMcp };
  const lPip = { x: pipX - nx * halfPip, y: pipY - ny * halfPip };
  const lDip = { x: dipX - nx * halfDip, y: dipY - ny * halfDip };
  const lTip = { x: tipX - nx * halfTip, y: tipY - ny * halfTip };

  const rTip = { x: tipX + nx * halfTip, y: tipY + ny * halfTip };
  const rDip = { x: dipX + nx * halfDip, y: dipY + ny * halfDip };
  const rPip = { x: pipX + nx * halfPip, y: pipY + ny * halfPip };
  const rMcp = { x: mcpX + nx * halfMcp, y: mcpY + ny * halfMcp };

  const apexDist = halfTip * 1.32;
  const cp1X = (lTip.x + ux * apexDist).toFixed(1);
  const cp1Y = (lTip.y + uy * apexDist).toFixed(1);
  const cp2X = (rTip.x + ux * apexDist).toFixed(1);
  const cp2Y = (rTip.y + uy * apexDist).toFixed(1);

  return `
    M ${lMcp.x.toFixed(1)} ${lMcp.y.toFixed(1)}
    Q ${lPip.x.toFixed(1)} ${lPip.y.toFixed(1)} ${lDip.x.toFixed(1)} ${lDip.y.toFixed(1)}
    L ${lTip.x.toFixed(1)} ${lTip.y.toFixed(1)}
    C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${rTip.x.toFixed(1)} ${rTip.y.toFixed(1)}
    L ${rDip.x.toFixed(1)} ${rDip.y.toFixed(1)}
    Q ${rPip.x.toFixed(1)} ${rPip.y.toFixed(1)} ${rMcp.x.toFixed(1)} ${rMcp.y.toFixed(1)}
  `;
}

/**
 * Computes consistent curved thumb geometry shared by both the unified hand silhouette
 * and the individual thumb highlight path (exact left/right mirror symmetry).
 */
function buildThumbContour(
  hand: 'left' | 'right',
  mcpX: number,
  mcpY: number,
  tipX: number,
  tipY: number,
  width: number,
  squashFactor: number = 1,
  elevation: number = 0
) {
  const isLeft = hand === 'left';
  const effW = width * (1 - Math.max(-0.35, Math.min(0.45, elevation)) * 0.05);
  const dx = tipX - mcpX;
  const dy = tipY - mcpY;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  // Normal pointing toward the "upper/index-facing" side of the thumb
  // Left thumb points up-right (ux > 0, uy < 0) -> upper normal is (uy, -ux) = (-, -)
  // Right thumb points up-left (ux < 0, uy < 0) -> upper normal is (-uy, ux) = (+, -)
  const upNx = isLeft ? uy : -uy;
  const upNy = isLeft ? -ux : ux;

  const halfTip = (effW * 0.78 * squashFactor) / 2;
  const halfMid = (effW * 0.94) / 2;
  const halfBase = (effW * 1.12) / 2;

  const midX = mcpX + dx * 0.52;
  const midY = mcpY + dy * 0.52;

  // Gentle ergonomic bow curving toward the spacebar
  const bow = 4.2;

  const upBase = { x: mcpX + upNx * halfBase, y: mcpY + upNy * halfBase };
  const upMid = { x: midX + upNx * (halfMid - bow * 0.35), y: midY + upNy * (halfMid - bow * 0.35) };
  const upTip = { x: tipX + upNx * halfTip, y: tipY + upNy * halfTip };

  const lowTip = { x: tipX - upNx * halfTip, y: tipY - upNy * halfTip };
  const lowMid = { x: midX - upNx * (halfMid + bow), y: midY - upNy * (halfMid + bow) };
  const lowBase = { x: mcpX - upNx * (halfBase * 1.18), y: mcpY - upNy * (halfBase * 1.18) };

  const apexDist = halfTip * 1.35;
  const cpUp = { x: upTip.x + ux * apexDist, y: upTip.y + uy * apexDist };
  const cpLow = { x: lowTip.x + ux * apexDist, y: lowTip.y + uy * apexDist };

  const rootCenter = { x: mcpX - ux * 18, y: mcpY - uy * 18 };
  const upRoot = { x: rootCenter.x + upNx * halfBase, y: rootCenter.y + upNy * halfBase };
  const lowRoot = { x: rootCenter.x - upNx * (halfBase * 1.1), y: rootCenter.y - upNy * (halfBase * 1.1) };

  return { upRoot, upBase, upMid, upTip, cpUp, cpLow, lowTip, lowMid, lowBase, lowRoot, rootCenter };
}

/**
 * Generates an organic curved thumb fill path matching the unified silhouette seamlessly
 */
export function generateSculptedThumbPath(
  hand: 'left' | 'right',
  mcpX: number,
  mcpY: number,
  tipX: number,
  tipY: number,
  width: number,
  squashFactor: number = 1,
  elevation: number = 0
): string {
  const t = buildThumbContour(hand, mcpX, mcpY, tipX, tipY, width, squashFactor, elevation);
  return `
    M ${t.upRoot.x.toFixed(1)} ${t.upRoot.y.toFixed(1)}
    L ${t.upBase.x.toFixed(1)} ${t.upBase.y.toFixed(1)}
    Q ${t.upMid.x.toFixed(1)} ${t.upMid.y.toFixed(1)} ${t.upTip.x.toFixed(1)} ${t.upTip.y.toFixed(1)}
    C ${t.cpUp.x.toFixed(1)} ${t.cpUp.y.toFixed(1)}, ${t.cpLow.x.toFixed(1)} ${t.cpLow.y.toFixed(1)}, ${t.lowTip.x.toFixed(1)} ${t.lowTip.y.toFixed(1)}
    Q ${t.lowMid.x.toFixed(1)} ${t.lowMid.y.toFixed(1)} ${t.lowBase.x.toFixed(1)} ${t.lowBase.y.toFixed(1)}
    L ${t.lowRoot.x.toFixed(1)} ${t.lowRoot.y.toFixed(1)}
    Z
  `;
}

/**
 * Generates an open lateral stroke along the thumb (for crisp Typing.com active thumb outline)
 */
export function generateSculptedThumbStroke(
  hand: 'left' | 'right',
  mcpX: number,
  mcpY: number,
  tipX: number,
  tipY: number,
  width: number,
  squashFactor: number = 1,
  elevation: number = 0
): string {
  const t = buildThumbContour(hand, mcpX, mcpY, tipX, tipY, width, squashFactor, elevation);
  return `
    M ${t.upBase.x.toFixed(1)} ${t.upBase.y.toFixed(1)}
    Q ${t.upMid.x.toFixed(1)} ${t.upMid.y.toFixed(1)} ${t.upTip.x.toFixed(1)} ${t.upTip.y.toFixed(1)}
    C ${t.cpUp.x.toFixed(1)} ${t.cpUp.y.toFixed(1)}, ${t.cpLow.x.toFixed(1)} ${t.cpLow.y.toFixed(1)}, ${t.lowTip.x.toFixed(1)} ${t.lowTip.y.toFixed(1)}
    Q ${t.lowMid.x.toFixed(1)} ${t.lowMid.y.toFixed(1)} ${t.lowBase.x.toFixed(1)} ${t.lowBase.y.toFixed(1)}
  `;
}

/**
 * Computes finger contour vertices for building a seamless unified hand outline.
 * Ensures consistent left-to-right winding around the finger regardless of hand.
 */
function buildFingerContour(f: {
  tipX: number;
  tipY: number;
  mcpX: number;
  mcpY: number;
  pipX: number;
  pipY: number;
  dipX: number;
  dipY: number;
  w: number;
  sq: number;
}) {
  const dx = f.tipX - f.mcpX;
  const dy = f.tipY - f.mcpY;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const leftNx = uy;
  const leftNy = -ux;

  const halfMcp = (f.w * 1.02) / 2;
  const halfPip = (f.w * 0.93) / 2;
  const halfDip = (f.w * 0.86) / 2;
  const halfTip = (f.w * 0.80 * f.sq) / 2;
  const apexDist = halfTip * 1.32;

  const lTip = { x: f.tipX + leftNx * halfTip, y: f.tipY + leftNy * halfTip };
  const rTip = { x: f.tipX - leftNx * halfTip, y: f.tipY - leftNy * halfTip };

  return {
    lMcp: { x: f.mcpX + leftNx * halfMcp, y: f.mcpY + leftNy * halfMcp },
    lPip: { x: f.pipX + leftNx * halfPip, y: f.pipY + leftNy * halfPip },
    lDip: { x: f.dipX + leftNx * halfDip, y: f.dipY + leftNy * halfDip },
    lTip,
    cp1: { x: lTip.x + ux * apexDist, y: lTip.y + uy * apexDist },
    cp2: { x: rTip.x + ux * apexDist, y: rTip.y + uy * apexDist },
    rTip,
    rDip: { x: f.dipX - leftNx * halfDip, y: f.dipY - leftNy * halfDip },
    rPip: { x: f.pipX - leftNx * halfPip, y: f.pipY - leftNy * halfPip },
    rMcp: { x: f.mcpX - leftNx * halfMcp, y: f.mcpY - leftNy * halfMcp },
  };
}

/**
 * Generates a soft, U-shaped cubic Bezier interdigital web connecting two adjacent finger bases
 */
function buildWebCurve(pA: { x: number; y: number }, pB: { x: number; y: number }, dropY: number = 11): string {
  const c1x = pA.x + (pB.x - pA.x) * 0.14;
  const c1y = Math.max(pA.y, pB.y) + dropY;
  const c2x = pB.x - (pB.x - pA.x) * 0.14;
  const c2y = Math.max(pA.y, pB.y) + dropY;
  return `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${pB.x.toFixed(1)} ${pB.y.toFixed(1)}`;
}

/**
 * Generates a perfectly symmetrical, smooth, Typing.com-style continuous hand silhouette
 * with fuller anatomical fingers, soft U-shaped interdigital webs, organic curved thumb,
 * rounded dorsal palm, and clean tapered forearm wrist.
 */
export function generateUnifiedHandSilhouette(
  hand: 'left' | 'right',
  palmOffsetX: number = 0,
  palmOffsetY: number = 0,
  fingers?: Record<string, FingerRenderPose>
): string {
  const isLeft = hand === 'left';
  const geom = HAND_GEOMETRY[hand];
  const prefix = hand;

  const getPose = (suffix: string) => {
    const key = `${prefix}_${suffix}`;
    const f = fingers?.[key];
    const a = FINGER_ANCHORS[key];
    if (f) {
      return {
        tipX: f.tipX,
        tipY: f.tipY,
        mcpX: f.mcpX,
        mcpY: f.mcpY,
        pipX: f.pipX,
        pipY: f.pipY,
        dipX: f.dipX,
        dipY: f.dipY,
        w: f.width,
        sq: f.squashFactor,
        el: f.elevation,
      };
    }
    const joints = calculateJointKinematics(a.mcpX, a.mcpY, a.homeX, a.homeY, a.length, 0, suffix === 'thumb', 0, hand);
    return {
      tipX: a.homeX,
      tipY: a.homeY,
      mcpX: a.mcpX,
      mcpY: a.mcpY,
      pipX: joints.pip.x,
      pipY: joints.pip.y,
      dipX: joints.dip.x,
      dipY: joints.dip.y,
      w: a.width,
      sq: 1,
      el: 0,
    };
  };

  const pPinky = getPose('pinky');
  const pRing = getPose('ring');
  const pMid = getPose('middle');
  const pIndex = getPose('index');
  const pThumb = getPose('thumb');

  const vPinky = buildFingerContour(pPinky);
  const vRing = buildFingerContour(pRing);
  const vMid = buildFingerContour(pMid);
  const vIndex = buildFingerContour(pIndex);
  const tThumb = buildThumbContour(hand, pThumb.mcpX, pThumb.mcpY, pThumb.tipX, pThumb.tipY, pThumb.w, pThumb.sq, pThumb.el);

  if (isLeft) {
    // Clockwise traversal for Left Hand:
    // Left wrist outer -> Hypothenar palm edge -> Pinky -> Ring -> Middle -> Index -> Thumb saddle -> Thumb -> Thenar -> Left wrist inner
    const wristOuter = { x: geom.wristOuterX + palmOffsetX * 0.25, y: 432 };
    const wristInner = { x: geom.wristInnerX + palmOffsetX * 0.25, y: 432 };

    // Smooth thumb saddle between Index outer MCP and Thumb upper base
    const saddleC1 = { x: vIndex.rMcp.x + 8, y: vIndex.rMcp.y + 30 };
    const saddleC2 = { x: tThumb.upBase.x + 2, y: tThumb.upBase.y - 16 };

    // Smooth fleshy thenar curve from lower thumb base into inner wrist
    const thenarC1 = { x: tThumb.lowBase.x + 18, y: tThumb.lowBase.y + 38 + palmOffsetY * 0.15 };
    const thenarC2 = { x: wristInner.x + 18, y: 396 };

    return `
      M ${wristOuter.x.toFixed(1)} ${wristOuter.y.toFixed(1)}
      C ${(wristOuter.x - 16 + palmOffsetX * 0.3).toFixed(1)} 364, ${(vPinky.lMcp.x - 16).toFixed(1)} 304, ${vPinky.lMcp.x.toFixed(1)} ${vPinky.lMcp.y.toFixed(1)}
      Q ${vPinky.lPip.x.toFixed(1)} ${vPinky.lPip.y.toFixed(1)} ${vPinky.lDip.x.toFixed(1)} ${vPinky.lDip.y.toFixed(1)}
      L ${vPinky.lTip.x.toFixed(1)} ${vPinky.lTip.y.toFixed(1)}
      C ${vPinky.cp1.x.toFixed(1)} ${vPinky.cp1.y.toFixed(1)}, ${vPinky.cp2.x.toFixed(1)} ${vPinky.cp2.y.toFixed(1)}, ${vPinky.rTip.x.toFixed(1)} ${vPinky.rTip.y.toFixed(1)}
      L ${vPinky.rDip.x.toFixed(1)} ${vPinky.rDip.y.toFixed(1)}
      Q ${vPinky.rPip.x.toFixed(1)} ${vPinky.rPip.y.toFixed(1)} ${vPinky.rMcp.x.toFixed(1)} ${vPinky.rMcp.y.toFixed(1)}
      ${buildWebCurve(vPinky.rMcp, vRing.lMcp, 11)}

      Q ${vRing.lPip.x.toFixed(1)} ${vRing.lPip.y.toFixed(1)} ${vRing.lDip.x.toFixed(1)} ${vRing.lDip.y.toFixed(1)}
      L ${vRing.lTip.x.toFixed(1)} ${vRing.lTip.y.toFixed(1)}
      C ${vRing.cp1.x.toFixed(1)} ${vRing.cp1.y.toFixed(1)}, ${vRing.cp2.x.toFixed(1)} ${vRing.cp2.y.toFixed(1)}, ${vRing.rTip.x.toFixed(1)} ${vRing.rTip.y.toFixed(1)}
      L ${vRing.rDip.x.toFixed(1)} ${vRing.rDip.y.toFixed(1)}
      Q ${vRing.rPip.x.toFixed(1)} ${vRing.rPip.y.toFixed(1)} ${vRing.rMcp.x.toFixed(1)} ${vRing.rMcp.y.toFixed(1)}
      ${buildWebCurve(vRing.rMcp, vMid.lMcp, 10)}

      Q ${vMid.lPip.x.toFixed(1)} ${vMid.lPip.y.toFixed(1)} ${vMid.lDip.x.toFixed(1)} ${vMid.lDip.y.toFixed(1)}
      L ${vMid.lTip.x.toFixed(1)} ${vMid.lTip.y.toFixed(1)}
      C ${vMid.cp1.x.toFixed(1)} ${vMid.cp1.y.toFixed(1)}, ${vMid.cp2.x.toFixed(1)} ${vMid.cp2.y.toFixed(1)}, ${vMid.rTip.x.toFixed(1)} ${vMid.rTip.y.toFixed(1)}
      L ${vMid.rDip.x.toFixed(1)} ${vMid.rDip.y.toFixed(1)}
      Q ${vMid.rPip.x.toFixed(1)} ${vMid.rPip.y.toFixed(1)} ${vMid.rMcp.x.toFixed(1)} ${vMid.rMcp.y.toFixed(1)}
      ${buildWebCurve(vMid.rMcp, vIndex.lMcp, 11)}

      Q ${vIndex.lPip.x.toFixed(1)} ${vIndex.lPip.y.toFixed(1)} ${vIndex.lDip.x.toFixed(1)} ${vIndex.lDip.y.toFixed(1)}
      L ${vIndex.lTip.x.toFixed(1)} ${vIndex.lTip.y.toFixed(1)}
      C ${vIndex.cp1.x.toFixed(1)} ${vIndex.cp1.y.toFixed(1)}, ${vIndex.cp2.x.toFixed(1)} ${vIndex.cp2.y.toFixed(1)}, ${vIndex.rTip.x.toFixed(1)} ${vIndex.rTip.y.toFixed(1)}
      L ${vIndex.rDip.x.toFixed(1)} ${vIndex.rDip.y.toFixed(1)}
      Q ${vIndex.rPip.x.toFixed(1)} ${vIndex.rPip.y.toFixed(1)} ${vIndex.rMcp.x.toFixed(1)} ${vIndex.rMcp.y.toFixed(1)}

      C ${saddleC1.x.toFixed(1)} ${saddleC1.y.toFixed(1)}, ${saddleC2.x.toFixed(1)} ${saddleC2.y.toFixed(1)}, ${tThumb.upBase.x.toFixed(1)} ${tThumb.upBase.y.toFixed(1)}
      Q ${tThumb.upMid.x.toFixed(1)} ${tThumb.upMid.y.toFixed(1)} ${tThumb.upTip.x.toFixed(1)} ${tThumb.upTip.y.toFixed(1)}
      C ${tThumb.cpUp.x.toFixed(1)} ${tThumb.cpUp.y.toFixed(1)}, ${tThumb.cpLow.x.toFixed(1)} ${tThumb.cpLow.y.toFixed(1)}, ${tThumb.lowTip.x.toFixed(1)} ${tThumb.lowTip.y.toFixed(1)}
      Q ${tThumb.lowMid.x.toFixed(1)} ${tThumb.lowMid.y.toFixed(1)} ${tThumb.lowBase.x.toFixed(1)} ${tThumb.lowBase.y.toFixed(1)}
      C ${thenarC1.x.toFixed(1)} ${thenarC1.y.toFixed(1)}, ${thenarC2.x.toFixed(1)} ${thenarC2.y.toFixed(1)}, ${wristInner.x.toFixed(1)} ${wristInner.y.toFixed(1)}
      L ${wristOuter.x.toFixed(1)} ${wristOuter.y.toFixed(1)}
      Z
    `;
  } else {
    // Clockwise traversal for Right Hand (exact mathematical mirror of Left Hand):
    // Right wrist inner -> Thenar -> Thumb -> Thumb saddle -> Index -> Middle -> Ring -> Pinky -> Hypothenar -> Right wrist outer
    const wristInner = { x: geom.wristInnerX + palmOffsetX * 0.25, y: 432 };
    const wristOuter = { x: geom.wristOuterX + palmOffsetX * 0.25, y: 432 };

    const thenarC2 = { x: wristInner.x - 18, y: 396 };
    const thenarC1 = { x: tThumb.lowBase.x - 18, y: tThumb.lowBase.y + 38 + palmOffsetY * 0.15 };

    const saddleC2 = { x: tThumb.upBase.x - 2, y: tThumb.upBase.y - 16 };
    const saddleC1 = { x: vIndex.lMcp.x - 8, y: vIndex.lMcp.y + 30 };

    return `
      M ${wristInner.x.toFixed(1)} ${wristInner.y.toFixed(1)}
      C ${thenarC2.x.toFixed(1)} ${thenarC2.y.toFixed(1)}, ${thenarC1.x.toFixed(1)} ${thenarC1.y.toFixed(1)}, ${tThumb.lowBase.x.toFixed(1)} ${tThumb.lowBase.y.toFixed(1)}
      Q ${tThumb.lowMid.x.toFixed(1)} ${tThumb.lowMid.y.toFixed(1)} ${tThumb.lowTip.x.toFixed(1)} ${tThumb.lowTip.y.toFixed(1)}
      C ${tThumb.cpLow.x.toFixed(1)} ${tThumb.cpLow.y.toFixed(1)}, ${tThumb.cpUp.x.toFixed(1)} ${tThumb.cpUp.y.toFixed(1)}, ${tThumb.upTip.x.toFixed(1)} ${tThumb.upTip.y.toFixed(1)}
      Q ${tThumb.upMid.x.toFixed(1)} ${tThumb.upMid.y.toFixed(1)} ${tThumb.upBase.x.toFixed(1)} ${tThumb.upBase.y.toFixed(1)}
      C ${saddleC2.x.toFixed(1)} ${saddleC2.y.toFixed(1)}, ${saddleC1.x.toFixed(1)} ${saddleC1.y.toFixed(1)}, ${vIndex.lMcp.x.toFixed(1)} ${vIndex.lMcp.y.toFixed(1)}

      Q ${vIndex.lPip.x.toFixed(1)} ${vIndex.lPip.y.toFixed(1)} ${vIndex.lDip.x.toFixed(1)} ${vIndex.lDip.y.toFixed(1)}
      L ${vIndex.lTip.x.toFixed(1)} ${vIndex.lTip.y.toFixed(1)}
      C ${vIndex.cp1.x.toFixed(1)} ${vIndex.cp1.y.toFixed(1)}, ${vIndex.cp2.x.toFixed(1)} ${vIndex.cp2.y.toFixed(1)}, ${vIndex.rTip.x.toFixed(1)} ${vIndex.rTip.y.toFixed(1)}
      L ${vIndex.rDip.x.toFixed(1)} ${vIndex.rDip.y.toFixed(1)}
      Q ${vIndex.rPip.x.toFixed(1)} ${vIndex.rPip.y.toFixed(1)} ${vIndex.rMcp.x.toFixed(1)} ${vIndex.rMcp.y.toFixed(1)}
      ${buildWebCurve(vIndex.rMcp, vMid.lMcp, 11)}

      Q ${vMid.lPip.x.toFixed(1)} ${vMid.lPip.y.toFixed(1)} ${vMid.lDip.x.toFixed(1)} ${vMid.lDip.y.toFixed(1)}
      L ${vMid.lTip.x.toFixed(1)} ${vMid.lTip.y.toFixed(1)}
      C ${vMid.cp1.x.toFixed(1)} ${vMid.cp1.y.toFixed(1)}, ${vMid.cp2.x.toFixed(1)} ${vMid.cp2.y.toFixed(1)}, ${vMid.rTip.x.toFixed(1)} ${vMid.rTip.y.toFixed(1)}
      L ${vMid.rDip.x.toFixed(1)} ${vMid.rDip.y.toFixed(1)}
      Q ${vMid.rPip.x.toFixed(1)} ${vMid.rPip.y.toFixed(1)} ${vMid.rMcp.x.toFixed(1)} ${vMid.rMcp.y.toFixed(1)}
      ${buildWebCurve(vMid.rMcp, vRing.lMcp, 10)}

      Q ${vRing.lPip.x.toFixed(1)} ${vRing.lPip.y.toFixed(1)} ${vRing.lDip.x.toFixed(1)} ${vRing.lDip.y.toFixed(1)}
      L ${vRing.lTip.x.toFixed(1)} ${vRing.lTip.y.toFixed(1)}
      C ${vRing.cp1.x.toFixed(1)} ${vRing.cp1.y.toFixed(1)}, ${vRing.cp2.x.toFixed(1)} ${vRing.cp2.y.toFixed(1)}, ${vRing.rTip.x.toFixed(1)} ${vRing.rTip.y.toFixed(1)}
      L ${vRing.rDip.x.toFixed(1)} ${vRing.rDip.y.toFixed(1)}
      Q ${vRing.rPip.x.toFixed(1)} ${vRing.rPip.y.toFixed(1)} ${vRing.rMcp.x.toFixed(1)} ${vRing.rMcp.y.toFixed(1)}
      ${buildWebCurve(vRing.rMcp, vPinky.lMcp, 11)}

      Q ${vPinky.lPip.x.toFixed(1)} ${vPinky.lPip.y.toFixed(1)} ${vPinky.lDip.x.toFixed(1)} ${vPinky.lDip.y.toFixed(1)}
      L ${vPinky.lTip.x.toFixed(1)} ${vPinky.lTip.y.toFixed(1)}
      C ${vPinky.cp1.x.toFixed(1)} ${vPinky.cp1.y.toFixed(1)}, ${vPinky.cp2.x.toFixed(1)} ${vPinky.cp2.y.toFixed(1)}, ${vPinky.rTip.x.toFixed(1)} ${vPinky.rTip.y.toFixed(1)}
      L ${vPinky.rDip.x.toFixed(1)} ${vPinky.rDip.y.toFixed(1)}
      Q ${vPinky.rPip.x.toFixed(1)} ${vPinky.rPip.y.toFixed(1)} ${vPinky.rMcp.x.toFixed(1)} ${vPinky.rMcp.y.toFixed(1)}

      C ${(vPinky.rMcp.x + 16).toFixed(1)} 304, ${(wristOuter.x + 16 + palmOffsetX * 0.3).toFixed(1)} 364, ${wristOuter.x.toFixed(1)} ${wristOuter.y.toFixed(1)}
      L ${wristInner.x.toFixed(1)} ${wristInner.y.toFixed(1)}
      Z
    `;
  }
}

function createInitialFingerStates(): Record<string, FingerPhysicsState> {
  const states: Record<string, FingerPhysicsState> = {};
  Object.entries(FINGER_ANCHORS).forEach(([key, anchor]) => {
    states[key] = {
      x: anchor.homeX,
      y: anchor.homeY,
      vx: 0,
      vy: 0,
      elevation: 0,
      vElevation: 0,
      squash: 1,
      vSquash: 0,
    };
  });
  return states;
}

function buildStaticInitialPoses(): { leftHand: HandRenderPose; rightHand: HandRenderPose } {
  const lFingers: Record<string, FingerRenderPose> = {};
  const rFingers: Record<string, FingerRenderPose> = {};

  Object.entries(FINGER_ANCHORS).forEach(([fKey, anchor]) => {
    const joints = calculateJointKinematics(
      anchor.mcpX,
      anchor.mcpY,
      anchor.homeX,
      anchor.homeY,
      anchor.length,
      0,
      fKey.includes('thumb'),
      0,
      anchor.hand
    );
    const pose: FingerRenderPose = {
      key: fKey,
      tipX: anchor.homeX,
      tipY: anchor.homeY,
      mcpX: anchor.mcpX,
      mcpY: anchor.mcpY,
      pipX: joints.pip.x,
      pipY: joints.pip.y,
      dipX: joints.dip.x,
      dipY: joints.dip.y,
      joints,
      width: anchor.width,
      length: anchor.length,
      angleDeg: 0,
      elevation: 0,
      isPressed: false,
      isTarget: false,
      isShiftTarget: false,
      squashFactor: 1.0,
      reachDx: 0,
      reachDy: 0,
      shadowBlur: 3.0,
      shadowOpacity: 0.22,
    };
    if (anchor.hand === 'left') lFingers[fKey] = pose;
    else rFingers[fKey] = pose;
  });

  return {
    leftHand: {
      hand: 'left',
      palmCenter: { x: HAND_GEOMETRY.left.palmCenterX, y: HAND_GEOMETRY.left.palmCenterY },
      wristCenter: { x: HAND_GEOMETRY.left.wristCenterX, y: HAND_GEOMETRY.left.wristCenterY },
      tiltDeg: 0,
      palmOffsetX: 0,
      palmOffsetY: 0,
      fingers: lFingers,
    },
    rightHand: {
      hand: 'right',
      palmCenter: { x: HAND_GEOMETRY.right.palmCenterX, y: HAND_GEOMETRY.right.palmCenterY },
      wristCenter: { x: HAND_GEOMETRY.right.wristCenterX, y: HAND_GEOMETRY.right.wristCenterY },
      tiltDeg: 0,
      palmOffsetX: 0,
      palmOffsetY: 0,
      fingers: rFingers,
    },
  };
}

/**
 * High-performance spring-damper hand motion engine with:
 * - Simultaneous primary-finger + opposite-Shift-pinky coordination
 * - Symmetrical palm glide and natural finger tap rebound
 * - Automatic idle sleep once springs settle (zero wasted React re-renders)
 */
export function useHandMotion({
  activeFinger,
  targetKeyDef,
  requiresShift = false,
  shiftFinger = 'none',
  shiftKeyDef = null,
  pressedKey,
  lastResult,
  speedProfile = 'fluid_natural',
  keyStrokeCount,
  keys,
  enabled = true,
}: ComputeHandPoseParams): {
  leftHand: HandRenderPose;
  rightHand: HandRenderPose;
} {
  const fingerPhysicsRef = useRef<Record<string, FingerPhysicsState>>(createInitialFingerStates());
  const leftHandPhysicsRef = useRef<HandPhysicsState>({ tilt: 0, vTilt: 0, palmDx: 0, palmDy: 0, vPalmDx: 0, vPalmDy: 0 });
  const rightHandPhysicsRef = useRef<HandPhysicsState>({ tilt: 0, vTilt: 0, palmDx: 0, palmDy: 0, vPalmDx: 0, vPalmDy: 0 });
  const strikesRef = useRef<Map<string, ActiveStrike>>(new Map());
  const prevCountRef = useRef<number | undefined>(keyStrokeCount);
  const prevPressedKeyRef = useRef<string | null>(null);
  const wakeLoopRef = useRef<(() => void) | null>(null);

  const paramsRef = useRef({
    activeFinger,
    targetKeyDef,
    requiresShift,
    shiftFinger,
    shiftKeyDef,
    pressedKey,
    lastResult,
    speedProfile,
    keyStrokeCount,
    keys,
    enabled,
  });
  paramsRef.current = {
    activeFinger,
    targetKeyDef,
    requiresShift,
    shiftFinger,
    shiftKeyDef,
    pressedKey,
    lastResult,
    speedProfile,
    keyStrokeCount,
    keys,
    enabled,
  };

  const [animatedPoses, setAnimatedPoses] = useState<{
    leftHand: HandRenderPose;
    rightHand: HandRenderPose;
  }>(buildStaticInitialPoses);

  // Trigger strike impulse on new keystroke and wake animation loop on any target change
  useEffect(() => {
    const isNewCount = keyStrokeCount !== undefined && keyStrokeCount !== prevCountRef.current;
    const isNewKey = pressedKey !== null && pressedKey !== prevPressedKeyRef.current;

    prevCountRef.current = keyStrokeCount;
    prevPressedKeyRef.current = pressedKey;

    if ((isNewCount || isNewKey) && (pressedKey || targetKeyDef)) {
      const pKey = (pressedKey || '').toLowerCase();
      const allKeys = keys || [];
      const matchingKey =
        pKey && allKeys.length > 0
          ? allKeys.find((k) => {
              if (pKey === ' ' || pKey === 'space') return k.id === ' ';
              return (
                k.char.toLowerCase() === pKey ||
                (k.displayTop && k.displayTop.toLowerCase() === pKey)
              );
            })
          : targetKeyDef;

      if (matchingKey && matchingKey.finger && matchingKey.finger !== 'none') {
        const pt = getKeyTargetPoint(matchingKey, matchingKey.finger);
        const duration =
          speedProfile === 'rapid_snappy' ? 115 : speedProfile === 'cinematic_tutorial' ? 190 : 145;

        strikesRef.current.set(matchingKey.finger, {
          finger: matchingKey.finger,
          targetX: pt.x,
          targetY: pt.y,
          startTime: performance.now(),
          durationMs: duration,
          isCorrect: lastResult !== 'incorrect',
        });
      }
    }

    wakeLoopRef.current?.();
  }, [
    activeFinger,
    targetKeyDef,
    requiresShift,
    shiftFinger,
    shiftKeyDef,
    keyStrokeCount,
    pressedKey,
    keys,
    lastResult,
    speedProfile,
    enabled,
  ]);

  // Physics loop with automatic idle sleep
  useEffect(() => {
    let animId: number | null = null;
    let lastTime = performance.now();
    let isRunning = false;

    const tick = (now: number) => {
      if (!paramsRef.current.enabled) {
        isRunning = false;
        animId = null;
        return;
      }

      const deltaSec = Math.min(Math.max((now - lastTime) / 1000, 0.001), 0.033);
      lastTime = now;

      const {
        activeFinger: curActive,
        targetKeyDef: curTargetKey,
        requiresShift: curReqShift,
        shiftFinger: curShiftFinger,
        shiftKeyDef: curShiftKey,
        speedProfile: curSpeed,
      } = paramsRef.current;

      const fStates = fingerPhysicsRef.current;
      const leftH = leftHandPhysicsRef.current;
      const rightH = rightHandPhysicsRef.current;

      // Determine active reach intent per hand (including synchronized Shift pinky)
      let leftReachDx = 0;
      let leftReachDy = 0;
      let rightReachDx = 0;
      let rightReachDy = 0;

      Object.entries(FINGER_ANCHORS).forEach(([fKey, anchor]) => {
        const isLeft = anchor.hand === 'left';
        const strike = strikesRef.current.get(fKey);
        let targetPt: { x: number; y: number } | null = null;

        if (strike) {
          targetPt = { x: strike.targetX, y: strike.targetY };
        } else if (fKey === curActive && curTargetKey) {
          targetPt = getKeyTargetPoint(curTargetKey, fKey);
        } else if (curReqShift && fKey === curShiftFinger && curShiftKey) {
          targetPt = getKeyTargetPoint(curShiftKey, fKey);
        }

        if (targetPt) {
          const rDx = targetPt.x - anchor.homeX;
          const rDy = targetPt.y - anchor.homeY;
          if (isLeft) {
            leftReachDx = rDx;
            leftReachDy = rDy;
          } else {
            rightReachDx = rDx;
            rightReachDy = rDy;
          }
        }
      });

      // Gentle palm glide following reaching finger
      const targetLeftPalmX = Math.max(-18, Math.min(18, leftReachDx * 0.14));
      const targetLeftPalmY = Math.max(-18, Math.min(14, leftReachDy < 0 ? leftReachDy * 0.18 : leftReachDy * 0.10));
      const targetLeftTilt = Math.max(-5, Math.min(5, leftReachDx * 0.032));

      const targetRightPalmX = Math.max(-18, Math.min(18, rightReachDx * 0.14));
      const targetRightPalmY = Math.max(-18, Math.min(14, rightReachDy < 0 ? rightReachDy * 0.18 : rightReachDy * 0.10));
      const targetRightTilt = Math.max(-5, Math.min(5, rightReachDx * 0.032));

      const palmK = 200;
      const palmC = 28;
      let anyMotion = strikesRef.current.size > 0;

      const stepHand = (h: HandPhysicsState, tx: number, ty: number, tt: number) => {
        h.vPalmDx += ((tx - h.palmDx) * palmK - h.vPalmDx * palmC) * deltaSec;
        h.vPalmDy += ((ty - h.palmDy) * palmK - h.vPalmDy * palmC) * deltaSec;
        h.vTilt += ((tt - h.tilt) * palmK - h.vTilt * palmC) * deltaSec;

        h.palmDx += h.vPalmDx * deltaSec;
        h.palmDy += h.vPalmDy * deltaSec;
        h.tilt += h.vTilt * deltaSec;

        if (
          Math.abs(tx - h.palmDx) < 0.05 &&
          Math.abs(ty - h.palmDy) < 0.05 &&
          Math.abs(tt - h.tilt) < 0.05 &&
          Math.abs(h.vPalmDx) < 0.05 &&
          Math.abs(h.vPalmDy) < 0.05 &&
          Math.abs(h.vTilt) < 0.05
        ) {
          h.palmDx = tx;
          h.palmDy = ty;
          h.tilt = tt;
          h.vPalmDx = 0;
          h.vPalmDy = 0;
          h.vTilt = 0;
        } else {
          anyMotion = true;
        }
      };

      stepHand(leftH, targetLeftPalmX, targetLeftPalmY, targetLeftTilt);
      stepHand(rightH, targetRightPalmX, targetRightPalmY, targetRightTilt);

      const currentLeftFingers: Record<string, FingerRenderPose> = {};
      const currentRightFingers: Record<string, FingerRenderPose> = {};

      Object.entries(FINGER_ANCHORS).forEach(([fKey, anchor]) => {
        const state = fStates[fKey];
        const isThumb = fKey.includes('thumb');
        const isLeft = anchor.hand === 'left';
        const mass = (FINGER_MASS[fKey] || FINGER_MASS.left_index).mTip;
        const handH = isLeft ? leftH : rightH;

        const ideal = {
          x: anchor.homeX,
          y: anchor.homeY,
          elevation: 0,
          squash: 1.0,
          isTarget: false,
          isShiftTarget: false,
          isPressed: false,
        };

        const activeStrike = strikesRef.current.get(fKey);
        const isShiftActive = curReqShift && fKey === curShiftFinger && Boolean(curShiftKey);

        if (activeStrike) {
          const elapsed = now - activeStrike.startTime;
          const progress = elapsed / activeStrike.durationMs;

          if (progress < 1) {
            ideal.x = activeStrike.targetX;
            ideal.y = activeStrike.targetY;
            if (progress < 0.42) {
              const phase = progress / 0.42;
              ideal.y += 2.6 * Math.sin(phase * Math.PI * 0.5);
              ideal.elevation = -0.45 * Math.sin(phase * Math.PI * 0.5);
              ideal.squash = 1.0 + 0.28 * Math.sin(phase * Math.PI * 0.5);
              ideal.isPressed = true;
            } else {
              const phase = (progress - 0.42) / 0.58;
              ideal.isPressed = false;
              ideal.squash = 1.0 + 0.28 * (1 - phase);

              if (fKey === curActive && curTargetKey) {
                const nextPt = getKeyTargetPoint(curTargetKey, fKey);
                ideal.x = activeStrike.targetX + (nextPt.x - activeStrike.targetX) * phase;
                ideal.y = activeStrike.targetY + (nextPt.y - activeStrike.targetY) * phase;
                ideal.elevation = 0.20 * phase;
                ideal.isTarget = true;
              } else if (isShiftActive && curShiftKey) {
                const shiftPt = getKeyTargetPoint(curShiftKey, fKey);
                ideal.x = activeStrike.targetX + (shiftPt.x - activeStrike.targetX) * phase;
                ideal.y = activeStrike.targetY + (shiftPt.y - activeStrike.targetY) * phase;
                ideal.elevation = -0.20;
                ideal.isShiftTarget = true;
              } else {
                ideal.x = activeStrike.targetX + (anchor.homeX - activeStrike.targetX) * phase;
                ideal.y = activeStrike.targetY + (anchor.homeY - activeStrike.targetY) * phase;
                ideal.elevation = 0;
              }
            }
          } else {
            strikesRef.current.delete(fKey);
          }
        }

        if (!strikesRef.current.has(fKey)) {
          if (fKey === curActive && curTargetKey) {
            const pt = getKeyTargetPoint(curTargetKey, fKey);
            ideal.x = pt.x;
            ideal.y = pt.y;
            ideal.elevation = 0.20;
            ideal.squash = 1.0;
            ideal.isTarget = true;
          } else if (isShiftActive && curShiftKey) {
            const pt = getKeyTargetPoint(curShiftKey, fKey);
            ideal.x = pt.x;
            ideal.y = pt.y + 1.5;
            ideal.elevation = -0.25;
            ideal.squash = 1.12;
            ideal.isShiftTarget = true;
            ideal.isPressed = true;
          } else {
            ideal.x = anchor.homeX;
            ideal.y = anchor.homeY;
            ideal.elevation = 0;
            ideal.squash = 1.0;

            // Gentle tendon sympathy when an adjacent finger reaches up/down
            if (curActive && curActive !== 'none' && curTargetKey) {
              const coupling = TENDON_COUPLING[curActive]?.[fKey] || 0;
              if (coupling > 0) {
                const activeHome = FINGER_ANCHORS[curActive];
                if (activeHome) {
                  const reachDy = curTargetKey.y + curTargetKey.h / 2 - activeHome.homeY;
                  ideal.y += coupling * 0.04 * reachDy;
                }
              }
            }
          }
        }

        const omega = ideal.isPressed
          ? 34
          : curSpeed === 'rapid_snappy'
          ? 32
          : curSpeed === 'cinematic_tutorial'
          ? 18
          : 25;
        const zeta = 0.92;
        const k = (omega * omega) / mass;
        const c = (2 * zeta * omega) / Math.sqrt(mass);

        state.vx += ((ideal.x - state.x) * k - state.vx * c) * deltaSec;
        state.vy += ((ideal.y - state.y) * k - state.vy * c) * deltaSec;
        state.x += state.vx * deltaSec;
        state.y += state.vy * deltaSec;

        if (
          Math.hypot(ideal.x - state.x, ideal.y - state.y) < 0.08 &&
          Math.hypot(state.vx, state.vy) < 0.08
        ) {
          state.x = ideal.x;
          state.y = ideal.y;
          state.vx = 0;
          state.vy = 0;
        } else {
          anyMotion = true;
        }

        state.vElevation += ((ideal.elevation - state.elevation) * 580 - state.vElevation * 44) * deltaSec;
        state.elevation += state.vElevation * deltaSec;
        if (Math.abs(ideal.elevation - state.elevation) < 0.005 && Math.abs(state.vElevation) < 0.005) {
          state.elevation = ideal.elevation;
          state.vElevation = 0;
        } else {
          anyMotion = true;
        }

        state.vSquash += ((ideal.squash - state.squash) * 620 - state.vSquash * 46) * deltaSec;
        state.squash += state.vSquash * deltaSec;
        if (Math.abs(ideal.squash - state.squash) < 0.005 && Math.abs(state.vSquash) < 0.005) {
          state.squash = ideal.squash;
          state.vSquash = 0;
        } else {
          anyMotion = true;
        }

        const dynamicMcpX = anchor.mcpX + handH.palmDx;
        const dynamicMcpY = anchor.mcpY + handH.palmDy;

        const joints = calculateJointKinematics(
          dynamicMcpX,
          dynamicMcpY,
          state.x,
          state.y,
          anchor.length,
          state.elevation,
          isThumb,
          ideal.isPressed ? 0.08 : 0,
          anchor.hand
        );

        const dx = state.x - dynamicMcpX;
        const dy = state.y - dynamicMcpY;
        const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;

        const fingerPose: FingerRenderPose = {
          key: fKey,
          tipX: state.x,
          tipY: state.y,
          mcpX: dynamicMcpX,
          mcpY: dynamicMcpY,
          pipX: joints.pip.x,
          pipY: joints.pip.y,
          dipX: joints.dip.x,
          dipY: joints.dip.y,
          joints,
          width: anchor.width,
          length: anchor.length,
          angleDeg,
          elevation: state.elevation,
          isPressed: ideal.isPressed,
          isTarget: ideal.isTarget,
          isShiftTarget: ideal.isShiftTarget,
          squashFactor: Math.max(0.88, Math.min(1.32, state.squash)),
          reachDx: state.x - anchor.homeX,
          reachDy: state.y - anchor.homeY,
          shadowBlur: Math.max(1.5, 3.0 + state.elevation * 3.5),
          shadowOpacity: Math.max(0.12, 0.24 - state.elevation * 0.06),
        };

        if (isLeft) currentLeftFingers[fKey] = fingerPose;
        else currentRightFingers[fKey] = fingerPose;
      });

      setAnimatedPoses({
        leftHand: {
          hand: 'left',
          palmCenter: {
            x: HAND_GEOMETRY.left.palmCenterX + leftH.palmDx,
            y: HAND_GEOMETRY.left.palmCenterY + leftH.palmDy,
          },
          wristCenter: {
            x: HAND_GEOMETRY.left.wristCenterX + leftH.palmDx * 0.25,
            y: HAND_GEOMETRY.left.wristCenterY,
          },
          tiltDeg: leftH.tilt,
          palmOffsetX: leftH.palmDx,
          palmOffsetY: leftH.palmDy,
          fingers: currentLeftFingers,
        },
        rightHand: {
          hand: 'right',
          palmCenter: {
            x: HAND_GEOMETRY.right.palmCenterX + rightH.palmDx,
            y: HAND_GEOMETRY.right.palmCenterY + rightH.palmDy,
          },
          wristCenter: {
            x: HAND_GEOMETRY.right.wristCenterX + rightH.palmDx * 0.25,
            y: HAND_GEOMETRY.right.wristCenterY,
          },
          tiltDeg: rightH.tilt,
          palmOffsetX: rightH.palmDx,
          palmOffsetY: rightH.palmDy,
          fingers: currentRightFingers,
        },
      });

      if (anyMotion) {
        animId = requestAnimationFrame(tick);
      } else {
        isRunning = false;
        animId = null;
      }
    };

    const wake = () => {
      if (!paramsRef.current.enabled) return;
      if (!isRunning) {
        isRunning = true;
        lastTime = performance.now();
        animId = requestAnimationFrame(tick);
      }
    };

    wakeLoopRef.current = wake;
    wake();

    return () => {
      wakeLoopRef.current = null;
      isRunning = false;
      if (animId !== null) cancelAnimationFrame(animId);
    };
  }, []);

  return animatedPoses;
}
