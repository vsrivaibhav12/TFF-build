# MIGRATION NOTE — Flask backend bundle is deprecated

**Date:** May 4, 2026
**Decision:** Path A (Next.js-native backend)

---

## What changed

The earlier bundle of Flask-specific documents is deprecated:

- `FLASK_BACKEND_ARCHITECTURE.md`
- `FLASK_BACKEND_REFINED.md`
- `FLASK_IMPLEMENTATION_CHECKLIST.md`
- `COMPLETE_BUILD_ROADMAP.txt` (tied to the 45-day Flask timeline)

These have been replaced by:

- `NEXTJS_BACKEND_ARCHITECTURE.md`
- `BUILD_PLAN.md`
- `schema.sql` (v3 — same as v2 plus one partial unique index on tasks)

The schema-corrections documents (`SCHEMA_CORRECTIONS_APPLIED.md`, `SCHEMA_REVISION_QUICK_REFERENCE.md`, `SCHEMA_REVISION_SUMMARY.txt`, `00_READ_ME_FIRST.txt`) remain valid as historical context for the v1→v2 schema corrections. They describe a decision already made; nothing in them is wrong, but they're no longer load-bearing.

---

## Why the change

The locked tech stack from the v1 specification has always been Next.js + Supabase + Vercel. The Flask bundle quietly added a separate Python backend on top of that stack — a meaningful architectural deviation that wasn't acknowledged as one.

For a single-firm internal tool with one developer (no coding background, building via Emergent), adding Flask meant:

1. Two codebases instead of one (Next.js frontend + Flask backend)
2. Two deployments instead of one (Vercel + Heroku/Railway)
3. A network seam between UI and data that Emergent struggles with
4. ~20 days of duplicated capability — JWT verification, CRUD, cron, email — all of which Next.js + Supabase + Vercel Cron handle natively
5. A 45-day backend-only build pushing real launch to ~75 days

None of this was wrong on its own merits. Flask is a fine framework. But it didn't fit the constraints already locked in.

---

## What's preserved from the Flask work

The thinking was good. Only the runtime moved.

- The schema is the same (v3 has one tiny addition)
- The three-layer separation (Routes/Services/Repositories) maps cleanly to Next.js (Actions/Services/Repositories)
- The RLS-as-primary-security stance is unchanged
- The versioning pattern (`is_current` + `superseded_by`) is unchanged
- The soft-delete pattern is unchanged
- The cron job semantics and schedule are unchanged
- The module breakdown is unchanged
- The principle that database stores facts and application owns logic is unchanged
- The catches in the refined Flask doc (DB-level duplicate prevention, scheduler persistence, notification retry, error-shape standardisation) are all incorporated into the Next.js architecture

---

## What materially changed

| Concern | Flask version | Next.js version |
|---|---|---|
| HTTP entry | Flask routes with decorators | Server Actions for UI; API Routes for cron/webhooks |
| Auth | `verify_supabase_token()` middleware | `@supabase/ssr` + `requireRole` helper |
| Cron persistence | APScheduler with SQLAlchemy jobstore | Vercel Cron (managed, no jobstore concern) |
| Cron timeout | Long-running process, no limit | 60s on Vercel Pro — flagged, not a v1 problem |
| Encryption | Python `cryptography` | Node `crypto` (AES-256-GCM, app-layer) |
| Deployment | Heroku/Railway/Render | Vercel (`git push`) |
| Frontend integration | Separate phase 15 (10 days) | Same codebase from day 1 |
| Total backend build | 45 days | ~30 days |

---

## If you (or a future Claude) find a Flask reference

Treat any reference to `Flask`, `APScheduler`, `flask_cors`, `requirements.txt`, `python -m venv`, or `modules/auth/routes.py`-style structure in the project knowledge as historical context, not as instructions.

The current source of truth is:

1. `schema.sql` — database
2. `NEXTJS_BACKEND_ARCHITECTURE.md` — backend architecture
3. `BUILD_PLAN.md` — 35-day execution plan (30 build + 5 launch)
4. The locked v1 spec in your build journal — product scope

If anything in those four documents conflicts with anything in the older Flask bundle, the four above win.

---

## v3.1 amendment — May 8, 2026

**Status:** v3.1 supersedes v3 for execution. The on-disk `schema.sql` v3 is unchanged. v3.1 adds three additive product layers in `schema-additions.sql` and a fresh execution plan in `GO_FORWARD_PLAN.md`.

### What's new in v3.1

1. **Granular portal visibility per client.** Admin selects which of 11 named modules each client sees. New table: `client_portal_visibility`. Default on portal-enable: `dashboard + tasks + queries` only.
2. **Staff RBAC capability layer.** Admin grants ~25 named rights per staff member, on top of the flat `team` role. New table: `staff_capabilities`. Every Server Action gates on both `requireRole` and `requireCapability(...)`.
3. **Notification preferences.** Per-user email digest cadence (immediate / daily / weekly / off). New table: `notification_preferences`.
4. **Sophistication bar locked.** Every screen built from here on must clear the rules in `DESIGN_SYSTEM.md` §Sophistication Layer.
5. **Marketing site integration.** `fiscalfulcrum.in` adds a "Sign in" link → `portal.fiscalfulcrum.in/login`. Portal signout returns to marketing home. Visual identity matched.

### What stays from v3

The 40+ existing tables, all RLS policies, the versioning pattern, the soft-delete pattern, the cron schedule, the layered architecture (Actions → Services → Repositories), every business rule. All unchanged.

### Source of truth precedence (v3.1)

When in conflict:
1. `schema.sql` v3 + `schema-additions.sql` (database)
2. `NEXTJS_BACKEND_ARCHITECTURE.md` (with v3.1 amendment — capability layer, portal visibility resolver, notification service, marketing integration)
3. `DESIGN_SYSTEM.md` (with Sophistication Layer addendum)
4. `DPDP_AND_SECURITY.md` (with v3.1 amendment — RBAC, 2FA, 3 new tests)
5. `GO_FORWARD_PLAN.md` (active execution backlog — replaces day-by-day Build Plan for sequencing)
6. `BUILD_PLAN.md` (retained as historical reference for module shape and dependencies)

### What Phase 0 and Phase 1 already shipped (do not rebuild)

See `GO_FORWARD_PLAN.md` §Status today. Foundations, schema deployment with compatibility patches, additive RLS layer, demo seed, admin client/service/team CRUD, task engine with 5-state workflow, GST/TDS/IT compliance entry with versioning, queries thread, monthly task cron, due-alerts cron, mobile-responsive AppShell, and the design system primitives are all done. Build on top, do not start over.
