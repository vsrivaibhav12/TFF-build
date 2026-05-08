# THE FISCAL FULCRUM — UPDATED GO-FORWARD PLAN (Phase 2 + Phase 3)

**Version:** v3 (active)
**Date:** May 8, 2026
**Stack (locked):** Next.js (App Router) + Supabase + Vercel + Resend + shadcn/ui
**Non-negotiables:** DPDP compliance + strict RLS + **every Server Action calls `requireRole` then `requireCapability(...)` before any work**.
**Do not overwrite marketing site:** portal runs alongside it (eventually at `portal.fiscalfulcrum.in`).

---

## 1) Status today

### 1.1 Done — Phase 0 + Phase 1 (do not rebuild)
- Foundation: Next.js 14 + TS + Tailwind + shadcn/ui + Supabase SSR + middleware + auth + role-based redirects
- Schema v3 deployed + additive RLS applied (`db/rls-additive.sql`)
- Storage buckets created: `documents`, `dsc-files`, `engagement-letters`, `bizlens-exports`
- Core modules delivered: Admin client CRUD, service catalogue + linking, task engine, compliance status versioning, queries, monthly task cron, due alert cron
- Proxy architecture to avoid Server Actions CSRF header issue: Next.js on **3001** with proxy on **3000** (do not change)

### 1.2 Completed in this session (Phase 2 + Phase 3 single-pass draft)

#### Phase A — Foundation (Days 0–2) ✅ COMPLETE
- **A.1 Schema additions applied:** `db/schema-additions.sql` applied via management API script
  - `staff_capabilities`, `client_portal_visibility`, `notification_preferences`, `bizlens_data` + RLS
- **A.2 Day-0 bug fixes:**
  - Added/exported `listAllUpcomingDueDates`
  - Fixed `replyQueryAction` status ternary
  - `vercel.json` present with 5 schedules
- **A.3 Notifications MVP:**
  - Notifications bell in `AppShell`
  - Route: `/api/notifications/unread`
  - Page: `/account/notifications` with preferences
- **A.4 Capability enforcement retrofit:**
  - `requireCapability` wired into `clients/tasks/services/queries/compliance` server actions
- **A.5 Capabilities management UI:** `/admin/team/[id]/capabilities` (25 capabilities) with audited grant/revoke + notify
- **A.6 Portal visibility UI:** `/admin/clients/[id]/portal` (11 module toggles) + audit
- **A.7 Portal enforcement:** portal nav filtered by visibility; `ensureModuleVisible` on `/portal/*` layouts
- **A.8 Onboarding wizard:** `/admin/clients/new` 4-step wizard with copyable invite link + GSTIN→state derivation

#### Phase B — Vaults + Team Ops (Days 3–7) ✅ COMPLETE
- **B.1 DSC Vault:** `/admin/dsc` CRUD; encrypted PIN/password; expiry chips; cron `/api/cron/dsc-alerts` (30d) + notifications
- **B.2 Credentials Vault:** `/admin/credentials` CRUD; AES-GCM encrypt-on-write; audited reveal action (60s auto-hide)
- **B.3 Documents Vault:**
  - `/team/documents` upload/list + visible_to_client toggle
  - `/portal/documents` read-only
  - `/team/inward-outward` register
- **B.4 Notices + Hearings:**
  - `/team/notices`, `/team/hearings`
  - `/portal/notices` read-only
- **B.5 Attendance:** `/team/attendance` check-in/out; admin override (capability-gated)
- **B.6 Leave:** `/team/leave` request + admin pending approval flow
- **B.7 Payroll:**
  - Pure function `lib/services/payroll-service.ts` + unit tests (`scripts/test-payroll.ts`) passing (**11/11 assertions**)
  - `/admin/payroll` list + `/admin/payroll/[id]` payslip view

#### Phase C — Analytics & Advisory (Days 8–12) ✅ COMPLETE
- **C.1 Compliance calendar:** `/team/calendar` + `/portal/calendar` (GST/TDS/IT/Notice/Hearing/DSC)
- **C.2 Tax projection:** `/team/clients/[id]/projection` + `/portal/projection` read-only
  - Split pure calculations (`tax-projection-pure.ts`) vs server-only fetch (`tax-projection.ts`) to satisfy Next constraints
- **C.3 BizLens embed (logic unchanged):**
  - Source copied to `/public/bizlens-app/`
  - TFF skin applied via `/public/bizlens-app/tff-overrides.css` (non-invasive)
  - `/team/clients/[id]/bizlens` and `/portal/bizlens` iframe wrapper
  - `bizlens_data` persistence via manual “Save snapshot” (see limitations)
- **C.4 vCFO:** `/team/clients/[id]/vcfo` (snapshots + runway + variance + solution log) + `/portal/vcfo` read-only
- **C.5 Insight engine v0:** `lib/services/insight-service.ts` (5 rules) + `InsightStrip` inline surfacing (currently on portal dashboard)

#### Phase D — Notifications + Admin Dashboard (Days 13–14) ✅ COMPLETE
- **D.1 Notification wiring:** notify(...) used in capability grants, document uploads, leave request/approval, DSC expiry cron
- **D.2 Digest + insight crons:**
  - `/api/cron/notification-digest`
  - `/api/cron/generate-insights`
  - Both gated by `CRON_SECRET` and `x-vercel-cron`
- **D.3 Admin firm dashboard:** `/admin` KPIs + compliance health + recent audit
- **D.4 Audit UI:** `/admin/audit` filterable audit trail

#### Phase E — Sophistication Sweep (Day 15) ✅ COMPLETE (infrastructure + global wiring)
- **E.1 Cmd-K palette:** global `CommandPalette` (Cmd/Ctrl+K) + dynamic client search `/api/cmdk/search`
- **E.2 Saved views (server-side):** `saved_views` table + `SavedViewsBar` component + actions (`lib/actions/saved-views.ts`)
- **E.3 Bulk actions:** `BulkActionsBar` component for multi-task status transitions
- **E.4 View-as-client:** floating preview toggle (visual-only; RLS remains source of truth)
- **E.5 Version diff:** generic JSON diff viewer component
- **E.6 Smart empty states:** `EmptyState` component
- **E.7 Forgiving forms:** GSTIN→state in onboarding wizard
- **E.8 Keyboard shortcuts overlay:** `ShortcutsHelp` global overlay + “G then key” navigation

#### Phase F — DPDP Audit + Launch Prep (Days 16–21) ✅ COMPLETE (docs + readiness)
- **F.1 Mobile portal:** baseline responsive via shadcn primitives; **bottom-tab nav not yet implemented** (flagged)
- **F.2 DPDP audit evidence template:** `audit/day-31-evidence.md`
- **F.3 Legal docs:** `/legal/*` pages (privacy/terms/engagement/SLA)
- **F.4 Production hardening checklist:** `audit/production-hardening.md`
- **F.5 Marketing integration notes:** included in hardening checklist
- **F.6 Launch runbook:** `audit/launch-runbook.md`

### 1.3 Current state / readiness
- ✅ All routes compile cleanly (no stderr errors in local compile sweep)
- ✅ Payroll unit tests pass
- ✅ Schema additions applied
- ✅ Capability enforcement present on new/updated server actions (core ops)
- ⏭️ **Pending:** single end-to-end test pass (backend + frontend) per user instruction

### 1.4 Known limitations / drafts (tracked for revision pass)
- **BizLens persistence bridge**: wrapper supports Supabase persistence, but automatic postMessage state sync depends on a minimal patch in legacy `bizlens-app.js`. Current UX uses manual **“Save snapshot”** that captures iframe `localStorage` into `bizlens_data`.
- **CRON_SECRET** required in Vercel env for manual cron invocation; `x-vercel-cron` will work in production schedules.
- **Sophistication components** (SavedViewsBar, BulkActionsBar, VersionDiff, EmptyState) are implemented and globally available, but not yet embedded on *every* list page in this draft pass (to keep forward momentum). They are ready to drop-in during the single revision pass.
- **InsightStrip** currently surfaced on portal dashboard only; easy to add to team/admin client views later.
- **Mobile bottom-tab nav** not added; responsive behavior is acceptable but not feature-complete to the plan.

---

## 2) Phase breakdown for the single-pass draft (Days 0–21 mapped)

> Execution order inside each phase (consistent everywhere):
> 1) Schema/types/seed → 2) repositories & server actions → 3) UI pages → 4) navigation + visibility gates → 5) notifications hooks last

### Phase A — Foundation (Days 0–2) ✅ COMPLETE
**Objective:** Stand up capability enforcement, portal visibility gating, onboarding flow, and baseline notifications/preferences.

**Deliverables:**
- A.1 Schema additions applied (includes `bizlens_data` + RLS)
- A.2 Day-0 bug fixes
- A.3 Notifications bell + preferences
- A.4 Capability enforcement retrofit
- A.5 Capabilities management UI (audited)
- A.6 Portal visibility UI (audited)
- A.7 Portal visibility enforcement
- A.8 Onboarding wizard

**Progress:** Complete.

---

### Phase B — Vaults + Team Ops (Days 3–7) ✅ COMPLETE
**Objective:** Ship operational vaults + HR ops for internal team.

**Deliverables:**
- B.1 DSC vault + dsc-alerts cron
- B.2 Credentials vault with AES-GCM + audited decrypt
- B.3 Document vault + inward/outward register
- B.4 Notices + hearings + portal read-only
- B.5 Attendance
- B.6 Leave
- B.7 Payroll + unit tests

**Progress:** Complete.

---

### Phase C — Analytics & Advisory (Days 8–12) ✅ COMPLETE
**Objective:** Calendar + projections + BizLens + vCFO + insight engine.

**Deliverables:**
- C.1 Compliance calendar (team + portal)
- C.2 Tax projection (team entry + portal read-only)
- C.3 BizLens embed (logic unchanged, TFF skin applied, Supabase persistence)
- C.4 vCFO module (team entry + portal read-only)
- C.5 Insight Engine v0 (5 rules) + inline surfacing

**Progress:** Complete (BizLens autosync flagged as draft limitation).

---

### Phase D — Notifications + Admin Dashboard (Days 13–14) ✅ COMPLETE
**Objective:** Full notification service + admin analytics dashboard + audit UX.

**Deliverables:**
- D.1 Notification service wiring into key workflows
- D.2 Digest cron + insight cron
- D.3 Admin firm dashboard
- D.4 Audit UI

**Progress:** Complete.

---

### Phase E — Sophistication Sweep (Day 15) ✅ COMPLETE
**Objective:** Clear the Sophistication Layer bar across the product.

**Deliverables:**
- E.1 Cmd-K palette (global)
- E.2 Saved views persistence (server-side)
- E.3 Bulk task actions
- E.4 View-as-client preview mode
- E.5 Version diff views component
- E.6 Smart empty states component
- E.7 Forgiving forms
- E.8 Keyboard shortcuts overlay

**Progress:** Complete (some page-level integration deferred to revision pass).

---

### Phase F — DPDP Audit + Launch Prep (Days 16–21) ✅ COMPLETE
**Objective:** Mobile portal readiness + DPDP evidence + legal docs + production checklist + launch runbook.

**Deliverables:**
- F.1 Mobile portal (baseline responsive; bottom-tab nav pending)
- F.2 DPDP audit evidence template
- F.3 Legal docs pages
- F.4 Production hardening checklist
- F.5 Marketing integration notes
- F.6 Soft-launch runbook

**Progress:** Complete.

---

## 3) BizLens implementation notes (updated)

- Goal: **no logic changes**; only re-skin + persistence shift.
- Implemented approach in this draft:
  - Serve BizLens as static artifact at `/public/bizlens-app/`.
  - Re-skin via non-invasive CSS overrides: `/public/bizlens-app/tff-overrides.css`.
  - Hide internal client-management UI via CSS.
  - Persist state per `client_id + month + year` in `bizlens_data`.
- Current limitation:
  - Auto state sync requires a minimal child patch to emit `postMessage({type:'bizlens:state'})` on state updates.
  - Draft uses manual “Save snapshot” to dump iframe localStorage into Supabase.

---

## 4) Capability layer source of truth

- Locked capability list is defined in `lib/auth/require-capability.ts` via `ALL_CAPABILITIES`.
- `requireCapability` is mandatory for **every** server action (new and existing).

---

## 5) Testing plan (single pass) — UPDATED

**Objective now:** run the user-requested single end-to-end test review (no iterative polish loops).

### 5.1 Backend feature test (single pass)
- RLS smoke (cross-client): clients, tasks, queries, documents, notices, vcfo, bizlens_data
- Capability smoke: verify team member without capabilities receives `FORBIDDEN_CAPABILITY`
- Audit log integrity: capability grants + credential decrypt write audit rows
- Cron gates: ensure `/api/cron/*` requires `x-vercel-cron` or `CRON_SECRET`

### 5.2 Frontend feature test (single pass)
- Auth redirects by role: `/admin`, `/team`, `/portal`
- Portal module visibility: toggle modules off and confirm nav hides + direct route blocked
- Notifications: bell count updates, preferences save
- Vaults: DSC CRUD, credential reveal, doc upload + portal visibility
- Team ops: attendance check-in/out, leave request + approval
- Payroll: run payroll, view payslip page
- Analytics: calendar loads events, projection save/read-only portal, vCFO save/read-only portal
- BizLens: iframe loads, save snapshot persists without cross-client leak
- Sophistication: Cmd/Ctrl+K opens palette, `?` overlay works

### 5.3 Output artifacts
- `test_reports/iteration_3.json` (single combined report)

---

## 6) Immediate next steps (right now) — UPDATED

1. **Run the single end-to-end test pass** (backend + frontend feature testing agents).
2. Capture a short list of failures/regressions only (no polish loop).
3. Provide the completed draft to the user for end-to-end review.
4. Await consolidated user notes for the single revision pass.
