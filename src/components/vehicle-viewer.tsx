import { useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Edges, OrbitControls, Html } from "@react-three/drei";
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
  ok: "#64748b",
};

const STATUS_EMISSIVE_INTENSITY: Record<SubsystemStatus, number> = {
  fix: 0.35,
  check: 0.2,
  ok: 0.0,
};

type GeomConfig =
  | { type: "box"; args: [number, number, number]; positions: [number, number, number][] }
  | { type: "cylinder"; args: [number, number, number, number]; positions: [number, number, number][] };

const SUBSYSTEM_GEOM: Partial<Record<SubsystemKey, GeomConfig>> = {
  engine: {
    type: "box",
    args: [0.85, 0.28, 0.6],
    positions: [[-1.35, -0.05, 0]],
  },
  transmission: {
    type: "box",
    args: [0.62, 0.24, 0.42],
    positions: [[-0.18, -0.14, 0]],
  },
  brakes_front: {
    type: "cylinder",
    args: [0.18, 0.18, 0.08, 24],
    positions: [
      [-1.5, -0.48, 0.82],
      [-1.5, -0.48, -0.82],
    ],
  },
  brakes_rear: {
    type: "cylinder",
    args: [0.16, 0.16, 0.08, 24],
    positions: [
      [1.32, -0.48, 0.82],
      [1.32, -0.48, -0.82],
    ],
  },
  suspension_front: {
    type: "box",
    args: [0.08, 0.35, 0.08],
    positions: [
      [-1.5, -0.28, 0.76],
      [-1.5, -0.28, -0.76],
    ],
  },
  suspension_rear: {
    type: "box",
    args: [0.08, 0.35, 0.08],
    positions: [
      [1.32, -0.28, 0.76],
      [1.32, -0.28, -0.76],
    ],
  },
  steering: {
    type: "box",
    args: [0.08, 0.08, 0.75],
    positions: [[-0.95, 0.08, 0]],
  },
  electrical: {
    type: "box",
    args: [0.28, 0.2, 0.24],
    positions: [[-1.65, 0.08, -0.36]],
  },
  exhaust: {
    type: "box",
    args: [2.0, 0.05, 0.05],
    positions: [[0.42, -0.58, 0.45]],
  },
  hvac: {
    type: "box",
    args: [0.34, 0.2, 0.38],
    positions: [[-0.72, 0.18, 0]],
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

interface ShellBoxProps {
  args: [number, number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  opacity?: number;
  edgeOpacity?: number;
}

function ShellBox({
  args,
  position,
  rotation = [0, 0, 0],
  color = "#7dd3fc",
  opacity = 0.12,
  edgeOpacity = 0.46,
}: ShellBoxProps) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={color}
        opacity={opacity}
        transparent
        depthWrite={false}
        side={DoubleSide}
        roughness={0.2}
        metalness={0.0}
      />
      <Edges color="#bae6fd" transparent opacity={edgeOpacity} />
    </mesh>
  );
}

function CarBodyModel() {
  return (
    <group renderOrder={1}>
      <ShellBox args={[4.35, 0.34, 1.5]} position={[0, -0.42, 0]} opacity={0.1} edgeOpacity={0.5} />
      <ShellBox args={[1.38, 0.2, 1.42]} position={[-1.44, -0.18, 0]} rotation={[0, 0, -0.08]} opacity={0.12} />
      <ShellBox args={[1.12, 0.2, 1.42]} position={[1.55, -0.18, 0]} rotation={[0, 0, 0.05]} opacity={0.12} />
      <ShellBox args={[2.24, 0.42, 1.28]} position={[0.18, 0.06, 0]} opacity={0.055} edgeOpacity={0.4} />
      <ShellBox args={[1.1, 0.12, 1.04]} position={[0.36, 0.38, 0]} opacity={0.06} edgeOpacity={0.5} />
      <ShellBox args={[0.12, 0.12, 1.56]} position={[-2.12, -0.36, 0]} color="#fef3c7" opacity={0.38} edgeOpacity={0.2} />
      <ShellBox args={[0.12, 0.12, 1.56]} position={[2.15, -0.36, 0]} color="#fecaca" opacity={0.42} edgeOpacity={0.2} />
      <ShellBox args={[0.56, 0.1, 0.42]} position={[-0.98, -0.66, 0]} color="#94a3b8" opacity={0.28} edgeOpacity={0.28} />
      <ShellBox args={[0.38, 0.16, 0.32]} position={[1.58, -0.62, 0.52]} color="#94a3b8" opacity={0.3} edgeOpacity={0.24} />
      <ShellBox args={[1.72, 0.04, 0.04]} position={[0.5, -0.66, 0.52]} color="#cbd5e1" opacity={0.36} edgeOpacity={0.0} />
      <ShellBox args={[0.62, 0.035, 0.035]} position={[1.92, -0.62, 0.52]} rotation={[0, 0.18, 0]} color="#cbd5e1" opacity={0.36} edgeOpacity={0.0} />
      <ShellBox args={[1.76, 0.035, 0.035]} position={[-1.5, -0.48, 0]} color="#cbd5e1" opacity={0.26} edgeOpacity={0.0} />
      <ShellBox args={[1.76, 0.035, 0.035]} position={[1.42, -0.48, 0]} color="#cbd5e1" opacity={0.26} edgeOpacity={0.0} />

      {[-0.66, 0.66].map((z) => (
        <group key={`side-glass-${z}`}>
          <ShellBox args={[0.74, 0.22, 0.016]} position={[-0.4, 0.17, z]} color="#dbeafe" opacity={0.17} edgeOpacity={0.42} />
          <ShellBox args={[0.68, 0.22, 0.016]} position={[0.46, 0.16, z]} color="#dbeafe" opacity={0.15} edgeOpacity={0.36} />
          <ShellBox args={[1.58, 0.025, 0.016]} position={[0.02, 0.3, z]} color="#bae6fd" opacity={0.22} edgeOpacity={0.0} />
          <ShellBox args={[1.7, 0.025, 0.016]} position={[0.02, 0.02, z]} color="#bae6fd" opacity={0.2} edgeOpacity={0.0} />
          <ShellBox args={[0.035, 0.3, 0.016]} position={[-0.82, 0.14, z]} color="#bae6fd" opacity={0.2} edgeOpacity={0.0} />
          <ShellBox args={[0.035, 0.3, 0.016]} position={[0.03, 0.15, z]} color="#bae6fd" opacity={0.22} edgeOpacity={0.0} />
          <ShellBox args={[0.035, 0.25, 0.016]} position={[0.94, 0.11, z]} color="#bae6fd" opacity={0.18} edgeOpacity={0.0} />
        </group>
      ))}

      {[-0.79, 0.79].map((z) => (
        <group key={`side-lines-${z}`}>
          <ShellBox args={[3.25, 0.025, 0.025]} position={[0.08, -0.11, z]} color="#bae6fd" opacity={0.4} edgeOpacity={0.0} />
          <ShellBox args={[3.5, 0.018, 0.025]} position={[0.08, -0.52, z]} color="#bae6fd" opacity={0.26} edgeOpacity={0.0} />
          <ShellBox args={[0.24, 0.06, 0.018]} position={[-2.08, -0.31, z]} color="#fef08a" opacity={0.75} edgeOpacity={0.0} />
          <ShellBox args={[0.18, 0.07, 0.018]} position={[2.08, -0.3, z]} color="#f87171" opacity={0.7} edgeOpacity={0.0} />
          <ShellBox args={[0.1, 0.16, 0.018]} position={[-0.12, -0.2, z]} color="#bae6fd" opacity={0.2} edgeOpacity={0.18} />
          <ShellBox args={[0.1, 0.16, 0.018]} position={[0.36, -0.2, z]} color="#bae6fd" opacity={0.18} edgeOpacity={0.18} />
        </group>
      ))}

      {[
        [-1.5, -0.48, 0.82],
        [-1.5, -0.48, -0.82],
        [1.42, -0.48, 0.82],
        [1.42, -0.48, -0.82],
      ].map(([x, y, z]) => (
        <group key={`${x}-${z}`} position={[x, y, z]}>
          <mesh>
            <torusGeometry args={[0.31, 0.045, 12, 48]} />
            <meshBasicMaterial color="#e2e8f0" transparent opacity={0.58} />
          </mesh>
          <mesh>
            <circleGeometry args={[0.23, 48]} />
            <meshBasicMaterial color="#020617" transparent opacity={0.32} side={DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
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
          rotation={config.type === "cylinder" ? [Math.PI / 2, 0, 0] : undefined}
          renderOrder={3}
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
            opacity={subsystem.status === "ok" ? 0.34 : 0.78}
            transparent
            depthWrite={false}
            depthTest={false}
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
    return <div className={cn("bg-transparent", className)} aria-hidden />;
  }

  const mechanicalSubsystems = subsystems.filter((s) => s.key !== "body");

  return (
    <div
      className={cn("relative bg-transparent", className)}
      style={mode === "mini" ? { pointerEvents: "none" } : undefined}
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
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

        <CarBodyModel />

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
