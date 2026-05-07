# The Fiscal Fulcrum — Portal Build Plan

**Stack:** Next.js 14 (App Router, TS) + Supabase (Postgres + Auth + Storage) + Tailwind + shadcn/ui + Zod + Resend
**Deploy target:** Vercel @ `portal.fiscalfulcrum.in`
**Marketing site:** untouched at `fiscalfulcrum.in` (separate, not in this container)
**Schema:** locked at `/app/db/schema.sql` v3 (46 tables, RLS-first)
**Constraints (from user):**
- Marketing website must remain intact
- Existing FARM template archived (not deleted) — at `/app/legacy/_emergent_template_backup/`
- No schema changes without explicit approval (in-memory compatibility patches only — file untouched)
- BizLens embedded as-is, no business-logic refactor
- All seeded/demo data must be reversible (`yarn db:seed-rollback`)

---

## ✅ Phase 0 — Foundation (COMPLETE)

| # | Item | Status |
|---|---|---|
| 0.1 | Archive FARM template → `/app/legacy/_emergent_template_backup/` | ✅ |
| 0.2 | Extract BizLens source → `/app/biz-lens-source/` (7 web files) | ✅ |
| 0.3 | Generate `CREDENTIALS_KEY` (32-byte AES-256-GCM) | ✅ |
| 0.4 | Bootstrap Next.js 14 + TS + Tailwind + shadcn/ui | ✅ |
| 0.5 | Install deps (Supabase SSR, Zod, Resend, ws polyfill, react-hook-form, lucide, sonner, tanstack-table) | ✅ |
| 0.6 | Supervisor: Next.js on :3000 + FastAPI proxy on :8001 → forwards `/api/*` to :3000 | ✅ |
| 0.7 | Apply schema.sql to Supabase via Management API + PAT (46 public tables) | ✅ |
| 0.8 | Storage buckets: `documents`, `dsc-files`, `engagement-letters`, `bizlens-exports` | ✅ |
| 0.9 | `lib/` scaffolding: supabase {server,client,service-role,middleware}, auth/require-role, crypto/credentials (AES-256-GCM), email/resend, actions/result | ✅ |
| 0.10 | Design system tokens: Inter font, zinc + teal-600, no card shadows, generous spacing, layout shells | ✅ |
| 0.11 | Auth flow: `/login` → role-based redirect via `middleware.ts` | ✅ |
| 0.12 | Reversible demo seed: 1 admin / 1 team / 1 client with full RLS linkage | ✅ |
| 0.13 | Day-3 RLS test suite: **7/7 passed** | ✅ |
| 0.14 | End-to-end UI verification (all 3 role shells): admin → `/admin`, team → `/team`, client → `/portal` | ✅ |

### In-memory schema compatibility patches (file untouched)
The locked schema.sql v3 had 3 issues that prevented apply:
1. `INSERT INTO services` used integer FKs for UUID `category_id` column — patched to UUID lookup by `display_order`.
2. `INSERT INTO sub_services` used integer FKs for UUID `service_id` — patched to UUID lookup by `code`.
3. `compliance_status.days_to_deadline` and `is_overdue` were declared as `GENERATED ALWAYS AS (... CURRENT_DATE ...) STORED`, which Postgres rejects (CURRENT_DATE is STABLE, not IMMUTABLE) — converted to plain columns; app-layer computes on read.

These patches only apply during `yarn db:apply-schema`. The on-disk file is bit-for-bit unchanged.

### Demo credentials
| Role | Email | Password |
|---|---|---|
| admin | `info@fiscalfulcrum.in` | `Admin@TFF2026` |
| team | `team.demo@fiscalfulcrum.in` | `Team@TFF2026` |
| client | `client.demo@fiscalfulcrum.in` | `Client@TFF2026` |

Rollback: `yarn db:seed-rollback` (removes all demo rows + auth users).

### Scripts
```
yarn dev                  # next dev :3000 (also accessible via 8001/api proxy)
yarn db:apply-schema      # apply schema.sql via Supabase Mgmt API
yarn db:apply-schema --reset   # DROP+CREATE public, then apply
yarn db:create-buckets    # idempotent storage bucket setup
yarn db:seed              # reversible demo seed
yarn db:seed-rollback     # remove demo rows + auth users
yarn db:rls-test          # Day-3 / Day-31 RLS audit
```

---

## 🔜 Phase 1 — Core Operations (NEXT)
**Goal:** ship the working CA-firm operations engine — clients, services, tasks, compliance, queries.

- Admin: client CRUD + groups, service catalogue management, client-service assignment, feature flags
- Team workspace: task templates, task CRUD, status workflow (`pending → awaiting_client → in_progress → review → completed`), reviewer sign-off, activity log
- Compliance: GST/TDS/IT trackers with versioning (`is_current`/`superseded_by`), compliance calendar, notices with attachments
- Cron: monthly task generation, daily due alerts (Vercel Cron + Resend)
- Client portal: dashboard with real metrics, my-tasks (RLS-filtered: `awaiting_client` + `completed` only), queries thread
- → `testing_agent_v3` E2E run, fix bugs

## 🔜 Phase 2 — Vaults, Documents, Team Ops, vCFO, BizLens Embed
- Document vault (Supabase Storage + `visible_to_client` flag + inward/outward register)
- DSC vault + Credentials vault (AES-256-GCM via `lib/crypto/credentials.ts`)
- Attendance, leave, payroll
- vCFO module (monthly snapshots, advisor notes, solution log)
- **BizLens embed**: wrap `/app/biz-lens-source/index.html` as `/portal/bizlens` and `/team/clients/[id]/bizlens`; swap `localStorage` writes → Supabase `bizlens_data` (additional client-keyed table to add per-explicit-approval). No BizLens business-logic edits.
- Compliance Insight Engine v1 (rules: ITC utilization, filing timeliness, GST rate)

## 🔜 Phase 3 — Polish, DPDP Audit, Launch
- Mobile-responsive sweep on `/portal`
- Day-31 DPDP RLS audit (re-run + document evidence)
- Privacy Policy / Terms / Engagement Letter pages
- Admin firm dashboard (real KPIs)
- Notification center, weekly insight digest cron
- Final `testing_agent_v3` E2E
- Handoff doc: Vercel deploy + DNS for `portal.fiscalfulcrum.in`

---

## Out of scope (per BUILD_PLAN.md "Month 2+")
- Tally connector
- CBAM module beyond schema
- Real-time WebSocket notifications
- Materialized view caching
