import React from 'react';
import {
  HandRenderPose,
  SkinPalette,
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

interface HumanHandRendererProps {
  pose: HandRenderPose;
  palette: SkinPalette;
  showColorZones: boolean;
}

export const HumanHandRenderer: React.FC<HumanHandRendererProps> = ({
  pose,
  palette,
  showColorZones,
}) => {
  const isLeft = pose.hand === 'left';
  const geom = HAND_GEOMETRY[pose.hand];
  const palmGrad = isLeft ? 'url(#humanPalmGradLeft)' : 'url(#humanPalmGradRight)';
  const thenarGrad = isLeft ? 'url(#thenarWarmthLeft)' : 'url(#thenarWarmthRight)';

  const unifiedHandPath = generateUnifiedHandSilhouette(
    pose.hand,
    pose.palmOffsetX || 0,
    pose.palmOffsetY || 0,
    pose.fingers
  );

  const wristBaseX = geom.wristCenterX + (pose.palmOffsetX || 0) * 0.25;
  const wristBaseY = geom.wristCenterY;

  return (
    <g
      id={`${pose.hand}-human-hand`}
      transform={`rotate(${pose.tiltDeg.toFixed(2)}, ${geom.wristCenterX}, 385)`}
      pointerEvents="none"
    >
      {/* 1. UNIFIED SEAMLESS ANATOMICAL HAND SILHOUETTE */}
      <g id={`${pose.hand}-unified-base`} filter="url(#hand-natural-shadow)">
        <path
          d={unifiedHandPath}
          fill={palmGrad}
          stroke={palette.stroke}
          strokeWidth="1.0"
          strokeOpacity="0.72"
          strokeLinejoin="round"
        />

        {/* Subtle Thenar Eminence Shading (Symmetrical around palm center) */}
        {isLeft ? (
          <ellipse
            cx={geom.palmCenterX + 44 + (pose.palmOffsetX || 0) * 0.4}
            cy={356 + (pose.palmOffsetY || 0) * 0.3}
            rx="34"
            ry="44"
            fill={thenarGrad}
          />
        ) : (
          <ellipse
            cx={geom.palmCenterX - 44 + (pose.palmOffsetX || 0) * 0.4}
            cy={356 + (pose.palmOffsetY || 0) * 0.3}
            rx="34"
            ry="44"
            fill={thenarGrad}
          />
        )}

        {/* Dorsal Metacarpal Extensor Tendons */}
        <g opacity="0.65">
          {Object.values(pose.fingers)
            .filter((f) => !f.key.includes('thumb'))
            .map((f) => {
              const midX = (wristBaseX + f.mcpX) * 0.5;
              const midY = (wristBaseY + f.mcpY) * 0.5 + 8;
              return (
                <path
                  key={`tendon-${f.key}`}
                  d={`M ${wristBaseX.toFixed(1)} ${wristBaseY.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${f.mcpX.toFixed(1)} ${f.mcpY.toFixed(1)}`}
                  stroke="url(#tendonSheenGrad)"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  fill="none"
                />
              );
            })}
        </g>
      </g>

      {/* 2. PHALANX DETAILS, NAILS & ACTIVE HIGHLIGHTS */}
      {Object.values(pose.fingers).map((f: FingerRenderPose) => {
        const isThumb = f.key.includes('thumb');
        const isTarget = f.isTarget;
        const isShift = Boolean(f.isShiftTarget);
        const isPressed = f.isPressed;
        const anchor = FINGER_ANCHORS[f.key];
        const zoneColor = anchor?.zoneColor || palette.activeAura;
        const highlightColor = isShift ? '#6366F1' : palette.activeAura;

        const nailW = f.width * 0.62 * f.squashFactor;
        const nailH = 10.5;
        const nailRot = isThumb ? (isLeft ? 32 : -32) : f.angleDeg;

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
          <g key={f.key} id={`${f.key}-human-group`}>
            {(isTarget || isShift) && (
              <path
                d={fingerFillPath}
                fill={isShift ? 'url(#typingComShiftFingerGrad)' : 'url(#humanActiveFingerSkinGrad)'}
                opacity="0.65"
              />
            )}

            {openFingerStroke && (
              <path
                d={openFingerStroke}
                stroke={isTarget || isShift ? highlightColor : palette.stroke}
                strokeWidth={isTarget || isShift ? '1.6' : '0.75'}
                strokeOpacity={isTarget || isShift ? '0.9' : '0.45'}
                fill="none"
              />
            )}

            {/* Knuckle Creases */}
            {!isThumb && (
              <>
                <g transform={`translate(${f.pipX.toFixed(1)}, ${f.pipY.toFixed(1)}) rotate(${f.angleDeg.toFixed(1)})`}>
                  <path
                    d={`M ${-(f.width * 0.30).toFixed(1)} -0.5 Q 0 -2.4 ${(f.width * 0.30).toFixed(1)} -0.5`}
                    stroke={palette.creaseStroke}
                    strokeWidth="0.75"
                    strokeOpacity="0.38"
                    fill="none"
                  />
                </g>
                <g transform={`translate(${f.dipX.toFixed(1)}, ${f.dipY.toFixed(1)}) rotate(${f.angleDeg.toFixed(1)})`}>
                  <path
                    d={`M ${-(f.width * 0.25).toFixed(1)} -0.5 Q 0 -2.0 ${(f.width * 0.25).toFixed(1)} -0.5`}
                    stroke={palette.creaseStroke}
                    strokeWidth="0.65"
                    strokeOpacity="0.32"
                    fill="none"
                  />
                </g>
              </>
            )}

            {/* Fingernail */}
            <g transform={`translate(${f.tipX.toFixed(1)}, ${f.tipY.toFixed(1)}) rotate(${nailRot.toFixed(1)})`}>
              <path
                d={`
                  M ${-nailW / 2} ${nailH * 0.42}
                  C ${-nailW / 2} ${-nailH * 0.22}, ${-nailW / 2 + 1} ${-nailH * 0.78}, 0 ${-nailH * 0.84}
                  C ${nailW / 2 - 1} ${-nailH * 0.78}, ${nailW / 2} ${-nailH * 0.22}, ${nailW / 2} ${nailH * 0.42}
                  Z
                `}
                fill="url(#nailPlateGrad)"
                stroke={palette.stroke}
                strokeWidth="0.6"
                strokeOpacity="0.55"
              />
              <ellipse cx={0} cy={nailH * 0.28} rx={nailW * 0.28} ry={nailH * 0.18} fill="url(#nailLunulaGrad)" />

              {showColorZones && (
                <circle cx={0} cy={0} r="3.6" fill={zoneColor} stroke="#FFFFFF" strokeWidth="1" />
              )}
            </g>

            {(isTarget || isShift) && (
              <g>
                <circle
                  cx={f.tipX}
                  cy={f.tipY}
                  r={isPressed ? 16 : 11}
                  fill="url(#touchPulseWave)"
                  opacity={isPressed ? 0.85 : 0.5}
                />
                <circle
                  cx={f.tipX}
                  cy={f.tipY}
                  r={isPressed ? 5.2 : 4.2}
                  fill="#FFFFFF"
                  stroke={highlightColor}
                  strokeWidth="2.0"
                />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};
