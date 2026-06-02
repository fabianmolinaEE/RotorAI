import type { SubsystemKey } from "./types";

/**
 * Maps domain subsystem keys to GLB mesh names.
 * Phase 2's VehicleViewer reads this to highlight subsystems.
 */
export const subsystemMap: Record<SubsystemKey, string> = {
  engine: "engine",
  brakes_front: "brakes_front",
  brakes_rear: "brakes_rear",
  suspension_front: "suspension_front",
  suspension_rear: "suspension_rear",
  transmission: "transmission",
  electrical: "electrical",
  hvac: "hvac",
  exhaust: "exhaust",
  steering: "steering",
  body: "body",
};

export const subsystemLabels: Record<SubsystemKey, string> = {
  engine: "Engine",
  brakes_front: "Front brakes",
  brakes_rear: "Rear brakes",
  suspension_front: "Front suspension",
  suspension_rear: "Rear suspension",
  transmission: "Transmission",
  electrical: "Electrical",
  hvac: "HVAC",
  exhaust: "Exhaust",
  steering: "Steering",
  body: "Body",
};