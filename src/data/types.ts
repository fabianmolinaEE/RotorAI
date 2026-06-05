export type Role = "owner" | "manager" | "service_advisor" | "technician" | "customer";

export interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface Profile {
  id: string;
  role: Role;
  name: string;
  email: string;
  avatarColor: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleIds: string[];
  since: string;
}

export interface Technician {
  id: string;
  profileId: string;
  name: string;
  specialty: string;
  clockedIn: boolean;
  activeWorkOrderIds: string[];
  weeklyCompleted: number;
  certifications: string[];
}

export interface Vehicle {
  id: string;
  customerId: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  vin: string;
  plate: string;
  mileage: number;
  color: string;
}

export interface ServiceHistoryRecord {
  id: string;
  customerId: string;
  vehicleId: string;
  workOrderId?: string;
  invoiceId?: string;
  servicedAtIso: string;
  mileage: number;
  title: string;
  summary: string;
  shopName: string;
  technicianName?: string;
  invoiceTotal?: number;
  customerNotes?: string;
}

export type RecommendationSeverity = "low" | "medium" | "high";
export type RecommendationStatus = "new" | "accepted" | "declined" | "snoozed";

export interface CustomerRecommendation {
  id: string;
  customerId: string;
  vehicleId: string;
  subsystemKey?: SubsystemKey;
  title: string;
  reason: string;
  dueWindow: string;
  severity: RecommendationSeverity;
  status: RecommendationStatus;
  generatedBy: "ai" | "advisor";
  createdAtIso: string;
}

export type SubsystemKey =
  | "engine"
  | "brakes_front"
  | "brakes_rear"
  | "suspension_front"
  | "suspension_rear"
  | "transmission"
  | "electrical"
  | "hvac"
  | "exhaust"
  | "steering"
  | "body";

export type SubsystemStatus = "ok" | "check" | "fix";

export interface Subsystem {
  key: SubsystemKey;
  label: string;
  status: SubsystemStatus;
  tools: string[];
  timeEstimateMin: number;
  procedure: string;
  resources: { label: string; url: string }[];
  notes?: string;
}

export type WorkOrderStatus =
  | "new"
  | "scheduled"
  | "in_progress"
  | "awaiting_parts"
  | "completed"
  | "invoiced";

export type Urgency = "low" | "normal" | "high";

export type QuoteLineCategory =
  | "labor"
  | "parts"
  | "equipment"
  | "shop_supplies"
  | "fees"
  | "tax";

export interface QuoteBreakdownLine {
  id: string;
  category: QuoteLineCategory;
  label: string;
  description?: string;
  quantity: number;
  unit: "hour" | "each" | "flat";
  unitCost: number;
  total: number;
  internalNote?: string;
  customerVisible: boolean;
}

export interface QuoteBreakdown {
  id: string;
  workOrderId: string;
  status: "draft" | "ready" | "approved";
  generatedBy: "advisor" | "manager" | "ai_draft";
  customerSummary: string;
  customerDetailAvailable: boolean;
  internalNotes?: string;
  lines: QuoteBreakdownLine[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface WorkOrder {
  id: string;
  number: string;
  vehicleId: string;
  customerId: string;
  technicianId: string | null;
  status: WorkOrderStatus;
  urgency: Urgency;
  aiUrgency: Urgency;
  title: string;
  complaint: string;
  subsystems: Subsystem[];
  quoteAmount: number;
  quoteBreakdown: QuoteBreakdown;
  laborHours: number;
  partsCost: number;
  etaIso: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  qtyOnHand: number;
  reorderAt: number;
  unitCost: number;
  binLocation: string;
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  available: boolean;
}

export interface ToolCheckout {
  id: string;
  toolId: string;
  technicianId: string;
  checkedOutIso: string;
  workOrderId: string | null;
}

export interface TimeEntry {
  id: string;
  technicianId: string;
  workOrderId: string;
  startedIso: string;
  endedIso: string | null;
  minutes: number;
}

export interface InvoiceLine {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  workOrderId: string;
  customerId: string;
  issuedIso: string;
  status: "draft" | "sent" | "paid" | "overdue";
  lines: InvoiceLine[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  interest: string;
  createdIso: string;
}

export interface Task {
  id: string;
  title: string;
  assigneeId: string;
  dueIso: string;
  done: boolean;
}
