import React from 'react';
import {
  HandRenderPose,
  FingerRenderPose,
  FINGER_ANCHORS,
  HAND_GEOMETRY,
} from '../HandArchitectureTypes';
import {
  generateUnifiedHandSilhouette,
  generateSculptedFingerStroke,
  generateSculptedFingerPath,
  generateSculptedThumbPath,
  generateSculptedThumbStroke,
} from '../HandMotionEngine';

interface TypingComRendererProps {
  pose: HandRenderPose;
  showColorZones: boolean;
  isDarkKeyboard?: boolean;
}

/**
 * Classic Typing.com translucent pale-blue hand replica.
 * - Soft translucent pale-blue vector silhouette so every keycap letter beneath remains crisp
 * - Crisp Typing.com slate-blue outline, subtle dorsal knuckle hints, and clean fingernail crescents
 * - Full-finger Typing.com blue highlight on the active finger (and Spacebar thumb) with zero bullseye clutter
 * - Coordinated cobalt-blue highlight on the opposite Shift pinky for uppercase & shifted symbols
 */
export const TypingComRenderer: React.FC<TypingComRendererProps> = ({
  pose,
  showColorZones,
  isDarkKeyboard = false,
}) => {
  const isLeft = pose.hand === 'left';
  const geom = HAND_GEOMETRY[pose.hand];

  const unifiedPath = generateUnifiedHandSilhouette(
    pose.hand,
    pose.palmOffsetX || 0,
    pose.palmOffsetY || 0,
    pose.fingers
  );

  const outlineColor = isDarkKeyboard ? '#7DD3FC' : '#5B9BD5';
  const detailStroke = isDarkKeyboard ? '#BAE6FD' : '#6AA4D9';

  return (
    <g
      id={`${pose.hand}-typingcom-hand`}
      transform={`rotate(${pose.tiltDeg.toFixed(2)}, ${geom.wristCenterX}, 395)`}
      pointerEvents="none"
    >
      {/* 1. UNIFIED CLASSIC TYPING.COM TRANSLUCENT PALE-BLUE HAND SILHOUETTE */}
      <g id={`${pose.hand}-typingcom-base`} filter="url(#hand-natural-shadow)">
        <path
          d={unifiedPath}
          fill="url(#typingComTranslucentFill)"
          stroke={outlineColor}
          strokeWidth="1.9"
          strokeOpacity={isDarkKeyboard ? 0.78 : 0.84}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Delicate inner specular rim for crisp vector polish */}
        <path
          d={unifiedPath}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.85"
          strokeOpacity={isDarkKeyboard ? 0.16 : 0.42}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>

      {/* 2. INDIVIDUAL FINGER HIGHLIGHTS (ACTIVE TYPING.COM BLUE / SHIFT COBALT) + ANATOMICAL DETAILS */}
      {Object.values(pose.fingers).map((f: FingerRenderPose) => {
        const isThumb = f.key.includes('thumb');
        const isTarget = f.isTarget;
        const isShift = Boolean(f.isShiftTarget);
        const isPressed = f.isPressed;
        const anchor = FINGER_ANCHORS[f.key];
        const zoneColor = anchor?.zoneColor || '#2596E8';

        const fingerFillPath = isThumb
          ? generateSculptedThumbPath(
              pose.hand,
              f.mcpX,
              f.mcpY,
              f.tipX,
              f.tipY,
              f.width,
              f.squashFactor,
              f.elevation
            )
          : generateSculptedFingerPath(
              f.mcpX,
              f.mcpY,
              f.tipX,
              f.tipY,
              f.width,
              f.squashFactor,
              f.elevation,
              f.joints,
              16
            );

        const openContourStroke = isThumb
          ? generateSculptedThumbStroke(
              pose.hand,
              f.mcpX,
              f.mcpY,
              f.tipX,
              f.tipY,
              f.width,
              f.squashFactor,
              f.elevation
            )
          : generateSculptedFingerStroke(
              f.mcpX,
              f.mcpY,
              f.tipX,
              f.tipY,
              f.width,
              f.squashFactor,
              f.elevation,
              f.joints
            );

        const highlightStrokeColor = isTarget
          ? showColorZones
            ? zoneColor
            : '#1A7DC8'
          : isShift
          ? '#1D4ED8'
          : zoneColor;

        const nailW = f.width * 0.54 * f.squashFactor;
        const nailH = isThumb ? 8.5 : 8.0;
        const nailRot = isThumb ? (isLeft ? 40 : -40) : f.angleDeg;

        return (
          <g key={f.key} id={`${f.key}-typingcom-finger`}>
            {/* Translucent Typing.com Blue Full-Finger Fill */}
            {(isTarget || isShift || showColorZones) && (
              <path
                d={fingerFillPath}
                fill={
                  isTarget
                    ? showColorZones
                      ? `url(#grad-finger-${f.key})`
                      : 'url(#typingComActiveFingerGrad)'
                    : isShift
                    ? 'url(#typingComShiftFingerGrad)'
                    : `url(#grad-finger-${f.key})`
                }
                fillOpacity={isTarget ? 0.88 : isShift ? 0.84 : 0.42}
              />
            )}

            {/* Crisp Active Contour Highlight matching Typing.com blue */}
            {(isTarget || isShift) && (
              <path
                d={openContourStroke}
                stroke={highlightStrokeColor}
                strokeWidth="2.15"
                strokeOpacity="0.92"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}

            {/* Subtle Dorsal Knuckle Arc & PIP Joint Crease (Clean Typing.com Vector Detail) */}
            {!isThumb && (
              <>
                <g
                  transform={`translate(${f.mcpX.toFixed(1)}, ${(f.mcpY + 12).toFixed(1)}) rotate(${(f.angleDeg * 0.35).toFixed(1)})`}
                >
                  <path
                    d={`M ${-(f.width * 0.32).toFixed(1)} 0 Q 0 -2.4 ${(f.width * 0.32).toFixed(1)} 0`}
                    stroke={isTarget || isShift ? '#FFFFFF' : detailStroke}
                    strokeWidth="1.05"
                    strokeOpacity={isTarget || isShift ? 0.42 : 0.28}
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
                <g
                  transform={`translate(${f.pipX.toFixed(1)}, ${f.pipY.toFixed(1)}) rotate(${f.angleDeg.toFixed(1)})`}
                >
                  <path
                    d={`M ${-(f.width * 0.28).toFixed(1)} 0 Q 0 -1.5 ${(f.width * 0.28).toFixed(1)} 0`}
                    stroke={isTarget || isShift ? '#FFFFFF' : detailStroke}
                    strokeWidth="0.9"
                    strokeOpacity={isTarget || isShift ? 0.52 : 0.26}
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              </>
            )}

            {/* Clean Typing.com Rounded Fingernail Crescent */}
            <g transform={`translate(${f.tipX.toFixed(1)}, ${f.tipY.toFixed(1)}) rotate(${nailRot.toFixed(1)})`}>
              <path
                d={`M ${(-nailW / 2).toFixed(1)} 2.5 C ${(-nailW / 2).toFixed(1)} ${(-nailH).toFixed(1)}, ${(nailW / 2).toFixed(1)} ${(-nailH).toFixed(1)}, ${(nailW / 2).toFixed(1)} 2.5 Q 0 4.2 ${(-nailW / 2).toFixed(1)} 2.5 Z`}
                fill="#FFFFFF"
                fillOpacity={isTarget || isShift ? 0.42 : 0.36}
                stroke={isTarget || isShift ? '#FFFFFF' : detailStroke}
                strokeWidth="0.95"
                strokeOpacity={isTarget || isShift ? 0.85 : 0.46}
                strokeLinejoin="round"
              />
            </g>

            {/* Tactile Key-Press Pad Cushion Bloom (Only during active press downstroke) */}
            {(isTarget || isShift) && isPressed && (
              <circle
                cx={f.tipX}
                cy={f.tipY}
                r={10.5}
                fill="url(#typingComPressBloom)"
              />
            )}
          </g>
        );
      })}
    </g>
  );
};
