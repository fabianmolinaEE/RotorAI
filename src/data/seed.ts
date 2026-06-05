import type {
  Bay,
  Customer,
  InventoryCategoryThreshold,
  Invoice,
  InventoryItem,
  Lead,
  Profile,
  Shop,
  Task,
  Technician,
  TimeEntry,
  Tool,
  ToolCheckout,
  Vehicle,
  WorkOrder,
} from "./types";

export const shop: Shop = {
  id: "shop_hialeah",
  name: "Hialeah Auto Works",
  address: "2147 W 4th Ave, Hialeah, FL 33010",
  phone: "(305) 884-2719",
  email: "service@hialeahautoworks.com",
};

export const profiles: Profile[] = [
  { id: "p_owner", role: "owner", name: "Frank Delgado", email: "frank@hialeahautoworks.com", avatarColor: "oklch(0.62 0.18 245)" },
  { id: "p_manager", role: "manager", name: "Sandra Pratt", email: "sandra@hialeahautoworks.com", avatarColor: "oklch(0.65 0.16 160)" },
  { id: "p_sa", role: "service_advisor", name: "Carlos Vega", email: "carlos@hialeahautoworks.com", avatarColor: "oklch(0.68 0.17 290)" },
  { id: "p_tech", role: "technician", name: "Luis Ortega", email: "luis@hialeahautoworks.com", avatarColor: "oklch(0.7 0.17 50)" },
  { id: "p_customer", role: "customer", name: "Maria Reyes", email: "maria.reyes@gmail.com", avatarColor: "oklch(0.65 0.18 330)" },
];

export const customers: Customer[] = [
  { id: "c_maria", name: "Maria Reyes", email: "maria.reyes@gmail.com", phone: "(305) 422-1188", vehicleIds: ["v_civic_2019", "v_f150_2015"], since: "2021-03-14" },
  { id: "c_jamal", name: "Jamal Wright", email: "jwright@yahoo.com", phone: "(786) 311-4422", vehicleIds: ["v_camry_2020"], since: "2022-08-02" },
  { id: "c_priya", name: "Priya Shah", email: "priya.shah@outlook.com", phone: "(305) 779-0214", vehicleIds: ["v_rav4_2021"], since: "2023-01-19" },
  { id: "c_diego", name: "Diego Alvarez", email: "diegoa@gmail.com", phone: "(786) 552-9803", vehicleIds: ["v_silverado_2017"], since: "2020-11-08" },
  { id: "c_emma", name: "Emma Lindqvist", email: "emma.l@protonmail.com", phone: "(305) 884-7341", vehicleIds: ["v_mazda3_2022"], since: "2024-02-27" },
];

export const vehicles: Vehicle[] = [
  { id: "v_civic_2019", customerId: "c_maria", year: 2019, make: "Honda", model: "Civic", trim: "EX", vin: "2HGFC2F69KH543218", plate: "HJK 4421", mileage: 47832, color: "Silver" },
  { id: "v_f150_2015", customerId: "c_maria", year: 2015, make: "Ford", model: "F-150", trim: "XLT", vin: "1FTEW1EF1FFA22113", plate: "TRQ 8810", mileage: 88214, color: "White" },
  { id: "v_camry_2020", customerId: "c_jamal", year: 2020, make: "Toyota", model: "Camry", trim: "SE", vin: "4T1G11AK5LU912345", plate: "LMP 2294", mileage: 62107, color: "Dark Blue" },
  { id: "v_rav4_2021", customerId: "c_priya", year: 2021, make: "Toyota", model: "RAV4", trim: "Hybrid", vin: "JTMRWRFV2MD104782", plate: "VEC 7102", mileage: 38241, color: "Pearl White" },
  { id: "v_silverado_2017", customerId: "c_diego", year: 2017, make: "Chevrolet", model: "Silverado 1500", trim: "LT", vin: "3GCUKREC5HG421987", plate: "DGO 1184", mileage: 104732, color: "Black" },
  { id: "v_mazda3_2022", customerId: "c_emma", year: 2022, make: "Mazda", model: "Mazda3", trim: "Premium", vin: "JM1BPBJL5N1500214", plate: "EMA 0027", mileage: 21487, color: "Soul Red" },
];

export const technicians: Technician[] = [
  { id: "t_luis", profileId: "p_tech", name: "Luis Ortega", specialty: "Brakes & Suspension", clockedIn: true, activeWorkOrderIds: ["wo_001", "wo_004", "wo_007"], weeklyCompleted: 1, certifications: ["ASE A5", "ASE A4"] },
  { id: "t_marcus", profileId: "p_tech_marcus", name: "Marcus Bell", specialty: "Engine & Drivetrain", clockedIn: true, activeWorkOrderIds: ["wo_003", "wo_009"], weeklyCompleted: 3, certifications: ["ASE A1", "ASE A2", "ASE A3"] },
  { id: "t_ana", profileId: "p_tech_ana", name: "Ana Beltran", specialty: "Electrical & Diagnostics", clockedIn: false, activeWorkOrderIds: ["wo_006"], weeklyCompleted: 2, certifications: ["ASE A6", "ASE A8"] },
];

const todayMs = Date.UTC(2026, 5, 2, 14, 30);
const isoOffset = (deltaHours: number) =>
  new Date(todayMs + deltaHours * 3600 * 1000).toISOString();

export const workOrders: WorkOrder[] = [
  {
    id: "wo_001",
    number: "WO-2871",
    vehicleId: "v_civic_2019",
    customerId: "c_maria",
    technicianId: "t_luis",
    status: "in_progress",
    urgency: "high",
    aiUrgency: "high",
    title: "Grinding noise, brake warning light",
    complaint: "Customer reports loud metallic grinding when braking, ABS warning on dash since Saturday.",
    subsystems: [
      {
        key: "brakes_front",
        label: "Front brakes",
        status: "fix",
        tools: ["Torque wrench (1/2\")", "C-clamp", "Brake bleeder kit", "21mm socket"],
        timeEstimateMin: 105,
        procedure:
          "Replace front pads + rotors. Inspect calipers for sticking pistons. Bleed front circuit, road test under hard braking.",
        resources: [
          { label: "Honda Civic 2019 brake service TSB", url: "#" },
          { label: "Torque spec sheet", url: "#" },
        ],
        notes: "Pads worn to 1.2mm; rotor lip 0.4mm beyond spec.",
      },
      {
        key: "electrical",
        label: "Electrical",
        status: "check",
        tools: ["OBD-II scanner", "Multimeter"],
        timeEstimateMin: 30,
        procedure: "Pull ABS module codes after brake job, clear and verify on test drive.",
        resources: [{ label: "ABS code reference", url: "#" }],
      },
      { key: "engine", label: "Engine", status: "ok", tools: [], timeEstimateMin: 0, procedure: "", resources: [] },
      { key: "brakes_rear", label: "Rear brakes", status: "ok", tools: [], timeEstimateMin: 0, procedure: "", resources: [] },
      { key: "suspension_front", label: "Front suspension", status: "ok", tools: [], timeEstimateMin: 0, procedure: "", resources: [] },
      { key: "suspension_rear", label: "Rear suspension", status: "ok", tools: [], timeEstimateMin: 0, procedure: "", resources: [] },
      { key: "transmission", label: "Transmission", status: "ok", tools: [], timeEstimateMin: 0, procedure: "", resources: [] },
      { key: "hvac", label: "HVAC", status: "ok", tools: [], timeEstimateMin: 0, procedure: "", resources: [] },
      { key: "exhaust", label: "Exhaust", status: "ok", tools: [], timeEstimateMin: 0, procedure: "", resources: [] },
      { key: "steering", label: "Steering", status: "ok", tools: [], timeEstimateMin: 0, procedure: "", resources: [] },
      { key: "body", label: "Body", status: "ok", tools: [], timeEstimateMin: 0, procedure: "", resources: [] },
    ],
    quoteAmount: 1247.83,
    quoteScore: 72,
    laborHours: 2.25,
    partsCost: 487.12,
    etaIso: isoOffset(25),
    createdAtIso: isoOffset(-44),
    updatedAtIso: isoOffset(-2),
  },
  { id: "wo_002", number: "WO-2872", vehicleId: "v_f150_2015", customerId: "c_maria", technicianId: null, status: "scheduled", urgency: "normal", aiUrgency: "normal", title: "60k mile service + tire rotation", complaint: "Due for major service interval.", subsystems: [], quoteAmount: 612.40, quoteScore: 88, laborHours: 1.8, partsCost: 214.5, etaIso: isoOffset(72), createdAtIso: isoOffset(-12), updatedAtIso: isoOffset(-12) },
  { id: "wo_003", number: "WO-2873", vehicleId: "v_camry_2020", customerId: "c_jamal", technicianId: "t_marcus", status: "in_progress", urgency: "normal", aiUrgency: "normal", title: "Check engine light - P0420", complaint: "CEL on for two weeks, no driveability issue.", subsystems: [], quoteAmount: 894.17, quoteScore: 64, laborHours: 3.1, partsCost: 421.0, etaIso: isoOffset(28), createdAtIso: isoOffset(-30), updatedAtIso: isoOffset(-3) },
  { id: "wo_004", number: "WO-2874", vehicleId: "v_rav4_2021", customerId: "c_priya", technicianId: "t_luis", status: "awaiting_parts", urgency: "low", aiUrgency: "low", title: "Rear strut replacement", complaint: "Knocking over bumps, left rear.", subsystems: [], quoteAmount: 728.92, quoteScore: 81, laborHours: 2.4, partsCost: 312.18, etaIso: isoOffset(120), createdAtIso: isoOffset(-60), updatedAtIso: isoOffset(-18) },
  { id: "wo_005", number: "WO-2870", vehicleId: "v_silverado_2017", customerId: "c_diego", technicianId: "t_marcus", status: "completed", urgency: "normal", aiUrgency: "normal", title: "Transmission fluid + filter service", complaint: "Scheduled maintenance, 100k miles.", subsystems: [], quoteAmount: 384.66, quoteScore: 92, laborHours: 1.2, partsCost: 142.4, etaIso: isoOffset(-8), createdAtIso: isoOffset(-30), updatedAtIso: isoOffset(-8) },
  { id: "wo_006", number: "WO-2869", vehicleId: "v_mazda3_2022", customerId: "c_emma", technicianId: "t_ana", status: "invoiced", urgency: "low", aiUrgency: "low", title: "Battery replacement under warranty", complaint: "Slow crank on cold mornings.", subsystems: [], quoteAmount: 218.31, quoteScore: 95, laborHours: 0.4, partsCost: 0, etaIso: isoOffset(-26), createdAtIso: isoOffset(-50), updatedAtIso: isoOffset(-24) },
  { id: "wo_007", number: "WO-2875", vehicleId: "v_camry_2020", customerId: "c_jamal", technicianId: "t_luis", status: "new", urgency: "normal", aiUrgency: "high", title: "Steering vibration above 60mph", complaint: "Wheel shimmies on highway.", subsystems: [], quoteAmount: 0, quoteScore: 0, laborHours: 0, partsCost: 0, etaIso: isoOffset(48), createdAtIso: isoOffset(-3), updatedAtIso: isoOffset(-3) },
  { id: "wo_008", number: "WO-2868", vehicleId: "v_silverado_2017", customerId: "c_diego", technicianId: null, status: "new", urgency: "high", aiUrgency: "high", title: "Coolant leak, overheating", complaint: "Steam from hood on the way in.", subsystems: [], quoteAmount: 0, quoteScore: 0, laborHours: 0, partsCost: 0, etaIso: isoOffset(20), createdAtIso: isoOffset(-1), updatedAtIso: isoOffset(-1) },
  { id: "wo_009", number: "WO-2867", vehicleId: "v_f150_2015", customerId: "c_maria", technicianId: "t_marcus", status: "completed", urgency: "normal", aiUrgency: "normal", title: "Spark plug + ignition coil replacement", complaint: "Rough idle when cold.", subsystems: [], quoteAmount: 472.18, quoteScore: 89, laborHours: 1.6, partsCost: 198.42, etaIso: isoOffset(-72), createdAtIso: isoOffset(-100), updatedAtIso: isoOffset(-72) },
  { id: "wo_010", number: "WO-2866", vehicleId: "v_rav4_2021", customerId: "c_priya", technicianId: "t_ana", status: "invoiced", urgency: "low", aiUrgency: "low", title: "Cabin air filter + alignment check", complaint: "Pulls slightly right.", subsystems: [], quoteAmount: 167.44, quoteScore: 93, laborHours: 0.8, partsCost: 38.9, etaIso: isoOffset(-96), createdAtIso: isoOffset(-120), updatedAtIso: isoOffset(-96) },
  { id: "wo_011", number: "WO-2865", vehicleId: "v_mazda3_2022", customerId: "c_emma", technicianId: "t_luis", status: "scheduled", urgency: "low", aiUrgency: "low", title: "Brake fluid flush", complaint: "Maintenance interval reached.", subsystems: [], quoteAmount: 142.7, quoteScore: 90, laborHours: 0.6, partsCost: 22.4, etaIso: isoOffset(60), createdAtIso: isoOffset(-6), updatedAtIso: isoOffset(-6) },
];

export const inventory: InventoryItem[] = [
  { id: "i_001", sku: "BP-CIV19-FR", name: "Brake pads, ceramic — Civic 2016-21 front", category: "Brakes", qtyOnHand: 7, reorderAt: 4, unitCost: 38.42, binLocation: "B-12", usageRank: 85 },
  { id: "i_002", sku: "RT-CIV19-FR", name: "Rotor — Civic 2016-21 front (pair)", category: "Brakes", qtyOnHand: 4, reorderAt: 2, unitCost: 89.18, binLocation: "B-14", usageRank: 78 },
  { id: "i_003", sku: "OF-HON-A02", name: "Oil filter — Honda A02", category: "Filters", qtyOnHand: 24, reorderAt: 10, unitCost: 6.87, binLocation: "F-03", usageRank: 92 },
  { id: "i_004", sku: "OIL-5W30-QT", name: "Motor oil 5W-30 (quart)", category: "Fluids", qtyOnHand: 62, reorderAt: 30, unitCost: 7.42, binLocation: "F-01", usageRank: 97 },
  { id: "i_005", sku: "BAT-H6-AGM", name: "AGM Battery H6", category: "Electrical", qtyOnHand: 3, reorderAt: 2, unitCost: 184.5, binLocation: "E-08", usageRank: 55 },
  { id: "i_006", sku: "SP-IRID-NGK", name: "Iridium spark plug — NGK", category: "Engine", qtyOnHand: 31, reorderAt: 16, unitCost: 11.27, binLocation: "E-02", usageRank: 80 },
  { id: "i_007", sku: "AF-CIV-19", name: "Air filter — Civic 2016-21", category: "Filters", qtyOnHand: 9, reorderAt: 5, unitCost: 18.4, binLocation: "F-04", usageRank: 73 },
  { id: "i_008", sku: "CF-MAZDA3", name: "Cabin filter — Mazda3 2019+", category: "Filters", qtyOnHand: 6, reorderAt: 4, unitCost: 14.62, binLocation: "F-05", usageRank: 60 },
  { id: "i_009", sku: "STRUT-RAV4-RR", name: "Rear strut — RAV4 2019-23", category: "Suspension", qtyOnHand: 1, reorderAt: 2, unitCost: 142.88, binLocation: "S-11", usageRank: 38 },
  { id: "i_010", sku: "COOL-OAT-GAL", name: "OAT coolant (gallon)", category: "Fluids", qtyOnHand: 11, reorderAt: 6, unitCost: 22.4, binLocation: "F-02", usageRank: 71 },
  { id: "i_011", sku: "TF-MERC-V", name: "ATF Mercon V (quart)", category: "Fluids", qtyOnHand: 18, reorderAt: 10, unitCost: 9.84, binLocation: "F-06", usageRank: 66 },
  { id: "i_012", sku: "WB-22-OEM", name: "Wheel bearing — Camry 2018-21", category: "Drivetrain", qtyOnHand: 2, reorderAt: 2, unitCost: 78.12, binLocation: "D-04", usageRank: 42 },
  { id: "i_013", sku: "BF-DOT4-LT", name: "Brake fluid DOT4 (liter)", category: "Fluids", qtyOnHand: 14, reorderAt: 8, unitCost: 11.6, binLocation: "F-07", usageRank: 74 },
  { id: "i_014", sku: "WIPER-22-BL", name: "Wiper blade 22\"", category: "Body", qtyOnHand: 22, reorderAt: 12, unitCost: 8.94, binLocation: "B-22", usageRank: 58 },
  { id: "i_015", sku: "FUSE-MINI-15A", name: "Mini fuse 15A (pack of 10)", category: "Electrical", qtyOnHand: 9, reorderAt: 6, unitCost: 4.18, binLocation: "E-12", usageRank: 45 },
];

// Per-category inventory thresholds (locked decision: per-category, global fallback)
export const inventoryCategoryThresholds: InventoryCategoryThreshold[] = [
  { category: "Fluids",    lowAt: 8,  highAt: 40 },
  { category: "Brakes",   lowAt: 3,  highAt: 12 },
  { category: "Filters",  lowAt: 5,  highAt: 20 },
  { category: "Engine",   lowAt: 10, highAt: 30 },
  { category: "Electrical", lowAt: 3, highAt: 15 },
  { category: "Suspension", lowAt: 2, highAt: 8 },
  { category: "Drivetrain", lowAt: 2, highAt: 8 },
  { category: "Body",     lowAt: 8,  highAt: 24 },
];

/** Global fallback thresholds when no category-specific entry exists */
export const inventoryGlobalThreshold: InventoryCategoryThreshold = {
  category: "__global__",
  lowAt: 5,
  highAt: 20,
};

// ─── Bay seed data (6 bays — layout space allows it per plan recommendation) ──
export const bays: Bay[] = [
  {
    id: "bay_1",
    label: "Bay 1",
    status: "active",
    technicianId: "t_luis",
    workOrderId: "wo_001",
    note: "Front brake job in progress",
  },
  {
    id: "bay_2",
    label: "Bay 2",
    status: "active",
    technicianId: "t_marcus",
    workOrderId: "wo_003",
    note: "CEL diagnosis — Camry",
  },
  {
    id: "bay_3",
    label: "Bay 3",
    status: "empty",
    technicianId: null,
    workOrderId: null,
  },
  {
    id: "bay_4",
    label: "Bay 4",
    status: "active",
    technicianId: "t_ana",
    workOrderId: null,
    note: "Ana waiting on parts for wo_006",
  },
  {
    id: "bay_5",
    label: "Bay 5",
    status: "empty",
    technicianId: null,
    workOrderId: null,
  },
  {
    id: "bay_6",
    label: "Bay 6",
    status: "offline",
    technicianId: null,
    workOrderId: null,
    note: "Lift out of service — inspection due Friday",
  },
];

export const tools: Tool[] = [
  { id: "tl_001", name: "Snap-On torque wrench 1/2\"", category: "Hand tools", serialNumber: "SN-44218", available: false },
  { id: "tl_002", name: "Bosch OBD-II scanner", category: "Diagnostics", serialNumber: "BS-77104", available: false },
  { id: "tl_003", name: "Hunter alignment rack", category: "Heavy equipment", serialNumber: "HT-00012", available: true },
  { id: "tl_004", name: "Brake bleeder kit", category: "Brakes", serialNumber: "BB-22931", available: false },
  { id: "tl_005", name: "Floor jack 3-ton", category: "Lifting", serialNumber: "FJ-10184", available: true },
  { id: "tl_006", name: "Mityvac coolant tester", category: "Fluids", serialNumber: "MV-44217", available: true },
  { id: "tl_007", name: "Multimeter Fluke 117", category: "Diagnostics", serialNumber: "FL-91024", available: true },
  { id: "tl_008", name: "Strut spring compressor", category: "Suspension", serialNumber: "SC-22184", available: true },
  { id: "tl_009", name: "Borescope inspection camera", category: "Diagnostics", serialNumber: "BC-77810", available: true },
  { id: "tl_010", name: "Engine hoist 2-ton", category: "Heavy equipment", serialNumber: "EH-00031", available: true },
];

export const toolCheckouts: ToolCheckout[] = [
  { id: "tc_001", toolId: "tl_001", technicianId: "t_luis", checkedOutIso: isoOffset(-3), workOrderId: "wo_001" },
  { id: "tc_002", toolId: "tl_004", technicianId: "t_luis", checkedOutIso: isoOffset(-3), workOrderId: "wo_001" },
  { id: "tc_003", toolId: "tl_002", technicianId: "t_marcus", checkedOutIso: isoOffset(-5), workOrderId: "wo_003" },
];

export const timeEntries: TimeEntry[] = [
  { id: "te_001", technicianId: "t_luis", workOrderId: "wo_001", startedIso: isoOffset(-3), endedIso: null, minutes: 132 },
  { id: "te_002", technicianId: "t_luis", workOrderId: "wo_004", startedIso: isoOffset(-18), endedIso: isoOffset(-16), minutes: 118 },
  { id: "te_003", technicianId: "t_marcus", workOrderId: "wo_005", startedIso: isoOffset(-30), endedIso: isoOffset(-28), minutes: 122 },
  { id: "te_004", technicianId: "t_marcus", workOrderId: "wo_009", startedIso: isoOffset(-100), endedIso: isoOffset(-98), minutes: 96 },
  { id: "te_005", technicianId: "t_ana", workOrderId: "wo_010", startedIso: isoOffset(-120), endedIso: isoOffset(-119), minutes: 47 },
];

export const invoices: Invoice[] = [
  {
    id: "inv_001",
    number: "INV-10241",
    workOrderId: "wo_006",
    customerId: "c_emma",
    issuedIso: isoOffset(-24),
    status: "paid",
    lines: [
      { id: "il_001", description: "AGM battery H6 (warranty)", qty: 1, unitPrice: 0, total: 0 },
      { id: "il_002", description: "Diagnostic + install labor", qty: 1, unitPrice: 89.0, total: 89.0 },
      { id: "il_003", description: "Shop supplies", qty: 1, unitPrice: 12.4, total: 12.4 },
    ],
    subtotal: 101.4,
    tax: 7.1,
    total: 218.31,
  },
  {
    id: "inv_002",
    number: "INV-10240",
    workOrderId: "wo_005",
    customerId: "c_diego",
    issuedIso: isoOffset(-8),
    status: "paid",
    lines: [
      { id: "il_004", description: "ATF Mercon V (8 qt)", qty: 8, unitPrice: 9.84, total: 78.72 },
      { id: "il_005", description: "Transmission filter kit", qty: 1, unitPrice: 63.68, total: 63.68 },
      { id: "il_006", description: "Labor — 1.2 hr", qty: 1.2, unitPrice: 145, total: 174.0 },
    ],
    subtotal: 316.4,
    tax: 22.15,
    total: 384.66,
  },
  { id: "inv_003", number: "INV-10239", workOrderId: "wo_009", customerId: "c_maria", issuedIso: isoOffset(-72), status: "paid", lines: [{ id: "il_007", description: "Spark plugs (4)", qty: 4, unitPrice: 11.27, total: 45.08 }, { id: "il_008", description: "Ignition coil", qty: 1, unitPrice: 152.34, total: 152.34 }, { id: "il_009", description: "Labor — 1.6 hr", qty: 1.6, unitPrice: 145, total: 232.0 }], subtotal: 429.42, tax: 30.06, total: 472.18 },
  { id: "inv_004", number: "INV-10238", workOrderId: "wo_010", customerId: "c_priya", issuedIso: isoOffset(-96), status: "paid", lines: [{ id: "il_010", description: "Cabin filter", qty: 1, unitPrice: 14.62, total: 14.62 }, { id: "il_011", description: "Alignment check", qty: 1, unitPrice: 89.0, total: 89.0 }, { id: "il_012", description: "Labor — 0.8 hr", qty: 0.8, unitPrice: 145, total: 50.92 }], subtotal: 156.51, tax: 10.93, total: 167.44 },
  { id: "inv_005", number: "INV-10237", workOrderId: "wo_001", customerId: "c_maria", issuedIso: isoOffset(-200), status: "paid", lines: [{ id: "il_013", description: "Prior service", qty: 1, unitPrice: 312.18, total: 312.18 }], subtotal: 291.74, tax: 20.42, total: 312.18 },
  { id: "inv_006", number: "INV-10236", workOrderId: "wo_004", customerId: "c_priya", issuedIso: isoOffset(-260), status: "overdue", lines: [{ id: "il_014", description: "Deposit on rear struts", qty: 1, unitPrice: 250.0, total: 250.0 }], subtotal: 250.0, tax: 17.5, total: 267.5 },
];

export const leads: Lead[] = [
  { id: "l_001", name: "Carmen Ruiz", phone: "(786) 401-7712", source: "Google search", interest: "Brake inspection — 2018 Accord", createdIso: isoOffset(-6) },
  { id: "l_002", name: "Travis Whitmore", phone: "(305) 991-0028", source: "Referral", interest: "Pre-purchase inspection — 2014 Jeep", createdIso: isoOffset(-30) },
  { id: "l_003", name: "Sofia Niemi", phone: "(305) 442-3318", source: "Instagram", interest: "AC not cooling — Tahoe", createdIso: isoOffset(-48) },
  { id: "l_004", name: "Hialeah Dealership Group", phone: "(305) 887-1100", source: "Cold outreach", interest: "Fleet service contract — 22 vehicles", createdIso: isoOffset(-90) },
];

export const tasks: Task[] = [
  { id: "ts_001", title: "Call Maria with brake estimate", assigneeId: "p_sa", dueIso: isoOffset(2), done: false },
  { id: "ts_002", title: "Reorder Civic front rotors", assigneeId: "p_manager", dueIso: isoOffset(24), done: false },
  { id: "ts_003", title: "Follow up — Hialeah Dealership lead", assigneeId: "p_owner", dueIso: isoOffset(48), done: false },
  { id: "ts_004", title: "Approve Luis overtime — last week", assigneeId: "p_owner", dueIso: isoOffset(-2), done: true },
  { id: "ts_005", title: "Inspect Civic after road test", assigneeId: "p_tech", dueIso: isoOffset(4), done: false },
  { id: "ts_006", title: "Update bay 3 lift inspection log", assigneeId: "p_manager", dueIso: isoOffset(72), done: false },
  { id: "ts_007", title: "Send Priya status update — RAV4 parts ETA", assigneeId: "p_sa", dueIso: isoOffset(3), done: false },
  { id: "ts_008", title: "Confirm wo_008 coolant diagnosis with Marcus", assigneeId: "p_sa", dueIso: isoOffset(5), done: false },
];