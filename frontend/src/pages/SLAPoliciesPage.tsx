import React, { useEffect, useState } from 'react';
import { ShieldAlert, Edit2, Save } from 'lucide-react';
import { governanceService, SLAPolicyItem } from '../services/governanceService';

export const SLAPoliciesPage: React.FC = () => {
  const [policies, setPolicies] = useState<SLAPolicyItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [respTime, setRespTime] = useState(15);
  const [resolTime, setResolTime] = useState(240);

  const fetchPolicies = async () => {
    try {
      const data = await governanceService.listSLAPolicies();
      setPolicies(data);
    } catch (err) {
      console.error("Error loading SLA policies", err);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleEditClick = (p: SLAPolicyItem) => {
    setEditingId(p.id);
    setRespTime(p.response_time_minutes);
    setResolTime(p.resolution_time_minutes);
  };

  const handleSave = async (id: string) => {
    try {
      await governanceService.updateSLAPolicy(id, {
        response_time_minutes: Number(respTime),
        resolution_time_minutes: Number(resolTime)
      });
      setEditingId(null);
      fetchPolicies();
    } catch {
      alert("Failed to update SLA policy.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" /> Service Level Governance
          </div>
          <h1 className="text-2xl font-bold text-slate-100">SLA Policies & Target Governance</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure response and resolution thresholds for P1–P4 priority incident management.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map((p) => {
          const isEditing = editingId === p.id;
          return (
            <div key={p.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400">{p.priority} Priority Tier</span>
                  <h3 className="text-base font-bold text-slate-100">{p.name}</h3>
                </div>

                {!isEditing ? (
                  <button onClick={() => handleEditClick(p)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={() => handleSave(p.id)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1">
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-semibold">Response Target:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={respTime}
                      onChange={(e) => setRespTime(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-indigo-500 rounded p-1 text-slate-100 font-mono"
                    />
                  ) : (
                    <p className="font-bold text-indigo-400 font-mono text-sm">{p.response_time_minutes} minutes</p>
                  )}
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-semibold">Resolution Target:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={resolTime}
                      onChange={(e) => setResolTime(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-indigo-500 rounded p-1 text-slate-100 font-mono"
                    />
                  ) : (
                    <p className="font-bold text-emerald-400 font-mono text-sm">{p.resolution_time_minutes} minutes ({roundHours(p.resolution_time_minutes)} hrs)</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const roundHours = (mins: number) => (mins / 60).toFixed(1);
