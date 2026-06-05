export type Role = "owner" | "manager" | "service_advisor" | "technician" | "customer";

// ─── Bay entities ─────────────────────────────────────────────────────────────
// Three canonical states per locked decision:
//   Active  = technician + job assigned (bay is occupied)
//   Empty   = available, no current assignment
//   Offline = bay closed/blocked/out of service
export type BayStatus = "active" | "empty" | "offline";

export interface Bay {
  id: string;
  /** Display label, e.g. "Bay 1" */
  label: string;
  status: BayStatus;
  /** Technician currently assigned to this bay (null when empty/offline) */
  technicianId: string | null;
  /** Active work order in this bay (null when empty/offline) */
  workOrderId: string | null;
  /** Human-readable note, e.g. "Lift out of service until Friday" */
  note?: string;
}

// ─── Inventory quantity classification ────────────────────────────────────────
/** Per-category thresholds for inventory quantity status labels */
export interface InventoryCategoryThreshold {
  category: string;
  /** At or below this qty → "Low quantity" */
  lowAt: number;
  /** At or above this qty → "High quantity" */
  highAt: number;
}

export type InventoryQuantityStatus = "low" | "healthy" | "high";

/** Usage ranking 0-100; items ≥ 70 are labelled "Frequently used" */
export type InventoryUsageRank = number;

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
  /** 0-100 mock usage rank. Items ≥ 70 are considered "Frequently used". */
  usageRank: number;
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

// ─── Messaging ────────────────────────────────────────────────────────────────

/**
 * Thread context type.
 * - work_order: attached to a specific work order (primary for customer comms)
 * - direct: direct message between two participants (internal roles)
 */
export type MessageThreadType = "work_order" | "direct";

export type NotificationChannel = "in_app" | "email" | "sms";

export interface NotificationPreferences {
  channels: readonly NotificationChannel[];
}

export interface MessageParticipant {
  profileId: string;
  role: Role;
  name: string;
  avatarColor: string;
  notificationPrefs: NotificationPreferences;
}

export interface Message {
  id: string;
  threadId: string;
  authorProfileId: string;
  authorName: string;
  authorRole: Role;
  bodyText: string;
  sentAtIso: string;
  /** True if this message body was AI-drafted (surfaced for transparency) */
  aiDrafted: boolean;
}

export interface MessageThread {
  id: string;
  type: MessageThreadType;
  subject: string;
  participants: MessageParticipant[];
  /** Linked context — populated for work_order threads */
  workOrderId?: string;
  customerId?: string;
  vehicleId?: string;
  messages: Message[];
  createdAtIso: string;
  updatedAtIso: string;
  /** Mock: true if there is at least one unread message in this thread */
  hasUnread: boolean;
}
