# Decisions

This document outlines the key architectural decisions, resolved design ambiguities, product scope questions, and specific subsets of handled/ignored data sources.

---

## 1. Resolved Ambiguities & Scope Selections

### 1.1. SAP Fuel Ingestion Subset
* **What We Handled:** 
  * Fossil fuel types: Diesel, Petrol, Fuel Oil, and Natural Gas.
  * Ingestion fields mapping: Plant (`Werk`), Fuel Type (`Kraftstoff`), Quantity (`Menge`), Unit (`Einheit`), and Date (`Buchungsdatum`).
* **What We Ignored:** 
  * Complex solid fuels (e.g. Coal, Anthracite, Coke).
  * Direct emissions from industrial chemical processes or agricultural soil additives.
  * Mobile equipment fuel logs (e.g. forklifts or corporate fleet vehicles) where billing is managed by third-party card integrations.
* **Ambiguity Resolved:** Standardized on English translations for all headers. If fields like `Menge` or `Einheit` are empty, the row is parsed as a `RawRecord` but marked `FAILED` or flagged as an anomaly instead of halting the database migration transactions.

### 1.2. Utility Consumption Ingestion Subset
* **What We Handled:** 
  * Grid electricity consumption mapped as Scope 2.
* **What We Ignored:** 
  * District heating, steam, chilled water, and municipal water utilities.
  * Natural gas billing records directly from utility providers (which are instead classified as Scope 1 Fuel Combustion).
* **Ambiguity Resolved:** Handled varying utility billing periods (which may span across two calendar months) by assigning the emissions calculation to the calendar month of the `BillingEnd` date.

### 1.3. Travel Ingestion Subset
* **What We Handled:** 
  * Commercial flights and intercity train bookings mapped as Scope 3.
* **What We Ignored:** 
  * Hotel stays, taxi/ride-sharing receipts, public bus transits, and rental car mileage logs.
* **Ambiguity Resolved:** Travel records containing incomplete routes or missing airport codes are accepted as raw data and flagged as anomalies (calculating with a default factor of `0.5` metric tons CO2e) rather than crashing the CSV parser.

---

## 2. Core Architectural Decisions

### 2.1. Multi-Tenant Architecture
* **Decision:** Implemented tenant isolation at the database level using a foreign key constraint to a `Tenant` model on all primary tables.
* **Reason:** Prevents data leakage between different organizations. Every user request is scoped strictly to the authenticated user's tenant ID.

### 2.2. Role-Based Access Control (RBAC)
* **Decision:** Implemented three roles: `ADMIN`, `ANALYST`, and `REVIEWER`.
* **Reason:** Provides sufficient separation of concerns (uploading, verification, and configuration management) without adding unnecessary hierarchical complexity.

### 2.3. Facility Model
* **Decision:** Facilities are modeled as explicit, first-class database entities with soft-deletion support (`is_deleted`).
* **Reason:** Organizations operate across multiple distinct locations. Soft-deletion ensures historical emission records linked to a decommissioned facility remain valid and queryable.

### 2.4. Scope Classification
* **Decision:** Mapped data ingestion sources to greenhouse gas (GHG) scopes:
  * Fuel $\rightarrow$ Scope 1 (Direct)
  * Electricity $\rightarrow$ Scope 2 (Indirect)
  * Travel (Flight, Train) $\rightarrow$ Scope 3 (Value Chain)
* **Reason:** Aligns calculations with the international GHG Protocol Corporate Standard.

---

## 3. Product Manager (PM) Questions

If we could align with the Product Manager, we would clarify the following points:
1. **Emissions Factor Registry:** Which emissions factor registry (e.g. EPA eGRID, DEFRA, IEA) should be the authoritative lookup source, and how frequently should factors be updated?
2. **Facility Hierarchy:** Should the system support a regional hierarchy (e.g., Facility $\rightarrow$ City $\rightarrow$ Region $\rightarrow$ Country) for corporate aggregation, or is a flat list of facilities sufficient?
3. **Approval Lifecycle Workflow:** Should the approval process require dual-review (multiple authorization levels) for emissions exceeding a specific metric tonnage threshold?
4. **Audit Retention:** What is the legal or compliance-driven retention period required for audit logs, and should we implement automatic database archiving or deletion policies?
5. **Multi-Unit Overrides:** Should users have the option to manually override the automated unit normalization if a facility imports energy using non-standard vendor units?
