from datetime import datetime, timezone
import math
from app.config.settings import settings

def calculate_amount(entry_time, exit_time):
    rate = settings.PARKING_RATE_PER_HOUR
    
    # Ensure both are timezone aware for subtraction
    if entry_time.tzinfo is None:
        entry_time = entry_time.replace(tzinfo=timezone.utc)
    if exit_time.tzinfo is None:
        exit_time = exit_time.replace(tzinfo=timezone.utc)
        
    diff_ms = (exit_time - entry_time).total_seconds() * 1000
    diff_minutes = diff_ms / (1000 * 60)
    hours = max(1, math.ceil(diff_minutes / 60))
    return round(float(hours * rate), 2)
