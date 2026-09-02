import os
import sys
import asyncio
from datetime import datetime, timedelta

# Append backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))
os.environ['USE_SQLITE'] = 'true'

from app.database.session import AsyncSessionLocal, engine, Base
from app.models.domain_models import (
    User, Role, Permission, BusinessUnit, Department, Team, SLAPolicy, Asset, Incident,
    IncidentComment, IncidentHistory, ServiceCatalog, ServiceRequest, ServiceRequestHistory,
    Problem, ProblemHistory, KnowledgeArticle, ChangeRequest, ChangeRequestHistory,
    InfrastructureResource, InfrastructureMetric, InfrastructureAlert, Notification, AuditLog,
    PriorityEnum, StatusEnum, RequestStatusEnum, ProblemStatusEnum, ChangeTypeEnum, ChangeStatusEnum
)
from app.core.security import get_password_hash
from sqlalchemy.future import select

async def seed():
    print("[INIT] Dropping and recreating database tables for fresh Prompt 6 schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        print("[SEED] Seeding Permissions...")
        permissions_data = [
            ("incidents.view", "Incidents"), ("incidents.create", "Incidents"), ("incidents.edit", "Incidents"), ("incidents.assign", "Incidents"),
            ("service_requests.view", "Service Requests"), ("service_requests.approve", "Service Requests"),
            ("problems.view", "Problems"), ("problems.edit", "Problems"),
            ("changes.view", "Change Management"), ("changes.approve", "Change Management"),
            ("assets.view", "Asset Management"), ("assets.edit", "Asset Management"),
            ("infra.view", "Infrastructure"), ("infra.manage", "Infrastructure"),
            ("kb.view", "Knowledge Base"), ("kb.publish", "Knowledge Base"),
            ("users.view", "Organization"), ("users.manage", "Organization"),
            ("reports.view", "Analytics"), ("audit_logs.view", "Governance")
        ]

        perm_map = {}
        for name, module in permissions_data:
            p = Permission(name=name, module=module)
            session.add(p)
            perm_map[name] = p
        await session.flush()

        print("[SEED] Seeding Roles & Permission Links...")
        roles_config = {
            "SUPER_ADMIN": list(perm_map.values()),
            "IT_MANAGER": [perm_map[k] for k in ["incidents.view", "service_requests.view", "service_requests.approve", "problems.view", "changes.view", "changes.approve", "assets.view", "infra.view", "kb.view", "reports.view", "audit_logs.view"]],
            "SERVICE_DESK_AGENT": [perm_map[k] for k in ["incidents.view", "incidents.create", "incidents.edit", "incidents.assign", "service_requests.view", "kb.view", "assets.view"]],
            "INFRASTRUCTURE_ENGINEER": [perm_map[k] for k in ["incidents.view", "incidents.edit", "problems.view", "problems.edit", "changes.view", "assets.view", "infra.view", "infra.manage", "kb.view"]],
            "END_USER": [perm_map[k] for k in ["incidents.create", "service_requests.view", "kb.view"]]
        }

        role_map = {}
        for r_name, p_list in roles_config.items():
            r = Role(name=r_name, description=f"{r_name} enterprise role", permissions=p_list)
            session.add(r)
            role_map[r_name] = r
        await session.flush()

        print("[SEED] Seeding Business Units & Departments...")
        bu = BusinessUnit(name="Enterprise IT & Operations")
        session.add(bu)
        await session.flush()

        dept = Department(name="IT Infrastructure & Support", business_unit_id=bu.id)
        session.add(dept)
        await session.flush()

        print("[SEED] Seeding Support Teams...")
        teams_data = [
            ("Service Desk L1", "First line support and incident logging"),
            ("Infrastructure Team", "Network, servers, cloud and security engineering"),
            ("Database Administrators", "Database cluster tuning, backups and optimization"),
            ("Cybersecurity SOC", "Security monitoring, threat response and compliance"),
            ("Application Support", "Enterprise software and internal tools support")
        ]
        team_map = {}
        for t_name, desc in teams_data:
            t = Team(name=t_name, description=desc, department_id=dept.id)
            session.add(t)
            team_map[t_name] = t
        await session.flush()

        print("[SEED] Seeding SLA Policies...")
        sla_policies = [
            SLAPolicy(name="P1 Critical SLA", priority=PriorityEnum.CRITICAL, response_time_minutes=15, resolution_time_minutes=60),
            SLAPolicy(name="P2 High SLA", priority=PriorityEnum.HIGH, response_time_minutes=30, resolution_time_minutes=240),
            SLAPolicy(name="P3 Medium SLA", priority=PriorityEnum.MEDIUM, response_time_minutes=120, resolution_time_minutes=480),
            SLAPolicy(name="P4 Low SLA", priority=PriorityEnum.LOW, response_time_minutes=480, resolution_time_minutes=1440)
        ]
        session.add_all(sla_policies)
        await session.flush()

        print("[SEED] Seeding Demo Users...")
        demo_password_hash = get_password_hash("Password123!")
        users_config = [
            ("admin@itsm.com", "Super Admin User", "SUPER_ADMIN"),
            ("manager@itsm.com", "IT Manager Sarah", "IT_MANAGER"),
            ("agent@itsm.com", "Agent Alex Rivera", "SERVICE_DESK_AGENT"),
            ("engineer@itsm.com", "Infra Engineer Marcus", "INFRASTRUCTURE_ENGINEER"),
            ("user@itsm.com", "End User David", "END_USER")
        ]
        user_map = {}
        for email, name, r_name in users_config:
            u = User(
                email=email,
                full_name=name,
                hashed_password=demo_password_hash,
                role_id=role_map[r_name].id,
                department_id=dept.id,
                business_unit_id=bu.id,
                is_active=True
            )
            session.add(u)
            user_map[email] = u
        await session.flush()

        print("[SEED] Seeding 12 IT Assets...")
        assets_data = [
            ("SVR-PROD-01", "Primary DB Cluster (PostgreSQL)", "Server", "SN-99010", "db01.itsm.internal", "192.168.1.50", "Server Room - Rack A1", "ACTIVE", "CRITICAL", "CRITICAL"),
            ("SVR-PROD-02", "Secondary DB Standby", "Server", "SN-99011", "db02.itsm.internal", "192.168.1.51", "Server Room - Rack A2", "ACTIVE", "HEALTHY", "HIGH"),
            ("NET-WAF-01", "Palo Alto WAF Firewall", "Firewall", "SN-88102", "waf01.itsm.internal", "192.168.1.1", "Network NOC - Rack B1", "ACTIVE", "HEALTHY", "CRITICAL"),
            ("NET-SW-01", "Core Cisco Catalyst 9500", "Switch", "SN-77401", "switch01.itsm.internal", "192.168.1.2", "Network NOC - Rack B2", "ACTIVE", "WARNING", "HIGH"),
            ("APP-API-01", "NGINX API Gateway", "Application", "SN-33901", "api01.itsm.internal", "192.168.1.10", "Cloud Region US-East", "ACTIVE", "HEALTHY", "HIGH"),
            ("VM-K8S-01", "AWS Kubernetes Master Node", "Virtual Machine", "SN-55410", "k8s-master.itsm.internal", "10.0.4.15", "AWS Cloud VPC", "ACTIVE", "HEALTHY", "CRITICAL"),
            ("CACHE-REDIS-01", "Redis In-Memory Cache Cluster", "Database", "SN-22104", "redis01.itsm.internal", "192.168.1.60", "Server Room - Rack A3", "ACTIVE", "HEALTHY", "MEDIUM"),
            ("SAN-STORAGE-01", "EMC PowerStore Storage SAN", "Cloud Resource", "SN-11009", "san01.itsm.internal", "192.168.1.80", "Storage SAN - Rack C1", "ACTIVE", "WARNING", "CRITICAL"),
            ("DEV-LAPTOP-01", "Dell XPS 15 (Manager Sarah)", "Laptop", "SN-44321", "laptop-sarah.itsm.internal", "192.168.2.105", "HQ Floor 3", "ACTIVE", "HEALTHY", "LOW"),
            ("DEV-LAPTOP-02", "MacBook Pro 16 (Engineer Marcus)", "Laptop", "SN-44322", "laptop-marcus.itsm.internal", "192.168.2.106", "HQ Floor 3", "ACTIVE", "HEALTHY", "LOW"),
            ("PRINTER-HQ-01", "HP LaserJet Enterprise 700", "Printer", "SN-66501", "printer01.itsm.internal", "192.168.2.200", "HQ Floor 2 Mailroom", "IN_MAINTENANCE", "OFFLINE", "LOW"),
            ("ROUTER-EDGE-01", "Cisco ASR 1000 Edge Router", "Router", "SN-99411", "router01.itsm.internal", "192.168.1.254", "Network NOC - Rack B3", "ACTIVE", "HEALTHY", "CRITICAL")
        ]
        asset_objs = []
        for idx, (tag, name, a_type, sn, host, ip, loc, st, hl, crit) in enumerate(assets_data):
            ast = Asset(
                asset_number=f"AST-{1001 + idx}",
                asset_name=name,
                asset_type=a_type,
                serial_number=sn,
                hostname=host,
                ip_address=ip,
                owner_id=user_map["engineer@itsm.com"].id,
                department_id=dept.id,
                location=loc,
                status=st,
                health=hl,
                criticality=crit,
                manufacturer="Enterprise OEM",
                model="2026 Model",
                purchase_date=datetime.utcnow() - timedelta(days=365),
                warranty_expiry=datetime.utcnow() + timedelta(days=730),
                description=f"Core IT Asset {tag} deployed in production."
            )
            session.add(ast)
            asset_objs.append(ast)
        await session.flush()

        print("[SEED] Seeding 25 Realistic Incidents...")
        incidents_data = [
            ("Primary Database CPU Saturation & Query Latency", "Database P1 critical bottleneck", PriorityEnum.CRITICAL, "Database", asset_objs[0].id),
            ("VPN AnyConnect Gateway Certificate Timeout", "Users unable to establish remote tunnel", PriorityEnum.HIGH, "Network", asset_objs[2].id),
            ("NGINX API Gateway 502 Bad Gateway Spike", "Microservices returning 502 error", PriorityEnum.HIGH, "Application", asset_objs[4].id),
            ("Core Switch Port Flapping on VLAN 10", "Network dropouts on Floor 2", PriorityEnum.MEDIUM, "Network", asset_objs[3].id),
            ("EMC SAN Storage Pool Disk Capacity Exceeded 85%", "Storage pool reaching critical threshold", PriorityEnum.HIGH, "Storage", asset_objs[7].id)
        ]
        inc_objs = []
        for i in range(25):
            base = incidents_data[i % len(incidents_data)]
            inc = Incident(
                incident_number=f"INC-{1001 + i}",
                title=f"{base[0]} #{i+1}",
                description=f"{base[1]}. Automated system alert detected at {datetime.utcnow().strftime('%H:%M')}.",
                category=base[3],
                priority=base[2],
                status=StatusEnum.IN_PROGRESS if i % 2 == 0 else StatusEnum.NEW,
                reporter_id=user_map["user@itsm.com"].id,
                assigned_team_id=team_map["Infrastructure Team"].id,
                assigned_agent_id=user_map["engineer@itsm.com"].id,
                affected_asset_id=base[4],
                sla_due_at=datetime.utcnow() + timedelta(hours=4)
            )
            session.add(inc)
            inc_objs.append(inc)
        await session.flush()

        print("[SEED] Seeding 10 Service Catalog Items...")
        catalog_items = [
            ("New Employee Laptop Provisioning", "Hardware", "Standard Dell XPS laptop setup with corporate image", 24, True, "Laptop"),
            ("VPN & Remote Access Clearance", "Access", "AnyConnect VPN account creation and security profile assignment", 4, True, "Shield"),
            ("PostgreSQL Database Access Grant", "Database", "Read-only or Read-Write schema access permissions", 8, True, "Database"),
            ("Software License Allocation", "Software", "JetBrains, MS Office 365, Docker Pro license allocation", 2, False, "Download"),
            ("Active Directory Password Reset", "Access", "Self-service or agent assisted AD password unlock", 1, False, "Key"),
            ("Cloud Sandbox AWS Account Setup", "Cloud", "Provision dedicated AWS sandbox account with budget limits", 12, True, "Cloud"),
            ("Hardware RAM / SSD Upgrade", "Hardware", "RAM expansion or NVMe SSD upgrade request", 48, True, "HardDrive"),
            ("Corporate Email Group Creation", "Email", "Create new distribution list or shared mailbox", 6, False, "Mail"),
            ("Departmental Printer Clearance", "Hardware", "Badge printing authorization for network printer", 2, False, "Laptop"),
            ("Production Deployment Authorization", "Software", "Special release authorization for production change window", 12, True, "UserPlus")
        ]
        cat_objs = []
        for name, cat, desc, hours, req_app, icon in catalog_items:
            sc = ServiceCatalog(
                name=name,
                category=cat,
                description=desc,
                fulfillment_time_hours=hours,
                approval_required=req_app,
                assigned_team_name="Service Desk",
                icon=icon
            )
            session.add(sc)
            cat_objs.append(sc)
        await session.flush()

        print("[SEED] Seeding 15 Service Requests...")
        for j in range(15):
            sr = ServiceRequest(
                request_number=f"REQ-{1001 + j}",
                title=f"Service Request for {cat_objs[j % len(cat_objs)].name}",
                description=f"User requested {cat_objs[j % len(cat_objs)].name} for project delivery requirements.",
                service_id=cat_objs[j % len(cat_objs)].id,
                requested_by_id=user_map["user@itsm.com"].id,
                assigned_team_id=team_map["Service Desk L1"].id,
                priority=PriorityEnum.MEDIUM,
                status=RequestStatusEnum.FULFILLMENT if j % 3 == 0 else RequestStatusEnum.APPROVAL_REQUIRED,
                approval_status="APPROVED" if j % 3 == 0 else "PENDING"
            )
            session.add(sr)
        await session.flush()

        print("[SEED] Seeding 5 Problem Records...")
        prb_data = [
            ("Persistent Database Connection Pool Saturation", "PgBouncer pool limits exceeded during peak query hours", ProblemStatusEnum.INVESTIGATION, True),
            ("Intermittent Cisco VPN Tunnel Disconnects", "ASA Firewall memory leak under concurrent TLS negotiation", ProblemStatusEnum.OPEN, False),
            ("NGINX Gateway 502 Bad Gateway Errors", "Upstream microservices pool exhaustion during peak load", ProblemStatusEnum.ROOT_CAUSE_IDENTIFIED, True),
            ("Core Switch Port Flapping on VLAN 10", "Physical fiber link degradation between Rack B1 and B2", ProblemStatusEnum.KNOWN_ERROR, True),
            ("SAN Storage SAN Capacity Degradation", "Unindexed temporary logging tables consuming SAN space", ProblemStatusEnum.RESOLVED, False)
        ]
        for k, (p_title, p_desc, p_st, p_ke) in enumerate(prb_data):
            prb = Problem(
                problem_number=f"PRB-{1001 + k}",
                title=p_title,
                description=p_desc,
                status=p_st,
                priority=PriorityEnum.HIGH,
                root_cause=f"Identified root cause for {p_title}: unindexed tables & thread starvation.",
                workaround="Restart service daemon and scale pool limit.",
                permanent_fix="Apply index idx_created_at and upgrade firmware to v4.2.",
                known_error=p_ke,
                created_by_id=user_map["engineer@itsm.com"].id,
                assigned_team_id=team_map["Database Administrators"].id
            )
            prb.incidents.extend(inc_objs[k*2:(k*2)+2])
            session.add(prb)
        await session.flush()

        print("[SEED] Seeding 15 Knowledge Base Articles...")
        kb_categories = ["Network", "Hardware", "Software", "Database", "Security", "Access Management"]
        for m in range(15):
            kb = KnowledgeArticle(
                article_number=f"KB-{1001 + m}",
                title=f"Troubleshooting SOP #{m+1}: {kb_categories[m % len(kb_categories)]} Diagnostic Guide",
                category=kb_categories[m % len(kb_categories)],
                problem=f"Common issue occurring in {kb_categories[m % len(kb_categories)]} components.",
                symptoms="Error 500, timeout, connection reset by peer.",
                root_cause="Configuration drift or exhausted connection pool.",
                resolution="1. Check connection status.\n2. Execute restart daemon script.\n3. Verify health checks pass.",
                content=f"## Standard Operating Procedure #{m+1}\n\nDetailed instructions for diagnosing and resolving issues in {kb_categories[m % len(kb_categories)]}.",
                author_id=user_map["engineer@itsm.com"].id,
                status="Published",
                views=45 + m * 3,
                helpful_count=12 + m
            )
            session.add(kb)
        await session.flush()

        print("[SEED] Seeding 10 Change Requests...")
        changes_data = [
            ("Deploy PostgreSQL v16.2 Database Migration", "Upgrade primary DB cluster to v16.2 with optimized indexing", ChangeTypeEnum.NORMAL, "CRITICAL", ChangeStatusEnum.SCHEDULED, "APPROVED"),
            ("Emergency Cisco ASA Firewall Security Patch", "Apply CVE-2026-8911 zero-day patch to core firewall", ChangeTypeEnum.EMERGENCY, "CRITICAL", ChangeStatusEnum.APPROVED, "APPROVED"),
            ("Standard Weekly NGINX Gateway Configuration Push", "Update routing rules for new microservices endpoints", ChangeTypeEnum.STANDARD, "LOW", ChangeStatusEnum.COMPLETED, "APPROVED"),
            ("EMC SAN Storage Pool Capacity Expansion", "Attach additional 20TB SAN storage shelf to SAN-01", ChangeTypeEnum.NORMAL, "HIGH", ChangeStatusEnum.PENDING_APPROVAL, "PENDING"),
            ("Kubernetes Master Node OS Kernel Upgrade", "Upgrade Ubuntu 22.04 LTS kernel to 6.5 on master nodes", ChangeTypeEnum.NORMAL, "HIGH", ChangeStatusEnum.IMPLEMENTATION, "APPROVED"),
            ("Redis In-Memory Cache Memory Buffer Scaling", "Increase maxmemory setting to 32GB on Redis cluster", ChangeTypeEnum.STANDARD, "MEDIUM", ChangeStatusEnum.COMPLETED, "APPROVED"),
            ("Core Switch VLAN 10 Trunk Re-cabling", "Replace degraded optic transceiver on Core Switch", ChangeTypeEnum.NORMAL, "MEDIUM", ChangeStatusEnum.VALIDATION, "APPROVED"),
            ("Active Directory Schema Update for RBAC", "Add new custom claims schema for automated role sync", ChangeTypeEnum.NORMAL, "HIGH", ChangeStatusEnum.REJECTED, "REJECTED"),
            ("Emergency Rollback of Order API v2.4 Release", "Rollback Order API due to unexpected thread lock", ChangeTypeEnum.EMERGENCY, "CRITICAL", ChangeStatusEnum.ROLLED_BACK, "APPROVED"),
            ("Deploy Cloudflare WAF Security Rules", "Add bot mitigation and rate-limiting rules to edge WAF", ChangeTypeEnum.STANDARD, "LOW", ChangeStatusEnum.COMPLETED, "APPROVED")
        ]

        for c_idx, (c_title, c_desc, c_type, c_risk, c_st, c_appr) in enumerate(changes_data):
            chg = ChangeRequest(
                change_number=f"CHG-{1001 + c_idx}",
                title=c_title,
                description=c_desc,
                reason="Required for system performance, security compliance, and high availability.",
                change_type=c_type,
                risk_level=c_risk,
                impact=1 if c_risk == "CRITICAL" else 2,
                urgency=1 if c_type == "EMERGENCY" else 2,
                affected_services="Core Infrastructure",
                requested_by_id=user_map["engineer@itsm.com"].id,
                assigned_team_id=team_map["Infrastructure Team"].id,
                assigned_engineer_id=user_map["engineer@itsm.com"].id,
                implementation_plan="1. Notify NOC team.\n2. Take pre-change snapshot.\n3. Execute migration script.\n4. Verify synthetic checks.",
                rollback_plan="1. Restore snapshot.\n2. Revert DNS CNAME to secondary standby.\n3. Notify stakeholders.",
                validation_plan="Execute automated post-deployment API test suite.",
                scheduled_start=datetime.utcnow() + timedelta(days=1),
                scheduled_end=datetime.utcnow() + timedelta(days=1, hours=2),
                approval_status=c_appr,
                approver_id=user_map["manager@itsm.com"].id,
                approval_decision_at=datetime.utcnow(),
                approval_comments="Approved based on CAB review and risk assessment.",
                status=c_st
            )
            chg.affected_assets_list.append(asset_objs[c_idx % len(asset_objs)])
            chg.incidents.append(inc_objs[c_idx % len(inc_objs)])
            session.add(chg)
        await session.flush()

        print("[SEED] Seeding 10 Infrastructure Resources & Telemetry...")
        infra_data = [
            ("Primary DB Cluster (PostgreSQL)", "Database", "192.168.1.50", "Production", "ACTIVE", "CRITICAL", 94.5, 88.0, 86.0, 420.0, 85.0, 99.85),
            ("Secondary DB Standby", "Database", "192.168.1.51", "Production", "ACTIVE", "HEALTHY", 25.0, 40.0, 50.0, 110.0, 12.0, 99.99),
            ("Palo Alto WAF Firewall", "Firewall", "192.168.1.1", "Production", "ACTIVE", "HEALTHY", 38.0, 52.0, 45.0, 850.0, 8.0, 99.99),
            ("Core Cisco Catalyst 9500", "Switch", "192.168.1.2", "Production", "ACTIVE", "WARNING", 76.0, 68.0, 60.0, 920.0, 18.0, 99.95),
            ("NGINX API Gateway Cluster", "API Gateway", "192.168.1.10", "Production", "ACTIVE", "HEALTHY", 55.0, 62.0, 58.0, 650.0, 15.0, 99.98),
            ("AWS Kubernetes Master Node", "Virtual Machine", "10.0.4.15", "Production", "ACTIVE", "HEALTHY", 48.0, 65.0, 62.0, 310.0, 22.0, 99.99),
            ("Redis In-Memory Cache Node", "Database", "192.168.1.60", "Production", "ACTIVE", "HEALTHY", 30.0, 72.0, 35.0, 180.0, 5.0, 99.99),
            ("EMC PowerStore SAN Array", "Cloud Resource", "192.168.1.80", "Production", "ACTIVE", "WARNING", 65.0, 75.0, 88.5, 540.0, 28.0, 99.92),
            ("Exchange Email Gateway", "Server", "192.168.2.5", "Production", "ACTIVE", "HEALTHY", 42.0, 58.0, 52.0, 220.0, 25.0, 99.96),
            ("Cisco ASR 1000 Edge Router", "Router", "192.168.1.254", "Production", "ACTIVE", "HEALTHY", 34.0, 45.0, 40.0, 980.0, 6.0, 99.99)
        ]

        infra_objs = []
        for r_idx, (r_name, r_type, ip, env, st, hl, cpu, mem, disk, net, resp, avail) in enumerate(infra_data):
            res_item = InfrastructureResource(
                resource_number=f"INF-{1001 + r_idx}",
                name=r_name,
                resource_type=r_type,
                ip_address=ip,
                environment=env,
                status=st,
                health=hl,
                cpu_percent=cpu,
                memory_percent=mem,
                disk_percent=disk,
                network_mbps=net,
                response_time_ms=resp,
                availability_percent=avail,
                last_check_at=datetime.utcnow()
            )
            session.add(res_item)
            infra_objs.append(res_item)
            await session.flush()

            for m_idx in range(20):
                m_time = datetime.utcnow() - timedelta(hours=(20 - m_idx))
                c_val = max(10.0, min(99.0, cpu + (m_idx * 0.5 - 5.0)))
                d_val = max(20.0, min(99.0, disk + (m_idx * 0.4 - 4.0)))
                metric = InfrastructureMetric(
                    resource_id=res_item.id,
                    cpu_percent=round(c_val, 1),
                    memory_percent=round(mem + (m_idx * 0.2 - 2.0), 1),
                    disk_percent=round(d_val, 1),
                    network_mbps=round(net + (m_idx * 5.0 - 50.0), 1),
                    response_time_ms=round(resp + (m_idx * 0.5 - 5.0), 1),
                    availability_percent=avail,
                    timestamp=m_time
                )
                session.add(metric)

        print("[SEED] Seeding 15 Infrastructure Alerts...")
        alerts_config = [
            (infra_objs[0].id, "CPU Utilization", 94.5, 90.0, "CRITICAL", "Critical CPU utilization reached 94.5% on Primary DB Cluster.", "OPEN"),
            (infra_objs[3].id, "CPU Utilization", 76.0, 70.0, "WARNING", "High CPU load on Core Cisco Switch.", "ACKNOWLEDGED"),
            (infra_objs[7].id, "Disk Utilization", 88.5, 75.0, "WARNING", "Storage pool disk usage reaching 88.5%.", "OPEN")
        ]
        for a_idx, (r_id, m_name, c_val, t_val, sev, msg, st) in enumerate(alerts_config):
            alt = InfrastructureAlert(
                alert_number=f"ALT-{1001 + a_idx}",
                resource_id=r_id,
                metric_name=m_name,
                current_value=c_val,
                threshold_value=t_val,
                severity=sev,
                message=msg,
                status=st,
                created_at=datetime.utcnow() - timedelta(hours=a_idx+1),
                incident_id=inc_objs[a_idx].id
            )
            session.add(alt)

        print("[SEED] Seeding 10 Notifications...")
        notif_items = [
            ("P1 Critical Incident Created", "INC-1001 Primary Database CPU Saturation requires immediate triage.", "Incidents", "CRITICAL", "/incidents/INC-1001"),
            ("Critical Infrastructure Alert", "Primary DB Cluster CPU usage exceeded 90% threshold.", "Infrastructure", "CRITICAL", "/infra"),
            ("Change Approval Required", "CHG-1004 EMC SAN Storage Capacity Expansion is pending CAB approval.", "Changes", "HIGH", "/changes"),
            ("SLA Risk Warning", "INC-1005 SLA resolution window is approaching 80% threshold.", "SLA", "HIGH", "/incidents"),
            ("AI Predictive Maintenance Insight", "EMC SAN Storage disk capacity estimated breach in 5 days.", "AI", "MEDIUM", "/infra")
        ]
        for idx, (title, msg, cat, prio, link) in enumerate(notif_items):
            n = Notification(
                user_id=user_map["admin@itsm.com"].id,
                title=title,
                message=msg,
                category=cat,
                priority=prio,
                is_read=idx % 2 == 0,
                link=link,
                created_at=datetime.utcnow() - timedelta(hours=idx*2)
            )
            session.add(n)

        print("[SEED] Seeding 15 Audit Logs...")
        audit_events = [
            ("LOGIN_SUCCESS", "Authentication", "User admin@itsm.com logged in successfully."),
            ("AUTOMATIC_INCIDENT_CREATED", "Infrastructure", "Automated P1 incident INC-1001 created on DB-01 CPU breach."),
            ("INCIDENT_ASSIGNED", "Incidents", "INC-1001 assigned to Infrastructure Team."),
            ("CHANGE_APPROVED", "Change Management", "Change CHG-1001 approved by IT Manager Sarah."),
            ("SLA_POLICY_UPDATED", "Governance", "Updated P1 Critical SLA targets."),
            ("USER_CREATED", "Organization", "Created user account engineer@itsm.com.")
        ]
        for idx, (act, mod, det) in enumerate(audit_events):
            audit = AuditLog(
                user_id=user_map["admin@itsm.com"].id,
                action=act,
                module=mod,
                details=det,
                ip_address="127.0.0.1",
                timestamp=datetime.utcnow() - timedelta(hours=idx*3)
            )
            session.add(audit)

        await session.commit()
        print("[SUCCESS] Prompt 6 Seeding Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
