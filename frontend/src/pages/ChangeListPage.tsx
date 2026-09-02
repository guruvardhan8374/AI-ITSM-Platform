import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GitPullRequest, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  X
} from 'lucide-react';
import { changeService, ChangeRequest, AIChangeAnalysisResponse } from '../services/changeService';

export const ChangeListPage: React.FC = () => {
  const navigate = useNavigate();
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [changeType, setChangeType] = useState('NORMAL');
  const [impact] = useState(2);
  const [urgency] = useState(2);
  const [affectedServices] = useState('Core Infrastructure');
  const [implementationPlan, setImplementationPlan] = useState('');
  const [rollbackPlan, setRollbackPlan] = useState('');
  const [validationPlan, setValidationPlan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Risk Assessment State
  const [aiRisk, setAiRisk] = useState<AIChangeAnalysisResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchChanges = async () => {
    setLoading(true);
    try {
      const data = await changeService.listChanges({
        search: search || undefined,
        change_type: typeFilter || undefined,
        risk_level: riskFilter || undefined,
        page
      });
      setChanges(data);
    } catch (err) {
      console.error("Failed to load changes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges();
  }, [search, typeFilter, riskFilter, page]);

  const handleRunAIRiskAnalysis = async () => {
    if (!description || !implementationPlan) {
      alert("Please fill in Description and Implementation Plan first.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await changeService.analyzeChangeRisk({
        change_description: description,
        change_type: changeType,
        impact,
        urgency,
        affected_services: affectedServices
      });
      setAiRisk(res);
    } catch {
      alert("AI Risk Analysis failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await changeService.createChange({
        title,
        description,
        reason,
        change_type: changeType,
        impact,
        urgency,
        affected_services: affectedServices,
        implementation_plan: implementationPlan,
        rollback_plan: rollbackPlan,
        validation_plan: validationPlan
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setReason('');
      setImplementationPlan('');
      setRollbackPlan('');
      setValidationPlan('');
      setAiRisk(null);
      fetchChanges();
    } catch {
      alert("Failed to submit change request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">CRITICAL RISK</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">HIGH RISK</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">MEDIUM RISK</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">LOW RISK</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'EMERGENCY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">EMERGENCY</span>;
      case 'NORMAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">NORMAL</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">STANDARD</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <GitPullRequest className="w-4 h-4" /> IT Governance & Release Enablement
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Change Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorize standard, normal, and emergency changes with AI risk assessment and CAB approval panels.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Change Request</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search CHG #, title, description..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Change Types</option>
              <option value="STANDARD">STANDARD</option>
              <option value="NORMAL">NORMAL</option>
              <option value="EMERGENCY">EMERGENCY</option>
            </select>
          </div>

          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Risk Levels</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Change #</th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Risk Level</th>
                <th className="p-3.5">Approval Status</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Requester</th>
                <th className="p-3.5">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 space-y-2">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs">Loading change requests...</p>
                  </td>
                </tr>
              ) : changes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 space-y-2">
                    <GitPullRequest className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="font-semibold text-slate-200">No Change Requests Found</p>
                  </td>
                </tr>
              ) : (
                changes.map((chg) => (
                  <tr
                    key={chg.id}
                    onClick={() => navigate(`/changes/${chg.id}`)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-mono font-bold text-indigo-400">{chg.change_number}</td>
                    <td className="p-3.5 font-semibold text-slate-100 max-w-sm truncate">{chg.title}</td>
                    <td className="p-3.5">{getTypeBadge(chg.change_type)}</td>
                    <td className="p-3.5">{getRiskBadge(chg.risk_level)}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        chg.approval_status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        chg.approval_status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {chg.approval_status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {chg.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300">{chg.requester.full_name}</td>
                    <td className="p-3.5 text-slate-500 font-mono">{new Date(chg.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {changes.length} change requests</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-1 rounded bg-slate-800 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-200">Page {page}</span>
            <button disabled={changes.length < 20} onClick={() => setPage(page + 1)} className="p-1 rounded bg-slate-800 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* New Change Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-slate-100">Submit Change Request</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Change Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Deploy PostgreSQL v16.2 Migration"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Change Type *</label>
                  <select
                    value={changeType}
                    onChange={(e) => setChangeType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="STANDARD">STANDARD (Pre-approved)</option>
                    <option value="NORMAL">NORMAL (CAB Approval)</option>
                    <option value="EMERGENCY">EMERGENCY (Urgent Fix)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Detailed Description *</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline purpose and architecture changes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Business Justification & Reason *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Compliance requirement & index optimization"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Implementation Plan *</label>
                  <textarea
                    required
                    rows={3}
                    value={implementationPlan}
                    onChange={(e) => setImplementationPlan(e.target.value)}
                    placeholder="1. Notify NOC&#10;2. Apply schema migration..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Rollback Plan *</label>
                  <textarea
                    required
                    rows={3}
                    value={rollbackPlan}
                    onChange={(e) => setRollbackPlan(e.target.value)}
                    placeholder="1. Restore snapshot&#10;2. Revert DNS..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none font-mono"
                  />
                </div>
              </div>

              {/* AI Risk Assessment Action */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> AI Change Risk Calculator
                  </span>
                  <button
                    type="button"
                    onClick={handleRunAIRiskAnalysis}
                    disabled={aiLoading}
                    className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-semibold transition-colors"
                  >
                    {aiLoading ? 'Calculating Risk...' : 'Analyze Risk Level'}
                  </button>
                </div>

                {aiRisk && (
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span>Calculated Risk Level: <strong className="text-rose-400">{aiRisk.recommended_risk}</strong></span>
                      <span>Confidence: <strong className="text-indigo-300">{Math.round(aiRisk.confidence * 100)}%</strong></span>
                    </div>
                    <p className="text-slate-400">Window: {aiRisk.recommended_implementation_window}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/30"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Change Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
