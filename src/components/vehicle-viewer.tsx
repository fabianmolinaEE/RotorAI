import { useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html, useGLTF } from "@react-three/drei";
import { DoubleSide, Box3, Vector3, Mesh } from "three";
import { cn } from "@/lib/utils";
import { subsystemLabels } from "@/data/subsystemMap";
import type { Subsystem, SubsystemKey, SubsystemStatus } from "@/data/types";

interface VehicleViewerProps {
  subsystems: Subsystem[];
  mode: "full" | "mini";
  onSubsystemClick?: (key: SubsystemKey) => void;
  className?: string;
}

const STATUS_COLORS: Record<SubsystemStatus, string> = {
  fix: "#ef4444",
  check: "#f59e0b",
  ok: "#4b5563",
};

const STATUS_EMISSIVE_INTENSITY: Record<SubsystemStatus, number> = {
  fix: 0.5,
  check: 0.3,
  ok: 0.0,
};

type GeomConfig =
  | { type: "box"; args: [number, number, number]; positions: [number, number, number][] }
  | { type: "cylinder"; args: [number, number, number, number]; positions: [number, number, number][] };

const SUBSYSTEM_GEOM: Partial<Record<SubsystemKey, GeomConfig>> = {
  engine: {
    type: "box",
    args: [1.0, 0.5, 0.9],
    positions: [[-1.2, 0, 0]],
  },
  transmission: {
    type: "box",
    args: [0.6, 0.35, 0.5],
    positions: [[-0.3, -0.2, 0]],
  },
  brakes_front: {
    type: "cylinder",
    args: [0.28, 0.28, 0.12, 12],
    positions: [
      [-1.4, -0.45, 0.72],
      [-1.4, -0.45, -0.72],
    ],
  },
  brakes_rear: {
    type: "cylinder",
    args: [0.25, 0.25, 0.12, 12],
    positions: [
      [1.3, -0.45, 0.72],
      [1.3, -0.45, -0.72],
    ],
  },
  suspension_front: {
    type: "box",
    args: [0.15, 0.5, 0.1],
    positions: [
      [-1.4, -0.2, 0.75],
      [-1.4, -0.2, -0.75],
    ],
  },
  suspension_rear: {
    type: "box",
    args: [0.15, 0.5, 0.1],
    positions: [
      [1.3, -0.2, 0.75],
      [1.3, -0.2, -0.75],
    ],
  },
  steering: {
    type: "box",
    args: [0.1, 0.1, 1.0],
    positions: [[-1.0, 0.1, 0]],
  },
  electrical: {
    type: "box",
    args: [0.4, 0.3, 0.35],
    positions: [[-1.5, 0.3, -0.4]],
  },
  exhaust: {
    type: "box",
    args: [2.2, 0.08, 0.08],
    positions: [[0.5, -0.55, 0.5]],
  },
  hvac: {
    type: "box",
    args: [0.45, 0.3, 0.5],
    positions: [[-0.8, 0.4, 0]],
  },
};

// Trigger a single render in mini mode then stop (frameloop="demand")
function FreezeMiniCanvas() {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  return null;
}

// Loads the real car GLB, auto-scales it to fit our subsystem coordinate space,
// and renders semi-transparent so the colored subsystem overlays show through.
function CarBodyModel() {
  const gltf = useGLTF("/models/toy-car.glb");

  const scaledScene = useMemo(() => {
    const cloned = gltf.scene.clone(true);

    // Bounding box in the model's own space (before we apply any transform)
    const box = new Box3().setFromObject(cloned);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Scale the longest horizontal dimension to 4.2 units to match subsystem layout
    const longestDim = Math.max(size.x, size.z);
    const s = 4.2 / longestDim;
    cloned.scale.setScalar(s);

    // Center horizontally and sit the bottom of the car at Y ≈ -0.7
    cloned.position.set(
      -center.x * s,
      -center.y * s - (size.y * s) * 0.5,
      -center.z * s,
    );

    // Semi-transparent x-ray effect — clone each material so we don't mutate the cache
    cloned.traverse((child) => {
      if (child instanceof Mesh) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map((m) => {
            const cm = m.clone();
            cm.transparent = true;
            cm.opacity = 0.55;
            cm.depthWrite = false;
            return cm;
          });
        } else {
          const cm = child.material.clone();
          cm.transparent = true;
          cm.opacity = 0.55;
          cm.depthWrite = false;
          child.material = cm;
        }
      }
    });

    return cloned;
  }, [gltf.scene]);

  // glTF cars typically face +Z; our subsystem layout has engine at X=-1.4 (front = -X).
  // Rotating the group by +π/2 around Y maps +Z → -X, aligning model front with subsystem front.
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <primitive object={scaledScene} renderOrder={1} />
    </group>
  );
}

// Shown while the GLB is loading (matches old glass-shell proportions)
function CarBodyFallback() {
  return (
    <mesh position={[0, 0, 0]} renderOrder={1}>
      <boxGeometry args={[4.2, 1.4, 1.8]} />
      <meshStandardMaterial
        color="#94a3b8"
        opacity={0.2}
        transparent
        depthWrite={false}
        side={DoubleSide}
        roughness={0.1}
        metalness={0.0}
      />
    </mesh>
  );
}

interface SubsystemMeshProps {
  subsystem: Subsystem;
  mode: "full" | "mini";
  hovered: SubsystemKey | null;
  onHover: (key: SubsystemKey | null) => void;
  onSubsystemClick?: (key: SubsystemKey) => void;
}

function SubsystemMeshGroup({ subsystem, mode, hovered, onHover, onSubsystemClick }: SubsystemMeshProps) {
  const config = SUBSYSTEM_GEOM[subsystem.key];
  if (!config) return null;

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  const color = STATUS_COLORS[subsystem.status];
  const emissiveIntensity = STATUS_EMISSIVE_INTENSITY[subsystem.status];
  const isHovered = hovered === subsystem.key;

  return (
    <>
      {config.positions.map((pos, i) => (
        <mesh
          key={i}
          position={pos}
          onPointerOver={
            mode === "full"
              ? (e) => {
                  e.stopPropagation();
                  onHover(subsystem.key);
                  document.body.style.cursor = "pointer";
                }
              : undefined
          }
          onPointerOut={
            mode === "full"
              ? () => {
                  onHover(null);
                  document.body.style.cursor = "auto";
                }
              : undefined
          }
          onPointerDown={
            mode === "full" && subsystem.status !== "ok"
              ? (e) => {
                  e.stopPropagation();
                  onSubsystemClick?.(subsystem.key);
                }
              : undefined
          }
        >
          {config.type === "box" ? (
            <boxGeometry args={config.args} />
          ) : (
            <cylinderGeometry args={config.args} />
          )}
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
            roughness={0.4}
            metalness={0.3}
          />
          {isHovered && mode === "full" && i === 0 && (
            <Html
              center
              position={[0, 0.4, 0]}
              style={{ pointerEvents: "none" }}
              zIndexRange={[10, 0]}
            >
              <div className="rounded-sm border bg-card px-2 py-1 text-xs font-semibold shadow-md">
                {subsystemLabels[subsystem.key]}
              </div>
            </Html>
          )}
        </mesh>
      ))}
    </>
  );
}

export function VehicleViewer({ subsystems, mode, onSubsystemClick, className }: VehicleViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<SubsystemKey | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn("bg-background", className)} aria-hidden />;
  }

  const mechanicalSubsystems = subsystems.filter((s) => s.key !== "body");

  return (
    <div
      className={cn("relative", className)}
      style={mode === "mini" ? { pointerEvents: "none" } : undefined}
    >
      <Canvas
        frameloop={mode === "mini" ? "demand" : "always"}
        camera={{
          position: mode === "mini" ? [0, 2.0, 5.5] : [0, 2.5, 6],
          fov: 45,
        }}
        aria-label="Interactive 3D vehicle diagram"
        role={mode === "mini" ? "img" : "application"}
      >
        {mode === "mini" && <FreezeMiniCanvas />}

        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <directionalLight position={[-3, 3, -5]} intensity={0.4} />

        {/* Subsystem status overlays (rendered before car body so they're visible through it) */}
        {mechanicalSubsystems.map((subsystem) => (
          <SubsystemMeshGroup
            key={subsystem.key}
            subsystem={subsystem}
            mode={mode}
            hovered={hovered}
            onHover={setHovered}
            onSubsystemClick={onSubsystemClick}
          />
        ))}

        {/* Real car body — falls back to glass box while loading */}
        <Suspense fallback={<CarBodyFallback />}>
          <CarBodyModel />
        </Suspense>

        {mode === "full" && (
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI - 0.3}
            enablePan={false}
            autoRotate={false}
          />
        )}
      </Canvas>
    </div>
  );
}

// Preload so the model is cached before the first VehicleViewer mounts
useGLTF.preload("/models/toy-car.glb");
