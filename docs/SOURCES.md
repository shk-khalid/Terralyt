# Ingestion Sources & Data Formats

This document describes the external datasets supported by the Terralyt ingestion engine, details on researched formats, key learnings, sample datasets, and production vulnerabilities.

---

## 1. Source 1: SAP Fuel Consumption (Scope 1)

### 1.1. Real-World Format Researched
We researched standardized SAP ERP material movements and plant maintenance logs (often exported via transactions like `MB51` or custom ABAP queries). These reports typically track fuel issues to equipment or storage tanks.

### 1.2. What We Learned
* **Localization:** Enterprise systems deployed in Europe or Latin America export CSV logs using local languages (e.g. German headers: `Werk`, `Kraftstoff`, `Menge`, `Einheit`, `Buchungsdatum`).
* **Unit Chaos:** Units of measurement are entered by local facility operators, resulting in non-standardized variations for identical metrics.

### 1.3. What Our Sample Data Looks Like & Why
* **Associated Files:** `../sources/FuelConsumption.csv` (production) and `../sources/sap_fuel_inconsistent_sample.csv` (inconsistent).
* **Structure:** Includes German column headers and highly inconsistent units (`L`, `ltr`, `Litres`, `liters`, `Lt`, `LTRS`).
* **Why:** Demonstrates that the backend can dynamically translate localized headers, normalize diverse unit strings to `liters`, and flag negative consumption or empty data values without crashing.

### 1.4. What Would Break in a Real Deployment
* **Encoding Conflicts:** Uploaded files containing local character encodings (e.g., ISO-8859-1 or Windows-1252) can break standard UTF-8 CSV parsers.
* **Unmapped Fuel Types:** Ingestion of a new unmapped fuel type (e.g., a specific grade of heavy fuel oil) will fail validation unless a corresponding emission factor and mapping are registered in the system.

---

## 2. Source 2: Utility Consumption (Scope 2)

### 2.1. Real-World Format Researched
We researched green button XML files, utility invoice PDFs exported as CSV spreadsheets, and grid operator consumption logs (e.g., ConEd, PG&E monthly energy billing reports).

### 2.2. What We Learned
* **Billing Cycles:** Billing start and end dates rarely align perfectly with the calendar month boundaries (e.g. billing from March 12 to April 11).
* **Adjustments:** Utilities regularly issue retro-active billing corrections, manifesting as negative consumption adjustments in subsequent months.

### 2.3. What Our Sample Data Looks Like & Why
* **Associated Files:** `../sources/electricity.csv` (production) and `../sources/utility_inconsistent_sample.csv` (inconsistent).
* **Structure:** Rows contain `MeterID`, `Facility`, `BillingStart`, `BillingEnd`, `Consumption`, and `Unit`.
* **Why:** Validates the system's ability to handle overlapping date ranges, normalize mixed power units (`kWh`, `KWH`, `kwh`, `KW-H`) into the standard database code `kWh`, and catch negative adjustment anomalies.

### 2.4. What Would Break in a Real Deployment
* **Time Zone Shifts:** Billing logs exported without explicit UTC offsets can lead to double-counting or gaps during Daylight Saving Time (DST) changes.
* **Multi-Meter Facility Complexities:** Large industrial facilities with dozens of electricity meters might experience double-counting if meters are not explicitly linked to primary parent connections.

---

## 3. Source 3: Travel Data (Scope 3)

### 3.1. Real-World Format Researched
We researched travel booking agency reports (e.g. Amex Global Business Travel, SAP Concur exports) containing passenger flight segments and train routes.

### 3.2. What We Learned
* **Airport Mapping:** Flight logs rarely contain route mileage. Instead, they provide airport IATA code pairs (e.g., `BOM` to `DXB`) which must be mapped to distance metrics using Great Circle distance math.
* **Cabin Multipliers:** Emissions vary heavily by travel cabin class (Business class accounts for a higher carbon footprint share than Economy).

### 3.3. What Our Sample Data Looks Like & Why
* **Associated Files:** `../sources/customerBooking.csv` (production) and `../sources/travel_inconsistent_sample.csv` (inconsistent).
* **Structure:** Includes departure/arrival fields (`From`, `To`), cabin class (`Class`), and duration (`TravelDurationHours`).
* **Why:** Tests travel class parsing (`Economy`, `Business`, `First`) and assesses how the engine handles bad route data (e.g. blank values or negative travel durations).

### 3.4. What Would Break in a Real Deployment
* **Unknown Route Segments:** Charter flights or routes between remote regional airports with missing IATA coordinates can cause distance calculations to fail.
* **Multi-Segment Flights:** Inability to distinguish between direct flight paths and multi-stop journeys can lead to significant underestimation of take-off/landing emissions cycles.

---

## 4. What Was Intentionally Ignored

To deliver focused, high-fidelity Scope 1, 2, and 3 workflows within the assignment scope, the following datasets were excluded from calculations:
* **Hotel accommodation emissions:** Scope 3 emissions from overnight stays.
* **Procurement emissions:** Supply chain carbon footprints for indirect materials purchased.
* **Waste management datasets:** Emissions from landfill disposal or incineration.
* **Water consumption datasets:** Water supply and wastewater treatment footprints.
