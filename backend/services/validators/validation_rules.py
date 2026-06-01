from datetime import date
from decimal import Decimal, InvalidOperation
from emissions.models import EmissionRecord

KNOWN_UNITS = {"liters", "kwh", "m3", "km", "miles", "nights", "days", "hours"}

def validate_record(common_record, norm_qty, norm_unit, norm_date):
    """
    Validates standard fields in the common record and their normalized representations.
    The validator only works against standard fields, not raw CSV field names.
    Includes travel-specific and utility-specific validation constraints.
    """
    reasons = []

    raw_qty = common_record.get("quantity")
    raw_unit = common_record.get("normalized_unit")
    raw_date = common_record.get("activity_date")
    source_type = common_record.get("source_type", "")

    # 1. Validate Date
    if not raw_date:
        if source_type not in ["TRAVEL", "UTILITY"]:
            reasons.append("Missing date field")
    elif common_record.get("is_date_derived"):
        # Date was derived during normalization, do not treat as an anomaly
        pass
    elif norm_date is None:
        reasons.append(f"Invalid or unparseable date format: '{raw_date}'")
    else:
        if norm_date > date.today():
            reasons.append(f"Future activity date: {norm_date}")
        elif norm_date < date(2000, 1, 1):
            reasons.append(f"Absurdly old activity date: {norm_date}")

    # Helper to parse decimal values
    def parse_decimal(val):
        if not val:
            return None
        try:
            return Decimal(str(val))
        except (ValueError, InvalidOperation):
            return None

    # 2. Validate Quantity / Duration / Energy Sales (source-specific validations)
    if source_type == "TRAVEL":
        if not raw_qty:
            reasons.append("Missing quantity")
        elif norm_qty is None:
            reasons.append(f"Invalid duration: '{raw_qty}'")
        else:
            if norm_qty < 0:
                reasons.append(f"Negative duration: {norm_qty}")
            elif norm_qty == 0:
                reasons.append("Zero duration")
            elif norm_qty > 1000:
                reasons.append(f"Absurd duration value: {norm_qty}")
                
    elif source_type == "UTILITY":
        # check missing Retail.Total.Sales
        if not raw_qty:
            reasons.append("Missing Retail.Total.Sales")
        elif norm_qty is None:
            reasons.append(f"Invalid Retail.Total.Sales: '{raw_qty}'")
        else:
            # check negative energy values (Sales)
            if norm_qty < 0:
                reasons.append("Negative energy values")
            # check absurdly high sales/generation values
            elif norm_qty > 10000000000:
                reasons.append("Absurdly high sales/generation values")
                
    else:
        if not raw_qty:
            reasons.append("Missing quantity field")
        elif norm_qty is None:
            reasons.append(f"Invalid non-numeric quantity: '{raw_qty}'")
        else:
            if norm_qty < 0:
                reasons.append(f"Negative quantity: {norm_qty}")
            elif norm_qty == 0:
                reasons.append("Zero quantity")
            elif norm_qty > 1000000:
                reasons.append(f"Absurdly high quantity: {norm_qty}")

    # 3. Validate Unit
    if not raw_unit:
        reasons.append("Missing unit field")
    elif not norm_unit or norm_unit.lower() not in KNOWN_UNITS:
        reasons.append(f"Unknown or unmapped unit: '{raw_unit}'")

    # 4. Travel-specific validation: Route / Location / Airport codes
    if source_type == "TRAVEL":
        origin = common_record.get("origin", "")
        destination = common_record.get("destination", "")
        route = common_record.get("route", "")

        has_route_airport_codes = False
        if route:
            parts = []
            if "-" in route:
                parts = route.split("-")
            elif "/" in route:
                parts = route.split("/")
            if len(parts) == 2:
                p1 = parts[0].strip()
                p2 = parts[1].strip()
                if len(p1) == 3 and p1.isalpha() and len(p2) == 3 and p2.isalpha():
                    has_route_airport_codes = True
        
        has_direct_airport_codes = False
        if len(origin) == 3 and origin.isalpha() and len(destination) == 3 and destination.isalpha():
            has_direct_airport_codes = True

        # Validate missing or invalid origin/destination
        if common_record.get("is_partial_route"):
            reasons.append("Destination airport missing")
        elif not origin and not destination and not route:
            reasons.append("Missing origin/destination")
        elif not (has_direct_airport_codes or has_route_airport_codes):
            reasons.append("Missing or invalid origin/destination airport codes")

    # 5. Utility-specific validation: Provider Name, Energy metrics, and Revenues
    if source_type == "UTILITY":
        # check missing utility/provider name
        if not common_record.get("facility"):
            reasons.append("Missing utility/provider name")
            
        # check negative energy values (Usage, Generation, Losses)
        usage_dec = parse_decimal(common_record.get("total_usage"))
        gen_dec = parse_decimal(common_record.get("total_generation"))
        losses_dec = parse_decimal(common_record.get("transmission_losses"))
        
        energy_neg = False
        if usage_dec is not None and usage_dec < 0:
            energy_neg = True
        if gen_dec is not None and gen_dec < 0:
            energy_neg = True
        if losses_dec is not None and losses_dec < 0:
            energy_neg = True
            
        # Add to reasons if not already appended by Sales validation
        if energy_neg and "Negative energy values" not in reasons:
            reasons.append("Negative energy values")
            
        # check absurdly high sales/generation values (Generation)
        if gen_dec is not None and gen_dec > 10000000000 and "Absurdly high sales/generation values" not in reasons:
            reasons.append("Absurdly high sales/generation values")
            
        # check negative revenue values
        retail_rev_dec = parse_decimal(common_record.get("retail_revenue"))
        total_rev_dec = parse_decimal(common_record.get("total_revenue"))
        
        if (retail_rev_dec is not None and retail_rev_dec < 0) or (total_rev_dec is not None and total_rev_dec < 0):
            reasons.append("Negative revenue values")

    if reasons:
        return True, "; ".join(reasons)
    
    return False, None
