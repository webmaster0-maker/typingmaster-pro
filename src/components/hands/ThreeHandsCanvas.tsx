import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import {
  DEFAULT_CENTERS,
  HAND_KEYS,
  keyPose,
  easeInOut,
} from './keyflowHands';

const ASSET_ROOT = '/hands/';
const FINGERS = ['index', 'middle', 'ring', 'pinky', 'thumb'] as const;
type FingerName = (typeof FINGERS)[number];
const HIGHLIGHTS = [...FINGERS, ...FINGERS.map((f) => `${f}-full`)] as const;

const ZERO_TEXTURE = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
ZERO_TEXTURE.needsUpdate = true;

interface TransformSnapshot {
  obj: THREE.Object3D;
  p: THREE.Vector3;
  q: THREE.Quaternion;
  s: THREE.Vector3;
}

interface MotionState {
  from: TransformSnapshot[];
  to: TransformSnapshot[];
  elapsed: number;
  duration: number;
}

function snapshot(root: THREE.Object3D): TransformSnapshot[] {
  const result: TransformSnapshot[] = [];
  root.traverse((obj) => {
    result.push({
      obj,
      p: obj.position.clone(),
      q: obj.quaternion.clone(),
      s: obj.scale.clone(),
    });
  });
  return result;
}

function restore(values: TransformSnapshot[]): void {
  for (const { obj, p, q, s } of values) {
    obj.position.copy(p);
    obj.quaternion.copy(q);
    obj.scale.copy(s);
  }
}

function sampleClip(root: THREE.Object3D, clip?: THREE.AnimationClip): void {
  if (!clip) return;
  for (const track of clip.tracks) {
    const binding = new THREE.PropertyBinding(root, track.name);
    binding.bind();
    const interpolant = (track as unknown as { createInterpolant: () => { evaluate: (t: number) => number[] } }).createInterpolant();
    const values = interpolant.evaluate(0);
    (binding as unknown as { setValue: (v: number[], offset: number) => void }).setValue(values, 0);
  }
}

function fit(points: [number, number][]): [number, number] {
  const n = points.length;
  if (n === 0) return [1, 0];
  const sx = points.reduce((v, p) => v + p[0], 0);
  const sy = points.reduce((v, p) => v + p[1], 0);
  const xx = points.reduce((v, p) => v + p[0] * p[0], 0);
  const xy = points.reduce((v, p) => v + p[0] * p[1], 0);
  const denom = n * xx - sx * sx;
  if (Math.abs(denom) < 1e-6) return [1, (sy - sx) / n];
  const a = (n * xy - sx * sy) / denom;
  return [a, (sy - a * sx) / n];
}

interface CustomMaterialUniforms {
  highlightMap: { value: THREE.Texture };
  highlightStrength: { value: number };
}

function createMaterial(texture: THREE.Texture): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.52,
    metalness: 0.04,
    color: 0xffffff,
    side: THREE.DoubleSide,
    toneMapped: true,
  });

  const uniforms: CustomMaterialUniforms = {
    highlightMap: { value: ZERO_TEXTURE },
    highlightStrength: { value: 0 },
  };

  material.userData.highlight = uniforms;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      '#include <common>\nuniform sampler2D highlightMap;\nuniform float highlightStrength;'
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      '#include <map_fragment>\nvec4 fingerColor = texture2D(highlightMap, vMapUv);\ndiffuseColor.rgb = mix(diffuseColor.rgb, fingerColor.rgb, fingerColor.a * highlightStrength * 0.95);'
    );
  };
  return material;
}

class ArticulatedHand {
  side: 'left' | 'right';
  root: THREE.Object3D;
  group: THREE.Group;
  clips: Map<string, THREE.AnimationClip>;
  highlights: Record<string, THREE.Texture>;
  materials: THREE.MeshStandardMaterial[] = [];
  mesh: THREE.SkinnedMesh | null = null;
  tips: Partial<Record<FingerName, { bone: THREE.Bone; point: THREE.Vector3 }>> = {};
  poseName = '';
  motion: MotionState | null = null;
  baseZ = 0;

  constructor(
    gltf: GLTF,
    side: 'left' | 'right',
    skin: THREE.Texture,
    highlights: Record<string, THREE.Texture>
  ) {
    this.side = side;
    this.root = clone(gltf.scene);
    if (side === 'right') {
      this.root.scale.x = -1;
    }
    this.group = new THREE.Group();
    this.group.add(this.root);
    this.clips = new Map(gltf.animations.map((a) => [a.name, a]));
    this.highlights = highlights;

    this.root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mat = createMaterial(skin);
        mesh.material = mat;
        mesh.frustumCulled = false;
        this.materials.push(mat);
      }
      if ((obj as THREE.SkinnedMesh).isSkinnedMesh) {
        this.mesh = obj as THREE.SkinnedMesh;
      }
    });

    for (const finger of FINGERS) {
      const tip = this.findTip(finger);
      if (tip) this.tips[finger] = tip;
    }

    this.pose(`default-${side}`, null, true);
  }

  findTip(finger: FingerName): { bone: THREE.Bone; point: THREE.Vector3 } | null {
    if (!this.mesh) return null;
    const skeleton = this.mesh.skeleton;
    const index = skeleton.bones.findIndex(
      (b) => b.name.replace(/[._]/g, '').toLowerCase() === `${finger}1`
    );
    const bone = skeleton.bones[index];
    if (!bone) return null;

    const geometry = this.mesh.geometry;
    const samples: THREE.Vector3[] = [];
    const point = new THREE.Vector3();

    for (let i = 0; i < geometry.attributes.position.count; i++) {
      let weight = 0;
      for (let j = 0; j < 4; j++) {
        if (geometry.attributes.skinIndex.getComponent(i, j) === index) {
          weight += geometry.attributes.skinWeight.getComponent(i, j);
        }
      }
      if (weight < 0.65) continue;
      point
        .fromBufferAttribute(geometry.attributes.position, i)
        .applyMatrix4(this.mesh.bindMatrix)
        .applyMatrix4(skeleton.boneInverses[index]);
      samples.push(point.clone());
    }

    if (!samples.length) return { bone, point: new THREE.Vector3(0, 0.35, 0) };

    const min = Math.min(...samples.map((p) => p.y));
    const max = Math.max(...samples.map((p) => p.y));
    const end = samples.filter((p) => p.y > max - (max - min) * 0.35);
    const center = end
      .reduce((p, v) => p.add(v), new THREE.Vector3())
      .multiplyScalar(1 / (end.length || 1));
    return { bone, point: center };
  }

  tip(finger: string): THREE.Vector3 {
    const tip = this.tips[finger as FingerName];
    return tip ? tip.bone.localToWorld(tip.point.clone()) : new THREE.Vector3();
  }

  apply(name: string): void {
    sampleClip(this.root, this.clips.get('base'));
    sampleClip(
      this.root,
      this.clips.get(name) || this.clips.get(`default-${this.side}`)
    );
    this.root.updateMatrixWorld(true);
  }

  pose(name: string, highlight: string | null = null, immediate = false): void {
    if (name !== this.poseName) {
      const from = snapshot(this.root);
      this.apply(name);
      const to = snapshot(this.root);
      if (!immediate) restore(from);
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.motion = immediate
        ? null
        : {
            from,
            to,
            elapsed: 0,
            duration: prefersReducedMotion ? 0 : 0.12,
          };
      this.poseName = name;
    }

    for (const material of this.materials) {
      const uniforms = material.userData.highlight as CustomMaterialUniforms | undefined;
      if (uniforms) {
        uniforms.highlightMap.value =
          (highlight && this.highlights[highlight]) || ZERO_TEXTURE;
        uniforms.highlightStrength.value = highlight ? 1 : 0;
      }
    }
  }

  calibrate(centers: Record<string, { x: number; y: number }>): void {
    this.group.position.set(0, 0, 0);
    this.group.scale.set(1, 1, 1);
    const xs: [number, number][] = [];
    const zs: [number, number][] = [];

    for (const [key, mapping] of Object.entries(HAND_KEYS)) {
      if (!/^[a-z]$/.test(key) || mapping.side !== this.side || !centers[key]) {
        continue;
      }
      this.apply(mapping.pose);
      this.group.updateMatrixWorld(true);
      const p = this.tip(mapping.finger.replace('-full', ''));
      xs.push([p.x, centers[key].x]);
      zs.push([p.z, centers[key].y]);
    }

    const [ax, bx] = fit(xs);
    const [az, bz] = fit(zs);
    const sx = ax / 300;
    const sz = az / 300;

    this.group.scale.set(sx, (Math.abs(sx) + Math.abs(sz)) / 2, sz);
    this.group.position.set((bx - 450) / 300, 0, (bz - 210) / 300);
    this.baseZ = this.group.position.z;
    this.apply(`default-${this.side}`);
    this.poseName = `default-${this.side}`;
    this.motion = null;
  }

  update(delta: number): void {
    if (!this.motion) return;
    const m = this.motion;
    m.elapsed += delta;
    const t = m.duration ? Math.min(1, m.elapsed / m.duration) : 1;
    const e = easeInOut(t);

    for (let i = 0; i < m.from.length; i++) {
      const a = m.from[i];
      const b = m.to[i];
      a.obj.position.lerpVectors(a.p, b.p, e);
      a.obj.quaternion.slerpQuaternions(a.q, b.q, e);
      a.obj.scale.lerpVectors(a.s, b.s, e);
    }
    this.root.updateMatrixWorld(true);
    if (t === 1) this.motion = null;
  }

  dispose(): void {
    this.materials.forEach((m) => m.dispose());
  }
}

function prepareTexture(texture: THREE.Texture): THREE.Texture {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.y = -1;
  texture.offset.y = 1;
  return texture;
}

export interface ThreeHandsCanvasProps {
  activeKey?: string | null;
  pressedKey?: string | null;
  keyCenters?: Record<string, { x: number; y: number }>;
  visible?: boolean;
}

export const ThreeHandsCanvas: React.FC<ThreeHandsCanvasProps> = ({
  activeKey = 'f',
  pressedKey = null,
  keyCenters = DEFAULT_CENTERS,
  visible = true,
}) => {
  const host = useRef<HTMLDivElement | null>(null);
  const engine = useRef<{
    hands: ArticulatedHand[];
    applyKey: () => void;
    calibrate: () => void;
    pressAt: number;
  } | null>(null);
  const latest = useRef({ activeKey, pressedKey, keyCenters, visible });
  const [failed, setFailed] = useState(false);

  latest.current = { activeKey, pressedKey, keyCenters, visible };
  const centersSignature = JSON.stringify(keyCenters);

  useEffect(() => {
    let disposed = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let observer: ResizeObserver | null = null;
    const textures: THREE.Texture[] = [];

    const applyKey = () => {
      const e = engine.current;
      if (!e?.hands) return;
      const target = keyPose(latest.current.activeKey);
      const pressed = keyPose(latest.current.pressedKey);
      const activePose = pressed.pose ? pressed : target;
      const { pose, shift } = activePose;

      for (const hand of e.hands) {
        const active = pose?.side === hand.side;
        const oppositeShift = shift && pose?.side !== hand.side;
        const name = active
          ? pose.pose
          : oppositeShift
            ? hand.side === 'left'
              ? 'bottom-row-6-left'
              : 'bottom-row-7-right'
            : `default-${hand.side}`;
        hand.pose(
          name,
          active ? pose.finger : oppositeShift ? 'pinky-full' : null
        );
      }
      e.pressAt = latest.current.pressedKey ? performance.now() : -1000;
    };

    (async () => {
      try {
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(
          -1.5,
          1.5,
          0.7,
          -0.7,
          0.1,
          100
        );
        camera.position.set(0, 5, 0);
        camera.up.set(0, 0, -1);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.setAttribute('aria-hidden', 'true');
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
        renderer.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
        });

        if (host.current) {
          host.current.appendChild(renderer.domElement);
        }

        const resize = () => {
          if (host.current && renderer) {
            const w = host.current.clientWidth || 900;
            const h = host.current.clientHeight || 420;
            renderer.setSize(w, h, false);
          }
        };

        if (host.current) {
          observer = new ResizeObserver(resize);
          observer.observe(host.current);
        }
        resize();

        scene.add(new THREE.HemisphereLight(0xfff5eb, 0x334155, 1.45));
        const target = new THREE.Vector3(0, 0, -0.825);
        for (const [color, intensity, position] of [
          [0xffffff, 2.2, [0, 0.8, -3]],
          [0xb8d4ff, 0.85, [0, 0.45, 1.9]],
        ] as [number, number, [number, number, number]][]) {
          const light = new THREE.DirectionalLight(color, intensity);
          const v = new THREE.Vector3(...position).sub(target);
          v.setLength(v.length() + 1);
          light.position.copy(target).add(v);
          light.target.position.copy(target);
          scene.add(light, light.target);
        }

        const textureLoader = new THREE.TextureLoader();
        const gltfLoader = new GLTFLoader();

        const [gltf, skin, ...maps] = await Promise.all([
          gltfLoader.loadAsync(ASSET_ROOT + 'hand.gltf'),
          textureLoader.loadAsync(ASSET_ROOT + 'base-1.jpg'),
          ...HIGHLIGHTS.map((f) =>
            textureLoader.loadAsync(ASSET_ROOT + `highlight-${f}.png`)
          ),
        ]);

        textures.push(skin, ...maps);
        if (disposed) {
          textures.forEach((t) => t.dispose());
          return;
        }

        prepareTexture(skin);
        const highlights = Object.fromEntries(
          HIGHLIGHTS.map((f, i) => [f, prepareTexture(maps[i])])
        );

        const hands: ArticulatedHand[] = (['left', 'right'] as const).map(
          (side) => new ArticulatedHand(gltf, side, skin, highlights)
        );

        for (const hand of hands) {
          scene.add(hand.group);
          hand.calibrate(latest.current.keyCenters);
        }

        const calibrate = () => {
          hands.forEach((hand) => hand.calibrate(latest.current.keyCenters));
          applyKey();
        };

        engine.current = { hands, applyKey, calibrate, pressAt: -1000 };
        applyKey();

        const clock = new THREE.Clock();
        renderer.setAnimationLoop(() => {
          if (!renderer) return;
          const delta = Math.min(clock.getDelta(), 0.05);
          if (!latest.current.visible) return;

          const age = performance.now() - (engine.current?.pressAt ?? 0);
          const pressed = keyPose(latest.current.pressedKey).pose;
          for (const hand of hands) {
            hand.update(delta);
            const pulse =
              pressed?.side === hand.side && age >= 0 && age < 180
                ? Math.sin((Math.PI * age) / 180) * 0.015
                : 0;
            hand.group.position.y = 0;
            hand.group.position.z = hand.baseZ + pulse;
          }
          renderer.render(scene, camera);
        });
      } catch (error) {
        if (!disposed) {
          console.warn('3D Hand rendering unavailable, using vector fallback', error);
          setFailed(true);
        }
      }
    })();

    return () => {
      disposed = true;
      observer?.disconnect();
      if (renderer) {
        renderer.setAnimationLoop(null);
        renderer.dispose();
        renderer.domElement.remove();
      }
      engine.current?.hands?.forEach((h) => h.dispose());
      textures.forEach((t) => t.dispose());
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    engine.current?.applyKey();
  }, [activeKey, pressedKey]);

  useEffect(() => {
    engine.current?.calibrate();
  }, [centersSignature]);

  return (
    <div
      ref={host}
      className="hands-layer absolute inset-0 w-full h-full pointer-events-none select-none z-10"
      aria-hidden="true"
      style={{
        opacity: visible ? 0.75 : 0,
        transition: 'opacity 220ms ease-in-out',
        maskImage: 'linear-gradient(to bottom, black 0%, black 78%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 78%, transparent 100%)',
        filter: 'drop-shadow(0 -2px 3px rgba(30, 41, 59, 0.35))',
      }}
    >
      {failed && (
        <svg
          viewBox="0 0 900 420"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="fallback-skin" x2=".8" y2="1">
              <stop stopColor="#d8b9ad" />
              <stop offset="1" stopColor="#af8980" />
            </linearGradient>
          </defs>
          {[false, true].map((mirror) => (
            <path
              key={String(mirror)}
              transform={mirror ? 'translate(900 0) scale(-1 1)' : undefined}
              fill="url(#fallback-skin)"
              stroke="#98776e"
              strokeWidth="2"
              d="M95 420L111 251Q109 209 122 172L139 133Q145 116 160 121Q174 128 166 149L155 192L177 126Q184 104 201 112Q213 116 210 136L198 190L224 126Q234 105 250 115Q263 125 255 147L238 202L275 158Q291 142 303 156Q312 168 297 186L277 218Q268 236 271 264L284 308Q294 329 307 306L324 275Q337 252 353 265Q369 276 356 299L332 352Q322 375 286 394L262 420Z"
            />
          ))}
        </svg>
      )}
    </div>
  );
};
