# AI Development Rules – Industrial Weighing Dashboard

You are an AI software engineer responsible for building a desktop application called **Industrial Weighing Dashboard**.

You must strictly follow the rules below.

---

## 1. Primary Project Reference

The document:

Planification__Industrial_Weithing_Dashboard.md

is the **main and primary source of truth for the entire project**.

Before performing any task you must:

1. Read this document completely.
2. Understand the system architecture.
3. Follow its phases, design decisions, and roadmap.

If there is any conflict between instructions and this document:

**The document takes priority.**

You must always align your implementation with the plan defined in this file.

---

## 2. Communication Rules

When communicating with the developer (user):

* Always communicate in **English**.

Do not switch language unless explicitly requested.

---

## 3. Interface Language

The application interface must be written in **French**.

All UI text must be in French, including:

* buttons
* labels
* menu items
* messages
* notifications
* settings
* dashboards

Examples:

Start Service → Démarrer le service
Stop Service → Arrêter le service
Settings → Paramètres

Future requirement:

The architecture should allow **internationalization (i18n)** so that English can be added later.

However:

For now, the application must focus **only on French as the interface language**.

---

## 4. Development Phases

The project must be developed in **clear phases** defined in the planning document.

For each phase you must:

1. Implement the required features.
2. Verify that the code compiles and runs.
3. Run tests.
4. Validate functionality.
5. Fix issues if detected.

Only after a phase is **fully validated and stable** can you proceed to the next phase.

Never skip phases.

---

## 5. Mandatory Testing Before Next Phase

At the end of every phase:

You must perform verification including:

* build validation
* unit tests
* basic functional tests
* configuration validation

If any issue occurs:

You must fix the problem **before moving to the next phase**.

The project must remain **in a working state at all times**.

---

## 6. Continuous Integration Requirement

Before starting the actual development of the project:

You must create a **GitHub Actions workflow**.

This CI pipeline must automatically run on:

* push
* pull_request

The pipeline must verify:

1. dependency installation
2. project build
3. lint checks
4. automated tests

Example responsibilities:

* ensure Electron app builds
* ensure TypeScript compiles
* run test scripts
* validate configuration files

The project should not progress until the CI pipeline is correctly configured and functioning.

---

## 7. Code Quality Requirements

All code must follow professional standards:

* clean architecture
* modular structure
* readable naming
* comments where necessary
* consistent formatting

Avoid:

* duplicated logic
* unnecessary complexity
* untested code

---

## 8. Project Stack

The dashboard application must use:

Electron
React
TypeScript

The application will interact with an existing system:

BalanceService (.NET Windows Service)

Communication must occur via **API**, not direct serial communication.

Electron must never directly control the hardware scale.

---

## 9. Reliability Requirements

This project is intended for an **industrial environment**.

Therefore the application must prioritize:

* stability
* predictable behavior
* clear error messages
* robust logging
* safe configuration management

---

## 10. Development Discipline

Always follow this workflow:

1. Read the planning document
2. Identify the current phase
3. Implement features for that phase
4. Write or update tests
5. run CI validation
6. verify functionality
7. only then move forward

Never implement large features without alignment with the planning document.

---

End of rules.
