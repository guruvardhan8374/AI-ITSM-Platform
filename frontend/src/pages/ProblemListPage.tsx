import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  BrainCircuit, 
  X
} from 'lucide-react';
import { problemService, Problem, AIDetectProblemItem } from '../services/problemService';

export const ProblemListPage: React.FC = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Detect Problems modal state
  const [aiPatterns, setAiPatterns] = useState<AIDetectProblemItem[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // New Problem Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [workaround, setWorkaround] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const data = await problemService.listProblems({
        search: search || undefined,
        status: statusFilter || undefined,
        page
      });
      setProblems(data);
    } catch (err) {
      console.error("Error fetching problems", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [search, statusFilter, page]);

  const handleRunAIDetection = async () => {
    setIsDetecting(true);
    try {
      const data = await problemService.detectProblems();
      setAiPatterns(data);
      setShowAiModal(true);
    } catch {
      alert("AI problem detection failed");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCreateFromPattern = (pattern: AIDetectProblemItem) => {
    setTitle(pattern.recommended_problem_title);
    setDescription(`AI Pattern Identified: ${pattern.pattern_title} affecting ${pattern.affected_service}. Total matching incidents: ${pattern.incident_count}.`);
    setRootCause(pattern.recommended_root_cause);
    setShowAiModal(false);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await problemService.createProblem({
        title,
        description,
        root_cause: rootCause,
        workaround
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setRootCause('');
      setWorkaround('');
      fetchProblems();
    } catch {
      alert("Failed to create problem record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">OPEN</span>;
      case 'INVESTIGATION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">INVESTIGATION</span>;
      case 'ROOT_CAUSE_IDENTIFIED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">ROOT CAUSE IDENTIFIED</span>;
      case 'KNOWN_ERROR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">KNOWN ERROR</span>;
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">RESOLVED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">CLOSED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" /> Root Cause & Trend Prevention
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Problem Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Identify underlying root causes of recurring incidents, track known errors, and establish permanent fixes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAIDetection}
            disabled={isDetecting}
            className="px-3.5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Sparkles className={`w-4 h-4 text-indigo-400 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Scanning Patterns...' : 'Detect Recurring Problems'}</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Problem Record</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PRB #, title, root cause..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="INVESTIGATION">INVESTIGATION</option>
              <option value="ROOT_CAUSE_IDENTIFIED">ROOT CAUSE IDENTIFIED</option>
              <option value="KNOWN_ERROR">KNOWN ERROR</option>
              <option value="RESOLVED">RESOLVED</option>
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
                <th className="p-3.5">Problem #</th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Root Cause</th>
                <th className="p-3.5">Service</th>
                <th className="p-3.5">Linked Incidents</th>
                <th className="p-3.5">Assigned Team</th>
                <th className="p-3.5">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 space-y-2">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs">Loading problem records...</p>
                  </td>
                </tr>
              ) : problems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 space-y-2">
                    <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="font-semibold text-slate-200">No Problem Records Found</p>
                  </td>
                </tr>
              ) : (
                problems.map((prb) => (
                  <tr
                    key={prb.id}
                    onClick={() => navigate(`/problems/${prb.id}`)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-mono font-bold text-indigo-400">{prb.problem_number}</td>
                    <td className="p-3.5 font-semibold text-slate-100 max-w-sm truncate">{prb.title}</td>
                    <td className="p-3.5">{getStatusBadge(prb.status)}</td>
                    <td className="p-3.5 text-slate-300 max-w-xs truncate">{prb.root_cause || 'Under Investigation'}</td>
                    <td className="p-3.5 text-slate-300 font-medium">{prb.affected_service || 'Core Infrastructure'}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {prb.incidents.length} Tickets
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">{prb.assigned_team?.name || 'Infrastructure Team'}</td>
                    <td className="p-3.5 text-slate-500 font-mono">{new Date(prb.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {problems.length} problem records</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-1 rounded bg-slate-800 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-200">Page {page}</span>
            <button disabled={problems.length < 20} onClick={() => setPage(page + 1)} className="p-1 rounded bg-slate-800 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Recurring Incident Pattern Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-slate-100">AI Recurring Incident Pattern Detection</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {aiPatterns.map((pat, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-sm">{pat.pattern_title}</span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold rounded text-[10px]">
                      {Math.round(pat.confidence * 100)}% Confidence
                    </span>
                  </div>

                  <p className="text-slate-300">{pat.recommended_root_cause}</p>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold">Matching Incident Pattern ({pat.incident_count} Incidents):</span>
                    {pat.matching_incidents.map((inc, i) => (
                      <p key={i} className="text-[11px] text-indigo-400 font-mono">
                        {inc.incident_number} — {inc.title}
                      </p>
                    ))}
                  </div>

                  <button
                    onClick={() => handleCreateFromPattern(pat)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Create Problem Record from Pattern
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Problem Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Register Problem Record</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Problem Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Persistent Database Connection Saturation"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Detailed Problem Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail recurring symptoms, affected microservices, and trends..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Root Cause (If Identified)</label>
                <input
                  type="text"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="e.g. Unindexed analytics queries during report generation"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Temporary Workaround</label>
                <input
                  type="text"
                  value={workaround}
                  onChange={(e) => setWorkaround(e.target.value)}
                  placeholder="e.g. Restart PgBouncer daemon"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-400">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/30"
                >
                  {isSubmitting ? 'Creating...' : 'Register Problem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
