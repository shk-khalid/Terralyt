from datetime import date as dt_date
from emissions.models import EmissionRecord

class SchemaNormalizer:
    @staticmethod
    def normalize(raw_row, source_type):
        """
        Converts source-specific fields of a raw row into a common internal schema.
        Common Internal Schema keys:
        - facility: raw facility/location/employee string
        - activity_type_name: raw activity type string (Mode, Kraftstoff, UtilityType)
        - quantity: raw quantity string
        - normalized_unit: raw unit string
        - activity_date: raw date string
        - scope: EmissionRecord.Scope choice
        - activity_type: EmissionRecord.ActivityType choice
        - source_type: normalized source type string (SAP, UTILITY, TRAVEL)
        - is_date_derived: boolean flag indicating if the date was derived
        - raw_payload: original unmodified dict row
        """
        normalized_source = source_type.strip().upper()
        
        # Helper to resolve keys case-insensitively
        def get_field_val(keys):
            for k in keys:
                if k in raw_row:
                    val = raw_row[k]
                    return str(val).strip() if val is not None else ""
            lower_row = {str(rk).lower().strip(): rv for rk, rv in raw_row.items()}
            for k in keys:
                lk = k.lower()
                if lk in lower_row:
                    val = lower_row[lk]
                    return str(val).strip() if val is not None else ""
            return ""

        if normalized_source == "SAP":
            return {
                "facility": get_field_val(["Werk", "Plant", "Standort", "Betriebsstätte"]),
                "activity_type_name": get_field_val(["Kraftstoff", "Fuel", "FuelType", "ActivityType", "Material", "Materialkurztext"]),
                "quantity": get_field_val(["Menge", "Quantity", "Qty", "Menge in Erfassungseinheit"]),
                "normalized_unit": get_field_val(["Einheit", "Unit", "Erfassungseinheit", "Me", "Maßeinheit"]),
                "activity_date": get_field_val(["Datum", "Date", "ActivityDate", "Buchungsdatum", "Belegdatum", "Erfassungsdatum", "PostingDate", "Posting Date"]),
                "scope": EmissionRecord.Scope.SCOPE_1,
                "activity_type": EmissionRecord.ActivityType.FUEL,
                "source_type": "SAP",
                "is_date_derived": False,
                "raw_payload": raw_row
            }
            
        elif normalized_source == "UTILITY":
            # Core Utility Fields
            facility_name = get_field_val(["Utility.Name", "facility_name", "Facility", "Location", "Building", "Plant", "Werk", "Standort"])
            region = get_field_val(["Utility.State", "region", "Region", "State"])
            utility_type = get_field_val(["Utility.Type", "utility_type", "UtilityType", "ActivityType", "Activity", "Resource", "Kraftstoff", "Type"])
            utility_id = get_field_val(["Utility.Number", "utility_id", "UtilityId", "Number"])

            # Primary Quantity Fields
            quantity = get_field_val(["Retail.Total.Sales", "quantity", "Consumption", "Quantity", "Usage", "Menge"])
            total_usage = get_field_val(["Uses.Total", "total_usage", "TotalUsage"])
            total_generation = get_field_val(["Sources.Total", "total_generation", "TotalGeneration"])
            transmission_losses = get_field_val(["Uses.Losses", "transmission_losses", "TransmissionLosses", "Losses"])

            # Optional Revenue Metrics
            retail_revenue = get_field_val(["Revenues.Retail", "retail_revenue", "RetailRevenue"])
            total_revenue = get_field_val(["Revenue.Total", "total_revenue", "TotalRevenue"])

            # Customer Metrics
            customer_count = get_field_val(["Retail.Total.Customers", "customer_count", "CustomerCount", "Customers"])
            residential_customers = get_field_val(["Retail.Residential.Customers", "residential_customers", "ResidentialCustomers"])
            commercial_customers = get_field_val(["Retail.Commercial.Customers", "commercial_customers", "CommercialCustomers"])
            industrial_customers = get_field_val(["Retail.Industrial.Customers", "industrial_customers", "IndustrialCustomers"])

            # Standardized unit defaults to "kWh"
            unit = "kWh"

            # Auto-generate derived activity date using ingestion timestamp since this dataset has no date
            date_val = get_field_val(["Date", "BillingStart", "BillingDate", "Datum", "PeriodEnd"])
            is_date_derived = False
            if not date_val:
                date_val = dt_date.today().strftime("%Y-%m-%d")
                is_date_derived = True

            return {
                "facility": facility_name,
                "activity_type_name": utility_type if utility_type else "Electricity",
                "quantity": quantity,
                "normalized_unit": unit,
                "activity_date": date_val,
                "scope": EmissionRecord.Scope.SCOPE_2,
                "activity_type": EmissionRecord.ActivityType.ELECTRICITY,
                "source_type": "UTILITY",
                "is_date_derived": is_date_derived,

                # Utility Schema Fields
                "region": region,
                "utility_type": utility_type,
                "utility_id": utility_id,
                "total_usage": total_usage,
                "total_generation": total_generation,
                "transmission_losses": transmission_losses,
                "retail_revenue": retail_revenue,
                "total_revenue": total_revenue,
                "customer_count": customer_count,
                "residential_customers": residential_customers,
                "commercial_customers": commercial_customers,
                "industrial_customers": industrial_customers,

                "raw_payload": raw_row
            }
            
        elif normalized_source == "TRAVEL":
            employee = get_field_val(["Employee", "Department", "Office", "Location", "Werk", "Branch"])
            
            # Primary Quantity Fields
            quantity_val = get_field_val(["flight_duration", "TravelDurationHours", "duration_hours", "duration", "Quantity", "Menge", "Qty"])
            
            # Route / Location Fields
            route = get_field_val(["route", "Route"])
            origin = get_field_val(["From", "origin", "Origin", "AirportFrom"])
            destination = get_field_val(["To", "destination", "Destination", "AirportTo"])
            booking_origin = get_field_val(["booking_origin", "BookingOrigin"])
            
            # Intelligent Route Parsing
            is_partial_route = False
            clean_route = route.replace("-", "").replace("/", "").replace(" ", "").strip()
            if clean_route:
                if len(clean_route) == 6:
                    origin = clean_route[:3]
                    destination = clean_route[3:]
                elif len(clean_route) == 3:
                    origin = clean_route
                    destination = ""
                    is_partial_route = True
            
            # Transport Fields
            transport_mode = get_field_val(["Mode", "mode", "transport_type", "TravelType", "ActivityType", "ExpenseType"])
            
            # Travel Metadata
            trip_type = get_field_val(["trip_type", "TripType"])
            travel_class = get_field_val(["Class", "class", "TravelClass"])
            sales_channel = get_field_val(["sales_channel", "SalesChannel"])
            passenger_count = get_field_val(["num_passengers", "PassengerCount", "Passengers"])
            purchase_lead_days = get_field_val(["purchase_lead", "PurchaseLead"])
            stay_length = get_field_val(["length_of_stay", "LengthOfStay", "StayLength"])
            flight_day = get_field_val(["flight_day", "FlightDay"])
            flight_hour = get_field_val(["flight_hour", "FlightHour"])
            booking_complete = get_field_val(["booking_complete", "BookingComplete"])
            
            # Standardized unit defaults to "hours" per requirement
            unit = "hours"
            
            # Auto-generate derived travel date if not provided in the dataset
            date_val = get_field_val(["Date", "TravelDate", "StartDate", "Datum"])
            is_date_derived = False
            if not date_val:
                date_val = dt_date.today().strftime("%Y-%m-%d")
                is_date_derived = True

            # Determine Activity Type based on travel mode (Scope is always Scope 3)
            clean_mode = transport_mode.lower()
            scope = EmissionRecord.Scope.SCOPE_3

            if any(f_keyword in clean_mode for f_keyword in ["flight", "air", "flug", "aviation"]):
                activity_type = EmissionRecord.ActivityType.FLIGHT
            elif any(h_keyword in clean_mode for h_keyword in ["hotel", "stay", "übernachtung", "accommodation"]):
                activity_type = EmissionRecord.ActivityType.HOTEL
            else:
                activity_type = EmissionRecord.ActivityType.GROUND_TRANSPORT

            return {
                "facility": employee if employee else (route if route else f"{origin}-{destination}"),
                "activity_type_name": transport_mode if transport_mode else "Flight",
                "quantity": quantity_val,
                "normalized_unit": unit,
                "activity_date": date_val,
                "scope": scope,
                "activity_type": activity_type,
                "source_type": "TRAVEL",
                "is_date_derived": is_date_derived,
                "is_partial_route": is_partial_route,
                
                # Travel Schema Fields
                "route": route,
                "origin": origin,
                "destination": destination,
                "booking_origin": booking_origin,
                "transport_mode": transport_mode,
                "trip_type": trip_type,
                "travel_class": travel_class,
                "sales_channel": sales_channel,
                "passenger_count": passenger_count,
                "purchase_lead_days": purchase_lead_days,
                "stay_length": stay_length,
                "flight_day": flight_day,
                "flight_hour": flight_hour,
                "booking_complete": booking_complete,
                
                "raw_payload": raw_row
            }
        else:
            raise ValueError(f"Unsupported source type for schema normalization: {source_type}")
