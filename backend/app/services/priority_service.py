from app.models.domain_models import PriorityEnum

def calculate_recommended_priority(impact: int, urgency: int) -> PriorityEnum:
    """
    Calculates ITSM priority matrix based on Impact (1-3) and Urgency (1-3).
    Impact: 1=Low, 2=Medium, 3=High
    Urgency: 1=Low, 2=Medium, 3=High
    """
    score = impact + urgency

    if score == 6:  # High (3) + High (3)
        return PriorityEnum.CRITICAL
    elif score == 5:  # High (3) + Med (2) OR Med (2) + High (3)
        return PriorityEnum.HIGH
    elif score == 4:  # Med (2) + Med (2) OR High (3) + Low (1) OR Low (1) + High (3)
        return PriorityEnum.MEDIUM
    elif score == 3:  # Med (2) + Low (1) OR Low (1) + Med (2)
        return PriorityEnum.MEDIUM
    else:  # Low (1) + Low (1)
        return PriorityEnum.LOW
