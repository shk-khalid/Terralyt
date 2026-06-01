# Tradeoffs & Scope Boundaries

This document details the critical architectural compromises, deferred integrations, and engineering tradeoffs chosen during the implementation of the Terralyt platform. 

---

## 1. Static Calculation Factors vs. Real-Time Emissions Registries

### Current Implementation
The system employs static emission factors hardcoded directly within the `EmissionRecord` model's lifecycle calculation logic (`0.385` for Electricity, `2.5` for Fuel, `0.3` for Flight, and `0.5` for other activities). 

### Deferred Integration (Not Built)
Integrations with live emissions databases and regulatory registries (such as the US EPA, UK DEFRA, or the GHG Protocol calculation tools) were not built.

### Trade-off Analysis
* **Why This Was Chosen:** The primary architectural goal was to build robust data ingestion pipelines, transaction handling, and review queue workflows. Integrating with live external API registries would require maintaining API keys, caching layer mechanisms, and handling network exceptions, which would have significantly expanded the development timeline without adding core value to the demonstration of the system's data isolation and user state lifecycles.
* **Future Upgrade Path:** The `emissions_standard` field on the `Tenant` model is designed to support different versions of factors (e.g. `epa_2025`). This configuration can later act as a routing key to query external registry APIs or versioned calculation service containers.

---

## 2. CSV Ingestion vs. Automated ERP Connectors

### Current Implementation
Data ingestion relies entirely on file uploads. Users with the *Analyst* role upload formatted CSV files through the web portal to populate raw record tables.

### Deferred Integration (Not Built)
Direct, automated connectors to ERP systems (such as SAP, Oracle) or automatic web scrapers/APIs for utility and business travel providers (such as Concur, utility portals) were not built.

### Trade-off Analysis
* **Why This Was Chosen:** Building direct ERP connectors requires managing sensitive credentials (OAuth, API secrets) for each tenant, configuring scheduled background workers (e.g. Celery), and matching diverse vendor schemas. A file-based upload engine acts as a clean, standardized integration boundary that allows testing data pipelines securely without external infrastructure dependencies.
* **Future Upgrade Path:** The `DataSource` model includes an `ingestion_method` field with support for `API_PULL` and `MANUAL` values. This sets the stage for introducing microservice workers that ingest data automatically and dump the payloads directly into the `RawRecord` JSON format.

---

## 3. Simplified Review Workflow vs. Advanced Escalation Engines

### Current Implementation
The record state machine supports a simple, single-stage verification queue: records are uploaded as `PENDING`, a user with the *Reviewer* role reviews it, and either approves (locking the record and generating an audit log) or rejects it.

### Deferred Integration (Not Built)
Multi-step approval chains, role escalation hierarchies, automated email notifications, and validation routing schemes based on emissions values or facility sizes were not built.

### Trade-off Analysis
* **Why This Was Chosen:** The single-reviewer workflow is sufficient to prove the viability of the review lifecycle, show state transition constraints (e.g., preventing edits on locked records), and log the transitions in the audit trail. Adding multi-stage routing would add significant database overhead (e.g., tracking current step index, user-group assignments) and complex UX flows.
* **Future Upgrade Path:** The `review_status` on `EmissionRecord` can be expanded from a simple TextChoices string to reference a dedicated `WorkflowState` model to handle custom corporate governance rules.
