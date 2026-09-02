import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Boolean, Float, Table, Column, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

# Many-to-Many Link Table for Roles & Permissions
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", String, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", String, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)

# Many-to-Many Link Table for Users & Teams
user_teams = Table(
    "user_teams",
    Base.metadata,
    Column("user_id", String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("team_id", String, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True),
)

# Many-to-Many Link Table for Problems & Incidents
problem_incidents = Table(
    "problem_incidents",
    Base.metadata,
    Column("problem_id", String, ForeignKey("problems.id", ondelete="CASCADE"), primary_key=True),
    Column("incident_id", String, ForeignKey("incidents.id", ondelete="CASCADE"), primary_key=True),
)

# Many-to-Many Link Table for Changes & Incidents
change_incidents = Table(
    "change_incidents",
    Base.metadata,
    Column("change_id", String, ForeignKey("change_requests.id", ondelete="CASCADE"), primary_key=True),
    Column("incident_id", String, ForeignKey("incidents.id", ondelete="CASCADE"), primary_key=True),
)

# Many-to-Many Link Table for Changes & Assets
change_assets = Table(
    "change_assets",
    Base.metadata,
    Column("change_id", String, ForeignKey("change_requests.id", ondelete="CASCADE"), primary_key=True),
    Column("asset_id", String, ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True),
)

class PriorityEnum(str, enum.Enum):
    LOW = "P4_Low"
    MEDIUM = "P3_Medium"
    HIGH = "P2_High"
    CRITICAL = "P1_Critical"

class StatusEnum(str, enum.Enum):
    NEW = "New"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    PENDING = "Pending"
    RESOLVED = "Resolved"
    CLOSED = "Closed"
    REOPENED = "Reopened"

class RequestStatusEnum(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED"
    APPROVED = "APPROVED"
    FULFILLMENT = "FULFILLMENT"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class ProblemStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    INVESTIGATION = "INVESTIGATION"
    ROOT_CAUSE_IDENTIFIED = "ROOT_CAUSE_IDENTIFIED"
    KNOWN_ERROR = "KNOWN_ERROR"
    FIX_IN_PROGRESS = "FIX_IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class ChangeTypeEnum(str, enum.Enum):
    STANDARD = "STANDARD"
    NORMAL = "NORMAL"
    EMERGENCY = "EMERGENCY"

class ChangeStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    RISK_ASSESSMENT = "RISK_ASSESSMENT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    SCHEDULED = "SCHEDULED"
    IMPLEMENTATION = "IMPLEMENTATION"
    VALIDATION = "VALIDATION"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    ROLLED_BACK = "ROLLED_BACK"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)

    users: Mapped[List["User"]] = relationship("User", back_populates="role")
    permissions: Mapped[List["Permission"]] = relationship("Permission", secondary=role_permissions, back_populates="roles")

class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    module: Mapped[str] = mapped_column(String(50), nullable=False)

    roles: Mapped[List["Role"]] = relationship("Role", secondary=role_permissions, back_populates="permissions")

class BusinessUnit(Base):
    __tablename__ = "business_units"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)

    departments: Mapped[List["Department"]] = relationship("Department", back_populates="business_unit")

class Department(Base):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    business_unit_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("business_units.id"))

    business_unit: Mapped[Optional["BusinessUnit"]] = relationship("BusinessUnit", back_populates="departments")
    users: Mapped[List["User"]] = relationship("User", back_populates="department")
    teams: Mapped[List["Team"]] = relationship("Team", back_populates="department")

class Team(Base):
    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    department_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("departments.id"))

    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="teams")
    members: Mapped[List["User"]] = relationship("User", secondary=user_teams, back_populates="teams")
    incidents: Mapped[List["Incident"]] = relationship("Incident", back_populates="assigned_team")

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))

    role_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("roles.id"))
    department_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("departments.id"))
    business_unit_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("business_units.id"))

    role: Mapped[Optional["Role"]] = relationship("Role", back_populates="users", lazy="joined")
    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="users", lazy="joined")
    teams: Mapped[List["Team"]] = relationship("Team", secondary=user_teams, back_populates="members")
    
    created_incidents: Mapped[List["Incident"]] = relationship("Incident", foreign_keys="[Incident.reporter_id]", back_populates="reporter")
    assigned_incidents: Mapped[List["Incident"]] = relationship("Incident", foreign_keys="[Incident.assigned_agent_id]", back_populates="assignee")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime)

class SLAPolicy(Base):
    __tablename__ = "sla_policies"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    priority: Mapped[PriorityEnum] = mapped_column(SQLEnum(PriorityEnum))
    response_time_minutes: Mapped[int] = mapped_column(Integer)
    resolution_time_minutes: Mapped[int] = mapped_column(Integer)

class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    asset_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    asset_name: Mapped[str] = mapped_column(String(100), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(50), nullable=False)
    serial_number: Mapped[Optional[str]] = mapped_column(String(100))
    hostname: Mapped[Optional[str]] = mapped_column(String(100))
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    
    owner_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"))
    department_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("departments.id"))
    business_unit_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("business_units.id"))
    team_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("teams.id"))
    
    location: Mapped[Optional[str]] = mapped_column(String(100), default="Primary Datacenter - Rack A4")
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE") # ACTIVE, INACTIVE, IN_MAINTENANCE, RETIRED, DISPOSED
    health: Mapped[str] = mapped_column(String(30), default="HEALTHY") # HEALTHY, WARNING, CRITICAL, OFFLINE
    criticality: Mapped[str] = mapped_column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    
    manufacturer: Mapped[Optional[str]] = mapped_column(String(100), default="Dell Enterprise")
    model: Mapped[Optional[str]] = mapped_column(String(100), default="PowerEdge R750")
    purchase_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    warranty_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime)
    last_maintenance: Mapped[Optional[datetime]] = mapped_column(DateTime)
    description: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: Mapped[Optional["User"]] = relationship("User", foreign_keys=[owner_id], lazy="joined")
    department: Mapped[Optional["Department"]] = relationship("Department", lazy="joined")
    incidents: Mapped[List["Incident"]] = relationship("Incident", back_populates="affected_asset")
    changes: Mapped[List["ChangeRequest"]] = relationship("ChangeRequest", secondary=change_assets, back_populates="affected_assets_list")
    maintenances: Mapped[List["AssetMaintenance"]] = relationship("AssetMaintenance", back_populates="asset", cascade="all, delete-orphan")
    history: Mapped[List["AssetHistory"]] = relationship("AssetHistory", back_populates="asset", cascade="all, delete-orphan")

class AssetMaintenance(Base):
    __tablename__ = "asset_maintenance"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    asset_id: Mapped[str] = mapped_column(String, ForeignKey("assets.id", ondelete="CASCADE"))
    maintenance_number: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    performed_by_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"))
    maintenance_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    result: Mapped[str] = mapped_column(String(50), default="SUCCESS")
    next_maintenance_date: Mapped[Optional[datetime]] = mapped_column(DateTime)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="maintenances")
    performed_by: Mapped[Optional["User"]] = relationship("User", lazy="joined")

class AssetHistory(Base):
    __tablename__ = "asset_history"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    asset_id: Mapped[str] = mapped_column(String, ForeignKey("assets.id", ondelete="CASCADE"))
    changed_by_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"))
    field_changed: Mapped[str] = mapped_column(String(50))
    old_value: Mapped[Optional[str]] = mapped_column(Text)
    new_value: Mapped[Optional[str]] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="history")
    changed_by: Mapped[Optional["User"]] = relationship("User", lazy="joined")

class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    incident_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="General IT")
    subcategory: Mapped[Optional[str]] = mapped_column(String(100))
    
    priority: Mapped[PriorityEnum] = mapped_column(SQLEnum(PriorityEnum), default=PriorityEnum.MEDIUM)
    impact: Mapped[int] = mapped_column(Integer, default=2)
    urgency: Mapped[int] = mapped_column(Integer, default=2)
    status: Mapped[StatusEnum] = mapped_column(SQLEnum(StatusEnum), default=StatusEnum.NEW)
    source: Mapped[str] = mapped_column(String(50), default="Web Portal")

    reporter_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    assigned_team_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("teams.id"))
    assigned_agent_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"))
    department_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("departments.id"))
    business_unit_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("business_units.id"))

    affected_service: Mapped[Optional[str]] = mapped_column(String(100), default="Core Infrastructure")
    affected_asset_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("assets.id"))
    sla_policy_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("sla_policies.id"))

    sla_due_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    first_response_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text)

    reporter: Mapped["User"] = relationship("User", foreign_keys=[reporter_id], back_populates="created_incidents", lazy="joined")
    assignee: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_agent_id], back_populates="assigned_incidents", lazy="joined")
    assigned_team: Mapped[Optional["Team"]] = relationship("Team", back_populates="incidents", lazy="joined")
    affected_asset: Mapped[Optional["Asset"]] = relationship("Asset", back_populates="incidents", lazy="joined")
    sla_policy: Mapped[Optional["SLAPolicy"]] = relationship("SLAPolicy", lazy="joined")

    comments: Mapped[List["IncidentComment"]] = relationship("IncidentComment", back_populates="incident", cascade="all, delete-orphan")
    history: Mapped[List["IncidentHistory"]] = relationship("IncidentHistory", back_populates="incident", cascade="all, delete-orphan")
    problems: Mapped[List["Problem"]] = relationship("Problem", secondary=problem_incidents, back_populates="incidents")
    changes: Mapped[List["ChangeRequest"]] = relationship("ChangeRequest", secondary=change_incidents, back_populates="incidents")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class IncidentComment(Base):
    __tablename__ = "incident_comments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    incident_id: Mapped[str] = mapped_column(String, ForeignKey("incidents.id", ondelete="CASCADE"))
    author_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    incident: Mapped["Incident"] = relationship("Incident", back_populates="comments")
    author: Mapped["User"] = relationship("User", lazy="joined")

class IncidentHistory(Base):
    __tablename__ = "incident_history"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    incident_id: Mapped[str] = mapped_column(String, ForeignKey("incidents.id", ondelete="CASCADE"))
    changed_by_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    field_changed: Mapped[str] = mapped_column(String(50))
    old_value: Mapped[Optional[str]] = mapped_column(Text)
    new_value: Mapped[Optional[str]] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    incident: Mapped["Incident"] = relationship("Incident", back_populates="history")
    changed_by: Mapped["User"] = relationship("User", lazy="joined")

# --- SERVICE REQUEST MANAGEMENT MODELS ---

class ServiceCatalog(Base):
    __tablename__ = "service_catalog"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(Text)
    fulfillment_time_hours: Mapped[int] = mapped_column(Integer, default=4)
    approval_required: Mapped[bool] = mapped_column(Boolean, default=True)
    assigned_team_name: Mapped[str] = mapped_column(String(100), default="Service Desk")
    icon: Mapped[str] = mapped_column(String(50), default="Laptop")
    status: Mapped[str] = mapped_column(String(30), default="Active")

class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    request_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    service_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("service_catalog.id"))
    requested_by_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    department_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("departments.id"))
    business_unit_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("business_units.id"))
    assigned_team_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("teams.id"))
    assigned_agent_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"))

    priority: Mapped[PriorityEnum] = mapped_column(SQLEnum(PriorityEnum), default=PriorityEnum.MEDIUM)
    status: Mapped[RequestStatusEnum] = mapped_column(SQLEnum(RequestStatusEnum), default=RequestStatusEnum.REQUESTED)
    approval_status: Mapped[str] = mapped_column(String(30), default="PENDING")
    approver_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"))
    approval_decision_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    approval_comments: Mapped[Optional[str]] = mapped_column(Text)
    additional_info: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    service: Mapped[Optional["ServiceCatalog"]] = relationship("ServiceCatalog", lazy="joined")
    requester: Mapped["User"] = relationship("User", foreign_keys=[requested_by_id], lazy="joined")
    approver: Mapped[Optional["User"]] = relationship("User", foreign_keys=[approver_id], lazy="joined")
    assigned_team: Mapped[Optional["Team"]] = relationship("Team", lazy="joined")
    assignee: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_agent_id], lazy="joined")
    history: Mapped[List["ServiceRequestHistory"]] = relationship("ServiceRequestHistory", back_populates="request", cascade="all, delete-orphan")

class ServiceRequestHistory(Base):
    __tablename__ = "service_request_history"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    request_id: Mapped[str] = mapped_column(String, ForeignKey("service_requests.id", ondelete="CASCADE"))
    changed_by_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    field_changed: Mapped[str] = mapped_column(String(50))
    old_value: Mapped[Optional[str]] = mapped_column(Text)
    new_value: Mapped[Optional[str]] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    request: Mapped["ServiceRequest"] = relationship("ServiceRequest", back_populates="history")
    changed_by: Mapped["User"] = relationship("User", lazy="joined")

# --- PROBLEM MANAGEMENT MODELS ---

class Problem(Base):
    __tablename__ = "problems"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    problem_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ProblemStatusEnum] = mapped_column(SQLEnum(ProblemStatusEnum), default=ProblemStatusEnum.OPEN)
    priority: Mapped[PriorityEnum] = mapped_column(SQLEnum(PriorityEnum), default=PriorityEnum.HIGH)

    root_cause: Mapped[Optional[str]] = mapped_column(Text)
    symptoms: Mapped[Optional[str]] = mapped_column(Text)
    workaround: Mapped[Optional[str]] = mapped_column(Text)
    permanent_fix: Mapped[Optional[str]] = mapped_column(Text)
    known_error: Mapped[bool] = mapped_column(Boolean, default=False)

    assigned_team_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("teams.id"))
    assigned_agent_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"))
    affected_service: Mapped[Optional[str]] = mapped_column(String(100), default="Database Services")
    affected_asset_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("assets.id"))
    created_by_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    created_by: Mapped["User"] = relationship("User", foreign_keys=[created_by_id], lazy="joined")
    assigned_team: Mapped[Optional["Team"]] = relationship("Team", lazy="joined")
    assignee: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_agent_id], lazy="joined")
    affected_asset: Mapped[Optional["Asset"]] = relationship("Asset", lazy="joined")
    incidents: Mapped[List["Incident"]] = relationship("Incident", secondary=problem_incidents, back_populates="problems", lazy="selectin")
    history: Mapped[List["ProblemHistory"]] = relationship("ProblemHistory", back_populates="problem", cascade="all, delete-orphan")

class ProblemHistory(Base):
    __tablename__ = "problem_history"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    problem_id: Mapped[str] = mapped_column(String, ForeignKey("problems.id", ondelete="CASCADE"))
    changed_by_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    field_changed: Mapped[str] = mapped_column(String(50))
    old_value: Mapped[Optional[str]] = mapped_column(Text)
    new_value: Mapped[Optional[str]] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    problem: Mapped["Problem"] = relationship("Problem", back_populates="history")
    changed_by: Mapped["User"] = relationship("User", lazy="joined")

# --- KNOWLEDGE BASE MODELS ---

class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    article_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    
    problem: Mapped[Optional[str]] = mapped_column(Text)
    symptoms: Mapped[Optional[str]] = mapped_column(Text)
    root_cause: Mapped[Optional[str]] = mapped_column(Text)
    resolution: Mapped[str] = mapped_column(Text, nullable=False)
    workaround: Mapped[Optional[str]] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[Optional[str]] = mapped_column(String(255))
    
    author_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(30), default="Published")
    views: Mapped[int] = mapped_column(Integer, default=0)
    helpful_count: Mapped[int] = mapped_column(Integer, default=0)
    not_helpful_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    author: Mapped["User"] = relationship("User", lazy="joined")

# --- CHANGE MANAGEMENT MODELS ---

class ChangeRequest(Base):
    __tablename__ = "change_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    change_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    
    change_type: Mapped[ChangeTypeEnum] = mapped_column(SQLEnum(ChangeTypeEnum), default=ChangeTypeEnum.NORMAL)
    risk_level: Mapped[str] = mapped_column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    impact: Mapped[int] = mapped_column(Integer, default=2)
    urgency: Mapped[int] = mapped_column(Integer, default=2)
    
    affected_services: Mapped[Optional[str]] = mapped_column(String(255), default="Core Infrastructure")
    requested_by_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    assigned_team_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("teams.id"))
    assigned_engineer_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"))

    implementation_plan: Mapped[str] = mapped_column(Text, nullable=False)
    rollback_plan: Mapped[str] = mapped_column(Text, nullable=False)
    validation_plan: Mapped[Optional[str]] = mapped_column(Text)

    scheduled_start: Mapped[Optional[datetime]] = mapped_column(DateTime)
    scheduled_end: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    approval_status: Mapped[str] = mapped_column(String(30), default="PENDING") # PENDING, APPROVED, REJECTED
    approver_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"))
    approval_decision_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    approval_comments: Mapped[Optional[str]] = mapped_column(Text)

    status: Mapped[ChangeStatusEnum] = mapped_column(SQLEnum(ChangeStatusEnum), default=ChangeStatusEnum.DRAFT)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    requester: Mapped["User"] = relationship("User", foreign_keys=[requested_by_id], lazy="joined")
    assigned_team: Mapped[Optional["Team"]] = relationship("Team", lazy="joined")
    engineer: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_engineer_id], lazy="joined")
    approver: Mapped[Optional["User"]] = relationship("User", foreign_keys=[approver_id], lazy="joined")

    incidents: Mapped[List["Incident"]] = relationship("Incident", secondary=change_incidents, back_populates="changes", lazy="selectin")
    affected_assets_list: Mapped[List["Asset"]] = relationship("Asset", secondary=change_assets, back_populates="changes", lazy="selectin")
    history: Mapped[List["ChangeRequestHistory"]] = relationship("ChangeRequestHistory", back_populates="change_request", cascade="all, delete-orphan")

class ChangeRequestHistory(Base):
    __tablename__ = "change_request_history"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    change_id: Mapped[str] = mapped_column(String, ForeignKey("change_requests.id", ondelete="CASCADE"))
    changed_by_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    field_changed: Mapped[str] = mapped_column(String(50))
    old_value: Mapped[Optional[str]] = mapped_column(Text)
    new_value: Mapped[Optional[str]] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    change_request: Mapped["ChangeRequest"] = relationship("ChangeRequest", back_populates="history")
    changed_by: Mapped["User"] = relationship("User", lazy="joined")

# --- INFRASTRUCTURE MONITORING MODELS ---

class InfrastructureResource(Base):
    __tablename__ = "infra_resources"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    resource_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False) # Server, Database, Router, Switch, Firewall, API Gateway, Virtual Machine, Cloud Resource
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    environment: Mapped[str] = mapped_column(String(30), default="Production") # Production, Staging, Development
    
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE") # ACTIVE, MAINTENANCE, DECOMMISSIONED
    health: Mapped[str] = mapped_column(String(30), default="HEALTHY") # HEALTHY, WARNING, CRITICAL, OFFLINE

    cpu_percent: Mapped[float] = mapped_column(Float, default=45.0)
    memory_percent: Mapped[float] = mapped_column(Float, default=60.0)
    disk_percent: Mapped[float] = mapped_column(Float, default=55.0)
    network_mbps: Mapped[float] = mapped_column(Float, default=120.0)
    response_time_ms: Mapped[float] = mapped_column(Float, default=15.0)
    availability_percent: Mapped[float] = mapped_column(Float, default=99.98)

    last_check_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    metrics: Mapped[List["InfrastructureMetric"]] = relationship("InfrastructureMetric", back_populates="resource", cascade="all, delete-orphan")
    alerts: Mapped[List["InfrastructureAlert"]] = relationship("InfrastructureAlert", back_populates="resource", cascade="all, delete-orphan")

class InfrastructureMetric(Base):
    __tablename__ = "infra_metrics"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    resource_id: Mapped[str] = mapped_column(String, ForeignKey("infra_resources.id", ondelete="CASCADE"))
    cpu_percent: Mapped[float] = mapped_column(Float)
    memory_percent: Mapped[float] = mapped_column(Float)
    disk_percent: Mapped[float] = mapped_column(Float)
    network_mbps: Mapped[float] = mapped_column(Float)
    response_time_ms: Mapped[float] = mapped_column(Float)
    availability_percent: Mapped[float] = mapped_column(Float)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    resource: Mapped["InfrastructureResource"] = relationship("InfrastructureResource", back_populates="metrics")

class InfrastructureAlert(Base):
    __tablename__ = "infra_alerts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    alert_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    resource_id: Mapped[str] = mapped_column(String, ForeignKey("infra_resources.id", ondelete="CASCADE"))
    metric_name: Mapped[str] = mapped_column(String(50), nullable=False)
    current_value: Mapped[float] = mapped_column(Float, nullable=False)
    threshold_value: Mapped[float] = mapped_column(Float, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="CRITICAL") # WARNING, CRITICAL
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    status: Mapped[str] = mapped_column(String(30), default="OPEN") # OPEN, ACKNOWLEDGED, RESOLVED
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    acknowledged_by_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"))
    
    incident_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("incidents.id"))

    resource: Mapped["InfrastructureResource"] = relationship("InfrastructureResource", back_populates="alerts", lazy="joined")
    acknowledged_by: Mapped[Optional["User"]] = relationship("User", lazy="joined")
    incident: Mapped[Optional["Incident"]] = relationship("Incident", lazy="joined")

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(100))
    message: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(50), default="System")
    priority: Mapped[str] = mapped_column(String(20), default="INFO")
    link: Mapped[Optional[str]] = mapped_column(String(255))
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", lazy="joined")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    module: Mapped[str] = mapped_column(String(50), default="General")
    entity_id: Mapped[Optional[str]] = mapped_column(String)
    details: Mapped[Optional[str]] = mapped_column(Text)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[Optional["User"]] = relationship("User", lazy="joined")
