from pydantic import BaseModel
from datetime import datetime

class HealthCheckSchema(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    timestamp: datetime
    database_status: str

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "service": "AI-Powered ITSM Platform API",
                "version": "1.0.0",
                "environment": "development",
                "timestamp": "2026-09-02T09:00:00.000000",
                "database_status": "connected"
            }
        }
