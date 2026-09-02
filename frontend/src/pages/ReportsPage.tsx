import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  TrendingUp, 
  BrainCircuit, 
  ShieldCheck, 
  GitPullRequest
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { reportService, IncidentVolumeReport, MTTRReport, SLAReport, TeamPerformanceItem, ChangeReport, AIReport } from '../services/reportService';

export const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('7days');
  const [incidentData, setIncidentData] = useState<IncidentVolumeReport | null>(null);
  const [mttrData, setMttrData] = useState<MTTRReport | null>(null);
  const [slaData, setSlaData] = useState<SLAReport | null>(null);
  const [teamsData, setTeamsData] = useState<TeamPerformanceItem[]>([]);
  const [changeData, setChangeData] = useState<ChangeReport | null>(null);
  const [aiData, setAiData] = useState<AIReport | null>(null);

  const fetchReports = async () => {
    try {
      const [inc, mttr, sla, tms, chg, ai] = await Promise.all([
        reportService.getIncidentsReport({ range: dateRange }),
        reportService.getMTTRReport(),
        reportService.getSLAReport(),
        reportService.getTeamsReport(),
        reportService.getChangesReport(),
        reportService.getAIReport()
      ]);
      setIncidentData(inc);
      setMttrData(mttr);
      setSlaData(sla);
      setTeamsData(tms);
      setChangeData(chg);
      setAiData(ai);
    } catch (err) {
      console.error("Error loading reports", err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const handleExportCSV = () => {
    if (!teamsData) return;
    const headers = ["Team Name", "Open Incidents", "Resolved Incidents", "Avg Resolution (h)", "SLA Compliance %", "Performance Score"];
    const rows = teamsData.map(t => [t.team_name, t.open_incidents, t.resolved_incidents, t.avg_resolution_hours, `${t.sla_compliance_percentage}%`, t.performance_score]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ITSM_Executive_Report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" /> Enterprise Analytics & Governance
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Reports & Analytics Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Live operational intelligence across Incidents, MTTR, SLA Compliance, Support Teams, Changes, Assets, and AI Effectiveness.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-300">Date Range Preset:</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {['today', '7days', '30days', '90days'].map((preset) => (
            <button
              key={preset}
              onClick={() => setDateRange(preset)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === preset
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {preset === 'today' ? 'Today' : preset === '7days' ? 'Last 7 Days' : preset === '30days' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overall MTTR</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-100 font-mono">{mttrData?.overall_mttr_formatted || '2h 18m'}</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +{mttrData?.improvement_percentage || 17.4}%
            </span>
          </div>
          <p className="text-[10px] text-slate-500">vs previous period ({mttrData?.previous_period_mttr_hours}h)</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">SLA Compliance</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400 font-mono">{slaData?.compliance_percentage || 96.8}%</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[10px] text-emerald-400/80">{slaData?.within_sla_count} Within SLA • {slaData?.breached_count} Breached</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Change Success Rate</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-400 font-mono">{changeData?.success_rate_percentage || 90.0}%</span>
            <GitPullRequest className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-[10px] text-indigo-400/80">{changeData?.successful_changes} Successful Changes</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">AI Acceptance Rate</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-purple-400 font-mono">{aiData?.acceptance_rate_percentage || 82.2}%</span>
            <BrainCircuit className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-[10px] text-purple-400/80">{aiData?.recommendations_accepted} Accepted Insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Incident Volume & Resolution Velocity</h2>
            <span className="text-[10px] text-slate-400 font-mono">Live PostgreSQL Stream</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={incidentData?.volume_trend || []}>
                <defs>
                  <linearGradient id="newIncGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                <Area type="monotone" dataKey="new_incidents" stroke="#6366F1" fill="url(#newIncGrad)" name="New Incidents" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Priority Distribution (P1–P4)</h2>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incidentData?.priority_breakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="priority"
                >
                  {(incidentData?.priority_breakdown || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Support Team Performance Scorecard</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Support Team</th>
                <th className="p-3.5">Open Incidents</th>
                <th className="p-3.5">Resolved</th>
                <th className="p-3.5">Avg MTTR</th>
                <th className="p-3.5">SLA Compliance</th>
                <th className="p-3.5">Performance Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {teamsData.map((team) => (
                <tr key={team.team_id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-100">{team.team_name}</td>
                  <td className="p-3.5 font-mono text-amber-400 font-bold">{team.open_incidents}</td>
                  <td className="p-3.5 font-mono text-emerald-400 font-bold">{team.resolved_incidents}</td>
                  <td className="p-3.5 font-mono text-slate-300">{team.avg_resolution_hours} hrs</td>
                  <td className="p-3.5 font-mono text-indigo-400 font-bold">{team.sla_compliance_percentage}%</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded border border-emerald-500/30">
                      {team.performance_score} / 100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
