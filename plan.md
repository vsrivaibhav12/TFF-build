# THE FISCAL FULCRUM — UPDATED GO-FORWARD PLAN (Workflow-first v3.2)

**Version:** v4 (active)
**Date:** May 9, 2026
**Stack (locked):** Next.js (App Router) + Supabase + Vercel + Resend + shadcn/ui

**Non-negotiables**
- DPDP compliance + strict RLS.
- **Every Server Action must call `requireRole` then `requireCapability(...)` before any work**.
- **No multi-step wizards** (single-screen workflow-first UI; Jamku/Practive/Turia-like).
- **No hardcoded service catalogues** (admin-defined catalogue only).
- **Do not expose 25-capability checkbox grids to end users**; wrap in **Role Templates**.
- **BizLens must be native (no iframes)** when Group D is executed.
- **Leave the port 3000 proxy / port 3001 Next.js setup untouched.**

---

## 1) Status today

### 1.1 Done — Phase 0 + Phase 1 (do not rebuild)
- Foundation: Next.js 14 + TS + Tailwind + shadcn/ui + Supabase SSR + middleware + auth + role-based redirects
- Schema v3 deployed + additive RLS applied (`db/rls-additive.sql`)
- Storage buckets created: `documents`, `dsc-files`, `engagement-letters`, `bizlens-exports`
- Core modules delivered: Admin client CRUD, task engine, compliance status versioning, queries, monthly task cron, due alert cron
- Proxy architecture to avoid Server Actions CSRF header issue: Next.js on **3001** with proxy on **3000** (do not change)

### 1.2 Completed in this session (Workflow-first refactor, Groups A + B)

#### Group A — Workflow-first UI primitives ✅ COMPLETE
- Replaced client onboarding wizard with **single-form** client creation (`client-create-form.tsx`)
- Added global workflow primitives:
  - `EmptyState`
  - `SavedViewsBar` + persistence
  - `BulkActionsBar` for tasks
  - `header-search.tsx`
  - `mobile-bottom-nav.tsx` for portal
- Calendar-first team home + admin-only tagging (`data-admin-only`)
- Manual task creation surface (`new-task-dialog.tsx`)

#### Group B — Custom service catalogue + SOPs ✅ COMPLETE
- Applied schema additions v3.2 (notably):
  - `saved_views`
  - `sub_service_sop_steps`
  - `task_steps`
  - `staff_role_templates` (+ capabilities junction)
  - Removed seeded/hardcoded service catalogue expectations
- Admin service catalogue rebuilt to be **fully custom** (no seeded catalogue dependency)
- SOP management:
  - `lib/repositories/sop.ts`, actions, and admin UI to define SOP steps per sub-service
- Task instantiation:
  - `lib/services/task-steps-service.ts` seeds `task_steps` from SOP at task creation
  - Cron `/api/cron/generate-monthly-tasks` seeds SOP steps into generated tasks
- Task execution:
  - `components/tasks/task-steps-panel.tsx` allows staff to check off SOP steps inside task detail
  - Wired checklist panel into `/team/tasks/[id]/page.tsx`

### 1.3 Current state / readiness
- ✅ Builds successfully (incremental `next build`/compile checks have passed)
- ✅ No open critical/high bugs in last testing report
- ⏭️ Now entering **Group C**

### 1.4 Known limitations / tracked for later groups
- **BizLens legacy embed is still present** in codebase from the earlier draft. Per v3.2, it will be fully replaced with native implementation in **Group D** (executed later per chosen order).
- Some sophistication components are implemented but not uniformly embedded on every list surface yet (final polish pass in Group I).

---

## 2) Phase breakdown for the workflow-first execution (Groups A → I)

> Execution order inside each group:
> 1) Schema/types/seed → 2) repositories & server actions → 3) UI pages/components → 4) nav/visibility gates → 5) notifications hooks last.

### Group A — Workflow primitives + simplification debt ✅ COMPLETE
**Objective:** Make the app usable for non-tech-savvy CAs by removing wizard patterns and adding workflow-first primitives.

**Delivered:** Single-form client creation, global search, manual task creation, EmptyState/SavedViews/BulkActions primitives, admin-only tagging, mobile portal bottom-nav.

**Progress:** Complete.

---

### Group B — Custom service catalogue + SOP engine ✅ COMPLETE
**Objective:** Enable a fully custom catalogue with SOPs per sub-service, and task instances that inherit SOP steps.

**Delivered:** SOP CRUD, SOP→task_steps seeding (cron + manual tasks), step checklist UI in task detail.

**Progress:** Complete.

---

### Group C — Task workflow with sign-off (review gates + reminders) 🔄 NEXT
**Objective:** Make task execution reliable: step-by-step sign-off, reviewer gating, and client reminders for awaiting inputs.

**Deliverables (confirmed with user):**
- **C.1 Task checklist completeness rules**
  - Define “required steps complete” for a task (`task_steps.is_required = true` must all be completed).
  - Surface completion state in task detail and task list rows (lightweight).
- **C.2 Reviewer-required gate (server-side enforced)**
  - Block transition to `review` (and/or `completed`, per existing workflow rules) when required steps are incomplete.
  - Ensure this is enforced in the server action/service layer (not only UI).
- **C.3 Ad-hoc steps**
  - Allow adding ad-hoc steps to a task (already partially implemented) and ensure ordering + audit entries.
- **C.4 Send reminder (awaiting_client)**
  - Add a “Send reminder” action for tasks in `awaiting_client`.
  - Notify the client (in-app + Resend email) using existing `notify(...)` service.
  - Write an audit/activity entry for reminder sent.
- **C.5 Portal task view alignment**
  - Ensure portal task detail can show a read-only checklist state (no staff-only controls).

**Progress:** Not started (planned next).

---

### Group E — Bulk client import (CSV/Excel) ⏳ PLANNED (after Group C)
**Objective:** Make onboarding fast for firms migrating from spreadsheets; insert-only with auditability.

**Deliverables:**
- Upload CSV/XLSX, map required fields, preview rows, import
- `client_import_batches` table for audit + re-run history (per v3.2)
- Capability-gated actions + audit entries

**Progress:** Not started.

---

### Group F — Staff role templates (capability presets without exposing capability grids) ⏳ PLANNED
**Objective:** Replace the raw capability grid workflow with role templates to match real CA firm operations.

**Deliverables:**
- Role template CRUD (`staff_role_templates` + `staff_role_template_capabilities`)
- Apply a template to a staff member to bulk grant capabilities
- Keep capability list closed; templates are the UX layer

**Progress:** Not started.

---

### Group G — Service-applicability gating ⏳ PLANNED
**Objective:** Hide irrelevant data-entry surfaces unless the client is subscribed to the relevant service.

**Deliverables:**
- Introduce/standardize `service_kind` (enum or equivalent) and map custom services/sub-services to kinds
- Gate data-entry UI modules based on subscribed kinds
- Ensure this works without hardcoding service names

**Progress:** Not started.

---

### Group D — BizLens native port (no iframe) ⏳ PLANNED (deferred by user choice)
**Objective:** Fully integrate BizLens inside the portal with native UI and typed calculation logic.

**Deliverables (implementation best-judgement, integrated with portal):**
- Port legacy BizLens logic into `lib/services/bizlens-service.ts` as pure typed functions
- Zod-validated JSONB for BizLens facts/state in `bizlens_data`
- Unit tests for calculations
- Native staff input + output pages and a curated client dashboard
- **Remove legacy embed** once parity achieved:
  - Delete `wizard.tsx`, `bizlens-frame.tsx`, and `/public/bizlens-app/` completely

**Progress:** Not started.

---

### Group H — DPDP audit + production readiness ⏳ PLANNED
**Objective:** Evidence-driven DPDP readiness, RLS verification, and production hardening.

**Deliverables:**
- Re-run RLS/access tests with ≥3 clients seeded
- Confirm 2FA enforced for admin/team in production
- Update evidence pack (`audit/day-31-evidence.md`)

**Progress:** Not started.

---

### Group I — Polish + audit-trail surfacing ⏳ PLANNED
**Objective:** Final workflow smoothing and making audit/insight surfacing ubiquitous.

**Deliverables:**
- Ensure sophistication layer coverage on all key list pages (saved views, filters, bulk actions)
- Inline audit/activity surfacing where it reduces support burden (tasks, client pages)
- Mobile portal UX pass (bottom-nav already exists; validate all flows)

**Progress:** Not started.

---

## 3) BizLens implementation notes (v3.2 direction)
- The v3 draft includes an embedded BizLens artifact. **This is temporary**.
- When Group D executes:
  - BizLens becomes **native UI** (no iframe)
  - Logic becomes typed, tested pure functions (`lib/services/bizlens-service.ts`)
  - Storage remains `bizlens_data` with JSONB + Zod validation
  - Legacy static files and wrappers are deleted

---

## 4) Capability layer source of truth
- Locked capability list: `lib/auth/require-capability.ts` (`ALL_CAPABILITIES`).
- **Mandatory pattern:** `requireRole(...)` then `requireCapability(...)` at the top of every Server Action.
- UX pattern: capabilities are administered primarily via **Role Templates** (Group F), not direct grids.

---

## 5) Testing plan (credit-conscious) — UPDATED

**User preference:** test **after a batch**, not after every group.

### 5.1 Batch test #1 (after Groups C + E + F + G)
Backend checks:
- RLS smoke: tasks + task_steps + services/sub-services + imports + role templates
- Capability enforcement: ensure forbidden actions return `NO_CAPABILITY`
- Reminder notifications: DB rows + email send attempt (Resend key permitting)

Frontend checks:
- Task checklist + reviewer gating
- Bulk import happy path + failure path (bad rows)
- Role template apply flow
- Service gating hides irrelevant modules

**Output:** new test report JSON under `test_reports/iteration_4.json`.

### 5.2 Batch test #2 (after Group D)
- BizLens native input/output parity sanity checks
- Cross-client isolation for `bizlens_data`
- Confirm iframe artifacts removed

### 5.3 Batch test #3 (after Groups H + I)
- DPDP evidence checklist verification
- Final UX smoke across admin/team/portal

---

## 6) Immediate next steps (right now) — UPDATED

1. Execute **Group C** (task sign-off workflow): checklist completeness → reviewer gate → reminder action → portal alignment.
2. Then proceed in the user-chosen order: **E → F → G → D → H → I**.
3. Run **batch testing after C+E+F+G** (credit-conscious), produce `iteration_4.json`.
4. Continue with Group D BizLens native port as a dedicated chunk, followed by batch test.
