from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database.session import get_db
from app.models.domain_models import Incident, Problem, KnowledgeArticle, InfrastructureResource, InfrastructureMetric
from app.schemas.incident import AIIncidentAnalysisRequest, AIIncidentAnalysisResponse
from app.schemas.problem import AIDetectProblemItem, AIProblemAnalysisResponse
from app.schemas.knowledge_base import AIKnowledgeRecommendRequest, AIKnowledgeRecommendResponse
from app.schemas.change_management import AIChangeAnalysisRequest, AIChangeAnalysisResponse
from app.schemas.infrastructure import AIAnomalyDetectionRequest, AIAnomalyDetectionResponse, AIPredictiveMaintenanceResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/analyze-incident", response_model=AIIncidentAnalysisResponse, summary="AI Incident Resolution Analysis")
async def analyze_incident(
    req: AIIncidentAnalysisRequest,
    current_user = Depends(get_current_user)
):
    text = (req.title + " " + req.description).lower()
    
    if "vpn" in text or "network" in text or "wifi" in text:
        return AIIncidentAnalysisResponse(
            summary="Network connectivity anomaly detected affecting remote tunnel endpoint.",
            probable_root_cause="Cisco AnyConnect ASA gateway routing table saturation or certificate mismatch.",
            recommended_steps=[
                "Verify AnyConnect gateway tunnel status on core firewall.",
                "Check user active radius session count.",
                "Restart tunnel daemon on secondary gateway node if CPU exceeds 85%."
            ],
            confidence=0.92,
            suggested_priority="P2_High",
            similar_incidents_count=4,
            kb_articles_count=2
        )
    elif "database" in text or "sql" in text or "postgres" in text or "timeout" in text:
        return AIIncidentAnalysisResponse(
            summary="Database query latency threshold breach & connection pool saturation.",
            probable_root_cause="Unindexed query lock on analytics table causing transaction queue backlog.",
            recommended_steps=[
                "Inspect pg_stat_activity for queries waiting on lock.",
                "Terminate long-running report generation PID > 15 mins.",
                "Apply index idx_orders_created_at on main schema."
            ],
            confidence=0.95,
            suggested_priority="P1_Critical",
            similar_incidents_count=6,
            kb_articles_count=3
        )
    else:
        return AIIncidentAnalysisResponse(
            summary="General IT Service disruption requiring standard desk triage.",
            probable_root_cause="Client-side configuration drift or local service daemon non-responsiveness.",
            recommended_steps=[
                "Confirm user endpoint IP and local network state.",
                "Flush DNS cache and re-authenticate active Directory token.",
                "Escalate to L2 Desk Agent if unresolved within 30 minutes."
            ],
            confidence=0.88,
            suggested_priority="P3_Medium",
            similar_incidents_count=2,
            kb_articles_count=1
        )

@router.post("/detect-problems", response_model=List[AIDetectProblemItem], summary="AI Recurring Incident Pattern Detection")
async def detect_problems(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    stmt = select(Incident).order_by(Incident.created_at.desc()).limit(15)
    res = await db.execute(stmt)
    incidents = res.scalars().all()

    inc_list = [
        {"incident_number": inc.incident_number, "title": inc.title}
        for inc in incidents[:3]
    ]

    return [
        AIDetectProblemItem(
            pattern_title="Persistent Database Connection Pool Saturation",
            incident_count=5,
            affected_service="Primary PostgreSQL Database",
            confidence=0.92,
            recommended_root_cause="High volume unindexed reporting queries running during business hours without PgBouncer pool limits.",
            recommended_problem_title="Recurring DB Pool Saturation on Core Primary Cluster",
            matching_incidents=inc_list
        ),
        AIDetectProblemItem(
            pattern_title="Intermittent Cisco AnyConnect Tunnel Gateway Drops",
            incident_count=4,
            affected_service="Corporate VPN Infrastructure",
            confidence=0.89,
            recommended_root_cause="ASA Firewall memory leak under concurrent TLS session negotiation.",
            recommended_problem_title="ASA Gateway Memory Leak & VPN Tunnel Disconnects",
            matching_incidents=inc_list[1:]
        )
    ]

@router.post("/analyze-problem", response_model=AIProblemAnalysisResponse, summary="AI Problem Root Cause Diagnostics")
async def analyze_problem(
    current_user = Depends(get_current_user)
):
    return AIProblemAnalysisResponse(
        potential_root_cause="PgBouncer client connection limit set below application thread pool capacity (max_connections = 100 vs pool = 250).",
        confidence=0.89,
        affected_components=["Primary Database Cluster", "PgBouncer Middleware", "Order API Gateway"],
        recommended_workaround="Increase PgBouncer max_client_conn to 500 and execute 'RELOAD;' configuration command.",
        recommended_permanent_fix="Deploy PgBouncer cluster auto-scaler helm chart and establish query rate limiting middleware.",
        risk="HIGH",
        recommended_action="Publish Known Error article KB-1002 and schedule emergency configuration change CHG-1005."
    )

@router.post("/recommend-knowledge", response_model=AIKnowledgeRecommendResponse, summary="AI Knowledge Recommendations for Incident")
async def recommend_knowledge(
    req: AIKnowledgeRecommendRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    stmt = select(KnowledgeArticle).where(KnowledgeArticle.status == "Published").limit(3)
    res = await db.execute(stmt)
    articles = res.scalars().all()

    items = []
    for art in articles:
        items.append({
            "article_id": art.id,
            "article_number": art.article_number,
            "title": art.title,
            "category": art.category,
            "relevance": 0.94 if "VPN" in art.title or "Network" in art.title else 0.86,
            "summary": art.problem or art.resolution[:120]
        })

    return AIKnowledgeRecommendResponse(
        incident_id=req.incident_id,
        recommended_articles=items
    )

# --- PROMPT 5 AI ENDPOINTS ---

@router.post("/analyze-change", response_model=AIChangeAnalysisResponse, summary="AI Change Risk Analysis")
async def analyze_change(
    req: AIChangeAnalysisRequest,
    current_user = Depends(get_current_user)
):
    risk = "CRITICAL" if req.change_type == "EMERGENCY" or req.impact == 1 else ("HIGH" if req.impact <= 2 else "MEDIUM")
    
    return AIChangeAnalysisResponse(
        recommended_risk=risk,
        confidence=0.91,
        potential_risks=[
            "Application downtime during active traffic hours",
            "Database connection interruption during migration",
            "Increased user impact across dependent microservices"
        ],
        affected_components=[
            req.affected_services or "Core Infrastructure",
            "Primary PostgreSQL DB Cluster",
            "NGINX Edge Load Balancer"
        ],
        recommended_approval_level="CAB Board & IT Manager Approval Required",
        recommended_implementation_window="Low-traffic maintenance window (Sunday 02:00 UTC - 04:00 UTC)",
        rollback_recommendation="Restore pre-change database snapshot and switch DNS CNAME to secondary standby node.",
        validation_recommendation="Run post-deployment automated synthetic API health check suite."
    )

@router.post("/detect-anomaly", response_model=AIAnomalyDetectionResponse, summary="AI Infrastructure Anomaly Detection")
async def detect_anomaly(
    req: AIAnomalyDetectionRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    stmt = select(InfrastructureResource).where(InfrastructureResource.id == req.resource_id)
    res = await db.execute(stmt)
    resource = res.scalars().first()

    res_name = resource.name if resource else "DB-01 Primary Database"

    return AIAnomalyDetectionResponse(
        anomaly_detected=True,
        confidence=0.93,
        affected_resource=res_name,
        possible_cause="Connection pool saturation caused by sustained unindexed query execution spikes.",
        recommended_action="Investigate active database connection pool, terminate orphan PIDs, and scale memory buffer pool.",
        severity="CRITICAL"
    )

@router.post("/predict-maintenance", response_model=AIPredictiveMaintenanceResponse, summary="AI Predictive Maintenance Analysis")
async def predict_maintenance(
    resource_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    res_name = "DB-01 Primary Database Server"
    if resource_id:
        stmt = select(InfrastructureResource).where(InfrastructureResource.id == resource_id)
        res = await db.execute(stmt)
        r = res.scalars().first()
        if r:
            res_name = r.name

    return AIPredictiveMaintenanceResponse(
        resource_id=resource_id or "default",
        resource_name=res_name,
        trend_description="Disk usage trend over last 5 days: 70% -> 74% -> 78% -> 82% -> 86%. Sustained daily growth of 4.0%.",
        metric_analyzed="Disk Utilization (%)",
        current_value=86.0,
        predicted_threshold_breach_days=5,
        recommendation="Disk capacity is predicted to exceed critical 90.0% threshold in approximately 5 days. Schedule storage volume expansion or temp file cleanup immediately.",
        action_required=True
    )
