def normalize_unit(unit_str):
    """
    Normalizes variations of unit strings to a standard form.
    Specifically: 'L', 'ltr', 'Litres', 'liter', 'liters' -> 'liters'
    """
    if not unit_str:
        return ""
    
    clean_unit = unit_str.strip().lower()
    if clean_unit in ["l", "ltr", "litres", "liter", "liters"]:
        return "liters"
        
    return clean_unit
