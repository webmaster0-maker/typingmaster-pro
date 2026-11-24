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
} from '../HandMotionEngine';

interface GlassHandRendererProps {
  pose: HandRenderPose;
  showColorZones: boolean;
}

export const GlassHandRenderer: React.FC<GlassHandRendererProps> = ({
  pose,
  showColorZones,
}) => {
  const geom = HAND_GEOMETRY[pose.hand];

  const unifiedPath = generateUnifiedHandSilhouette(
    pose.hand,
    pose.palmOffsetX || 0,
    pose.palmOffsetY || 0,
    pose.fingers
  );

  return (
    <g
      id={`${pose.hand}-glass-hand`}
      transform={`rotate(${pose.tiltDeg.toFixed(2)}, ${geom.wristCenterX}, 385)`}
      pointerEvents="none"
    >
      {/* 1. FROSTED GLASS HAND SILHOUETTE */}
      <g id={`${pose.hand}-glass-base`} filter="url(#crisp-hand-shadow)">
        <path
          d={unifiedPath}
          fill="url(#glassHandBodyGrad)"
          stroke="url(#glassHandRimGrad)"
          strokeWidth="1.5"
          strokeOpacity="0.85"
          strokeLinejoin="round"
        />
      </g>

      {/* 2. ARTICULATED FINGERS & GLOWING FINGERTIP GUIDES */}
      {Object.values(pose.fingers).map((f: FingerRenderPose) => {
        const isThumb = f.key.includes('thumb');
        const isTarget = f.isTarget;
        const isShift = Boolean(f.isShiftTarget);
        const isPressed = f.isPressed;
        const anchor = FINGER_ANCHORS[f.key];
        const zoneColor = anchor?.zoneColor || '#38BDF8';
        const activeColor = isShift ? '#818CF8' : showColorZones ? zoneColor : '#38BDF8';

        const fingerPath = isThumb
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
              14
            );

        const openFingerStroke = !isThumb
          ? generateSculptedFingerStroke(
              f.mcpX,
              f.mcpY,
              f.tipX,
              f.tipY,
              f.width,
              f.squashFactor,
              f.elevation,
              f.joints
            )
          : null;

        return (
          <g key={f.key} id={`${f.key}-glass-finger`}>
            {(isTarget || isShift || showColorZones) && (
              <path
                d={fingerPath}
                fill={isTarget || isShift ? activeColor : `url(#grad-finger-${f.key})`}
                fillOpacity={isTarget ? 0.58 : isShift ? 0.52 : 0.34}
                filter={isTarget || isShift ? 'url(#cyber-neon-glow)' : undefined}
              />
            )}

            {openFingerStroke && (isTarget || isShift) && (
              <path
                d={openFingerStroke}
                stroke={activeColor}
                strokeWidth="1.8"
                strokeOpacity="0.95"
                fill="none"
              />
            )}

            {/* Minimalist Fingertip Contact Dot */}
            <circle
              cx={f.tipX}
              cy={f.tipY}
              r={isPressed ? 6.5 : isTarget || isShift ? 5.5 : 3.2}
              fill={isTarget || isShift ? '#FFFFFF' : zoneColor}
              fillOpacity={isTarget || isShift ? 0.96 : 0.55}
              stroke={activeColor}
              strokeWidth={isTarget || isShift ? '2.2' : '1'}
            />
          </g>
        );
      })}
    </g>
  );
};
