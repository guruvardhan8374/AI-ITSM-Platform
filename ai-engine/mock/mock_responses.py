import random

MOCK_INCIDENT_ANALYSIS = {
    "priority_recommendation": "P1_Critical",
    "confidence_score": 0.94,
    "category": "Database Infrastructure",
    "summary": "AI detected database connection pool exhaustion resulting from an unindexed query in recent release v2.4.1.",
    "root_cause_probability": [
        {"cause": "Connection Pool Exhaustion", "probability": 0.88},
        {"cause": "Network Latency Spikes", "probability": 0.08},
        {"cause": "Hardware Disk Failure", "probability": 0.04}
    ],
    "suggested_actions": [
        "Increase PostgreSQL max_connections setting temporarily",
        "Kill stale idle backend queries on db_primary node",
        "Deploy emergency hotfix adding index on `user_id` column in `audit_logs`"
    ]
}

MOCK_RESOLUTION_ASSISTANCE = {
    "recommended_kb_articles": [
        {"id": "kb-102", "title": "Resolving PostgreSQL Connection Pool Saturation", "relevance": "96%"},
        {"id": "kb-405", "title": "Emergency Index Creation Guide", "relevance": "89%"}
    ],
    "automated_script_suggestion": "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction';",
    "estimated_resolution_time_minutes": 15
}
