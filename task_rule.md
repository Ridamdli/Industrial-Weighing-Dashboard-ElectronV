You are a **Senior Software Auditor AI** responsible for performing the **final verification of the entire project**.

Your role is to **audit, verify, and fix** the project implementation against the official project planning document.

This is **not a normal code review**.
This is a **phase-by-phase technical audit** ensuring that the implementation **fully satisfies the planification document**.

---

# PRIMARY OBJECTIVE

Verify that the entire project implementation **correctly satisfies every requirement defined in:**

Planification__Indistruial_weithing_Dashboard.md

The project must match the plan **from Phase 1 to Phase 11**.

You must confirm that:

* every phase is implemented
* nothing is missing
* everything works together correctly
* architecture rules are respected
* the code compiles and runs
* the design follows the industrial dashboard constraints

If something is **missing, incorrect, incomplete, or inconsistent**, you must:

1. Stop the audit at that phase
2. Fix the implementation
3. Re-verify the phase
4. Only then continue to the next phase

Never skip problems.

---

# FIRST STEP — CONTEXT UNDERSTANDING

Before auditing anything, you must fully understand the project.

You MUST read and analyze these files carefully:

1️⃣
Planification__Indistruial_weithing_Dashboard.md
This is the **source of truth** for all phases.

2️⃣
README.md
Understand the project purpose, architecture, and usage.

3️⃣
All files inside:

ai-rules/

These contain important architectural rules and design constraints.

Do not start the audit until these are fully understood.

---

# AUDIT STRATEGY

The audit must be performed **phase by phase**.

For each phase:

1️⃣ Read the phase definition in the planification document.

2️⃣ Identify all expected elements:

* features
* modules
* files
* architecture
* APIs
* UI components
* behavior

3️⃣ Search the repository to verify implementation.

4️⃣ Validate:

* correctness
* completeness
* integration with other phases
* architecture compliance

5️⃣ Run technical checks where applicable:

* TypeScript types
* build success
* lint success
* tests passing
* Electron security rules respected
* IPC boundaries respected

---

# IF SOMETHING IS MISSING OR WRONG

If you detect any issue such as:

* missing feature
* incorrect architecture
* incorrect IPC usage
* broken integration
* incorrect API
* missing UI component
* incorrect configuration
* security violation
* incomplete phase

You must:

1️⃣ explain the issue clearly
2️⃣ implement the required fix directly in the code
3️⃣ re-verify that the fix works
4️⃣ continue the audit

Do not continue until the phase is **fully correct**.

---

# ELECTRON ARCHITECTURE RULES

Verify these rules strictly:

Renderer (React UI):

* must NOT access Node.js directly
* must NOT access filesystem
* must NOT access hardware

All system interactions must go through:

Electron Main Process
via IPC exposed in:

window.api (preload)

---

# IMPORTANT SYSTEM COMPONENTS TO VERIFY

Confirm correct implementation of:

Service Management
(sc.exe control of BalanceAgentService)

Configuration Manager
(balances.ini read/write)

COM Port Management
(serialport usage)

API Proxy
(balance device HTTP API)

Logs Monitoring
(Windows Event Log)

Dashboard UI

Installer / packaging

Security configuration

---

# OUTPUT FORMAT

For each phase, produce a structured report:

Phase X — [Phase Title]

Status:
✅ Complete
⚠ Needs Fix
❌ Missing

Verification:

* item 1
* item 2
* item 3

Fixes Applied:
(list code changes if any)

Conclusion:
(ready to proceed / requires more fixes)

---

# FINAL AUDIT REPORT

When all phases are verified, generate a final report:

Industrial Weighing Dashboard
Final Implementation Audit

Summary:

Phase 1
Phase 2
Phase 3
...
Phase 11

For each phase show:

✅ Passed
⚠ Fixed during audit
❌ Not implemented

Then give a final verdict:

PROJECT STATUS

✔ Production Ready
or
⚠ Requires additional fixes

---

# IMPORTANT RULE

You are the **final quality gate**.

Do not assume something works.

You must verify it from the code.

---

# SOME VERIFICATION COMMENTS THAT I FOUND MAY HELP YOU

The implementation establishes a solid Electron main/preload/renderer split with IPC, but several integration-critical issues prevent reliable operation with the existing BalanceAgentService. The most serious problems are API/config contract mismatches and config write path handling, which currently block real-time monitoring and safe configuration management. There are also architectural deviations from the user's intent (direct COM communication) and notable gaps versus the approved implementation plan (wizard/dashboard/logging completeness).

I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

The context section for each comment explains the problem and its significance. The fix section defines the scope of changes to make that may help you.

---

## Critical:

1. ## Comment 1: Balance API proxy reads non-existent `[api]` INI section, causing health and weight calls to fail by default.

### Context
Operators cannot monitor service health or live weight on a fresh install because `apiHandlers.ts` hard-fails when `[api]` is absent. The existing `balances.ini` schema uses `[Balances]`/`[Balance1]` and does not include `host`/`port` keys, so `balance:getHealth` and `balance:getWeight` frequently return `{ ok:false }` despite a running service. This breaks the expected integration contract with the already-working BalanceService.

### Fix

In `balance-dashboard/electron/main/ipc/apiHandlers.ts`, remove the hard dependency on `[api]` keys. Default to `http://localhost:5001` (or a persisted app setting) when API settings are not present. Treat INI-based API overrides as optional, and keep `balance:getHealth`/`balance:getWeight` functional against the existing deployed service without requiring INI schema changes.

### Referred Files
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\electron\main\ipc\apiHandlers.ts
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balances.ini

2. ## Comment 1: Configuration writes pass an empty path, so save operations fail or target an invalid destination.

### Context
Both configuration UIs build write payloads with `path: ''`, but the IPC handler calls `writeIniConfig(payload.path, ...)` directly with no fallback. This can fail renaming/writing or write in unintended locations, meaning operators cannot reliably persist settings. It also risks silent misconfiguration in production environments.

### Fix

In `balance-dashboard/electron/main/ipc/configHandlers.ts`, treat missing or empty `payload.path` as undefined and resolve it via `detectDefaultConfigPath()`. In `src/renderer/pages/IniForm.tsx` and `src/renderer/pages/SetupWizard.tsx`, store the `config.read()` returned path and send that exact path on save.

### Referred Files
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\electron\main\ipc\configHandlers.ts
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\src\renderer\pages\IniForm.tsx
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\src\renderer\pages\SetupWizard.tsx
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\electron\main\utils\iniConfig.ts

3. ## Comment 1: INI form rewrites service configuration into incompatible sections and keys, risking BalanceService startup and runtime behavior.

### Context
The current form reads/writes `API.Host`, `API.Port`, `Balance.ComPort`, and `Balance.BaudRate`, while the live service config uses `[Balances]` and `[Balance1]` with keys like `PortCom`, `DataBits`, `Parity`, `StopBits`, `Timeout`, `Unite`, and `Decimales`. Saving from the UI can erase required sections/fields and break consumer expectations of BalanceService configuration.

### Fix

Refactor `src/renderer/pages/IniForm.tsx` and `src/renderer/pages/SetupWizard.tsx` to map the real schema from `balances.ini` (`[Balances]`, `[BalanceN]`, `PortCom`, etc.). In `electron/main/utils/iniConfig.ts`, preserve untouched sections/keys when writing, and update only edited fields. Add validation for all required serial parameters before save.

### Referred Files
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\src\renderer\pages\IniForm.tsx
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\src\renderer\pages\SetupWizard.tsx
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balances.ini
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\electron\main\utils\iniConfig.ts

---

## Major:

1. ## Comment 1: Weight polling expects `poids/unite` fields, conflicting with documented API `weight/unit` response contract.

### Context
Live dashboard readings may remain blank even when data flows, because `useWeightPolling` only updates state when `body.poids` is numeric. The simulator and planning contract show `weight` and `unit`, so this parser mismatch breaks the renderer-consumer contract and introduces hard-to-diagnose false offline behavior.

### Fix

In `src/renderer/hooks/useWeightPolling.ts`, parse the canonical API shape (`weight`, `unit`, `timestamp`) and optionally support legacy aliases for backward compatibility. Update typing in `src/renderer/api/balanceApi.ts` and `src/vite-env.d.ts` to enforce a single normalized response contract.

### Referred Files
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\src\renderer\hooks\useWeightPolling.ts
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\ScaleSimulator\README.md
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\Planification___Industrial_Weighing_Dashboard.md

2. ## Comment 1: Direct COM port opening from Electron violates the no-direct-scale-communication architectural requirement and can conflict with service ownership.

### Context
`comPorts.test` opens serial ports directly via `serialport`, bypassing BalanceService. This contradicts the explicit architecture rule that all communications flow through BalanceService API. In production, it can also contend with the Windows service already holding the COM device, causing false test failures or operational disruption.

### Fix

In `electron/main/utils/comPorts.ts` and `electron/main/ipc/comPortHandlers.ts`, remove direct serial open testing or gate it behind a strict maintenance mode. Implement connection/health verification through BalanceService API endpoints instead, and update `ComPortDetector` and `SetupWizard` to use those service-mediated checks.

### Referred Files
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\electron\main\utils\comPorts.ts
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\electron\main\ipc\comPortHandlers.ts
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\src\renderer\pages\ComPortDetector.tsx
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\src\renderer\pages\SetupWizard.tsx

3. ## Comment 1: Log streaming listener cleanup is missing, creating duplicate handlers and growing memory usage across page revisits.

### Context
`LogsViewer` registers `onNewEntries` listeners each stream start but never invokes the unsubscribe function returned by preload. Over time, each revisit/start adds another listener, duplicating log rows and increasing renderer memory/CPU usage. This creates noisy operator UX and potential long-running instability.

### Fix

In `src/renderer/pages/LogsViewer.tsx`, store the unsubscribe callback returned by `balanceApi.logs.onNewEntries`. Invoke it on stop, before re-subscribing, and in `useEffect` cleanup alongside `logs.unsubscribe()`. Add deduplication logic by entry fingerprint when merging streamed logs.

### Referred Files
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\src\renderer\pages\LogsViewer.tsx
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\electron\preload\index.ts

4. ## Comment 1: Multiple required roadmap features are still missing, leaving the deliverable incomplete for operator workflows.

### Context
Several core planned capabilities are absent or partial: dashboard lacks API connection status/COM display/recent logs; setup wizard implements 4 steps instead of 6 (missing scale test, API connectivity test, finish step); logs viewer lacks filtering/virtualization; configuration UI omits many required serial parameters. This reduces operational readiness and deviates from approved scope.

### Fix

Complete missing items in `src/App.tsx`, `src/renderer/pages/SetupWizard.tsx`, `src/renderer/pages/LogsViewer.tsx`, and `src/renderer/pages/IniForm.tsx` to match the documented roadmap and feature set. Add explicit acceptance checks for each planned step/feature before release.

### Referred Files
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\src\App.tsx
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\src\renderer\pages\SetupWizard.tsx
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\src\renderer\pages\LogsViewer.tsx
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\balance-dashboard\src\renderer\pages\IniForm.tsx
- c:\Users\grimm\OneDrive\Desktop\BalanceAgentService\Planification___Industrial_Weighing_Dashboard.md