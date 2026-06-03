import { useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { DoubleSide } from "three";
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
  fix: 0.4,
  check: 0.25,
  ok: 0.0,
};

// Primitive geometry config for each mechanical subsystem key.
// The body key maps to the glass shell (rendered separately) — not included here.
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

// Scene helper: trigger a single frame render in mini mode then stop (frameloop="demand")
function FreezeMiniCanvas() {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  return null;
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

  // Filter to only mechanical subsystems (skip body — rendered as glass shell)
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

        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <directionalLight position={[-3, 3, -5]} intensity={0.4} />

        {/* Mechanical subsystem meshes */}
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

        {/* Glass car body shell — rendered last (renderOrder=1) to avoid z-fighting */}
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

        {/* Orbit controls — full mode only */}
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
