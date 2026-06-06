-- ─── RotorAI: RLS Policies Migration ─────────────────────────────────────────
-- Enables RLS on all 23 tables.
-- Anon role: broad read-only on all tables (demo verification before Phase 7 auth).
-- Authenticated role: per-role policies using auth.jwt() -> 'user_metadata' ->> 'role'
-- (Phase 7 will store role in user_metadata.role when approving signups.)

-- ─── Enable RLS on every table ────────────────────────────────────────────────
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE bays ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_category_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE new_concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_foreman_notes ENABLE ROW LEVEL SECURITY;

-- ─── Anon: broad read-only on all tables (demo verification before Phase 7) ───
-- Applied to every table so the seed script output is readable without auth.
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'shops','profiles','customers','vehicles','technicians','bays',
    'work_orders','quote_breakdowns','invoices','service_history',
    'customer_recommendations','technician_shifts','time_entries',
    'inventory_items','inventory_category_thresholds','tools',
    'tool_checkouts','leads','tasks','message_threads','new_concerns',
    'draft_work_orders','work_order_foreman_notes'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE POLICY "anon_read_%s" ON %I FOR SELECT TO anon USING (true)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ─── Authenticated role helper ────────────────────────────────────────────────
-- All policies below use auth.jwt() -> 'user_metadata' ->> 'role'
-- This matches Phase 7's user_metadata.role assignment at signup approval.

-- ─── Shop-wide read (owner, manager, service_advisor) ────────────────────────
CREATE POLICY "staff_read_work_orders" ON work_orders
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner','manager','service_advisor')
  );

CREATE POLICY "staff_read_vehicles" ON vehicles
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner','manager','service_advisor')
  );

CREATE POLICY "staff_read_customers" ON customers
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner','manager','service_advisor')
  );

CREATE POLICY "staff_read_technicians" ON technicians
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner','manager','service_advisor','technician')
  );

-- ─── Technician: read only assigned work orders (D-05) ───────────────────────
-- Phase 7 stores technician profile_id in user_metadata.profile_id.
CREATE POLICY "tech_read_assigned_work_orders" ON work_orders
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'technician'
    AND technician_id IN (
      SELECT id FROM technicians
      WHERE profile_id = (auth.jwt() -> 'user_metadata' ->> 'profile_id')
    )
  );

-- ─── Customer: read only own vehicles and work orders (D-05) ─────────────────
CREATE POLICY "customer_read_own_vehicles" ON vehicles
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'customer'
    AND customer_id IN (
      SELECT id FROM customers
      WHERE id = (auth.jwt() -> 'user_metadata' ->> 'customer_id')
    )
  );

CREATE POLICY "customer_read_own_work_orders" ON work_orders
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'customer'
    AND customer_id = (auth.jwt() -> 'user_metadata' ->> 'customer_id')
  );

-- ─── Service role: full bypass (used by seed script and admin ops) ────────────
-- The service_role key bypasses RLS by default in Supabase. No policy needed.
COMMENT ON TABLE work_orders IS 'service_role key bypasses RLS — used for seed and admin operations only';
