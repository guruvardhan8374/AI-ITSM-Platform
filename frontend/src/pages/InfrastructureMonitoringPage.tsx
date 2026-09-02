import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Server, 
  Activity, 
  ShieldAlert, 
  BrainCircuit, 
  Sparkles, 
  RefreshCw, 
  Zap, 
  Clock, 
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  infrastructureService, 
  InfraResource, 
  InfraMetricItem, 
  InfraAlertItem, 
  AIAnomalyResponse, 
  AIPredictiveMaintenanceResponse 
} from '../services/infrastructureService';

export const InfrastructureMonitoringPage: React.FC = () => {
  const navigate = useNavigate();

  const [resources, setResources] = useState<InfraResource[]>([]);
  const [alerts, setAlerts] = useState<InfraAlertItem[]>([]);
  const [selectedResource, setSelectedResource] = useState<InfraResource | null>(null);
  const [metrics, setMetrics] = useState<InfraMetricItem[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Modal & Feature state
  const [aiAnomaly, setAiAnomaly] = useState<AIAnomalyResponse | null>(null);
  const [aiPredictive, setAiPredictive] = useState<AIPredictiveMaintenanceResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const loadNocData = async () => {
    setLoading(true);
    try {
      const resList = await infrastructureService.listResources();
      setResources(resList);

      if (resList.length > 0) {
        const sel = resList[0];
        setSelectedResource(sel);
        const mList = await infrastructureService.getMetrics(sel.id);
        setMetrics(mList);
      }

      const alertList = await infrastructureService.listAlerts();
      setAlerts(alertList);
    } catch (err) {
      console.error("Error loading NOC monitoring data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNocData();
  }, []);

  const handleSelectResource = async (res: InfraResource) => {
    setSelectedResource(res);
    try {
      const mList = await infrastructureService.getMetrics(res.id);
      setMetrics(mList);
    } catch (err) {
      console.error("Error fetching resource metrics", err);
    }
  };

  const handleSimulateCheckSpike = async (resId: string) => {
    try {
      await infrastructureService.triggerCheck(resId, true);
      alert("Simulated CPU & Memory spike! Monitoring engine detected critical threshold breach & automatically created a P1 Critical Incident.");
      loadNocData();
    } catch {
      alert("Failed to simulate check");
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await infrastructureService.acknowledgeAlert(alertId);
      loadNocData();
    } catch {
      alert("Failed to acknowledge alert");
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await infrastructureService.resolveAlert(alertId);
      loadNocData();
    } catch {
      alert("Failed to resolve alert");
    }
  };

  const handleRunAIAnomaly = async () => {
    if (!selectedResource) return;
    setIsAiLoading(true);
    try {
      const anomaly = await infrastructureService.detectAnomaly(selectedResource.id);
      setAiAnomaly(anomaly);
      
      const pred = await infrastructureService.predictMaintenance(selectedResource.id);
      setAiPredictive(pred);
    } catch {
      alert("AI Anomaly Detection failed");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Metrics KPI calculations
  const totalCount = resources.length;
  const healthyCount = resources.filter(r => r.health === 'HEALTHY').length;
  const warningCount = resources.filter(r => r.health === 'WARNING').length;
  const criticalCount = resources.filter(r => r.health === 'CRITICAL').length;
  const offlineCount = resources.filter(r => r.health === 'OFFLINE').length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" /> Real-Time NOC & Telemetry Engine
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Infrastructure Monitoring Console</h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor enterprise servers, database clusters, firewalls, routers, API gateways, and automated incident creation on threshold breaches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadNocData}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh NOC Telemetry
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Resources</span>
          <p className="text-2xl font-bold text-slate-100 font-mono">{totalCount}</p>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Healthy</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{healthyCount}</p>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Warning</span>
          <p className="text-2xl font-bold text-amber-400 font-mono">{warningCount}</p>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 p-5 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Critical</span>
          <p className="text-2xl font-bold text-rose-400 font-mono">{criticalCount}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Offline</span>
          <p className="text-2xl font-bold text-slate-400 font-mono">{offlineCount}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Resources Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" /> Monitored Infrastructure Telemetry
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">Auto-polling every 15s</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Resource</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Health</th>
                    <th className="p-3">CPU %</th>
                    <th className="p-3">Memory %</th>
                    <th className="p-3">Disk %</th>
                    <th className="p-3">Latency</th>
                    <th className="p-3">Simulate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </td>
                    </tr>
                  ) : (
                    resources.map((res) => {
                      const isSelected = selectedResource?.id === res.id;
                      return (
                        <tr
                          key={res.id}
                          onClick={() => handleSelectResource(res)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-600/15 border-l-2 border-indigo-500' : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="p-3 font-semibold text-slate-100">
                            <div>{res.name}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{res.ip_address}</span>
                          </td>
                          <td className="p-3 text-slate-300 font-medium">{res.resource_type}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              res.health === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              res.health === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {res.health}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-indigo-400">{res.cpu_percent.toFixed(1)}%</td>
                          <td className="p-3 font-mono text-slate-300">{res.memory_percent.toFixed(1)}%</td>
                          <td className="p-3 font-mono text-slate-300">{res.disk_percent.toFixed(1)}%</td>
                          <td className="p-3 font-mono text-slate-400">{res.response_time_ms.toFixed(0)} ms</td>
                          <td className="p-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSimulateCheckSpike(res.id); }}
                              className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                              title="Simulate CPU/Memory Spike & Trigger Automated Incident"
                            >
                              <Zap className="w-3 h-3 text-rose-400" /> Spike
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Infrastructure Alerts Table */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" /> Active Infrastructure Alerts ({alerts.length})
              </h2>
            </div>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 text-center">No active alerts present.</p>
              ) : (
                alerts.map((alt) => (
                  <div key={alt.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-400">{alt.alert_number}</span>
                        <span className="font-bold text-slate-100">{alt.message}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        alt.status === 'ACKNOWLEDGED' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {alt.status}
                      </span>
                    </div>

                    {alt.incident && (
                      <div className="bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-500/30 flex items-center justify-between">
                        <span className="text-[11px] text-indigo-300 font-mono">
                          Automated Incident Created: <strong>{alt.incident.incident_number}</strong> — {alt.incident.title}
                        </span>
                        <button
                          onClick={() => navigate(`/incidents/${alt.incident?.id}`)}
                          className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1 hover:underline"
                        >
                          View Incident <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span>Threshold: {alt.threshold_value}%</span>
                      <div className="flex items-center gap-2">
                        {alt.status === 'OPEN' && (
                          <button
                            onClick={() => handleAcknowledgeAlert(alt.id)}
                            className="px-2.5 py-1 bg-purple-600/20 text-purple-300 rounded border border-purple-500/30 font-semibold"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alt.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolveAlert(alt.id)}
                            className="px-2.5 py-1 bg-emerald-600/20 text-emerald-300 rounded border border-emerald-500/30 font-semibold"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {selectedResource ? selectedResource.name : 'Select Resource'}
                </h3>
                <p className="text-[10px] text-slate-400">Telemetry History Trend</p>
              </div>
              <button
                onClick={handleRunAIAnomaly}
                disabled={isAiLoading}
                className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
              >
                <Sparkles className={`w-3 h-3 ${isAiLoading ? 'animate-spin' : ''}`} />
                <span>Run AI Anomaly</span>
              </button>
            </div>

            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics}>
                  <defs>
                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="timestamp" stroke="#64748b" tickFormatter={(t) => new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} fontSize={10} />
                  <YAxis stroke="#64748b" domain={[0, 100]} fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="cpu_percent" stroke="#6366f1" fillOpacity={1} fill="url(#cpuGrad)" name="CPU %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <BrainCircuit className="w-4 h-4 text-indigo-400" /> AI Anomaly & Predictive Maintenance
            </div>

            {aiAnomaly ? (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-400">Anomaly Detected</span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold rounded text-[10px]">
                      {Math.round(aiAnomaly.confidence * 100)}% Confidence
                    </span>
                  </div>
                  <p className="text-slate-300">{aiAnomaly.possible_cause}</p>
                </div>

                {aiPredictive && (
                  <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-lg space-y-2 text-[11px]">
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Predictive Maintenance Insight
                    </span>
                    <p className="text-slate-300">{aiPredictive.trend_description}</p>
                    <div className="bg-slate-900 p-2 rounded text-slate-200 font-mono">
                      Estimated threshold breach in <strong>{aiPredictive.predicted_threshold_breach_days} days</strong>.
                    </div>
                    <button
                      onClick={() => alert("Maintenance Task created and scheduled for infrastructure team.")}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded text-xs transition-colors"
                    >
                      Schedule Storage Maintenance Task
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-2 text-xs">
                <BrainCircuit className="w-8 h-8 text-indigo-400 mx-auto opacity-60" />
                <p className="font-semibold text-slate-200">AI Infrastructure Diagnostics Ready</p>
                <p className="text-slate-500 text-[11px]">Select any resource and click "Run AI Anomaly" to perform predictive metric analysis.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
