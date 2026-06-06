import type {
  Bay,
  Customer,
  CustomerRecommendation,
  DraftWorkOrder,
  InventoryCategoryThreshold,
  Invoice,
  InventoryItem,
  Lead,
  MessageThread,
  NewConcern,
  Profile,
  QuoteBreakdown,
  Role,
  Shop,
  ServiceHistoryRecord,
  SubsystemKey,
  Task,
  Technician,
  TechnicianShift,
  TimeEntry,
  Tool,
  ToolCheckout,
  Urgency,
  Vehicle,
  WorkOrder,
  WorkOrderForemanNote,
  WorkOrderStatus,
} from "./types";
import { mockDataService } from "./mockDataService";

export interface DataService {
  getShop(): Promise<Shop>;

  getProfiles(): Promise<Profile[]>;
  getProfileByRole(role: Role): Promise<Profile | null>;

  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | null>;
  getServiceHistoryByCustomer(customerId: string): Promise<ServiceHistoryRecord[]>;
  getServiceHistoryByVehicle(vehicleId: string): Promise<ServiceHistoryRecord[]>;
  getCustomerRecommendations(customerId: string): Promise<CustomerRecommendation[]>;

  getVehicles(): Promise<Vehicle[]>;
  getVehicleById(id: string): Promise<Vehicle | null>;
  getVehiclesByCustomer(customerId: string): Promise<Vehicle[]>;

  getTechnicians(): Promise<Technician[]>;
  getTechnicianById(id: string): Promise<Technician | null>;

  getWorkOrders(): Promise<WorkOrder[]>;
  getWorkOrderById(id: string): Promise<WorkOrder | null>;
  getWorkOrdersByTech(technicianId: string): Promise<WorkOrder[]>;
  getWorkOrdersByCustomer(customerId: string): Promise<WorkOrder[]>;
  getWorkOrdersByStatus(status: WorkOrderStatus): Promise<WorkOrder[]>;

  getInventory(): Promise<InventoryItem[]>;
  getTools(): Promise<Tool[]>;
  getToolCheckouts(): Promise<ToolCheckout[]>;
  getTimeEntries(): Promise<TimeEntry[]>;

  getInvoices(): Promise<Invoice[]>;
  getInvoiceById(id: string): Promise<Invoice | null>;

  getLeads(): Promise<Lead[]>;
  getTasks(): Promise<Task[]>;

  // ─── Bay / floor management ────────────────────────────────────────────────
  getBays(): Promise<Bay[]>;

  /**
   * Assign a pending work order to a bay + technician together.
   * Returns the updated Bay on success.
   * In the mock implementation this mutates in-memory seed data so navigation
   * within the session reflects the change without a real backend.
   */
  delegateTicket(params: {
    workOrderId: string;
    bayId: string;
    technicianId: string;
  }): Promise<Bay>;

  // ─── Inventory thresholds ──────────────────────────────────────────────────
  getInventoryCategoryThresholds(): Promise<InventoryCategoryThreshold[]>;

  // ─── Messaging ────────────────────────────────────────────────────────────
  /** All threads visible to the current role/user context (mock: returns all). */
  getMessageThreads(): Promise<MessageThread[]>;
  /** Threads linked to a specific work order. */
  getMessageThreadsByWorkOrder(workOrderId: string): Promise<MessageThread[]>;
  /** Threads linked to a specific customer. */
  getMessageThreadsByCustomer(customerId: string): Promise<MessageThread[]>;
  /** Get a single thread by ID. */
  getMessageThreadById(threadId: string): Promise<MessageThread | null>;
  /**
   * Append a new message to an existing thread.
   * Returns updated thread. Mock: mutates in-memory seed data.
   */
  sendMessage(params: {
    threadId: string;
    authorProfileId: string;
    authorName: string;
    authorRole: Role;
    bodyText: string;
    aiDrafted?: boolean;
  }): Promise<MessageThread>;

  // ─── Service Advisor: Concerns and Draft Work Orders ──────────────────────
  /** All new concerns, newest first. */
  getNewConcerns(): Promise<NewConcern[]>;
  /** Concerns for a specific customer. */
  getNewConcernsByCustomer(customerId: string): Promise<NewConcern[]>;
  /**
   * Update diagnostic state for a concern — SA selects AI suggestions
   * and/or adds free-text notes.
   * Returns updated concern. Mock: mutates in-memory seed data.
   */
  updateConcernDiagnostics(params: {
    concernId: string;
    selectedDiagnosticIds: string[];
    diagnosticNotes: string;
  }): Promise<NewConcern>;
  /**
   * Promote a concern to a draft work order for foreman review.
   * Returns the created DraftWorkOrder. Mock: mutates in-memory arrays.
   * Customer NOT notified at this stage per locked decision.
   */
  createDraftWorkOrder(params: {
    concernId: string;
    title: string;
    requestedDateIso: string;
    foremanNote: string;
  }): Promise<DraftWorkOrder>;
  /** All draft work orders pending foreman confirmation. */
  getDraftWorkOrders(): Promise<DraftWorkOrder[]>;

  // ─── Technician timekeeping (shift-level) ──────────────────────────────────
  /**
   * Get all shifts for a technician, newest first.
   * Returns empty array if no shifts exist.
   */
  getShiftsByTechnician(technicianId: string): Promise<TechnicianShift[]>;
  /**
   * Get the currently open (not clocked out) shift for a technician.
   * Returns null if technician is clocked out.
   */
  getActiveShift(technicianId: string): Promise<TechnicianShift | null>;
  /**
   * Clock a technician in: creates a new shift record, updates technician.clockedIn.
   * Returns the new TechnicianShift. Mock: mutates in-memory data.
   */
  clockIn(params: { technicianId: string; bayId: string | null }): Promise<TechnicianShift>;
  /**
   * Clock a technician out: closes the active shift, updates technician.clockedIn.
   * Returns the closed TechnicianShift. Rejects if no active shift found.
   * Mock: mutates in-memory data.
   */
  clockOut(technicianId: string): Promise<TechnicianShift>;

  // ─── Foreman notes on assigned work orders ─────────────────────────────────
  /** Foreman note for a specific work order, or null if none exists. */
  getForemanNote(workOrderId: string): Promise<WorkOrderForemanNote | null>;
  /** All foreman notes (used to pre-fetch for the assignment queue). */
  getForemanNotes(): Promise<WorkOrderForemanNote[]>;

  // "AI" features — prefilled for demo, easy to swap to real later.
  getQuoteBreakdown(workOrderId: string): Promise<QuoteBreakdown | null>;
  getAiUrgencySuggestion(workOrderId: string): Promise<Urgency>;
  getRecommendedProcedure(subsystemKey: SubsystemKey): Promise<string>;
}

// ─── DataService initialization with USE_MOCK switch (D-01) ─────────────────
//
// Local dev: set USE_MOCK=true in .env.local → mockDataService (no Supabase needed)
// Prod (Cloudflare Workers): omit USE_MOCK binding → supabaseDataService
//
// process.env is read at module initialization time here, which is acceptable
// because TanStack Start/Vite evaluates this at server startup, not per-request.
// The switch is static for the lifetime of the server instance.
import { supabaseDataService } from "./supabaseDataService";

const useMock =
  typeof process !== "undefined" &&
  (process.env.USE_MOCK === "true" || process.env.USE_MOCK === "1");

let service: DataService = useMock ? mockDataService : supabaseDataService;

export function getDataService(): DataService {
  return service;
}

/** Override the active DataService implementation (used in tests and dev tooling). */
export function setDataService(impl: DataService) {
  service = impl;
}
