-- ============================================================================
-- THE FISCAL FULCRUM — SCHEMA ADDITIONS (v3.1)
-- ============================================================================
--
-- Date:   May 8, 2026
-- Status: Additive only. The base schema.sql v3 is unchanged on disk.
-- Apply:  AFTER schema.sql + db/rls-additive.sql, via Management API
--         (extend scripts/apply-schema.ts or add a new
--         scripts/apply-schema-additions.ts).
--
-- v3.1 adds three tables and their RLS policies:
--   1. staff_capabilities       — RBAC capability layer (per-staff named rights)
--   2. client_portal_visibility — granular per-client portal module toggle
--   3. notification_preferences — per-user email digest cadence
--
-- All three tables ALTER ENABLE ROW LEVEL SECURITY and have explicit policies.
-- All three reference the public.current_user_role() helper from
-- db/rls-additive.sql (must be applied first).
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. STAFF CAPABILITIES (RBAC)
-- ----------------------------------------------------------------------------
-- Closed list of capabilities (v1) — see NEXTJS_BACKEND_ARCHITECTURE.md
-- §Capability layer. admin role implicitly holds all; team holds none by
-- default. Application code uses requireCapability(userId, capability).
--
-- Capability strings (~25, do not invent new ones without journaling):
--   clients.read.all, clients.create, clients.edit, clients.delete,
--   clients.assign_team, clients.toggle_portal,
--   services.manage, services.assign,
--   staff.manage, staff.grant_capabilities,
--   dsc.manage, credentials.manage,
--   tasks.assign, tasks.complete,
--   compliance.enter, notices.manage,
--   bizlens.enter, vcfo.enter,
--   payroll.run,
--   attendance.approve, leave.approve,
--   documents.upload, documents.delete,
--   queries.assign,
--   audit.view, firm_dashboard.view, insights.configure
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS staff_capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  capability TEXT NOT NULL,

  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by UUID NOT NULL REFERENCES users_profile(id),

  revoked_at TIMESTAMP,
  revoked_by UUID REFERENCES users_profile(id),

  -- One row per (user, capability). Re-grant after revoke updates the same row.
  UNIQUE(user_id, capability)
);

CREATE INDEX IF NOT EXISTS idx_staff_capabilities_user
  ON staff_capabilities(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_staff_capabilities_capability
  ON staff_capabilities(capability) WHERE revoked_at IS NULL;

ALTER TABLE staff_capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_caps_admin_all" ON staff_capabilities;
CREATE POLICY "staff_caps_admin_all" ON staff_capabilities
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "staff_caps_self_view" ON staff_capabilities;
CREATE POLICY "staff_caps_self_view" ON staff_capabilities
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 2. CLIENT PORTAL VISIBILITY (granular per-client module toggle)
-- ----------------------------------------------------------------------------
-- Closed list of modules (v1) — see NEXTJS_BACKEND_ARCHITECTURE.md
-- §Portal visibility resolver. Default on portal-enable: dashboard + tasks +
-- queries only; admin opens additional modules explicitly per engagement.
--
-- Module keys (11, do not invent new ones without journaling):
--   portal.dashboard, portal.tasks, portal.documents, portal.queries,
--   portal.bizlens, portal.vcfo, portal.compliance_calendar, portal.insights,
--   portal.tax_projection, portal.notices, portal.vendors
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS client_portal_visibility (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,

  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users_profile(id),

  UNIQUE(client_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_client_portal_visibility_client
  ON client_portal_visibility(client_id);

ALTER TABLE client_portal_visibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cpv_admin_all" ON client_portal_visibility;
CREATE POLICY "cpv_admin_all" ON client_portal_visibility
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "cpv_team_read" ON client_portal_visibility;
CREATE POLICY "cpv_team_read" ON client_portal_visibility
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() IN ('team', 'admin')
    AND client_id IN (
      SELECT client_id FROM team_client_assignment WHERE team_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cpv_client_read" ON client_portal_visibility;
CREATE POLICY "cpv_client_read" ON client_portal_visibility
  FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM client_users
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ----------------------------------------------------------------------------
-- 3. NOTIFICATION PREFERENCES (per-user email digest cadence)
-- ----------------------------------------------------------------------------
-- email_frequency: 'immediate' (send each event), 'daily', 'weekly', 'off'
-- in_app_enabled : whether the in-app notifications row is also written
--                  (default TRUE; rarely turned off).
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users_profile(id) ON DELETE CASCADE,
  email_frequency TEXT NOT NULL DEFAULT 'daily'
    CHECK (email_frequency IN ('immediate', 'daily', 'weekly', 'off')),
  in_app_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_prefs_self" ON notification_preferences;
CREATE POLICY "notif_prefs_self" ON notification_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notif_prefs_admin" ON notification_preferences;
CREATE POLICY "notif_prefs_admin" ON notification_preferences
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 4. APPLICATION-LAYER CONTRACTS (not enforced in SQL)
-- ----------------------------------------------------------------------------
-- a) When admin sets clients.portal_enabled = TRUE, application code seeds
--    three default rows in client_portal_visibility:
--      (client_id, 'portal.dashboard', TRUE)
--      (client_id, 'portal.tasks',     TRUE)
--      (client_id, 'portal.queries',   TRUE)
--    Other modules remain absent (treated as disabled by the resolver).
--
-- b) Capability grants and revokes write a row to global_audit_log with
--    action='capability.grant' or 'capability.revoke', entity_type='user',
--    entity_id=target_user_id, details JSONB containing { capability, granted_by }.
--
-- c) client_portal_visibility updates write a row to global_audit_log with
--    action='portal_visibility.set', entity_type='client', entity_id=client_id,
--    details JSONB containing { module_key, is_enabled, by }.
--
-- ============================================================================
-- DONE
-- ============================================================================
