-- ─── RotorAI: Initial Schema Migration ────────────────────────────────────────
-- Maps every TypeScript entity type in src/data/types.ts to a Postgres table.
-- ID strategy: text PRIMARY KEY (seed data uses string literals like "shop_hialeah")
-- jsonb used for complex nested arrays (subsystems, lines, messages, participants)

-- 1. shops
CREATE TABLE IF NOT EXISTS shops (
  id text PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL
);

-- 2. profiles
CREATE TABLE IF NOT EXISTS profiles (
  id text PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('owner','manager','service_advisor','technician','customer')),
  name text NOT NULL,
  email text NOT NULL,
  avatar_color text NOT NULL
);

-- 3. customers
CREATE TABLE IF NOT EXISTS customers (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  vehicle_ids text[] NOT NULL DEFAULT '{}',
  since date NOT NULL
);

-- 4. vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id),
  year integer NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  trim text,
  vin text NOT NULL,
  plate text NOT NULL,
  mileage integer NOT NULL,
  color text NOT NULL
);

-- 5. technicians
CREATE TABLE IF NOT EXISTS technicians (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES profiles(id),
  name text NOT NULL,
  specialty text NOT NULL,
  clocked_in boolean NOT NULL DEFAULT false,
  active_work_order_ids text[] NOT NULL DEFAULT '{}',
  weekly_completed integer NOT NULL DEFAULT 0,
  certifications text[] NOT NULL DEFAULT '{}'
);

-- 6. bays (work_order_id FK added after work_orders table)
CREATE TABLE IF NOT EXISTS bays (
  id text PRIMARY KEY,
  label text NOT NULL,
  status text NOT NULL CHECK (status IN ('active','empty','offline')),
  technician_id text REFERENCES technicians(id),
  work_order_id text,
  note text
);

-- 7. work_orders
CREATE TABLE IF NOT EXISTS work_orders (
  id text PRIMARY KEY,
  number text NOT NULL,
  vehicle_id text NOT NULL REFERENCES vehicles(id),
  customer_id text NOT NULL REFERENCES customers(id),
  technician_id text REFERENCES technicians(id),
  status text NOT NULL CHECK (status IN ('new','scheduled','in_progress','awaiting_parts','completed','invoiced')),
  urgency text NOT NULL CHECK (urgency IN ('low','normal','high')),
  ai_urgency text NOT NULL CHECK (ai_urgency IN ('low','normal','high')),
  title text NOT NULL,
  complaint text NOT NULL,
  subsystems jsonb NOT NULL DEFAULT '[]',
  quote_amount numeric NOT NULL DEFAULT 0,
  labor_hours numeric NOT NULL DEFAULT 0,
  parts_cost numeric NOT NULL DEFAULT 0,
  eta_iso timestamptz NOT NULL,
  created_at_iso timestamptz NOT NULL DEFAULT now(),
  updated_at_iso timestamptz NOT NULL DEFAULT now()
);

-- Add FK from bays to work_orders now that work_orders exists
ALTER TABLE bays ADD CONSTRAINT bays_work_order_id_fkey
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id);

-- 8. quote_breakdowns
CREATE TABLE IF NOT EXISTS quote_breakdowns (
  id text PRIMARY KEY,
  work_order_id text NOT NULL REFERENCES work_orders(id),
  status text NOT NULL CHECK (status IN ('draft','ready','approved')),
  generated_by text NOT NULL CHECK (generated_by IN ('advisor','manager','ai_draft')),
  customer_summary text NOT NULL,
  customer_detail_available boolean NOT NULL DEFAULT false,
  internal_notes text,
  lines jsonb NOT NULL DEFAULT '[]',
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0
);

-- 9. invoices
CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY,
  number text NOT NULL,
  work_order_id text NOT NULL REFERENCES work_orders(id),
  customer_id text NOT NULL REFERENCES customers(id),
  issued_iso timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('draft','sent','paid','overdue')),
  lines jsonb NOT NULL DEFAULT '[]',
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0
);

-- 10. service_history
CREATE TABLE IF NOT EXISTS service_history (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id),
  vehicle_id text NOT NULL REFERENCES vehicles(id),
  work_order_id text REFERENCES work_orders(id),
  invoice_id text REFERENCES invoices(id),
  serviced_at_iso timestamptz NOT NULL,
  mileage integer NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  shop_name text NOT NULL,
  technician_name text,
  invoice_total numeric,
  customer_notes text
);

-- 11. customer_recommendations
CREATE TABLE IF NOT EXISTS customer_recommendations (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id),
  vehicle_id text NOT NULL REFERENCES vehicles(id),
  subsystem_key text,
  title text NOT NULL,
  reason text NOT NULL,
  due_window text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low','medium','high')),
  status text NOT NULL CHECK (status IN ('new','accepted','declined','snoozed')),
  generated_by text NOT NULL CHECK (generated_by IN ('ai','advisor')),
  created_at_iso timestamptz NOT NULL DEFAULT now()
);

-- 12. technician_shifts
CREATE TABLE IF NOT EXISTS technician_shifts (
  id text PRIMARY KEY,
  technician_id text NOT NULL REFERENCES technicians(id),
  clocked_in_iso timestamptz NOT NULL,
  clocked_out_iso timestamptz,
  bay_id text REFERENCES bays(id),
  scheduled_hours numeric NOT NULL DEFAULT 8,
  break_minutes integer NOT NULL DEFAULT 0,
  shift_date date NOT NULL
);

-- 13. time_entries
CREATE TABLE IF NOT EXISTS time_entries (
  id text PRIMARY KEY,
  technician_id text NOT NULL REFERENCES technicians(id),
  work_order_id text NOT NULL REFERENCES work_orders(id),
  started_iso timestamptz NOT NULL,
  ended_iso timestamptz,
  minutes integer NOT NULL DEFAULT 0
);

-- 14. inventory_items
CREATE TABLE IF NOT EXISTS inventory_items (
  id text PRIMARY KEY,
  sku text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  qty_on_hand integer NOT NULL DEFAULT 0,
  reorder_at integer NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  bin_location text NOT NULL,
  usage_rank real NOT NULL DEFAULT 0
);

-- 15. inventory_category_thresholds
CREATE TABLE IF NOT EXISTS inventory_category_thresholds (
  category text PRIMARY KEY,
  low_at integer NOT NULL,
  high_at integer NOT NULL
);

-- 16. tools
CREATE TABLE IF NOT EXISTS tools (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  serial_number text NOT NULL,
  available boolean NOT NULL DEFAULT true
);

-- 17. tool_checkouts
CREATE TABLE IF NOT EXISTS tool_checkouts (
  id text PRIMARY KEY,
  tool_id text NOT NULL REFERENCES tools(id),
  technician_id text NOT NULL REFERENCES technicians(id),
  checked_out_iso timestamptz NOT NULL,
  work_order_id text REFERENCES work_orders(id)
);

-- 18. leads
CREATE TABLE IF NOT EXISTS leads (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  source text NOT NULL,
  interest text NOT NULL,
  created_iso timestamptz NOT NULL DEFAULT now()
);

-- 19. tasks
CREATE TABLE IF NOT EXISTS tasks (
  id text PRIMARY KEY,
  title text NOT NULL,
  assignee_id text NOT NULL REFERENCES profiles(id),
  due_iso timestamptz NOT NULL,
  done boolean NOT NULL DEFAULT false
);

-- 20. message_threads
CREATE TABLE IF NOT EXISTS message_threads (
  id text PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('work_order','direct')),
  subject text NOT NULL,
  participants jsonb NOT NULL DEFAULT '[]',
  work_order_id text REFERENCES work_orders(id),
  customer_id text REFERENCES customers(id),
  vehicle_id text REFERENCES vehicles(id),
  messages jsonb NOT NULL DEFAULT '[]',
  created_at_iso timestamptz NOT NULL DEFAULT now(),
  updated_at_iso timestamptz NOT NULL DEFAULT now(),
  has_unread boolean NOT NULL DEFAULT false
);

-- 21. new_concerns
CREATE TABLE IF NOT EXISTS new_concerns (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id),
  vehicle_id text NOT NULL REFERENCES vehicles(id),
  source text NOT NULL CHECK (source IN ('portal_form','phone_intake','walk_in','tech_flagged')),
  complaint text NOT NULL,
  urgency text NOT NULL CHECK (urgency IN ('low','normal','high')),
  status text NOT NULL CHECK (status IN ('new','reviewed','drafted','dismissed')),
  created_at_iso timestamptz NOT NULL DEFAULT now(),
  ai_diagnostic_suggestions jsonb NOT NULL DEFAULT '[]',
  diagnostic_notes text,
  selected_diagnostic_ids text[],
  draft_work_order_id text
);

-- 22. draft_work_orders
CREATE TABLE IF NOT EXISTS draft_work_orders (
  id text PRIMARY KEY,
  concern_id text NOT NULL REFERENCES new_concerns(id),
  customer_id text NOT NULL REFERENCES customers(id),
  vehicle_id text NOT NULL REFERENCES vehicles(id),
  title text NOT NULL,
  complaint text NOT NULL,
  diagnostic_notes text NOT NULL DEFAULT '',
  requested_date_iso timestamptz NOT NULL,
  urgency text NOT NULL CHECK (urgency IN ('low','normal','high')),
  foreman_note text NOT NULL DEFAULT '',
  selected_diagnostics text[] NOT NULL DEFAULT '{}',
  created_at_iso timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('pending_foreman','confirmed','rejected'))
);

-- 23. work_order_foreman_notes
CREATE TABLE IF NOT EXISTS work_order_foreman_notes (
  work_order_id text PRIMARY KEY REFERENCES work_orders(id),
  note text NOT NULL,
  foreman_name text NOT NULL,
  written_at_iso timestamptz NOT NULL DEFAULT now()
);
