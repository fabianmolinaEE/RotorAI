import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseConfig } from "@/lib/config.server";
import type { DataService } from "./dataService";
import type {
  Bay,
  Customer,
  CustomerRecommendation,
  DraftWorkOrder,
  InventoryCategoryThreshold,
  InventoryItem,
  Invoice,
  Lead,
  MessageThread,
  NewConcern,
  Profile,
  QuoteBreakdown,
  Role,
  ServiceHistoryRecord,
  Shop,
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

// ─── Helper: create Supabase client inside a handler (D-02, D-03) ────────────
// Dynamic import keeps Supabase out of the client bundle on Cloudflare Workers.
async function makeClient(key: "anon" | "service_role" = "anon") {
  const { createClient } = await import("@supabase/supabase-js");
  const cfg = getSupabaseConfig();
  return createClient(
    cfg.url,
    key === "service_role" ? cfg.serviceRoleKey : cfg.anonKey,
  );
}

// ─── Row mappers (DB snake_case → TypeScript camelCase) ──────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapShop(r: any): Shop {
  return { id: r.id, name: r.name, address: r.address, phone: r.phone, email: r.email };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfile(r: any): Profile {
  return { id: r.id, role: r.role, name: r.name, email: r.email, avatarColor: r.avatar_color };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCustomer(r: any): Customer {
  return {
    id: r.id, name: r.name, email: r.email, phone: r.phone,
    vehicleIds: r.vehicle_ids ?? [],
    since: r.since,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVehicle(r: any): Vehicle {
  return {
    id: r.id, customerId: r.customer_id, year: r.year, make: r.make,
    model: r.model, trim: r.trim ?? undefined, vin: r.vin, plate: r.plate,
    mileage: r.mileage, color: r.color,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTechnician(r: any): Technician {
  return {
    id: r.id, profileId: r.profile_id, name: r.name, specialty: r.specialty,
    clockedIn: r.clocked_in, activeWorkOrderIds: r.active_work_order_ids ?? [],
    weeklyCompleted: r.weekly_completed, certifications: r.certifications ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBay(r: any): Bay {
  return {
    id: r.id, label: r.label, status: r.status,
    technicianId: r.technician_id ?? null,
    workOrderId: r.work_order_id ?? null,
    note: r.note ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuoteBreakdown(r: any): QuoteBreakdown {
  return {
    id: r.id, workOrderId: r.work_order_id, status: r.status,
    generatedBy: r.generated_by, customerSummary: r.customer_summary,
    customerDetailAvailable: r.customer_detail_available,
    internalNotes: r.internal_notes ?? undefined,
    lines: r.lines ?? [],
    subtotal: Number(r.subtotal), tax: Number(r.tax), total: Number(r.total),
  };
}

const EMPTY_QUOTE_BREAKDOWN: QuoteBreakdown = {
  id: "", workOrderId: "", status: "draft", generatedBy: "advisor",
  customerSummary: "", customerDetailAvailable: false,
  lines: [], subtotal: 0, tax: 0, total: 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWorkOrder(r: any, qb: QuoteBreakdown): WorkOrder {
  return {
    id: r.id, number: r.number, vehicleId: r.vehicle_id, customerId: r.customer_id,
    technicianId: r.technician_id ?? null, status: r.status,
    urgency: r.urgency, aiUrgency: r.ai_urgency,
    title: r.title, complaint: r.complaint,
    subsystems: r.subsystems ?? [],
    quoteBreakdown: qb,
    quoteAmount: Number(r.quote_amount), laborHours: Number(r.labor_hours),
    partsCost: Number(r.parts_cost), etaIso: r.eta_iso,
    createdAtIso: r.created_at_iso, updatedAtIso: r.updated_at_iso,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInvoice(r: any): Invoice {
  return {
    id: r.id, number: r.number, workOrderId: r.work_order_id,
    customerId: r.customer_id, issuedIso: r.issued_iso, status: r.status,
    lines: r.lines ?? [], subtotal: Number(r.subtotal), tax: Number(r.tax), total: Number(r.total),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapServiceHistory(r: any): ServiceHistoryRecord {
  return {
    id: r.id, customerId: r.customer_id, vehicleId: r.vehicle_id,
    workOrderId: r.work_order_id ?? undefined, invoiceId: r.invoice_id ?? undefined,
    servicedAtIso: r.serviced_at_iso, mileage: r.mileage,
    title: r.title, summary: r.summary, shopName: r.shop_name,
    technicianName: r.technician_name ?? undefined,
    invoiceTotal: r.invoice_total != null ? Number(r.invoice_total) : undefined,
    customerNotes: r.customer_notes ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCustomerRecommendation(r: any): CustomerRecommendation {
  return {
    id: r.id, customerId: r.customer_id, vehicleId: r.vehicle_id,
    subsystemKey: r.subsystem_key ?? undefined, title: r.title, reason: r.reason,
    dueWindow: r.due_window, severity: r.severity, status: r.status,
    generatedBy: r.generated_by, createdAtIso: r.created_at_iso,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInventoryItem(r: any): InventoryItem {
  return {
    id: r.id, sku: r.sku, name: r.name, category: r.category,
    qtyOnHand: r.qty_on_hand, reorderAt: r.reorder_at,
    unitCost: Number(r.unit_cost), binLocation: r.bin_location,
    usageRank: Number(r.usage_rank),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTool(r: any): Tool {
  return { id: r.id, name: r.name, category: r.category, serialNumber: r.serial_number, available: r.available };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToolCheckout(r: any): ToolCheckout {
  return {
    id: r.id, toolId: r.tool_id, technicianId: r.technician_id,
    checkedOutIso: r.checked_out_iso, workOrderId: r.work_order_id ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTimeEntry(r: any): TimeEntry {
  return {
    id: r.id, technicianId: r.technician_id, workOrderId: r.work_order_id,
    startedIso: r.started_iso, endedIso: r.ended_iso ?? null, minutes: r.minutes,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLead(r: any): Lead {
  return { id: r.id, name: r.name, phone: r.phone, source: r.source, interest: r.interest, createdIso: r.created_iso };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTask(r: any): Task {
  return { id: r.id, title: r.title, assigneeId: r.assignee_id, dueIso: r.due_iso, done: r.done };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInventoryThreshold(r: any): InventoryCategoryThreshold {
  return { category: r.category, lowAt: r.low_at, highAt: r.high_at };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMessageThread(r: any): MessageThread {
  return {
    id: r.id, type: r.type, subject: r.subject,
    participants: r.participants ?? [],
    workOrderId: r.work_order_id ?? undefined,
    customerId: r.customer_id ?? undefined,
    vehicleId: r.vehicle_id ?? undefined,
    messages: r.messages ?? [],
    createdAtIso: r.created_at_iso, updatedAtIso: r.updated_at_iso,
    hasUnread: r.has_unread,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNewConcern(r: any): NewConcern {
  return {
    id: r.id, customerId: r.customer_id, vehicleId: r.vehicle_id,
    source: r.source, complaint: r.complaint, urgency: r.urgency,
    status: r.status, createdAtIso: r.created_at_iso,
    aiDiagnosticSuggestions: r.ai_diagnostic_suggestions ?? [],
    diagnosticNotes: r.diagnostic_notes ?? undefined,
    selectedDiagnosticIds: r.selected_diagnostic_ids ?? undefined,
    draftWorkOrderId: r.draft_work_order_id ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDraftWorkOrder(r: any): DraftWorkOrder {
  return {
    id: r.id, concernId: r.concern_id, customerId: r.customer_id,
    vehicleId: r.vehicle_id, title: r.title, complaint: r.complaint,
    diagnosticNotes: r.diagnostic_notes, requestedDateIso: r.requested_date_iso,
    urgency: r.urgency, foremanNote: r.foreman_note,
    selectedDiagnostics: r.selected_diagnostics ?? [],
    createdAtIso: r.created_at_iso, status: r.status,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTechnicianShift(r: any): TechnicianShift {
  return {
    id: r.id, technicianId: r.technician_id,
    clockedInIso: r.clocked_in_iso, clockedOutIso: r.clocked_out_iso ?? null,
    bayId: r.bay_id ?? null,
    scheduledHours: Number(r.scheduled_hours), breakMinutes: r.break_minutes,
    shiftDate: r.shift_date,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapForemanNote(r: any): WorkOrderForemanNote {
  return {
    workOrderId: r.work_order_id, note: r.note,
    foremanName: r.foreman_name, writtenAtIso: r.written_at_iso,
  };
}

// ─── Helper: fetch quote_breakdowns for a set of work_order IDs ──────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchQbMap(db: any, workOrderIds: string[]): Promise<Map<string, QuoteBreakdown>> {
  if (workOrderIds.length === 0) return new Map();
  const { data } = await db.from("quote_breakdowns").select("*").in("work_order_id", workOrderIds);
  const map = new Map<string, QuoteBreakdown>();
  for (const row of (data ?? [])) {
    map.set(row.work_order_id, mapQuoteBreakdown(row));
  }
  return map;
}

// ─── Recommended procedure stubs (Phase 9 replaces with real AI) ─────────────
const PROCEDURE_STUBS: Record<string, string> = {
  engine: "Inspect engine mounts, belts, and fluids. Check for oil leaks and unusual sounds under load. Verify coolant level and thermostat operation.",
  brakes_front: "Inspect front brake pads, rotors, and calipers. Measure pad thickness and rotor runout. Test hydraulic line pressure and bleed if necessary.",
  brakes_rear: "Inspect rear brake pads/shoes, drums/rotors, and emergency brake cable. Check wheel cylinder condition. Adjust parking brake.",
  suspension_front: "Inspect front control arms, ball joints, tie rod ends, and strut assemblies. Check for uneven tire wear. Verify alignment angles.",
  suspension_rear: "Inspect rear springs, shock absorbers/struts, and trailing arms. Check bushing condition and sway bar links.",
  transmission: "Check fluid level and condition. Inspect for leaks at pan, output shaft, and cooler lines. Verify shift quality and torque converter operation.",
  electrical: "Scan for diagnostic trouble codes. Test battery capacity, alternator output voltage, and starter current draw. Inspect fuse panel and relay box.",
  hvac: "Check refrigerant charge and high/low side pressures. Test blower motor speeds, compressor clutch engagement, and evaporator temperature.",
  exhaust: "Inspect manifold, catalytic converter, muffler, and all joints for leaks or damage. Check O2 sensor readings and back pressure.",
  steering: "Inspect rack/pinion or steering box, power steering fluid level, and pump output. Check for play in steering wheel and inspect tie rod ends.",
  body: "Inspect body panels, frame rails, and unibody for impact damage. Check door alignment, latch operation, and weatherstripping integrity.",
};

// ─── Server functions ─────────────────────────────────────────────────────────

// ── Shop ──────────────────────────────────────────────────────────────────────
const _getShop = createServerFn({ method: "GET" })
  .handler(async (): Promise<Shop> => {
    const db = await makeClient();
    const { data, error } = await db.from("shops").select("*").single();
    if (error) throw new Error(`getShop: ${error.message}`);
    return mapShop(data);
  });

// ── Profiles ──────────────────────────────────────────────────────────────────
const _getProfiles = createServerFn({ method: "GET" })
  .handler(async (): Promise<Profile[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("profiles").select("*");
    if (error) throw new Error(`getProfiles: ${error.message}`);
    return (data ?? []).map(mapProfile);
  });

const _getProfileByRole = createServerFn({ method: "POST" })
  .inputValidator(z.object({ role: z.string() }))
  .handler(async ({ data }): Promise<Profile | null> => {
    const db = await makeClient();
    const { data: rows, error } = await db.from("profiles").select("*").eq("role", data.role).limit(1);
    if (error) throw new Error(`getProfileByRole: ${error.message}`);
    const row = (rows ?? [])[0];
    return row ? mapProfile(row) : null;
  });

// ── Customers ─────────────────────────────────────────────────────────────────
const _getCustomers = createServerFn({ method: "GET" })
  .handler(async (): Promise<Customer[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("customers").select("*");
    if (error) throw new Error(`getCustomers: ${error.message}`);
    return (data ?? []).map(mapCustomer);
  });

const _getCustomerById = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<Customer | null> => {
    const db = await makeClient();
    const { data: row, error } = await db.from("customers").select("*").eq("id", data.id).single();
    if (error) return null;
    return mapCustomer(row);
  });

const _getServiceHistoryByCustomer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ customerId: z.string() }))
  .handler(async ({ data }): Promise<ServiceHistoryRecord[]> => {
    const db = await makeClient();
    const { data: rows, error } = await db.from("service_history").select("*").eq("customer_id", data.customerId);
    if (error) throw new Error(`getServiceHistoryByCustomer: ${error.message}`);
    return (rows ?? []).map(mapServiceHistory);
  });

const _getServiceHistoryByVehicle = createServerFn({ method: "POST" })
  .inputValidator(z.object({ vehicleId: z.string() }))
  .handler(async ({ data }): Promise<ServiceHistoryRecord[]> => {
    const db = await makeClient();
    const { data: rows, error } = await db.from("service_history").select("*").eq("vehicle_id", data.vehicleId);
    if (error) throw new Error(`getServiceHistoryByVehicle: ${error.message}`);
    return (rows ?? []).map(mapServiceHistory);
  });

const _getCustomerRecommendations = createServerFn({ method: "POST" })
  .inputValidator(z.object({ customerId: z.string() }))
  .handler(async ({ data }): Promise<CustomerRecommendation[]> => {
    const db = await makeClient();
    const { data: rows, error } = await db.from("customer_recommendations").select("*").eq("customer_id", data.customerId);
    if (error) throw new Error(`getCustomerRecommendations: ${error.message}`);
    return (rows ?? []).map(mapCustomerRecommendation);
  });

// ── Vehicles ──────────────────────────────────────────────────────────────────
const _getVehicles = createServerFn({ method: "GET" })
  .handler(async (): Promise<Vehicle[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("vehicles").select("*");
    if (error) throw new Error(`getVehicles: ${error.message}`);
    return (data ?? []).map(mapVehicle);
  });

const _getVehicleById = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<Vehicle | null> => {
    const db = await makeClient();
    const { data: row, error } = await db.from("vehicles").select("*").eq("id", data.id).single();
    if (error) return null;
    return mapVehicle(row);
  });

const _getVehiclesByCustomer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ customerId: z.string() }))
  .handler(async ({ data }): Promise<Vehicle[]> => {
    const db = await makeClient();
    const { data: rows, error } = await db.from("vehicles").select("*").eq("customer_id", data.customerId);
    if (error) throw new Error(`getVehiclesByCustomer: ${error.message}`);
    return (rows ?? []).map(mapVehicle);
  });

// ── Technicians ───────────────────────────────────────────────────────────────
const _getTechnicians = createServerFn({ method: "GET" })
  .handler(async (): Promise<Technician[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("technicians").select("*");
    if (error) throw new Error(`getTechnicians: ${error.message}`);
    return (data ?? []).map(mapTechnician);
  });

const _getTechnicianById = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<Technician | null> => {
    const db = await makeClient();
    const { data: row, error } = await db.from("technicians").select("*").eq("id", data.id).single();
    if (error) return null;
    return mapTechnician(row);
  });

// ── Work Orders ───────────────────────────────────────────────────────────────
const _getWorkOrders = createServerFn({ method: "GET" })
  .handler(async (): Promise<WorkOrder[]> => {
    const db = await makeClient();
    const { data: rows, error } = await db.from("work_orders").select("*");
    if (error) throw new Error(`getWorkOrders: ${error.message}`);
    const ids = (rows ?? []).map((r) => r.id as string);
    const qbMap = await fetchQbMap(db, ids);
    return (rows ?? []).map((r) => mapWorkOrder(r, qbMap.get(r.id) ?? { ...EMPTY_QUOTE_BREAKDOWN, workOrderId: r.id }));
  });

const _getWorkOrderById = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<WorkOrder | null> => {
    const db = await makeClient();
    const { data: row, error } = await db.from("work_orders").select("*").eq("id", data.id).single();
    if (error) return null;
    const qbMap = await fetchQbMap(db, [row.id]);
    return mapWorkOrder(row, qbMap.get(row.id) ?? { ...EMPTY_QUOTE_BREAKDOWN, workOrderId: row.id });
  });

const _getWorkOrdersByTech = createServerFn({ method: "POST" })
  .inputValidator(z.object({ technicianId: z.string() }))
  .handler(async ({ data }): Promise<WorkOrder[]> => {
    const db = await makeClient();
    const { data: rows, error } = await db.from("work_orders").select("*").eq("technician_id", data.technicianId);
    if (error) throw new Error(`getWorkOrdersByTech: ${error.message}`);
    const ids = (rows ?? []).map((r) => r.id as string);
    const qbMap = await fetchQbMap(db, ids);
    return (rows ?? []).map((r) => mapWorkOrder(r, qbMap.get(r.id) ?? { ...EMPTY_QUOTE_BREAKDOWN, workOrderId: r.id }));
  });

const _getWorkOrdersByCustomer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ customerId: z.string() }))
  .handler(async ({ data }): Promise<WorkOrder[]> => {
    const db = await makeClient();
    const { data: rows, error } = await db.from("work_orders").select("*").eq("customer_id", data.customerId);
    if (error) throw new Error(`getWorkOrdersByCustomer: ${error.message}`);
    const ids = (rows ?? []).map((r) => r.id as string);
    const qbMap = await fetchQbMap(db, ids);
    return (rows ?? []).map((r) => mapWorkOrder(r, qbMap.get(r.id) ?? { ...EMPTY_QUOTE_BREAKDOWN, workOrderId: r.id }));
  });

const _getWorkOrdersByStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({ status: z.string() }))
  .handler(async ({ data }): Promise<WorkOrder[]> => {
    const db = await makeClient();
    const { data: rows, error } = await db.from("work_orders").select("*").eq("status", data.status);
    if (error) throw new Error(`getWorkOrdersByStatus: ${error.message}`);
    const ids = (rows ?? []).map((r) => r.id as string);
    const qbMap = await fetchQbMap(db, ids);
    return (rows ?? []).map((r) => mapWorkOrder(r, qbMap.get(r.id) ?? { ...EMPTY_QUOTE_BREAKDOWN, workOrderId: r.id }));
  });

// ── Inventory ─────────────────────────────────────────────────────────────────
const _getInventory = createServerFn({ method: "GET" })
  .handler(async (): Promise<InventoryItem[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("inventory_items").select("*");
    if (error) throw new Error(`getInventory: ${error.message}`);
    return (data ?? []).map(mapInventoryItem);
  });

const _getInventoryCategoryThresholds = createServerFn({ method: "GET" })
  .handler(async (): Promise<InventoryCategoryThreshold[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("inventory_category_thresholds").select("*");
    if (error) throw new Error(`getInventoryCategoryThresholds: ${error.message}`);
    return (data ?? []).map(mapInventoryThreshold);
  });

// ── Tools ─────────────────────────────────────────────────────────────────────
const _getTools = createServerFn({ method: "GET" })
  .handler(async (): Promise<Tool[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("tools").select("*");
    if (error) throw new Error(`getTools: ${error.message}`);
    return (data ?? []).map(mapTool);
  });

const _getToolCheckouts = createServerFn({ method: "GET" })
  .handler(async (): Promise<ToolCheckout[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("tool_checkouts").select("*");
    if (error) throw new Error(`getToolCheckouts: ${error.message}`);
    return (data ?? []).map(mapToolCheckout);
  });

// ── Time Entries ──────────────────────────────────────────────────────────────
const _getTimeEntries = createServerFn({ method: "GET" })
  .handler(async (): Promise<TimeEntry[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("time_entries").select("*");
    if (error) throw new Error(`getTimeEntries: ${error.message}`);
    return (data ?? []).map(mapTimeEntry);
  });

// ── Invoices ──────────────────────────────────────────────────────────────────
const _getInvoices = createServerFn({ method: "GET" })
  .handler(async (): Promise<Invoice[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("invoices").select("*");
    if (error) throw new Error(`getInvoices: ${error.message}`);
    return (data ?? []).map(mapInvoice);
  });

const _getInvoiceById = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<Invoice | null> => {
    const db = await makeClient();
    const { data: row, error } = await db.from("invoices").select("*").eq("id", data.id).single();
    if (error) return null;
    return mapInvoice(row);
  });

// ── Leads & Tasks ─────────────────────────────────────────────────────────────
const _getLeads = createServerFn({ method: "GET" })
  .handler(async (): Promise<Lead[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("leads").select("*");
    if (error) throw new Error(`getLeads: ${error.message}`);
    return (data ?? []).map(mapLead);
  });

const _getTasks = createServerFn({ method: "GET" })
  .handler(async (): Promise<Task[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("tasks").select("*");
    if (error) throw new Error(`getTasks: ${error.message}`);
    return (data ?? []).map(mapTask);
  });

// ── Bays ──────────────────────────────────────────────────────────────────────
const _getBays = createServerFn({ method: "GET" })
  .handler(async (): Promise<Bay[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("bays").select("*");
    if (error) throw new Error(`getBays: ${error.message}`);
    return (data ?? []).map(mapBay);
  });

const _delegateTicket = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    workOrderId: z.string(),
    bayId: z.string(),
    technicianId: z.string(),
  }))
  .handler(async ({ data }): Promise<Bay> => {
    const db = await makeClient("service_role");
    const { error: bayErr } = await db.from("bays")
      .update({ status: "active", technician_id: data.technicianId, work_order_id: data.workOrderId })
      .eq("id", data.bayId);
    if (bayErr) throw new Error(`delegateTicket/bay: ${bayErr.message}`);

    const { error: woErr } = await db.from("work_orders")
      .update({ technician_id: data.technicianId, status: "in_progress" })
      .eq("id", data.workOrderId);
    if (woErr) throw new Error(`delegateTicket/work_order: ${woErr.message}`);

    const { data: tech } = await db.from("technicians").select("active_work_order_ids").eq("id", data.technicianId).single();
    const existing: string[] = tech?.active_work_order_ids ?? [];
    if (!existing.includes(data.workOrderId)) {
      await db.from("technicians")
        .update({ active_work_order_ids: [...existing, data.workOrderId] })
        .eq("id", data.technicianId);
    }

    const { data: bay, error: fetchErr } = await db.from("bays").select("*").eq("id", data.bayId).single();
    if (fetchErr) throw new Error(`delegateTicket/fetch: ${fetchErr.message}`);
    return mapBay(bay);
  });

// ── Message Threads ───────────────────────────────────────────────────────────
const _getMessageThreads = createServerFn({ method: "GET" })
  .handler(async (): Promise<MessageThread[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("message_threads").select("*");
    if (error) throw new Error(`getMessageThreads: ${error.message}`);
    return (data ?? []).map(mapMessageThread);
  });

const _getMessageThreadsByWorkOrder = createServerFn({ method: "POST" })
  .inputValidator(z.object({ workOrderId: z.string() }))
  .handler(async ({ data }): Promise<MessageThread[]> => {
    const db = await makeClient();
    const { data: rows, error } = await db.from("message_threads").select("*").eq("work_order_id", data.workOrderId);
    if (error) throw new Error(`getMessageThreadsByWorkOrder: ${error.message}`);
    return (rows ?? []).map(mapMessageThread);
  });

const _getMessageThreadsByCustomer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ customerId: z.string() }))
  .handler(async ({ data }): Promise<MessageThread[]> => {
    const db = await makeClient();
    const { data: rows, error } = await db.from("message_threads").select("*").eq("customer_id", data.customerId);
    if (error) throw new Error(`getMessageThreadsByCustomer: ${error.message}`);
    return (rows ?? []).map(mapMessageThread);
  });

const _getMessageThreadById = createServerFn({ method: "POST" })
  .inputValidator(z.object({ threadId: z.string() }))
  .handler(async ({ data }): Promise<MessageThread | null> => {
    const db = await makeClient();
    const { data: row, error } = await db.from("message_threads").select("*").eq("id", data.threadId).single();
    if (error) return null;
    return mapMessageThread(row);
  });

const _sendMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    threadId: z.string(),
    authorProfileId: z.string(),
    authorName: z.string(),
    authorRole: z.string(),
    bodyText: z.string(),
    aiDrafted: z.boolean().optional(),
  }))
  .handler(async ({ data }): Promise<MessageThread> => {
    const db = await makeClient("service_role");
    const { data: thread, error: fetchErr } = await db.from("message_threads").select("*").eq("id", data.threadId).single();
    if (fetchErr) throw new Error(`sendMessage/fetch: ${fetchErr.message}`);

    const existingMessages: unknown[] = thread.messages ?? [];
    const newMessage = {
      id: crypto.randomUUID(),
      threadId: data.threadId,
      authorProfileId: data.authorProfileId,
      authorName: data.authorName,
      authorRole: data.authorRole,
      bodyText: data.bodyText,
      sentAtIso: new Date().toISOString(),
      aiDrafted: data.aiDrafted ?? false,
    };
    const updatedMessages = [...existingMessages, newMessage];

    const { data: updated, error: updateErr } = await db.from("message_threads")
      .update({ messages: updatedMessages, updated_at_iso: new Date().toISOString(), has_unread: true })
      .eq("id", data.threadId)
      .select("*")
      .single();
    if (updateErr) throw new Error(`sendMessage/update: ${updateErr.message}`);
    return mapMessageThread(updated);
  });

// ── New Concerns ──────────────────────────────────────────────────────────────
const _getNewConcerns = createServerFn({ method: "GET" })
  .handler(async (): Promise<NewConcern[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("new_concerns").select("*").order("created_at_iso", { ascending: false });
    if (error) throw new Error(`getNewConcerns: ${error.message}`);
    return (data ?? []).map(mapNewConcern);
  });

const _getNewConcernsByCustomer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ customerId: z.string() }))
  .handler(async ({ data }): Promise<NewConcern[]> => {
    const db = await makeClient();
    const { data: rows, error } = await db.from("new_concerns").select("*").eq("customer_id", data.customerId);
    if (error) throw new Error(`getNewConcernsByCustomer: ${error.message}`);
    return (rows ?? []).map(mapNewConcern);
  });

const _updateConcernDiagnostics = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    concernId: z.string(),
    selectedDiagnosticIds: z.array(z.string()),
    diagnosticNotes: z.string(),
  }))
  .handler(async ({ data }): Promise<NewConcern> => {
    const db = await makeClient("service_role");
    const { data: updated, error } = await db.from("new_concerns")
      .update({
        selected_diagnostic_ids: data.selectedDiagnosticIds,
        diagnostic_notes: data.diagnosticNotes,
        status: "reviewed",
      })
      .eq("id", data.concernId)
      .select("*")
      .single();
    if (error) throw new Error(`updateConcernDiagnostics: ${error.message}`);
    return mapNewConcern(updated);
  });

const _createDraftWorkOrder = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    concernId: z.string(),
    title: z.string(),
    requestedDateIso: z.string(),
    foremanNote: z.string(),
  }))
  .handler(async ({ data }): Promise<DraftWorkOrder> => {
    const db = await makeClient("service_role");
    const { data: concern, error: fetchErr } = await db.from("new_concerns").select("*").eq("id", data.concernId).single();
    if (fetchErr) throw new Error(`createDraftWorkOrder/fetch: ${fetchErr.message}`);

    const draftId = `dwo_${crypto.randomUUID().slice(0, 8)}`;
    const draft = {
      id: draftId,
      concern_id: data.concernId,
      customer_id: concern.customer_id,
      vehicle_id: concern.vehicle_id,
      title: data.title,
      complaint: concern.complaint,
      diagnostic_notes: concern.diagnostic_notes ?? "",
      requested_date_iso: data.requestedDateIso,
      urgency: concern.urgency,
      foreman_note: data.foremanNote,
      selected_diagnostics: concern.selected_diagnostic_ids ?? [],
      created_at_iso: new Date().toISOString(),
      status: "pending_foreman" as const,
    };

    const { data: inserted, error: insertErr } = await db.from("draft_work_orders").insert(draft).select("*").single();
    if (insertErr) throw new Error(`createDraftWorkOrder/insert: ${insertErr.message}`);

    await db.from("new_concerns")
      .update({ draft_work_order_id: draftId, status: "drafted" })
      .eq("id", data.concernId);

    return mapDraftWorkOrder(inserted);
  });

const _getDraftWorkOrders = createServerFn({ method: "GET" })
  .handler(async (): Promise<DraftWorkOrder[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("draft_work_orders").select("*").order("created_at_iso", { ascending: false });
    if (error) throw new Error(`getDraftWorkOrders: ${error.message}`);
    return (data ?? []).map(mapDraftWorkOrder);
  });

// ── Technician Shifts ─────────────────────────────────────────────────────────
const _getShiftsByTechnician = createServerFn({ method: "POST" })
  .inputValidator(z.object({ technicianId: z.string() }))
  .handler(async ({ data }): Promise<TechnicianShift[]> => {
    const db = await makeClient();
    const { data: rows, error } = await db.from("technician_shifts").select("*")
      .eq("technician_id", data.technicianId)
      .order("clocked_in_iso", { ascending: false });
    if (error) throw new Error(`getShiftsByTechnician: ${error.message}`);
    return (rows ?? []).map(mapTechnicianShift);
  });

const _getActiveShift = createServerFn({ method: "POST" })
  .inputValidator(z.object({ technicianId: z.string() }))
  .handler(async ({ data }): Promise<TechnicianShift | null> => {
    const db = await makeClient();
    const { data: rows, error } = await db.from("technician_shifts").select("*")
      .eq("technician_id", data.technicianId)
      .is("clocked_out_iso", null)
      .limit(1);
    if (error) throw new Error(`getActiveShift: ${error.message}`);
    const row = (rows ?? [])[0];
    return row ? mapTechnicianShift(row) : null;
  });

const _clockIn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ technicianId: z.string(), bayId: z.string().nullable() }))
  .handler(async ({ data }): Promise<TechnicianShift> => {
    const db = await makeClient("service_role");
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const shiftId = `shift_${crypto.randomUUID().slice(0, 8)}`;

    const { data: inserted, error: insertErr } = await db.from("technician_shifts")
      .insert({
        id: shiftId,
        technician_id: data.technicianId,
        clocked_in_iso: now,
        clocked_out_iso: null,
        bay_id: data.bayId,
        scheduled_hours: 8,
        break_minutes: 0,
        shift_date: today,
      })
      .select("*")
      .single();
    if (insertErr) throw new Error(`clockIn/insert: ${insertErr.message}`);

    await db.from("technicians").update({ clocked_in: true }).eq("id", data.technicianId);
    return mapTechnicianShift(inserted);
  });

const _clockOut = createServerFn({ method: "POST" })
  .inputValidator(z.object({ technicianId: z.string() }))
  .handler(async ({ data }): Promise<TechnicianShift> => {
    const db = await makeClient("service_role");
    const { data: rows, error: fetchErr } = await db.from("technician_shifts").select("*")
      .eq("technician_id", data.technicianId)
      .is("clocked_out_iso", null)
      .limit(1);
    if (fetchErr) throw new Error(`clockOut/fetch: ${fetchErr.message}`);
    const activeShift = (rows ?? [])[0];
    if (!activeShift) throw new Error("No active shift found for technician");

    const now = new Date().toISOString();
    const { data: updated, error: updateErr } = await db.from("technician_shifts")
      .update({ clocked_out_iso: now })
      .eq("id", activeShift.id)
      .select("*")
      .single();
    if (updateErr) throw new Error(`clockOut/update: ${updateErr.message}`);

    await db.from("technicians").update({ clocked_in: false }).eq("id", data.technicianId);
    return mapTechnicianShift(updated);
  });

// ── Foreman Notes ─────────────────────────────────────────────────────────────
const _getForemanNote = createServerFn({ method: "POST" })
  .inputValidator(z.object({ workOrderId: z.string() }))
  .handler(async ({ data }): Promise<WorkOrderForemanNote | null> => {
    const db = await makeClient();
    const { data: row, error } = await db.from("work_order_foreman_notes").select("*").eq("work_order_id", data.workOrderId).single();
    if (error) return null;
    return mapForemanNote(row);
  });

const _getForemanNotes = createServerFn({ method: "GET" })
  .handler(async (): Promise<WorkOrderForemanNote[]> => {
    const db = await makeClient();
    const { data, error } = await db.from("work_order_foreman_notes").select("*");
    if (error) throw new Error(`getForemanNotes: ${error.message}`);
    return (data ?? []).map(mapForemanNote);
  });

// ── Quote Breakdown ───────────────────────────────────────────────────────────
const _getQuoteBreakdown = createServerFn({ method: "POST" })
  .inputValidator(z.object({ workOrderId: z.string() }))
  .handler(async ({ data }): Promise<QuoteBreakdown | null> => {
    const db = await makeClient();
    const { data: row, error } = await db.from("quote_breakdowns").select("*").eq("work_order_id", data.workOrderId).single();
    if (error) return null;
    return mapQuoteBreakdown(row);
  });

// ── AI stubs (Phase 9 replaces with real LLM calls) ──────────────────────────
const _getAiUrgencySuggestion = createServerFn({ method: "POST" })
  .inputValidator(z.object({ workOrderId: z.string() }))
  .handler(async ({ data }): Promise<Urgency> => {
    const db = await makeClient();
    const { data: row, error } = await db.from("work_orders").select("urgency").eq("id", data.workOrderId).single();
    if (error) return "normal";
    return (row?.urgency ?? "normal") as Urgency;
  });

const _getRecommendedProcedure = createServerFn({ method: "POST" })
  .inputValidator(z.object({ subsystemKey: z.string() }))
  .handler(async ({ data }): Promise<string> => {
    return PROCEDURE_STUBS[data.subsystemKey] ?? "No procedure available for this subsystem.";
  });

// ─── Export ───────────────────────────────────────────────────────────────────
export const supabaseDataService = {
  getShop: () => _getShop(),
  getProfiles: () => _getProfiles(),
  getProfileByRole: (role: Role) => _getProfileByRole({ data: { role } }),
  getCustomers: () => _getCustomers(),
  getCustomerById: (id: string) => _getCustomerById({ data: { id } }),
  getServiceHistoryByCustomer: (customerId: string) => _getServiceHistoryByCustomer({ data: { customerId } }),
  getServiceHistoryByVehicle: (vehicleId: string) => _getServiceHistoryByVehicle({ data: { vehicleId } }),
  getCustomerRecommendations: (customerId: string) => _getCustomerRecommendations({ data: { customerId } }),
  getVehicles: () => _getVehicles(),
  getVehicleById: (id: string) => _getVehicleById({ data: { id } }),
  getVehiclesByCustomer: (customerId: string) => _getVehiclesByCustomer({ data: { customerId } }),
  getTechnicians: () => _getTechnicians(),
  getTechnicianById: (id: string) => _getTechnicianById({ data: { id } }),
  getWorkOrders: () => _getWorkOrders(),
  getWorkOrderById: (id: string) => _getWorkOrderById({ data: { id } }),
  getWorkOrdersByTech: (technicianId: string) => _getWorkOrdersByTech({ data: { technicianId } }),
  getWorkOrdersByCustomer: (customerId: string) => _getWorkOrdersByCustomer({ data: { customerId } }),
  getWorkOrdersByStatus: (status: WorkOrderStatus) => _getWorkOrdersByStatus({ data: { status } }),
  getInventory: () => _getInventory(),
  getTools: () => _getTools(),
  getToolCheckouts: () => _getToolCheckouts(),
  getTimeEntries: () => _getTimeEntries(),
  getInvoices: () => _getInvoices(),
  getInvoiceById: (id: string) => _getInvoiceById({ data: { id } }),
  getLeads: () => _getLeads(),
  getTasks: () => _getTasks(),
  getBays: () => _getBays(),
  delegateTicket: (params: { workOrderId: string; bayId: string; technicianId: string }) =>
    _delegateTicket({ data: params }),
  getInventoryCategoryThresholds: () => _getInventoryCategoryThresholds(),
  getMessageThreads: () => _getMessageThreads(),
  getMessageThreadsByWorkOrder: (workOrderId: string) => _getMessageThreadsByWorkOrder({ data: { workOrderId } }),
  getMessageThreadsByCustomer: (customerId: string) => _getMessageThreadsByCustomer({ data: { customerId } }),
  getMessageThreadById: (threadId: string) => _getMessageThreadById({ data: { threadId } }),
  sendMessage: (params: { threadId: string; authorProfileId: string; authorName: string; authorRole: Role; bodyText: string; aiDrafted?: boolean }) =>
    _sendMessage({ data: params }),
  getNewConcerns: () => _getNewConcerns(),
  getNewConcernsByCustomer: (customerId: string) => _getNewConcernsByCustomer({ data: { customerId } }),
  updateConcernDiagnostics: (params: { concernId: string; selectedDiagnosticIds: string[]; diagnosticNotes: string }) =>
    _updateConcernDiagnostics({ data: params }),
  createDraftWorkOrder: (params: { concernId: string; title: string; requestedDateIso: string; foremanNote: string }) =>
    _createDraftWorkOrder({ data: params }),
  getDraftWorkOrders: () => _getDraftWorkOrders(),
  getShiftsByTechnician: (technicianId: string) => _getShiftsByTechnician({ data: { technicianId } }),
  getActiveShift: (technicianId: string) => _getActiveShift({ data: { technicianId } }),
  clockIn: (params: { technicianId: string; bayId: string | null }) => _clockIn({ data: params }),
  clockOut: (technicianId: string) => _clockOut({ data: { technicianId } }),
  getForemanNote: (workOrderId: string) => _getForemanNote({ data: { workOrderId } }),
  getForemanNotes: () => _getForemanNotes(),
  getQuoteBreakdown: (workOrderId: string) => _getQuoteBreakdown({ data: { workOrderId } }),
  getAiUrgencySuggestion: (workOrderId: string) => _getAiUrgencySuggestion({ data: { workOrderId } }),
  getRecommendedProcedure: (subsystemKey: SubsystemKey) => _getRecommendedProcedure({ data: { subsystemKey } }),
} satisfies DataService;
