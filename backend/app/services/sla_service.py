from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.models.domain_models import PriorityEnum, StatusEnum

# SLA Resolution Target Durations (in Minutes)
SLA_TARGETS_MINUTES = {
    PriorityEnum.CRITICAL: 60,     # 1 hour
    PriorityEnum.HIGH: 240,       # 4 hours
    PriorityEnum.MEDIUM: 480,     # 8 hours
    PriorityEnum.LOW: 1440,       # 24 hours
}

def calculate_sla_due_time(priority: PriorityEnum, start_time: Optional[datetime] = None) -> datetime:
    if not start_time:
        start_time = datetime.utcnow()
    minutes = SLA_TARGETS_MINUTES.get(priority, 480)
    return start_time + timedelta(minutes=minutes)

def get_sla_status(sla_due_at: Optional[datetime], current_status: StatusEnum) -> Dict[str, Any]:
    if current_status in [StatusEnum.RESOLVED, StatusEnum.CLOSED]:
        return {
            "status": "Resolved",
            "is_breached": False,
            "remaining_seconds": 0,
            "badge_color": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        }

    if not sla_due_at:
        return {
            "status": "Within SLA",
            "is_breached": False,
            "remaining_seconds": 3600,
            "badge_color": "bg-slate-800 text-slate-300 border-slate-700"
        }

    now = datetime.utcnow()
    remaining = (sla_due_at - now).total_seconds()

    if remaining <= 0:
        return {
            "status": "Breached",
            "is_breached": True,
            "remaining_seconds": 0,
            "badge_color": "bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold animate-pulse"
        }
    elif remaining <= 1800:  # 30 minutes or less
        return {
            "status": "At Risk",
            "is_breached": False,
            "remaining_seconds": int(remaining),
            "badge_color": "bg-amber-500/20 text-amber-400 border-amber-500/30"
        }
    else:
        return {
            "status": "Within SLA",
            "is_breached": False,
            "remaining_seconds": int(remaining),
            "badge_color": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        }
