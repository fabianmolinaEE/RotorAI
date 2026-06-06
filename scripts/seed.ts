/**
 * Seed script: populates the Hialeah Auto Works demo story in Supabase.
 * Uses service_role key — bypasses RLS.
 * Idempotent: upsert with onConflict: 'id' — safe to re-run.
 *
 * Run: bun run seed
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment
 */

import { createClient } from "@supabase/supabase-js";
import {
  bays,
  customers,
  customerRecommendations,
  draftWorkOrders,
  foremanNotes,
  inventory,
  inventoryCategoryThresholds,
  invoices,
  leads,
  messageThreads,
  newConcerns,
  profiles,
  serviceHistory,
  shop,
  tasks,
  technicians,
  technicianShifts,
  timeEntries,
  toolCheckouts,
  tools,
  vehicles,
  workOrders,
} from "../src/data/seed";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.\n" +
      "Get these from Supabase dashboard → Settings → API.",
  );
  process.exit(1);
}

const db = createClient(supabaseUrl, serviceRoleKey);

async function upsert(table: string, rows: unknown | unknown[]) {
  const data = Array.isArray(rows) ? rows : [rows];
  if (data.length === 0) {
    console.log(`  SKIP: ${table} (0 rows)`);
    return;
  }
  const { error } = await db
    .from(table)
    .upsert(data as Record<string, unknown>[], { onConflict: "id" });
  if (error) {
    console.error(`  FAILED ${table}:`, error.message);
    throw error;
  }
  console.log(`  OK: ${table} (${data.length} rows)`);
}

function mapShop() {
  return {
    id: shop.id,
    name: shop.name,
    address: shop.address,
    phone: shop.phone,
    email: shop.email,
  };
}

function mapProfile(p: (typeof profiles)[0]) {
  return {
    id: p.id,
    role: p.role,
    name: p.name,
    email: p.email,
    avatar_color: p.avatarColor,
  };
}

function mapCustomer(c: (typeof customers)[0]) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    vehicle_ids: c.vehicleIds,
    since: c.since,
  };
}

function mapVehicle(v: (typeof vehicles)[0]) {
  return {
    id: v.id,
    customer_id: v.customerId,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: v.trim ?? null,
    vin: v.vin,
    plate: v.plate,
    mileage: v.mileage,
    color: v.color,
  };
}

function mapTechnician(t: (typeof technicians)[0]) {
  return {
    id: t.id,
    profile_id: t.profileId,
    name: t.name,
    specialty: t.specialty,
    clocked_in: t.clockedIn,
    active_work_order_ids: t.activeWorkOrderIds,
    weekly_completed: t.weeklyCompleted,
    certifications: t.certifications,
  };
}

function mapBay(b: (typeof bays)[0]) {
  return {
    id: b.id,
    label: b.label,
    status: b.status,
    technician_id: b.technicianId ?? null,
    work_order_id: b.workOrderId ?? null,
    note: b.note ?? null,
  };
}

function mapWorkOrder(w: (typeof workOrders)[0]) {
  return {
    id: w.id,
    number: w.number,
    vehicle_id: w.vehicleId,
    customer_id: w.customerId,
    technician_id: w.technicianId ?? null,
    status: w.status,
    urgency: w.urgency,
    ai_urgency: w.aiUrgency,
    title: w.title,
    complaint: w.complaint,
    subsystems: w.subsystems,
    quote_amount: w.quoteAmount,
    labor_hours: w.laborHours,
    parts_cost: w.partsCost,
    eta_iso: w.etaIso,
    created_at_iso: w.createdAtIso,
    updated_at_iso: w.updatedAtIso,
  };
}

function mapQuoteBreakdown(w: (typeof workOrders)[0]) {
  const qb = w.quoteBreakdown;
  return {
    id: qb.id,
    work_order_id: qb.workOrderId,
    status: qb.status,
    generated_by: qb.generatedBy,
    customer_summary: qb.customerSummary,
    customer_detail_available: qb.customerDetailAvailable,
    internal_notes: qb.internalNotes ?? null,
    lines: qb.lines,
    subtotal: qb.subtotal,
    tax: qb.tax,
    total: qb.total,
  };
}

function mapInvoice(inv: (typeof invoices)[0]) {
  return {
    id: inv.id,
    number: inv.number,
    work_order_id: inv.workOrderId,
    customer_id: inv.customerId,
    issued_iso: inv.issuedIso,
    status: inv.status,
    lines: inv.lines,
    subtotal: inv.subtotal,
    tax: inv.tax,
    total: inv.total,
  };
}

function mapServiceHistory(s: (typeof serviceHistory)[0]) {
  return {
    id: s.id,
    customer_id: s.customerId,
    vehicle_id: s.vehicleId,
    work_order_id: s.workOrderId ?? null,
    invoice_id: s.invoiceId ?? null,
    serviced_at_iso: s.servicedAtIso,
    mileage: s.mileage,
    title: s.title,
    summary: s.summary,
    shop_name: s.shopName,
    technician_name: s.technicianName ?? null,
    invoice_total: s.invoiceTotal ?? null,
    customer_notes: s.customerNotes ?? null,
  };
}

function mapCustomerRecommendation(r: (typeof customerRecommendations)[0]) {
  return {
    id: r.id,
    customer_id: r.customerId,
    vehicle_id: r.vehicleId,
    subsystem_key: r.subsystemKey ?? null,
    title: r.title,
    reason: r.reason,
    due_window: r.dueWindow,
    severity: r.severity,
    status: r.status,
    generated_by: r.generatedBy,
    created_at_iso: r.createdAtIso,
  };
}

function mapTechnicianShift(s: (typeof technicianShifts)[0]) {
  return {
    id: s.id,
    technician_id: s.technicianId,
    clocked_in_iso: s.clockedInIso,
    clocked_out_iso: s.clockedOutIso ?? null,
    bay_id: s.bayId ?? null,
    scheduled_hours: s.scheduledHours,
    break_minutes: s.breakMinutes,
    shift_date: s.shiftDate,
  };
}

function mapTimeEntry(t: (typeof timeEntries)[0]) {
  return {
    id: t.id,
    technician_id: t.technicianId,
    work_order_id: t.workOrderId,
    started_iso: t.startedIso,
    ended_iso: t.endedIso ?? null,
    minutes: t.minutes,
  };
}

function mapInventoryItem(i: (typeof inventory)[0]) {
  return {
    id: i.id,
    sku: i.sku,
    name: i.name,
    category: i.category,
    qty_on_hand: i.qtyOnHand,
    reorder_at: i.reorderAt,
    unit_cost: i.unitCost,
    bin_location: i.binLocation,
    usage_rank: i.usageRank,
  };
}

function mapInventoryThreshold(t: (typeof inventoryCategoryThresholds)[0]) {
  return { category: t.category, low_at: t.lowAt, high_at: t.highAt };
}

function mapTool(t: (typeof tools)[0]) {
  return {
    id: t.id,
    name: t.name,
    category: t.category,
    serial_number: t.serialNumber,
    available: t.available,
  };
}

function mapToolCheckout(t: (typeof toolCheckouts)[0]) {
  return {
    id: t.id,
    tool_id: t.toolId,
    technician_id: t.technicianId,
    checked_out_iso: t.checkedOutIso,
    work_order_id: t.workOrderId ?? null,
  };
}

function mapLead(l: (typeof leads)[0]) {
  return {
    id: l.id,
    name: l.name,
    phone: l.phone,
    source: l.source,
    interest: l.interest,
    created_iso: l.createdIso,
  };
}

function mapTask(t: (typeof tasks)[0]) {
  return {
    id: t.id,
    title: t.title,
    assignee_id: t.assigneeId,
    due_iso: t.dueIso,
    done: t.done,
  };
}

function mapMessageThread(mt: (typeof messageThreads)[0]) {
  return {
    id: mt.id,
    type: mt.type,
    subject: mt.subject,
    participants: mt.participants,
    work_order_id: mt.workOrderId ?? null,
    customer_id: mt.customerId ?? null,
    vehicle_id: mt.vehicleId ?? null,
    messages: mt.messages,
    created_at_iso: mt.createdAtIso,
    updated_at_iso: mt.updatedAtIso,
    has_unread: mt.hasUnread,
  };
}

function mapNewConcern(c: (typeof newConcerns)[0]) {
  return {
    id: c.id,
    customer_id: c.customerId,
    vehicle_id: c.vehicleId,
    source: c.source,
    complaint: c.complaint,
    urgency: c.urgency,
    status: c.status,
    created_at_iso: c.createdAtIso,
    ai_diagnostic_suggestions: c.aiDiagnosticSuggestions,
    diagnostic_notes: c.diagnosticNotes ?? null,
    selected_diagnostic_ids: c.selectedDiagnosticIds ?? null,
    draft_work_order_id: c.draftWorkOrderId ?? null,
  };
}

function mapDraftWorkOrder(d: (typeof draftWorkOrders)[0]) {
  return {
    id: d.id,
    concern_id: d.concernId,
    customer_id: d.customerId,
    vehicle_id: d.vehicleId,
    title: d.title,
    complaint: d.complaint,
    diagnostic_notes: d.diagnosticNotes,
    requested_date_iso: d.requestedDateIso,
    urgency: d.urgency,
    foreman_note: d.foremanNote,
    selected_diagnostics: d.selectedDiagnostics,
    created_at_iso: d.createdAtIso,
    status: d.status,
  };
}

function mapForemanNote(n: (typeof foremanNotes)[0]) {
  return {
    work_order_id: n.workOrderId,
    note: n.note,
    foreman_name: n.foremanName,
    written_at_iso: n.writtenAtIso,
  };
}

// Additional technician profiles referenced in seed.ts technicians array
// but absent from the profiles array (only p_tech/Luis is in the main profiles list).
const additionalTechProfiles = [
  { id: "p_tech_marcus", role: "technician", name: "Marcus Bell", email: "marcus@hialeahautoworks.com", avatar_color: "oklch(0.65 0.18 30)" },
  { id: "p_tech_ana", role: "technician", name: "Ana Beltran", email: "ana@hialeahautoworks.com", avatar_color: "oklch(0.68 0.17 150)" },
];

async function seed() {
  console.log("Seeding Hialeah Auto Works demo data...\n");

  // Insert in FK-dependency order
  await upsert("shops", mapShop());
  // Upsert main profiles first, then additional technician profiles not in seed.ts
  await upsert("profiles", [...profiles.map(mapProfile), ...additionalTechProfiles]);
  await upsert("customers", customers.map(mapCustomer));
  await upsert("vehicles", vehicles.map(mapVehicle));
  await upsert("technicians", technicians.map(mapTechnician));

  // Insert work_orders before bays (bays.work_order_id FK requires work_orders to exist)
  await upsert("work_orders", workOrders.map(mapWorkOrder));
  await upsert("quote_breakdowns", workOrders.map(mapQuoteBreakdown));
  await upsert("bays", bays.map(mapBay));

  await upsert("invoices", invoices.map(mapInvoice));
  await upsert("service_history", serviceHistory.map(mapServiceHistory));
  await upsert(
    "customer_recommendations",
    customerRecommendations.map(mapCustomerRecommendation),
  );
  await upsert("technician_shifts", technicianShifts.map(mapTechnicianShift));
  await upsert("time_entries", timeEntries.map(mapTimeEntry));
  await upsert("inventory_items", inventory.map(mapInventoryItem));

  // inventory_category_thresholds PK is category, not id
  const { error: threshErr } = await db
    .from("inventory_category_thresholds")
    .upsert(inventoryCategoryThresholds.map(mapInventoryThreshold), {
      onConflict: "category",
    });
  if (threshErr) {
    console.error("  FAILED inventory_category_thresholds:", threshErr.message);
    throw threshErr;
  }
  console.log(
    `  OK: inventory_category_thresholds (${inventoryCategoryThresholds.length} rows)`,
  );

  await upsert("tools", tools.map(mapTool));
  await upsert("tool_checkouts", toolCheckouts.map(mapToolCheckout));
  await upsert("leads", leads.map(mapLead));
  await upsert("tasks", tasks.map(mapTask));
  await upsert("message_threads", messageThreads.map(mapMessageThread));
  await upsert("new_concerns", newConcerns.map(mapNewConcern));
  await upsert("draft_work_orders", draftWorkOrders.map(mapDraftWorkOrder));

  // work_order_foreman_notes PK is work_order_id, not id
  if (foremanNotes.length > 0) {
    const { error: fnErr } = await db
      .from("work_order_foreman_notes")
      .upsert(foremanNotes.map(mapForemanNote), {
        onConflict: "work_order_id",
      });
    if (fnErr) {
      console.error("  FAILED work_order_foreman_notes:", fnErr.message);
      throw fnErr;
    }
    console.log(`  OK: work_order_foreman_notes (${foremanNotes.length} rows)`);
  }

  console.log(
    "\nSeed complete. Hialeah Auto Works demo story is live in Supabase.",
  );
}

seed().catch((err) => {
  console.error("\nSeed failed:", err);
  process.exit(1);
});
