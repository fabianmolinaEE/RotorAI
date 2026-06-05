import type { DataService } from "./dataService";
import {
  bays,
  customers,
  customerRecommendations,
  draftWorkOrders,
  inventory,
  inventoryCategoryThresholds,
  inventoryGlobalThreshold,
  invoices,
  leads,
  messageThreads,
  newConcerns,
  profiles,
  shop,
  serviceHistory,
  tasks,
  technicians,
  timeEntries,
  toolCheckouts,
  tools,
  vehicles,
  workOrders,
} from "./seed";
import type { Bay, DraftWorkOrder, Role, SubsystemKey, Urgency, WorkOrderStatus } from "./types";

const ok = <T>(v: T): Promise<T> => Promise.resolve(v);

export const mockDataService: DataService = {
  getShop: () => ok(shop),

  getProfiles: () => ok(profiles),
  getProfileByRole: (role: Role) =>
    ok(profiles.find((p) => p.role === role) ?? null),

  getCustomers: () => ok(customers),
  getCustomerById: (id) => ok(customers.find((c) => c.id === id) ?? null),
  getServiceHistoryByCustomer: (customerId) =>
    ok(serviceHistory.filter((record) => record.customerId === customerId)),
  getServiceHistoryByVehicle: (vehicleId) =>
    ok(serviceHistory.filter((record) => record.vehicleId === vehicleId)),
  getCustomerRecommendations: (customerId) =>
    ok(customerRecommendations.filter((rec) => rec.customerId === customerId)),

  getVehicles: () => ok(vehicles),
  getVehicleById: (id) => ok(vehicles.find((v) => v.id === id) ?? null),
  getVehiclesByCustomer: (customerId) =>
    ok(vehicles.filter((v) => v.customerId === customerId)),

  getTechnicians: () => ok(technicians),
  getTechnicianById: (id) => ok(technicians.find((t) => t.id === id) ?? null),

  getWorkOrders: () => ok(workOrders),
  getWorkOrderById: (id) => ok(workOrders.find((w) => w.id === id) ?? null),
  getWorkOrdersByTech: (technicianId) =>
    ok(workOrders.filter((w) => w.technicianId === technicianId)),
  getWorkOrdersByCustomer: (customerId) =>
    ok(workOrders.filter((w) => w.customerId === customerId)),
  getWorkOrdersByStatus: (status: WorkOrderStatus) =>
    ok(workOrders.filter((w) => w.status === status)),

  getInventory: () => ok(inventory),
  getTools: () => ok(tools),
  getToolCheckouts: () => ok(toolCheckouts),
  getTimeEntries: () => ok(timeEntries),

  getInvoices: () => ok(invoices),
  getInvoiceById: (id) => ok(invoices.find((i) => i.id === id) ?? null),

  getLeads: () => ok(leads),
  getTasks: () => ok(tasks),

  getBays: () => ok([...bays]),

  delegateTicket: ({ workOrderId, bayId, technicianId }) => {
    const bay = bays.find((b) => b.id === bayId);
    if (!bay) return Promise.reject(new Error(`Bay ${bayId} not found`));

    const wo = workOrders.find((w) => w.id === workOrderId);
    if (!wo) return Promise.reject(new Error(`Work order ${workOrderId} not found`));

    bay.status = "active";
    bay.workOrderId = workOrderId;
    bay.technicianId = technicianId;

    wo.technicianId = technicianId;
    wo.status = "in_progress";

    const tech = technicians.find((t) => t.id === technicianId);
    if (tech && !tech.activeWorkOrderIds.includes(workOrderId)) {
      tech.activeWorkOrderIds.push(workOrderId);
    }

    return ok({ ...bay } as Bay);
  },

  getInventoryCategoryThresholds: () =>
    ok([...inventoryCategoryThresholds, inventoryGlobalThreshold]),

  // ─── Messaging ──────────────────────────────────────────────────────────────
  getMessageThreads: () => ok([...messageThreads]),
  getMessageThreadsByWorkOrder: (workOrderId) =>
    ok(messageThreads.filter((t) => t.workOrderId === workOrderId)),
  getMessageThreadsByCustomer: (customerId) =>
    ok(messageThreads.filter((t) => t.customerId === customerId)),
  getMessageThreadById: (threadId) =>
    ok(messageThreads.find((t) => t.id === threadId) ?? null),
  sendMessage: ({ threadId, authorProfileId, authorName, authorRole, bodyText, aiDrafted = false }) => {
    const thread = messageThreads.find((t) => t.id === threadId);
    if (!thread) return Promise.reject(new Error(`Thread ${threadId} not found`));
    const newMessage = {
      id: `msg_${Date.now()}`,
      threadId,
      authorProfileId,
      authorName,
      authorRole,
      bodyText,
      sentAtIso: new Date().toISOString(),
      aiDrafted,
    };
    thread.messages.push(newMessage);
    thread.updatedAtIso = newMessage.sentAtIso;
    thread.hasUnread = false;
    return ok({ ...thread, messages: [...thread.messages] });
  },

  // ─── Service Advisor: Concerns and Draft Work Orders ──────────────────────
  getNewConcerns: () =>
    ok([...newConcerns].sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso))),
  getNewConcernsByCustomer: (customerId) =>
    ok(newConcerns.filter((c) => c.customerId === customerId)),
  updateConcernDiagnostics: ({ concernId, selectedDiagnosticIds, diagnosticNotes }) => {
    const concern = newConcerns.find((c) => c.id === concernId);
    if (!concern) return Promise.reject(new Error(`Concern ${concernId} not found`));
    concern.selectedDiagnosticIds = selectedDiagnosticIds;
    concern.diagnosticNotes = diagnosticNotes;
    concern.status = "reviewed";
    return ok({ ...concern });
  },
  createDraftWorkOrder: ({ concernId, title, requestedDateIso, foremanNote }) => {
    const concern = newConcerns.find((c) => c.id === concernId);
    if (!concern) return Promise.reject(new Error(`Concern ${concernId} not found`));
    const selectedDiagnostics = (concern.selectedDiagnosticIds ?? []).map(
      (id) => concern.aiDiagnosticSuggestions.find((s) => s.id === id)?.label ?? id,
    );
    const draft: DraftWorkOrder = {
      id: `draft_${Date.now()}`,
      concernId,
      customerId: concern.customerId,
      vehicleId: concern.vehicleId,
      title,
      complaint: concern.complaint,
      diagnosticNotes: concern.diagnosticNotes ?? "",
      requestedDateIso,
      urgency: concern.urgency,
      foremanNote,
      selectedDiagnostics,
      createdAtIso: new Date().toISOString(),
      status: "pending_foreman",
    };
    draftWorkOrders.push(draft);
    concern.draftWorkOrderId = draft.id;
    concern.status = "drafted";
    return ok({ ...draft });
  },
  getDraftWorkOrders: () => ok([...draftWorkOrders]),

  getQuoteBreakdown: (workOrderId) =>
    ok(workOrders.find((w) => w.id === workOrderId)?.quoteBreakdown ?? null),
  getAiUrgencySuggestion: (workOrderId): Promise<Urgency> =>
    ok(workOrders.find((w) => w.id === workOrderId)?.aiUrgency ?? "normal"),
  getRecommendedProcedure: (subsystemKey: SubsystemKey) => {
    for (const wo of workOrders) {
      const s = wo.subsystems.find((s) => s.key === subsystemKey);
      if (s && s.procedure) return ok(s.procedure);
    }
    return ok("Inspect, diagnose, repair per OEM service procedure.");
  },
};
