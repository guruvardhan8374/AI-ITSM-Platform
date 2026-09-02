import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  HardDrive, 
  Plus, 
  Activity, 
  Clock, 
  User, 
  MapPin, 
  Server, 
  X,
  FileText,
  GitPullRequest,
  AlertOctagon
} from 'lucide-react';
import { assetService, Asset, AssetHistoryItem, IncidentBasic, ChangeBasic } from '../services/assetService';

export const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<AssetHistoryItem[]>([]);
  const [incidents, setIncidents] = useState<IncidentBasic[]>([]);
  const [changes, setChanges] = useState<ChangeBasic[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'incidents' | 'changes' | 'maintenance' | 'history'>('overview');

  // Maintenance modal
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintType, setMaintType] = useState('Database Optimization');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintResult, setMaintResult] = useState('SUCCESS');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await assetService.getAsset(id);
      setAsset(data);

      const hist = await assetService.getHistory(data.id);
      setHistory(hist);

      const incs = await assetService.getIncidents(data.id);
      setIncidents(incs);

      const chgs = await assetService.getChanges(data.id);
      setChanges(chgs);
    } catch (err) {
      console.error("Failed loading asset details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleHealthChange = async (newHealth: string) => {
    if (!asset) return;
    try {
      await assetService.updateHealth(asset.id, newHealth);
      loadDetails();
    } catch {
      alert("Failed to update health");
    }
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    setIsSubmitting(true);
    try {
      await assetService.addMaintenance(asset.id, {
        type: maintType,
        description: maintDesc,
        result: maintResult
      });
      setShowMaintModal(false);
      setMaintDesc('');
      loadDetails();
    } catch {
      alert("Failed to record maintenance");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading IT Asset Console...</span>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-4">
        <HardDrive className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-200">Asset Record Not Found</h2>
        <button onClick={() => navigate('/assets')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
          Return to Assets Inventory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/assets')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Assets Inventory
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xl font-mono font-bold text-indigo-400">{asset.asset_number}</span>
            <h1 className="text-xl font-bold text-slate-100">{asset.asset_name}</h1>
          </div>
        </div>

        {/* Health Control Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold">Set Health:</span>
          <button
            onClick={() => handleHealthChange('HEALTHY')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              asset.health === 'HEALTHY' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            HEALTHY
          </button>
          <button
            onClick={() => handleHealthChange('WARNING')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              asset.health === 'WARNING' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            WARNING
          </button>
          <button
            onClick={() => handleHealthChange('CRITICAL')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              asset.health === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            CRITICAL
          </button>
        </div>
      </div>

      {/* Info Specs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-indigo-400" /> Hostname
          </span>
          <p className="font-mono font-bold text-slate-100">{asset.hostname || 'N/A'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> IP Address
          </span>
          <p className="font-mono font-bold text-indigo-400">{asset.ip_address || 'N/A'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" /> Location
          </span>
          <p className="font-semibold text-slate-100">{asset.location || 'Datacenter'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-purple-400" /> Owner
          </span>
          <p className="font-semibold text-slate-100">{asset.owner?.full_name || 'Infrastructure Team'}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Overview & Specs
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'incidents' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <AlertOctagon className="w-4 h-4" /> Related Incidents ({incidents.length})
        </button>

        <button
          onClick={() => setActiveTab('changes')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'changes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <GitPullRequest className="w-4 h-4" /> Related Changes ({changes.length})
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'maintenance' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" /> Maintenance History ({asset.maintenances.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" /> Audit History
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-5 text-xs text-slate-300">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Asset Overview & Description</h2>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed">
            {asset.description || 'No description provided.'}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <div>
              <span className="text-slate-500 font-medium">Manufacturer:</span>
              <p className="font-semibold text-slate-200 mt-0.5">{asset.manufacturer || 'Dell Enterprise'}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Model:</span>
              <p className="font-semibold text-slate-200 mt-0.5">{asset.model || 'PowerEdge R750'}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Serial Number:</span>
              <p className="font-mono font-semibold text-indigo-400 mt-0.5">{asset.serial_number || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Associated SLA Incidents</h2>
          {incidents.length === 0 ? (
            <p className="text-slate-500 italic p-4 text-center">No incidents associated with this asset.</p>
          ) : (
            <div className="space-y-2">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                  className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-indigo-400">{inc.incident_number}</span>
                    <span className="font-semibold text-slate-200">{inc.title}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-slate-300">
                    {inc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'changes' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Associated Change Requests</h2>
          {changes.length === 0 ? (
            <p className="text-slate-500 italic p-4 text-center">No change requests affecting this asset.</p>
          ) : (
            <div className="space-y-2">
              {changes.map((chg) => (
                <div
                  key={chg.id}
                  onClick={() => navigate(`/changes/${chg.id}`)}
                  className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-indigo-400">{chg.change_number}</span>
                    <span className="font-semibold text-slate-200">{chg.title}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-slate-300">
                    {chg.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Maintenance History Logs</h2>
            <button
              onClick={() => setShowMaintModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Record Maintenance
            </button>
          </div>

          {asset.maintenances.length === 0 ? (
            <p className="text-slate-500 italic p-4 text-center">No maintenance logs recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {asset.maintenances.map((m) => (
                <div key={m.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-400">{m.maintenance_number} — {m.type}</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                      {m.result}
                    </span>
                  </div>
                  <p className="text-slate-300">{m.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Performed by: {m.performed_by?.full_name || 'Engineer'}</span>
                    <span>Date: {new Date(m.maintenance_date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Audit History</h2>
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{item.field_changed}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  By <strong className="text-slate-300">{item.changed_by?.full_name || 'System'}</strong>: {item.new_value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Maintenance Modal */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-2xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Record Maintenance Log</h3>
              <button onClick={() => setShowMaintModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMaintenanceSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Maintenance Type *</label>
                <input
                  type="text"
                  required
                  value={maintType}
                  onChange={(e) => setMaintType(e.target.value)}
                  placeholder="e.g. Firmware Upgrade or Disk Optimization"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Description of Work Performed *</label>
                <textarea
                  required
                  rows={3}
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  placeholder="Applied security patch CVE-2026-101 and restarted daemon..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Result Status</label>
                <select
                  value={maintResult}
                  onChange={(e) => setMaintResult(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="PARTIAL_SUCCESS">PARTIAL_SUCCESS</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowMaintModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/30"
                >
                  {isSubmitting ? 'Recording...' : 'Record Maintenance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
