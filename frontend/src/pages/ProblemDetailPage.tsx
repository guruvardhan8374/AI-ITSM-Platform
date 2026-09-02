import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertTriangle, 
  BrainCircuit, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  Plus, 
  X,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { problemService, Problem, AIProblemAnalysisResponse } from '../services/problemService';

export const ProblemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  // AI Root Cause Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<AIProblemAnalysisResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Link Incident Modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [incidentNumberToLink, setIncidentNumberToLink] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const loadDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await problemService.getProblem(id);
      setProblem(data);
    } catch (err) {
      console.error("Failed loading problem details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const runAIRootCauseAnalysis = async () => {
    setAiLoading(true);
    try {
      const res = await problemService.analyzeProblem();
      setAiAnalysis(res);
    } catch {
      alert("AI Root Cause Analysis failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleLinkIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem || !incidentNumberToLink) return;
    setIsLinking(true);
    try {
      await problemService.linkIncident(problem.id, incidentNumberToLink);
      setShowLinkModal(false);
      setIncidentNumberToLink('');
      loadDetails();
    } catch {
      alert("Failed to link incident. Please check ticket number.");
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkIncident = async (incId: string) => {
    if (!problem) return;
    try {
      await problemService.unlinkIncident(problem.id, incId);
      loadDetails();
    } catch {
      alert("Failed to unlink incident");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!problem) return;
    try {
      await problemService.updateProblem(problem.id, { status: newStatus as any });
      loadDetails();
    } catch {
      alert("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading Problem Record Console...</span>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-200">Problem Record Not Found</h2>
        <button onClick={() => navigate('/problems')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
          Return to Problems List
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
            onClick={() => navigate('/problems')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Problems List
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xl font-mono font-bold text-indigo-400">{problem.problem_number}</span>
            <h1 className="text-xl font-bold text-slate-100">{problem.title}</h1>
          </div>
        </div>

        {/* Status Transition Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {problem.status === 'OPEN' && (
            <button
              onClick={() => handleStatusChange('INVESTIGATION')}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" /> Start Investigation
            </button>
          )}

          {problem.status === 'INVESTIGATION' && (
            <button
              onClick={() => handleStatusChange('ROOT_CAUSE_IDENTIFIED')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Root Cause Identified
            </button>
          )}

          {problem.status !== 'RESOLVED' && problem.status !== 'CLOSED' && (
            <button
              onClick={() => handleStatusChange('RESOLVED')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Problem
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Problem Diagnostics</h2>
              {problem.known_error && (
                <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Published Known Error
                </span>
              )}
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {problem.description}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-rose-400">Identified Root Cause:</span>
                <p className="text-slate-300">{problem.root_cause || 'Under Investigation'}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400">Temporary Workaround:</span>
                <p className="text-slate-300">{problem.workaround || 'No workaround documented yet'}</p>
              </div>
            </div>

            {problem.permanent_fix && (
              <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-emerald-400">Permanent Resolution Fix:</span>
                <p className="text-slate-300 font-mono">{problem.permanent_fix}</p>
              </div>
            )}
          </div>

          {/* Linked Incidents */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Related Recurring Incidents</h2>
                <p className="text-xs text-slate-400">{problem.incidents.length} incident tickets linked to this problem record</p>
              </div>

              <button
                onClick={() => setShowLinkModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Link Incident
              </button>
            </div>

            <div className="space-y-2">
              {problem.incidents.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 text-center">No recurring incidents linked yet.</p>
              ) : (
                problem.incidents.map((inc) => (
                  <div key={inc.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-indigo-400">{inc.incident_number}</span>
                      <span className="font-semibold text-slate-200 truncate max-w-sm">{inc.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400">{inc.reporter?.full_name}</span>
                      <button
                        onClick={() => handleUnlinkIncident(inc.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Unlink Incident"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">AI Root Cause Analysis</h2>
              </div>
              <button
                onClick={runAIRootCauseAnalysis}
                disabled={aiLoading}
                className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
              >
                <Sparkles className={`w-3 h-3 ${aiLoading ? 'animate-spin' : ''}`} />
                <span>{aiLoading ? 'Analyzing...' : 'Run Diagnostics'}</span>
              </button>
            </div>

            {aiAnalysis ? (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500">Root Cause Confidence</span>
                    <p className="font-bold text-indigo-300">{Math.round(aiAnalysis.confidence * 100)}% Match</p>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-bold text-[10px]">
                    Risk: {aiAnalysis.risk}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-300 text-[11px]">Potential Root Cause:</span>
                  <p className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                    {aiAnalysis.potential_root_cause}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-300 text-[11px]">Recommended Permanent Fix:</span>
                  <p className="text-emerald-400 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                    {aiAnalysis.recommended_permanent_fix}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-2">
                <BrainCircuit className="w-8 h-8 text-indigo-400 mx-auto opacity-60" />
                <p className="text-xs text-slate-300 font-semibold">AI Problem Engine Ready</p>
                <p className="text-[11px] text-slate-500">Click "Run Diagnostics" to generate root cause probability and permanent fix recommendations.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Link Incident Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-2xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Link Incident Ticket</h3>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleLinkIncident} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Incident Ticket # *</label>
                <input
                  type="text"
                  required
                  value={incidentNumberToLink}
                  onChange={(e) => setIncidentNumberToLink(e.target.value)}
                  placeholder="e.g. INC-1001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowLinkModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" disabled={isLinking} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg">
                  {isLinking ? 'Linking...' : 'Link Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
