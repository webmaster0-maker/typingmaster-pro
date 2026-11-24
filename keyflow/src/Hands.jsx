import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { HAND_KEYS, DEFAULT_CENTERS, keyPose, easeInOut } from "./hands";

const ASSET_ROOT = "/hands/";
const FINGERS = ["index", "middle", "ring", "pinky", "thumb"];
const HIGHLIGHTS = [...FINGERS, ...FINGERS.map((f) => `${f}-full`)];
const ZERO_TEXTURE = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
ZERO_TEXTURE.needsUpdate = true;

function snapshot(root) {
  const result = [];
  root.traverse((obj) =>
    result.push({
      obj,
      p: obj.position.clone(),
      q: obj.quaternion.clone(),
      s: obj.scale.clone(),
    }),
  );
  return result;
}
function restore(values) {
  for (const { obj, p, q, s } of values) {
    obj.position.copy(p);
    obj.quaternion.copy(q);
    obj.scale.copy(s);
  }
}
function sampleClip(root, clip) {
  if (!clip) return;
  for (const track of clip.tracks) {
    const binding = new THREE.PropertyBinding(root, track.name);
    binding.bind();
    const values = track.createInterpolant().evaluate(0);
    binding.setValue(values, 0);
  }
}
function fit(points) {
  const n = points.length;
  const sx = points.reduce((v, p) => v + p[0], 0),
    sy = points.reduce((v, p) => v + p[1], 0);
  const xx = points.reduce((v, p) => v + p[0] * p[0], 0),
    xy = points.reduce((v, p) => v + p[0] * p[1], 0);
  const a = (n * xy - sx * sy) / (n * xx - sx * sx);
  return [a, (sy - a * sx) / n];
}
function createMaterial(texture) {
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.55,
    metalness: 0,
    color: 0xffffff,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const uniforms = {
    highlightMap: { value: ZERO_TEXTURE },
    highlightStrength: { value: 0 },
  };
  material.userData.highlight = uniforms;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      "#include <common>\nuniform sampler2D highlightMap;\nuniform float highlightStrength;",
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      "#include <map_fragment>\nvec4 fingerColor = texture2D(highlightMap, vMapUv);\ndiffuseColor.rgb = mix(diffuseColor.rgb, fingerColor.rgb, fingerColor.a * highlightStrength * .95);",
    );
  };
  return material;
}

class ArticulatedHand {
  constructor(gltf, side, skin, highlights) {
    this.side = side;
    this.root = clone(gltf.scene);
    if (side === "right") this.root.scale.x = -1;
    this.group = new THREE.Group();
    this.group.add(this.root);
    this.clips = new Map(gltf.animations.map((a) => [a.name, a]));
    this.highlights = highlights;
    this.materials = [];
    this.root.traverse((obj) => {
      if (obj.isMesh) {
        obj.material = createMaterial(skin);
        obj.frustumCulled = false;
        this.materials.push(obj.material);
      }
      if (obj.isSkinnedMesh) this.mesh = obj;
    });
    this.tips = {};
    for (const finger of FINGERS) this.tips[finger] = this.findTip(finger);
    this.pose(`default-${side}`, null, true);
  }
  findTip(finger) {
    const skeleton = this.mesh.skeleton;
    const index = skeleton.bones.findIndex(
      (b) => b.name.replace(/[._]/g, "").toLowerCase() === `${finger}1`,
    );
    const bone = skeleton.bones[index];
    if (!bone) return null;
    const geometry = this.mesh.geometry,
      samples = [];
    const point = new THREE.Vector3();
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      let weight = 0;
      for (let j = 0; j < 4; j++)
        if (geometry.attributes.skinIndex.getComponent(i, j) === index)
          weight += geometry.attributes.skinWeight.getComponent(i, j);
      if (weight < 0.65) continue;
      point
        .fromBufferAttribute(geometry.attributes.position, i)
        .applyMatrix4(this.mesh.bindMatrix)
        .applyMatrix4(skeleton.boneInverses[index]);
      samples.push(point.clone());
    }
    if (!samples.length) return { bone, point: new THREE.Vector3(0, 0.35, 0) };
    const min = Math.min(...samples.map((p) => p.y)),
      max = Math.max(...samples.map((p) => p.y));
    const end = samples.filter((p) => p.y > max - (max - min) * 0.35);
    const center = end
      .reduce((p, v) => p.add(v), new THREE.Vector3())
      .multiplyScalar(1 / end.length);
    return { bone, point: center };
  }
  tip(finger) {
    const tip = this.tips[finger];
    return tip ? tip.bone.localToWorld(tip.point.clone()) : new THREE.Vector3();
  }
  apply(name) {
    sampleClip(this.root, this.clips.get("base"));
    sampleClip(
      this.root,
      this.clips.get(name) || this.clips.get(`default-${this.side}`),
    );
    this.root.updateMatrixWorld(true);
  }
  pose(name, highlight, immediate = false) {
    if (name !== this.poseName) {
      const from = snapshot(this.root);
      this.apply(name);
      const to = snapshot(this.root);
      if (!immediate) restore(from);
      this.motion = immediate
        ? null
        : {
            from,
            to,
            elapsed: 0,
            duration: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? 0
              : 0.2,
          };
      this.poseName = name;
    }
    for (const material of this.materials) {
      material.userData.highlight.highlightMap.value =
        this.highlights[highlight] || ZERO_TEXTURE;
      material.userData.highlight.highlightStrength.value = highlight ? 1 : 0;
    }
  }
  calibrate(centers) {
    this.group.position.set(0, 0, 0);
    this.group.scale.set(1, 1, 1);
    const xs = [],
      zs = [];
    for (const [key, mapping] of Object.entries(HAND_KEYS)) {
      if (!/^[a-z]$/.test(key) || mapping.side !== this.side || !centers[key])
        continue;
      this.apply(mapping.pose);
      this.group.updateMatrixWorld(true);
      const p = this.tip(mapping.finger.replace("-full", ""));
      xs.push([p.x, centers[key].x]);
      zs.push([p.z, centers[key].y]);
    }
    const [ax, bx] = fit(xs),
      [az, bz] = fit(zs);
    const sx = ax / 300,
      sz = az / 300;
    // Fit each keyboard's real key centers, so guidance stays aligned responsively.
    this.group.scale.set(sx, (Math.abs(sx) + Math.abs(sz)) / 2, sz);
    this.group.position.set((bx - 450) / 300, 0, (bz - 210) / 300);
    this.baseZ = this.group.position.z;
    this.apply(`default-${this.side}`);
    this.poseName = `default-${this.side}`;
    this.motion = null;
  }
  update(delta) {
    if (!this.motion) return;
    const m = this.motion;
    m.elapsed += delta;
    const t = m.duration ? Math.min(1, m.elapsed / m.duration) : 1,
      e = easeInOut(t);
    for (let i = 0; i < m.from.length; i++) {
      const a = m.from[i],
        b = m.to[i];
      a.obj.position.lerpVectors(a.p, b.p, e);
      a.obj.quaternion.slerpQuaternions(a.q, b.q, e);
      a.obj.scale.lerpVectors(a.s, b.s, e);
    }
    this.root.updateMatrixWorld(true);
    if (t === 1) this.motion = null;
  }
  dispose() {
    this.materials.forEach((m) => m.dispose());
  }
}

function prepareTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.y = -1;
  texture.offset.y = 1;
  return texture;
}

/** Real skinned hands. Parent stage coordinates: 900 × 420, keyboard at y=0. */
export default function Hands({
  activeKey = "f",
  pressedKey = null,
  keyCenters = DEFAULT_CENTERS,
  visible = true,
}) {
  const host = useRef(null),
    engine = useRef(null),
    latest = useRef({ activeKey, pressedKey, keyCenters, visible });
  const [failed, setFailed] = useState(false);
  latest.current = { activeKey, pressedKey, keyCenters, visible };
  const centersSignature = JSON.stringify(keyCenters);

  useEffect(() => {
    let disposed = false,
      renderer,
      observer;
    const textures = [];
    const applyKey = () => {
      const e = engine.current;
      if (!e?.hands) return;
      const { pose, shift } = keyPose(latest.current.activeKey);
      for (const hand of e.hands) {
        const active = pose?.side === hand.side;
        const oppositeShift = shift && pose?.side !== hand.side;
        const name = active
          ? pose.pose
          : oppositeShift
            ? hand.side === "left"
              ? "bottom-row-6-left"
              : "bottom-row-7-right"
            : `default-${hand.side}`;
        hand.pose(
          name,
          active ? pose.finger : oppositeShift ? "pinky-full" : null,
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
          100,
        );
        camera.position.set(0, 5, 0);
        camera.up.set(0, 0, -1);
        camera.lookAt(0, 0, 0);
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0, 0);
        renderer.domElement.setAttribute("aria-hidden", "true");
        host.current.appendChild(renderer.domElement);
        const resize = () => {
          if (host.current)
            renderer.setSize(
              host.current.clientWidth,
              host.current.clientHeight,
              false,
            );
        };
        observer = new ResizeObserver(resize);
        observer.observe(host.current);
        resize();
        scene.add(new THREE.HemisphereLight(0xffffff, 6320264, 1.83));
        const target = new THREE.Vector3(0, 0, -0.825);
        for (const [color, intensity, position] of [
          [0xffffff, 2.28, [0, 0.8, -3]],
          [0xb8d4ff, 0.78, [0, 0.45, 1.9]],
        ]) {
          const light = new THREE.DirectionalLight(color, intensity);
          const v = new THREE.Vector3(...position).sub(target);
          v.setLength(v.length() + 1);
          light.position.copy(target).add(v);
          light.target.position.copy(target);
          scene.add(light, light.target);
        }
        const loader = new THREE.TextureLoader();
        const [gltf, skin, ...maps] = await Promise.all([
          new GLTFLoader().loadAsync(ASSET_ROOT + "hand.gltf"),
          loader.loadAsync(ASSET_ROOT + "base-1.jpg"),
          ...HIGHLIGHTS.map((f) =>
            loader.loadAsync(ASSET_ROOT + `highlight-${f}.png`),
          ),
        ]);
        textures.push(skin, ...maps);
        if (disposed) {
          textures.forEach((t) => t.dispose());
          return;
        }
        prepareTexture(skin);
        const highlights = Object.fromEntries(
          HIGHLIGHTS.map((f, i) => [f, prepareTexture(maps[i])]),
        );
        const hands = ["left", "right"].map(
          (side) => new ArticulatedHand(gltf, side, skin, highlights),
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
          const delta = Math.min(clock.getDelta(), 0.05);
          if (!latest.current.visible) return;
          const age = performance.now() - engine.current.pressAt;
          for (const hand of hands) {
            hand.update(delta);
            const pressed = keyPose(latest.current.pressedKey).pose;
            const pulse =
              pressed?.side === hand.side && age < 180
                ? Math.sin((Math.PI * age) / 180) * 0.008
                : 0;
            hand.group.position.z = hand.baseZ + pulse;
          }
          renderer.render(scene, camera);
        });
      } catch (error) {
        if (!disposed) {
          console.warn("Hand rendering unavailable", error);
          setFailed(true);
        }
      }
    })();
    return () => {
      disposed = true;
      observer?.disconnect();
      renderer?.setAnimationLoop(null);
      engine.current?.hands?.forEach((h) => h.dispose());
      textures.forEach((t) => t.dispose());
      renderer?.dispose();
      renderer?.domElement.remove();
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
      className="hands-layer"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: visible ? 0.56 : 0,
        transition: "opacity 180ms",
        maskImage:
          "linear-gradient(to bottom, black 0%, black 77%, transparent 99%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, black 0%, black 77%, transparent 99%)",
        filter: "drop-shadow(0 -1px 1px #48332e66)",
      }}
    >
      {failed && (
        <svg viewBox="0 0 900 420" width="100%" height="100%">
          <defs>
            <linearGradient id="fallback-skin" x2=".8" y2="1">
              <stop stopColor="#d8b9ad" />
              <stop offset="1" stopColor="#af8980" />
            </linearGradient>
          </defs>
          {[false, true].map((mirror) => (
            <path
              key={String(mirror)}
              transform={mirror ? "translate(900 0) scale(-1 1)" : undefined}
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
}
