import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertOctagon, 
  BrainCircuit, 
  TrendingUp, 
  Server, 
  AlertTriangle, 
  GitPullRequest, 
  ArrowRight, 
  RefreshCw, 
  HardDrive, 
  ShoppingBag
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { dashboardService, DashboardSummary, IncidentTrend, PriorityDistribution, InfraMetric } from '../services/dashboardService';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<IncidentTrend[]>([]);
  const [priorities, setPriorities] = useState<PriorityDistribution[]>([]);
  const [infraMetrics, setInfraMetrics] = useState<InfraMetric[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, trendRes, prioRes, infraRes] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getIncidentTrends(),
        dashboardService.getPriorityDistribution(),
        dashboardService.getInfrastructureSummary()
      ]);
      setSummary(sumRes);
      setTrends(trendRes);
      setPriorities(prioRes);
      setInfraMetrics(infraRes);
    } catch (err) {
      console.error("Dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const mockRecentIncidents = [
    { id: 'INC-1001', title: 'Primary Database CPU Saturation & Query Latency', priority: 'P1', status: 'In Progress', team: 'Database Team', created: '10 min ago', sla: 'At Risk', priorityColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    { id: 'INC-1002', title: 'Corporate VPN AnyConnect gateway connection timeout', priority: 'P2', status: 'Assigned', team: 'Network Team', created: '25 min ago', sla: 'Within SLA', priorityColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { id: 'INC-1003', title: 'NGINX API Gateway 502 Bad Gateway Spike', priority: 'P2', status: 'In Progress', team: 'Infra Team', created: '1 hour ago', sla: 'Within SLA', priorityColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { id: 'INC-1004', title: 'Core Switch Port Flapping on VLAN 10', priority: 'P3', status: 'Resolved', team: 'Network Team', created: '2 hours ago', sla: 'Resolved', priorityColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { id: 'INC-1005', title: 'EMC SAN Storage Pool Disk Capacity Exceeded 85%', priority: 'P1', status: 'New', team: 'Storage Team', created: '3 hours ago', sla: 'At Risk', priorityColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Refresh Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <BrainCircuit className="w-4 h-4" /> Enterprise Operations Command Center
          </div>
          <h1 className="text-2xl font-bold text-slate-100">IT Operations Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time overview of IT incidents, service requests, changes, assets, infrastructure health, and AI telemetry insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
          <button
            onClick={() => navigate('/infra')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <Server className="w-3.5 h-3.5" /> NOC Infrastructure Console
          </button>
        </div>
      </div>

      {/* Top 6 Main ITSM Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Open Incidents</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400">{summary?.open_incidents || 25}</span>
            <AlertOctagon className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-[10px] text-amber-400/80">Pending resolution</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Open Requests</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-400">{summary?.open_service_requests || 12}</span>
            <ShoppingBag className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-[10px] text-indigo-400/80">{summary?.pending_approvals || 4} Pending Approvals</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Open Problems</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-purple-400">{summary?.open_problems || 4}</span>
            <AlertTriangle className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-[10px] text-purple-400/80">{summary?.known_errors || 2} Known Errors</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Change Success</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400">{summary?.change_management?.success_rate || 90.0}%</span>
            <GitPullRequest className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[10px] text-emerald-400/80">{summary?.change_management?.total_changes || 10} Total Changes</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Active IT Assets</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-cyan-400">{summary?.asset_management?.active_assets || 12}</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-[10px] text-cyan-400/80">{summary?.asset_management?.critical_assets || 4} Critical Assets</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">System Uptime</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400">{summary?.service_availability || 99.97}%</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[10px] text-emerald-400/80">SLA Compliant</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Trend Line Chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Incident Volume & Resolution Velocity</h2>
              <p className="text-[11px] text-slate-400">7-day incident intake vs resolution trend</p>
            </div>
            <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">Last 7 Days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="incidentsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }} />
                <Area type="monotone" dataKey="incidents" stroke="#6366F1" fillOpacity={1} fill="url(#incidentsGrad)" name="New Incidents" />
                <Area type="monotone" dataKey="resolved" stroke="#10B981" fillOpacity={1} fill="url(#resolvedGrad)" name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Incidents Distribution by Priority</h2>
              <p className="text-[11px] text-slate-400">P1 Critical through P4 Low triage classification</p>
            </div>
            <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">Real-time</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorities}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="priority"
                >
                  {priorities.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Incidents Table (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Recent Operational Incidents</h2>
              <p className="text-[11px] text-slate-400">Latest active tickets in service desk queue</p>
            </div>
            <button
              onClick={() => navigate('/incidents')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              View All Incidents <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Incident ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Team</th>
                  <th className="p-3">SLA Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {mockRecentIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors cursor-pointer" onClick={() => navigate('/incidents')}>
                    <td className="p-3 font-mono font-semibold text-indigo-400">{inc.id}</td>
                    <td className="p-3 font-medium text-slate-200 max-w-xs truncate">{inc.title}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${inc.priorityColor}`}>
                        {inc.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {inc.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{inc.team}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-semibold ${inc.sla === 'At Risk' ? 'text-amber-400' : inc.sla === 'Resolved' ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {inc.sla}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Infrastructure NOC Health Panel (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Infrastructure NOC Health</h2>
              <p className="text-[11px] text-slate-400">Core server & cluster utilization</p>
            </div>
            <button
              onClick={() => navigate('/infra')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              NOC Console <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {infraMetrics.map((infra, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-slate-400" /> {infra.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    infra.status === 'Healthy' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                      : infra.status === 'Warning' 
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {infra.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>CPU: {infra.cpu_usage}%</span>
                    <span>Memory: {infra.memory_usage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${infra.cpu_usage > 90 ? 'bg-rose-500' : infra.cpu_usage > 75 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                      style={{ width: `${infra.cpu_usage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
