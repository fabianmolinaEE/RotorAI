import type {
  Bay,
  Customer,
  CustomerRecommendation,
  InventoryCategoryThreshold,
  Invoice,
  InventoryItem,
  Lead,
  Message,
  MessageThread,
  Profile,
  QuoteBreakdown,
  Role,
  Shop,
  ServiceHistoryRecord,
  SubsystemKey,
  Task,
  Technician,
  TimeEntry,
  Tool,
  ToolCheckout,
  Urgency,
  Vehicle,
  WorkOrder,
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

  // "AI" features — prefilled for demo, easy to swap to real later.
  getQuoteBreakdown(workOrderId: string): Promise<QuoteBreakdown | null>;
  getAiUrgencySuggestion(workOrderId: string): Promise<Urgency>;
  getRecommendedProcedure(subsystemKey: SubsystemKey): Promise<string>;
}

// Unused imports referenced for completeness (Message used in sendMessage return)
export type { Message };

let service: DataService = mockDataService;

export function getDataService(): DataService {
  return service;
}

/** Future hook for swapping to a real backend implementation. */
export function setDataService(impl: DataService) {
  service = impl;
}
