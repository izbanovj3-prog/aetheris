"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { getStations, mulberry32 } from "@/lib/data";

/* Decorative global uplink nodes for the hero globe — independent of the
   national station network so the data arcs still span the whole planet.
   Astana anchors the set, signalling Kazakhstan at the centre of the grid. */
const WORLD_NODES: Array<[number, number]> = [
  [51.17, 71.43], // Astana (anchor)
  [43.24, 76.89], // Almaty
  [40.71, -74.01], // New York
  [51.51, -0.13], // London
  [48.86, 2.35], // Paris
  [55.76, 37.62], // Moscow
  [35.68, 139.69], // Tokyo
  [1.35, 103.82], // Singapore
  [-33.87, 151.21], // Sydney
  [19.43, -99.13], // Mexico City
  [-23.55, -46.63], // São Paulo
  [28.61, 77.21], // Delhi
  [30.04, 31.24], // Cairo
  [-1.29, 36.82], // Nairobi
  [37.57, 126.98], // Seoul
  [25.2, 55.27], // Dubai
];

/* ── Geometry helpers ─────────────────────────────────────── */

function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

type Ring = Array<[number, number]>;

function pointInRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

interface LandData {
  polygons: Array<{ outer: Ring; holes: Ring[]; bbox: [number, number, number, number] }>;
}

function parseLand(geojson: {
  features: Array<{ geometry: { type: string; coordinates: unknown } }>;
}): LandData {
  const polygons: LandData["polygons"] = [];
  const addPoly = (coords: Ring[]) => {
    const outer = coords[0];
    let minX = 180, minY = 90, maxX = -180, maxY = -90;
    for (const [x, y] of outer) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    polygons.push({ outer, holes: coords.slice(1), bbox: [minX, minY, maxX, maxY] });
  };
  for (const f of geojson.features) {
    if (f.geometry.type === "Polygon") addPoly(f.geometry.coordinates as Ring[]);
    else if (f.geometry.type === "MultiPolygon")
      for (const p of f.geometry.coordinates as Ring[][]) addPoly(p);
  }
  return { polygons };
}

function isLand(lon: number, lat: number, land: LandData): boolean {
  for (const p of land.polygons) {
    const [minX, minY, maxX, maxY] = p.bbox;
    if (lon < minX || lon > maxX || lat < minY || lat > maxY) continue;
    if (pointInRing(lon, lat, p.outer)) {
      let inHole = false;
      for (const h of p.holes)
        if (pointInRing(lon, lat, h)) {
          inHole = true;
          break;
        }
      if (!inHole) return true;
    }
  }
  return false;
}

/* ── Land particle field ──────────────────────────────────── */

function LandPoints({ land }: { land: LandData }) {
  const { positions, colors } = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    const emerald = new THREE.Color("#2de2a6");
    const cyan = new THREE.Color("#4fd8f7");
    const atmos = new THREE.Color("#4f9dde");
    const step = 1.05;
    for (let lat = -88; lat <= 88; lat += step) {
      // keep longitudinal density even across latitudes
      const lonStep = step / Math.max(Math.cos((lat * Math.PI) / 180), 0.18);
      for (let lon = -180; lon < 180; lon += lonStep) {
        if (!isLand(lon, lat, land)) continue;
        const v = latLonToVec3(lat, lon, 1);
        pos.push(v.x, v.y, v.z);
        // emerald equator → cyan mid → atmospheric blue poles
        const t = Math.abs(lat) / 88;
        const c =
          t < 0.5
            ? emerald.clone().lerp(cyan, t * 2)
            : cyan.clone().lerp(atmos, (t - 0.5) * 2);
        col.push(c.r, c.g, c.b);
      }
    }
    return {
      positions: new Float32Array(pos),
      colors: new Float32Array(col),
    };
  }, [land]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.0115}
        sizeAttenuation
        transparent
        opacity={0.95}
        depthWrite={false}
      />
    </points>
  );
}

/* ── Atmosphere (fresnel shader, backside) ────────────────── */

const atmosphereVert = /* glsl */ `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const atmosphereFrag = /* glsl */ `
varying vec3 vNormal;
void main() {
  float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, -1.0)), 3.5);
  vec3 glow = mix(vec3(0.31, 0.62, 0.87), vec3(0.18, 0.89, 0.65), 0.35);
  gl_FragColor = vec4(glow, 1.0) * intensity;
}`;

function Atmosphere() {
  return (
    <mesh scale={1.16}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        vertexShader={atmosphereVert}
        fragmentShader={atmosphereFrag}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/* ── Data arcs between stations ───────────────────────────── */

function Arcs() {
  const group = useRef<THREE.Group>(null);
  const arcs = useMemo(() => {
    const r = mulberry32(777);
    const out: Array<{ curve: THREE.QuadraticBezierCurve3; phase: number }> = [];
    for (let i = 0; i < 14; i++) {
      const ai = Math.floor(r() * WORLD_NODES.length);
      const bi = Math.floor(r() * WORLD_NODES.length);
      if (ai === bi) continue;
      const a = WORLD_NODES[ai];
      const b = WORLD_NODES[bi];
      const va = latLonToVec3(a[0], a[1], 1.005);
      const vb = latLonToVec3(b[0], b[1], 1.005);
      const mid = va
        .clone()
        .add(vb)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(1 + va.distanceTo(vb) * 0.38);
      out.push({
        curve: new THREE.QuadraticBezierCurve3(va, mid, vb),
        phase: r() * Math.PI * 2,
      });
    }
    return out;
  }, []);

  const lines = useMemo(
    () =>
      arcs.map(({ curve }) => {
        const pts = curve.getPoints(48);
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineDashedMaterial({
          color: new THREE.Color("#4fd8f7"),
          transparent: true,
          opacity: 0.4,
          dashSize: 0.09,
          gapSize: 0.05,
          depthWrite: false,
        });
        const line = new THREE.Line(geo, mat);
        line.computeLineDistances();
        return line;
      }),
    [arcs],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    lines.forEach((line, i) => {
      const mat = line.material as THREE.LineDashedMaterial;
      mat.scale = 1 + 0.25 * Math.sin(t * 0.5 + arcs[i].phase);
      mat.opacity = 0.18 + 0.26 * (0.5 + 0.5 * Math.sin(t * 0.7 + arcs[i].phase));
    });
  });

  return (
    <group ref={group}>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}

/* ── Monitored network nodes (Kazakhstan) ─────────────────── */

function NetworkPoints() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos: number[] = [];
    for (const s of getStations()) {
      const v = latLonToVec3(s.lat, s.lon, 1.012);
      pos.push(v.x, v.y, v.z);
    }
    return new Float32Array(pos);
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.PointsMaterial;
    m.size = 0.026 + 0.01 * Math.sin(clock.elapsedTime * 2.4);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#2de2a6"
        size={0.028}
        sizeAttenuation
        transparent
        opacity={0.95}
        depthWrite={false}
      />
    </points>
  );
}

/* ── Scene ────────────────────────────────────────────────── */

function Scene({ land, reducedMotion }: { land: LandData; reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame((_, delta) => {
    if (!group.current || reducedMotion) return;
    group.current.rotation.y += delta * 0.055;
    // gentle parallax toward cursor
    const targetX = pointer.y * 0.18;
    const targetZ = -pointer.x * 0.08;
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.04;
    group.current.rotation.z += (targetZ - group.current.rotation.z) * 0.04;
  });

  return (
    <>
      <group ref={group}>
        {/* dark ocean body */}
        <mesh>
          <sphereGeometry args={[0.985, 64, 64]} />
          <meshBasicMaterial color="#060d12" transparent opacity={0.92} />
        </mesh>
        <LandPoints land={land} />
        <Arcs />
        <NetworkPoints />
        {/* faint wireframe graticule */}
        <mesh>
          <sphereGeometry args={[1.0, 28, 28]} />
          <meshBasicMaterial
            color="#27424d"
            wireframe
            transparent
            opacity={0.05}
          />
        </mesh>
      </group>
      <Atmosphere />
    </>
  );
}

/* ── Export ───────────────────────────────────────────────── */

export default function Globe({ className = "" }: { className?: string }) {
  const [land, setLand] = useState<LandData | null>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = !!useReducedMotion();

  useEffect(() => {
    let alive = true;
    fetch("/data/land.json")
      .then((r) => r.json())
      .then((g) => {
        if (!alive) return;
        setLand(parseLand(g));
        requestAnimationFrame(() => setVisible(true));
      })
      .catch(() => {
        /* globe simply stays hidden — page remains fully usable */
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div
      className={`transition-opacity duration-[2000ms] ease-out ${visible ? "opacity-100" : "opacity-0"} ${className}`}
      aria-hidden
    >
      {land && (
        <Canvas
          camera={{ position: [0, 0.25, 2.55], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
          frameloop={reducedMotion ? "demand" : "always"}
        >
          <Scene land={land} reducedMotion={reducedMotion} />
        </Canvas>
      )}
    </div>
  );
}
