See # Hima — MVP Implementation & Multi-Agent Delegation Plan

> **Status:** Implementation planning  
> **Version:** 1.0  
> **Platform:** React Native + TypeScript (Android-first)  
> **Stack:** Expo Development Build, Node.js/Express, Supabase/PostgreSQL, Kimi AI, NFC, Paiflow, Stellar testnet  
> **Product tagline:** *Your allowance, made smarter.*

## 1. Mission and scope

Hima's **UI already exists**. This plan is for wiring functional capabilities into that UI, **not redesigning or rebuilding screens**.

### MVP success scenario

A student can:

1. Register or log in.
2. Enter daily/weekly allowance, university days, expected expenses, and a savings/emergency reserve.
3. Review, confirm, and persist a schedule-aware budget.
4. See wallet/testnet status, planned expenses, and **Safe-to-Spend** on the dashboard.
5. Ask Hima's Kimi-powered assistant about the budget and receive grounded recommendations.
6. Start **Tap to Pay**, scan a registered *demo* NFC merchant tag, and review a checkout.
7. Check the financial impact, explicitly authorize an eligible payment, and initiate a **supported Paiflow testnet payment flow**.
8. See a **verified** on-chain payment result with transaction evidence.
9. Return to a dashboard whose budget and transaction history reflect the confirmed payment.

**Required hackathon evidence:** a confirmed Paiflow deployment and a confirmed on-chain payout originating from the team's deployment, plus the organizer-required identifiers/screenshots/repository artifacts.

### Product rules

- First-time preferences and estimated expenses are **manual**, not guessed by AI. Automation is optional after sufficient real spending history.
- **Schedule-aware budgeting** and **Safe-to-Spend** are deterministic computations. AI explains/recommends; it never owns ledger balances or payment authorization.
- NFC identifies a merchant for checkout; **a tap never charges money automatically**.
- The hackathon uses **Stellar testnet assets**, not real Philippine pesos. Clearly distinguish a PHP-denominated budgeting plan from blockchain wallet/asset balances. Do not assume a PHP-to-testnet exchange rate.
- Paiflow recipient/trigger/signing capabilities must be verified with the organizer. Do not invent API endpoints or claim a direct Stellar transfer is a Paiflow payout.
- Preserve existing Hima UI, mascot, colors, animations, navigation, and component patterns unless a specific missing control/state makes functionality impossible.

---

## 2. Architecture and responsibility boundaries

```text
React Native + TypeScript (existing UI)
  ├── Auth + onboarding / preferences
  ├── Dashboard / schedule / insights / AI assistant
  ├── Native NFC scanner (Android development build)
  └── Checkout / payment status / result
                      │
                Authenticated HTTPS API
                      │
               Node.js + Express
  ├── Auth & profile service ────────── Supabase Auth / PostgreSQL
  ├── Budget calculation service ───── schedules, estimates, periods, ledger
  ├── Safe-to-Spend validation ─────── verified funds + future commitments
  ├── Merchant resolution service ─── registered demo NFC tag → merchant
  ├── Kimi service ─────────────────── AI chat + structured recommendations
  └── Payment orchestration ────────── Paiflow / Stellar testnet
                      │
              Confirmation/reconciliation
                      │
           Persist payment + recalculate budget
```

**Sources of truth**

| Data | Authority |
|---|---|
| Logged-in identity | Supabase Auth |
| User preferences / schedules | PostgreSQL |
| PHP budget forecasts and Safe-to-Spend | Tested backend budget engine |
| Testnet funds and settlement | Verified Stellar/Paiflow payment state |
| Payment authorization | Explicit user approval + supported signing method |
| AI text and suggestions | Kimi, validated against backend numbers |
| Merchant identity | Backend registry; NFC tag is only a lookup hint |

**Money representation:** PHP budget values use integer centavos (`amountMinor`). Stellar assets use their actual asset codes and precision-safe decimal strings. Never use JavaScript floating point for ledger arithmetic.

---

## 3. Agent assignments (seven independent owners)

Agents work in separate feature branches / non-overlapping file scopes. The integration agent manages cross-agent contracts and final merges.

### Agent 01 — Database, authentication, persistence

**Owns:** database migrations, RLS, auth integration, preference/profile persistence, test fixtures.

**Tasks**
- [ ] Inspect existing Supabase client/auth flow; reuse rather than replace it.
- [ ] Create migrations with relationships, validation constraints, and user-scoped Row Level Security.
- [ ] Implement register/login/logout/session restore and onboarding completion state.
- [ ] Persist daily/weekly allowance preferences and university attendance schedule.
- [ ] Persist user-entered expense estimates, budget plans/periods, merchants, payment records, and AI recommendations.
- [ ] Seed one test student and one test merchant **without storing production secrets**.
- [ ] Supply migration/rollback instructions and local test fixtures.

**Acceptance:** Register → enter preferences → close/reopen app → sign in → same data is restored; users cannot read other users' private records.

**Do not own:** the budget formula, payment orchestration, or NFC hardware logic.

### Agent 02 — Budget and Safe-to-Spend engine

**Owns:** pure computation, budget preview/confirm logic, school-day forecasts, spending protection, recalculation, budget tests.

**Tasks**
- [ ] Support allowance frequency: `daily` and `weekly`, with explicit period/reset rules.
- [ ] Support school days, optional class times, per-school-day food/transport, weekly school costs, non-school-day estimates, reserve.
- [ ] Calculate essential commitments by upcoming day, protected reserves, discretionary headroom, and Safe-to-Spend.
- [ ] Make preview vs. confirmed budget changes distinct.
- [ ] Derive balances from confirmed transaction records and active budget period; account for in-flight funds reservations if implemented.
- [ ] Handle insufficient allowance, overspend warning, editable schedules, rollover rules, and changing budget periods.
- [ ] Expose testable pure functions and API handlers.

**Required test cases**
- [ ] Three school days vs. five; food/transport only on selected days.
- [ ] Daily allowance vs. weekly allowance.
- [ ] Planned commitments greater than available allowance.
- [ ] Payment confirmed, failed, pending, and cancelled.
- [ ] Schedule edited midweek; already confirmed expenses retained.
- [ ] Multiple payments and no double-deduction for retries.
- [ ] Cross-period boundaries and no negative Safe-to-Spend displayed.

**Acceptance:** Same input → same correct output; all major edge cases automated. **Kimi never calculates authoritative balances.**

### Agent 03 — Existing React Native UI → real state

**Owns:** auth/onboarding/dashboard/schedule/insights frontend wiring, fetch/cache/error states.

**Tasks**
- [ ] Inventory current screens, navigation, components, state management, and API placeholders.
- [ ] Preserve Hima's completed UI and existing mascot assets.
- [ ] Wire authentication and first-time onboarding to persisted state.
- [ ] Wire manual expense inputs, schedule picker, budget preview and confirmation.
- [ ] Load the dashboard from typed backend responses; show Safe-to-Spend and wallet/testnet balance separately.
- [ ] Wire schedule and transaction list screens to real data.
- [ ] Show loading, refresh, empty, error, stale-data, and retry states.
- [ ] Returning users skip onboarding; incomplete users resume at the appropriate step.
- [ ] After a confirmed payment, invalidate/refetch budget and transaction queries.

**Suggested state split:** Supabase session for identity, TanStack Query for server state, local/Zustand state for ephemeral form/NFC UI.

**Acceptance:** No permanent mock wallet balances or fake transactions on the core screens. Layout and navigation remain visually consistent.

### Agent 04 — NFC tag reader, merchant resolution, checkout

**Owns:** React Native NFC native integration, scanner states, merchant lookup frontend flow, checkout amount entry, user confirmation UI.

**Tasks**
- [ ] Verify NFC library compatibility with the existing React Native/Expo development build.
- [ ] Detect hardware support, NFC enabled/disabled, permissions when applicable, timeout, cancellation, unknown tags.
- [ ] Read compatible tag identifiers, normalize safely, and resolve using backend merchant registry.
- [ ] Validate the **actual demo student ID's readability** on the target phone, without modifying, cloning, or interacting with access credentials.
- [ ] Open merchant checkout with validated merchant info and category.
- [ ] Let student enter/verify amount; call server quote / Safe-to-Spend validation.
- [ ] Show within-budget, warning/override, and insufficient-funds outcomes clearly.
- [ ] Pass approved checkout intent to payment owner; prevent double-tap duplicate UI submissions.

**Acceptance:** Physical tap → recognized mock merchant → amount entry → server-validated checkout → explicit authorization step. **NFC tag ID is not authentication or payment authority.**

### Agent 05 — Paiflow / Stellar / verified payments **[critical path]**

**Owns:** organizer API investigation, flow deployment, wallet/signing approach, payment state machine, idempotency, blockchain verification.

**Immediate spike (do first)**
- [ ] Read organizer starter, API reference, `llms.md` (if supplied), and actual credentials documentation.
- [ ] Verify the supported Paiflow trigger(s): `on_receive + split`, schedule, and whether authenticated `web2_webhook` supports checkout-initiated merchant payout.
- [ ] Verify whether recipients must be fixed per deployment, how funds are supplied, how deployment IDs and transaction IDs are returned, and which assets are supported.
- [ ] Verify a **mobile-compatible** authorization/signing path. Do not assume Freighter browser-extension APIs work inside native React Native.
- [ ] Return a capability matrix: *confirmed*, *unsupported*, *unverified*; include exact documented contracts and blockers.

**Implementation tasks**
- [ ] Configure designated Stellar testnet accounts and compatible asset funding.
- [ ] Deploy supported Paiflow flow(s) with one configured demo merchant / savings recipient arrangement as appropriate.
- [ ] Create an authenticated checkout/payment request with a unique idempotency key.
- [ ] Validate budget quote, actual funds, authenticated user, merchant allowlist, user authorization, and asset/amount.
- [ ] Submit via the supported Paiflow path, monitor confirmation, persist deployment ID, tx hash, and result.
- [ ] Handle unknown/pending outcomes via reconciliation; never repeat a possible payout blindly.
- [ ] Trigger ledger persistence and budget refresh only once per confirmed payment.
- [ ] Export evidence: flow/deployment ID, on-chain payout hash, and any submission screenshot/preview.

**Minimum state machine:**

```text
created → awaiting_authorization → submitted → pending → confirmed
    └──────────────→ cancelled
               submitted/pending ───────────────→ failed (when verified)
```

`pending/unknown` is **not** `failed` and must not be automatically resubmitted. Explicitly design timeout/reconciliation behavior.

**Acceptance:** A **confirmed testnet payout attributable to our Paiflow deployment** can be demonstrated with verifiable deployment/transaction references. Do not substitute a direct Stellar transfer while claiming Paiflow integration.

### Agent 06 — Kimi AI service, insights, recommendations

**Owns:** backend Kimi API integration, prompt/context service, chat, spending insights, recommendations, validation, graceful fallback.

**Tasks**
- [ ] Verify organizer-provided Kimi endpoint, model name, API limits, and server-side configuration.
- [ ] Expose relevant **application-defined** read tools: `get_budget_summary`, `get_university_schedule`, `get_spending_history`, `get_safe_to_spend`.
- [ ] Implement budget setup explanations, weekly insights, Safe-to-Spend checkout explanations, and conversational Q&A.
- [ ] Implement recommended category adjustments as validated, structured JSON.
- [ ] Support manual mode, user-approved recommendation mode, and **bounded** automatic planning only when opted in.
- [ ] Enforce deterministic checks of proposed numbers through Agent 02 service.
- [ ] Provide UI-compatible loading/error/fallback messages; limit data passed to AI.
- [ ] Test hallucinated numbers, malformed output, lack of history, rate limits, and service downtime.

**AI is not authorized to:** sign, transfer, initiate payment, hold private keys, override a reserve, or modify budgets without applicable user permission.

**Acceptance:** Chat uses actual budget context and yields at least one explainable, validated recommendation that can be reviewed and applied. Main budget/payment workflow works if Kimi is down.

### Agent 07 — Integration, contract governance, QA, release

**Owns:** shared contracts, integration branch, automated E2E verification, Android build/rehearsal, issue triage.

**Tasks**
- [ ] Inventory the repository and create shared types/API schema before agents branch.
- [ ] Set module ownership rules and prevent overlapping edits.
- [ ] Configure lint, typecheck, tests, and CI/integration checks.
- [ ] Write E2E tests for onboarding, budget, NFC mock/native scan, AI, checkout, payment status, dashboard refresh.
- [ ] Test verified success, failed, cancelled, pending, duplicate request, offline, and retry paths.
- [ ] Verify Supabase RLS and that frontend contains no API keys, service-role key, or secret wallet material.
- [ ] Test on the actual NFC-capable Android phone; record whether demo ID is readable.
- [ ] Capture hackathon evidence and maintain a reproducible demo script.
- [ ] Produce final Android development/release build and rollback instructions.

**Acceptance:** The full real flow works end to end, payment states are honest, and the build can be reproduced without manually editing database records mid-demo.

---

## 4. Shared API contract — proposed Hima endpoints

> These endpoints are **Hima backend routes**, **not official Paiflow routes**. Freeze request/response schemas with Agent 07 before implementation.

| Method | Endpoint | Responsibility | Owner |
|---|---|---|---|
| `GET` | `/me/preferences` | Load allowance and schedule preferences | 01 |
| `PUT` | `/me/preferences` | Update validated preferences | 01 |
| `POST` | `/onboarding/complete` | Mark complete after saved plan | 01 |
| `POST` | `/budget/preview` | Pure budget forecast; no persistence | 02 |
| `POST` | `/budget/confirm` | Persist confirmed budget plan | 02 |
| `GET` | `/dashboard` | Budget, commitments, wallet, recent activity | 02/03 |
| `GET` | `/schedule` | Daily financial outlook | 02 |
| `GET` | `/transactions` | User's payments with canonical status | 01/05 |
| `POST` | `/merchants/resolve-tag` | Look up allowlisted NFC demo merchant | 04/01 |
| `POST` | `/payments/quote` | Validate proposed amount, asset, and budget impact | 02/05 |
| `POST` | `/payments` | Execute appropriately authorized Paiflow payment | 05 |
| `GET` | `/payments/:id` | Canonical payment status, proof when confirmed | 05 |
| `POST` | `/ai/chat` | Grounded financial assistant | 06 |
| `POST` | `/ai/recommendations` | Validated suggestions | 06 |
| `POST` | `/ai/recommendations/:id/approve` | Apply allowed suggestions | 06/02 |

### Shared TypeScript models (starting point)

```ts
export type AllowanceFrequency = 'daily' | 'weekly';
export type PaymentStatus =
  | 'created'
  | 'awaiting_authorization'
  | 'submitted'
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'cancelled';

export interface DashboardSummary {
  budgetPeriod: { startDate: string; endDate: string };
  allowance: {
    frequency: AllowanceFrequency;
    amountMinor: number; // PHP centavos; budget only
    currency: 'PHP';
  };
  budget: {
    safeToSpendMinor: number;
    remainingEssentialsMinor: number;
    protectedReserveMinor: number;
  };
  paymentWallet: {
    network: 'stellar-testnet';
    assetCode: string;
    availableAmount: string; // precision-safe decimal string
  };
  recentTransactions: TransactionSummary[];
}

export interface TransactionSummary {
  id: string;
  merchantName: string;
  category: string;
  budgetAmountMinor: number; // PHP planning impact
  paymentAssetCode: string;
  paymentAssetAmount: string;
  status: PaymentStatus;
  stellarTransactionHash?: string;
  createdAt: string;
}
```

**Define before coding:** schemas for preferences, daily budgets, `PaymentQuote`, `PaymentIntent`, `PaymentResult`, merchant lookup, Kimi recommendations, authorization challenges, error codes, and API auth headers. Freeze `/payments` semantics only after Agent 05 confirms Paiflow capabilities.

### Data model (initial)

- `profiles`
- `user_preferences`
- `university_schedules`
- `expense_estimates`
- `budget_periods`
- `budget_allocations`
- `merchants`
- `payment_attempts`
- `transactions`
- `paiflow_deployments`
- `ai_recommendations`

Add constraints for uniqueness/idempotency, transaction status integrity, ownership, and appropriate user-scoped access. Do not put secrets into user records.

---

## 5. Execution order and integration gates

### Phase 0 — Shared contracts and technical validation (start immediately)

- [ ] Agent 07 inventories existing repository, screen routes, dependencies, shared components, and open TODOs.
- [ ] Agent 07 freezes module boundaries and preliminary API/shared types.
- [ ] Agent 05 begins Paiflow capability spike **in parallel**.
- [ ] Agent 04 checks Android NFC build/library compatibility and tests whether the demo ID is readable.
- [ ] Agent 01 prepares migration design.

**Gate:** Repo ownership and key contracts are documented; payment limitations are explicitly marked confirmed/unverified.

### Phase 1 — Functional student account and budget

- [ ] Auth and persistence work.
- [ ] User manually configures allowance, university schedule, and expense estimates.
- [ ] Budget preview and Safe-to-Spend computation pass tests.
- [ ] User confirms budget; dashboard loads real persisted data.

**Gate:** **Login → Preferences → Calculation → Dashboard** works with no hardcoded balances.

### Phase 2 — AI and checkout

- [ ] Kimi responds with verified account context and graceful fallback.
- [ ] NFC identifies demo merchant; checkout screen receives merchant ID.
- [ ] `/payments/quote` computes valid funds and spending impact.
- [ ] UI shows within-budget / overspending warning / insufficient-funds states.

**Gate:** User can scan → review → receive a validated quote, without yet claiming payment occurred.

### Phase 3 — Real payment loop

- [ ] Supported Paiflow deployment and funding verified.
- [ ] Authorized testnet payment reaches canonical confirmation state.
- [ ] Backend stores proof, update is idempotent, dashboard recalculates.

**Gate:** **NFC → Checkout → Approval → Paiflow → Confirmed Receipt → Updated Dashboard** demonstrably works.

### Phase 4 — QA and presentation

- [ ] Pending, fail, cancel, repeat tap, retry, offline, and Kimi downtime tested.
- [ ] Android device build tested and stable.
- [ ] Paiflow deployment ID, flow preview screenshot, and payout tx hash captured.
- [ ] Demo accounts, balances, and test data prepared without unsecured keys.

**Gate:** Reproducible end-to-end demonstration plus required hackathon submission artifacts.

---

## 6. Shared integration test scenario

**Student:** Demo Student  
**Allowance:** ₱1,500 weekly  
**University days:** Monday / Wednesday / Friday  
**Estimated food:** ₱100 per school day = ₱300  
**Estimated transport:** ₱60 per school day = ₱180  
**School expenses:** ₱100 per week  
**Protected reserve:** ₱200 per week

**Initial plan**

| Item | PHP |
|---|---:|
| Weekly allowance | ₱1,500 |
| Food | −₱300 |
| Transport | −₱180 |
| School expenses | −₱100 |
| Protected reserve | −₱200 |
| **Initial discretionary Safe-to-Spend** | **₱720** |

Assumptions: full allowance is available, no other transactions exist, and the period starts before any planned commitments have been fulfilled.

**Merchant:** Campus Canteen (registered demo NFC tag)  
**Checkout:** ₱100 illustrative budget expense; testnet payout amount is **separately defined in its actual asset**.  
**Outcome:** Approved supported Paiflow testnet payment becomes confirmed; save transaction hash; under the simplified budget example, discretionary headroom becomes ₱620. Pending/failed transactions do **not** become completed spending.

**Alternate test cases:** insufficient funds; purchase exceeds Safe-to-Spend but actual funds exist; user cancels; unknown NFC tag; repeated payment submission; AI API unavailable; payment pending after app restart.

---

## 7. Agent-manager operating rules

1. **Inspect before editing.** Every agent reads the actual repo structure and dependencies.
2. **Preserve the finished UI.** Do not rebuild screens, discard mascot, or override design tokens.
3. **One owner per module.** Coordinate changes to shared files/types through Agent 07.
4. **Contracts before parallel integration.** Publish route payloads, TypeScript types, status enums, error format.
5. **Use feature branches / isolated worktrees.** Make focused commits and request review before merging.
6. **Prefer deterministic business logic.** AI does not own arithmetic or financial state.
7. **No fake financial proof.** Mock adapters must be labeled as mocks and swapped out before the final demo.
8. **Keep secrets server-side.** Never commit API keys, wallet secret keys, or Supabase service-role keys to the mobile application or repository.
9. **Payment confirmation is authoritative.** The server's verified canonical payment record drives the UI and spending ledger.
10. **Fail honestly.** Each owner reports unsupported capability, errors, and integration blockers early.

### Required handoff from each agent

```md
## Agent handoff
- Owner / branch:
- Scope completed:
- Files changed:
- Database migrations:
- New or changed endpoints/types:
- Environment variables required (names only):
- Tests run and results:
- Manual verification steps:
- Assumptions / blockers:
- Remaining integration work:
```

### Shared instruction for each agent (copy into your agent-manager)

> You are implementing functional capabilities for **Hima**, an existing React Native/TypeScript student budgeting app. Its UI is complete; preserve the screens, navigation, Hima branding, and mascot. The product includes manual allowance and schedule onboarding, deterministic Safe-to-Spend, optional Kimi AI recommendations, NFC merchant identification, and a supported Paiflow/Stellar **testnet** payment demonstration. Inspect the existing code before editing. Work only within your assigned module and follow frozen shared API contracts. Implement loading/error/pending states and tests. Never hardcode successful payments, expose secrets, allow AI to authorize transactions, or invent Paiflow behavior. Deliver working code plus the handoff checklist above.

---

## 8. Definition of done

### Functional

- [ ] Registration/login/session restore work.
- [ ] First-time setup saves manual allowance, school days, estimated expenses, and reserve.
- [ ] Returning users bypass completed onboarding.
- [ ] Budget calculation accounts for actual university days.
- [ ] Safe-to-Spend matches tested calculation results.
- [ ] Dashboard retrieves persisted financial information.
- [ ] Kimi explains a verified budget and returns at least one valid recommendation.
- [ ] Kimi failure does not block budgeting or payment.
- [ ] NFC reads a compatible registered demo tag on the test device.
- [ ] Merchant and category are resolved through an allowlisted backend record.
- [ ] Checkout shows actual quote, safe-spend warning, and authorization.
- [ ] A verified payout occurs through **our Paiflow deployment** using organizer-supported APIs.
- [ ] Payment result shows real status, deployment/reference evidence, and tx hash where applicable.
- [ ] Dashboard/history update **once** after confirmation.
- [ ] Pending/failed/cancelled events do not masquerade as completed payments.

### Quality/security

- [ ] No API keys or wallet secrets in frontend or committed files.
- [ ] Authenticated endpoints enforce user identity and ownership.
- [ ] Financial calculations use integer/decimal-safe money handling.
- [ ] Duplicate submissions cannot cause repeat payouts.
- [ ] Payment pending/unknown states survive app restart and reconcile correctly.
- [ ] UI supports loading, empty, offline, and error states.
- [ ] Android NFC and payment flows tested on physical hardware.
- [ ] Required hackathon transaction and deployment evidence is archived.

---

## 9. Critical blockers to resolve early

| Question | Owner | Required decision |
|---|---|---|
| Which Paiflow trigger supports checkout-initiated payout? | 05 | Documented supported route or alternative demo flow |
| Are payout recipients fixed per deployment? | 05 | Demo merchant and deployment architecture |
| How is payment signing/authorization supported on mobile? | 05 | Secure wallet/signing approach |
| How do PHP budget expenses relate to testnet asset amounts? | 02 + 05 | Explicit demo accounting mapping; no invented FX claim |
| Is the actual student ID readable by Android NFC? | 04 | Supported tag technology or use a dedicated blank NFC tag |
| Which Kimi model/endpoint/quotas are provided? | 06 | Verified server-side integration contract |
| Which existing screens/hooks are already implemented? | 03 + 07 | File-level assignment based on repo inventory |

**Priority:** Prove the Paiflow payout path early and simultaneously finish the first functional vertical slice: **Login → Preferences → Budget Preview → Confirm → Dashboard**.
