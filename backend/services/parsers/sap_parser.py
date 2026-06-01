class SAPParser:
    def parse(self, rows):
        """
        Parses raw CSV rows.
        If it's the Kaggle FuelConsumption dataset, maps to standard SAP columns.
        Otherwise, preserves and returns the raw rows directly.
        """
        # Check if rows contains a fuel consumption dataset
        is_fuel_consumption_dataset = False
        if rows and len(rows) > 0:
            first_row = rows[0]
            is_fuel_consumption_dataset = any(
                "fuelconsumption" in str(k).lower() for k in first_row.keys()
            )

        if not is_fuel_consumption_dataset:
            return rows

        parsed_rows = []
        for row in rows:
            # Resolve fields case-insensitively
            def get_field_val(keys):
                for k in keys:
                    if k in row:
                        val = row[k]
                        return str(val).strip() if val is not None else ""
                lower_row = {str(rk).lower().strip(): rv for rk, rv in row.items()}
                for k in keys:
                    lk = k.lower()
                    if lk in lower_row:
                        val = lower_row[lk]
                        return str(val).strip() if val is not None else ""
                return ""

            # Map Kaggle Fuel Consumption dataset columns
            make = get_field_val(["MAKE", "make"])
            model = get_field_val(["MODEL", "model"])
            year = get_field_val(["MODELYEAR", "modelyear"])
            fuel_type_code = get_field_val(["FUELTYPE", "fueltype"])
            qty = get_field_val(["FUELCONSUMPTION_COMB", "fuelconsumption_comb"])
            
            # Map fuel type codes to names
            fuel_mapping = {
                "D": "Diesel",
                "X": "Regular Gasoline",
                "Z": "Premium Gasoline",
                "E": "Ethanol",
                "N": "Natural Gas"
            }
            fuel_name = fuel_mapping.get(fuel_type_code.upper(), f"Gasoline ({fuel_type_code})")
            
            parsed_rows.append({
                "Werk": f"{make} {model}".strip(),
                "Kraftstoff": fuel_name,
                "Menge": qty,
                "Einheit": "L",
                "Datum": f"01.01.{year}" if year else "01.01.2014"
            })
            
        return parsed_rows

def parse_sap_csv(rows):
    return SAPParser().parse(rows)
