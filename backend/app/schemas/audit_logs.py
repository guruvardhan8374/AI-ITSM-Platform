from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditLogUserBasic(BaseModel):
  id: str
  full_name: str
  email: str

class AuditLogSchema(BaseModel):
  id: str
  action: str
  module: str
  entity_id: Optional[str] = None
  ip_address: Optional[str] = None
  details: Optional[str] = None
  timestamp: datetime
  user: Optional[AuditLogUserBasic] = None

  class Config:
    from_attributes = True
