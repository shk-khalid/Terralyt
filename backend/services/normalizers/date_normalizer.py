from datetime import datetime

def normalize_date(date_str):
    """
    Parses various date formats and returns a python datetime.date object.
    Supported formats:
    - 01.03.2026 (DD.MM.YYYY)
    - 2026/03/01 (YYYY/MM/DD)
    - 1 Mar 2026 (D MMM YYYY)
    - YYYY-MM-DD (ISO standard fallback)
    """
    if not date_str:
        return None
    
    clean_date = date_str.strip()
    
    formats = [
        "%d.%m.%Y",  # 01.03.2026 (DD.MM.YYYY)
        "%Y/%m/%d",  # 2026/03/01 (YYYY/MM/DD)
        "%d %b %Y",  # 1 Mar 2026 (D MMM YYYY)
        "%Y-%m-%d",  # 2026-03-01 (YYYY-MM-DD)
        "%d-%m-%Y",  # 01-03-2026 (DD-MM-YYYY)
        "%Y.%m.%d",  # 2026.03.01 (YYYY.MM.DD)
        "%B %d %Y",  # March 01 2026 (Month DD YYYY - full month name)
        "%b %d %Y",  # Mar 01 2026 (Month DD YYYY - abbreviated month name)
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(clean_date, fmt)
            return dt.date()
        except ValueError:
            continue
            
    return None
