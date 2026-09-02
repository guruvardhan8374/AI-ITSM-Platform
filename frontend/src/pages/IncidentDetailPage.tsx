import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  AlertOctagon, 
  ArrowLeft, 
  Clock, 
  Users, 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  Send, 
  Activity,
  Copy,
  RotateCcw,
  CheckSquare
} from 'lucide-react';
import { incidentService, Incident, IncidentComment, IncidentHistoryItem } from '../services/incidentService';
import { aiService, AIAnalysisResponse } from '../services/aiService';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [comments, setComments] = useState<IncidentComment[]>([]);
  const [history, setHistory] = useState<IncidentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');

  // AI Assistant state
  const [aiData, setAiData] = useState<AIAnalysisResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Form states
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');

  const loadDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const incData = await incidentService.getIncident(id);
      setIncident(incData);
      setResolutionNotes(incData.resolution_notes || '');

      const [commData, histData] = await Promise.all([
        incidentService.getComments(incData.id),
        incidentService.getHistory(incData.id)
      ]);
      setComments(commData);
      setHistory(histData);
    } catch (err) {
      console.error("Error loading incident details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const runAIAnalysis = async () => {
    if (!incident) return;
    setAiLoading(true);
    try {
      const result = await aiService.analyzeIncident({
        title: incident.title,
        description: incident.description,
        category: incident.category,
        impact: incident.impact,
        urgency: incident.urgency,
        affected_service: incident.affected_service
      });
      setAiData(result);
    } catch {
      console.error("AI Analysis failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleStatusChange = async (status: string, notes?: string) => {
    if (!incident) return;
    try {
      await incidentService.updateStatus(incident.id, status, notes);
      setShowResolveModal(false);
      loadDetails();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to update status");
    }
  };

  const handleAssignTeam = async () => {
    if (!incident || !selectedTeam) return;
    try {
      await incidentService.assignIncident(incident.id, selectedTeam);
      setShowAssignModal(false);
      loadDetails();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to assign team");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident || !newComment.trim()) return;
    try {
      await incidentService.addComment(incident.id, newComment, isInternalComment);
      setNewComment('');
      loadDetails();
    } catch {
      alert("Failed to add comment");
    }
  };

  const applyAIRecommendation = () => {
    if (!aiData) return;
    const stepsText = aiData.troubleshooting_steps.join('\n');
    setResolutionNotes(`[AI Solution Applied]\nRecommended Steps:\n${stepsText}`);
    alert("AI Resolution recommendation applied to resolution notes.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading Incident Console...</span>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-4">
        <AlertOctagon className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-200">Incident Not Found</h2>
        <button
          onClick={() => navigate('/incidents')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
        >
          Return to Incidents List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/incidents')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Incidents List
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xl font-mono font-bold text-indigo-400">{incident.incident_number}</span>
            <h1 className="text-xl font-bold text-slate-100">{incident.title}</h1>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {incident.status === 'New' && (
            <button
              onClick={() => handleStatusChange('In Progress')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" /> Start Progress
            </button>
          )}

          {incident.status !== 'Resolved' && incident.status !== 'Closed' && (
            <button
              onClick={() => setShowResolveModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Incident
            </button>
          )}

          {incident.status === 'Resolved' && (
            <button
              onClick={() => handleStatusChange('Closed')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" /> Close Incident
            </button>
          )}

          {incident.status === 'Resolved' && (
            <button
              onClick={() => handleStatusChange('Reopened')}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reopen Ticket
            </button>
          )}

          <button
            onClick={() => setShowAssignModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" /> Assign Team
          </button>
        </div>
      </div>

      {/* Main Grid: Left Details (2 cols) & Right AI/SLA Panel (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details & Resolution Notes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-5">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Incident Details</h2>
            
            <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
              {incident.description}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2">
              <div>
                <span className="text-slate-500 font-medium">Category:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{incident.category}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Subcategory:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{incident.subcategory || 'General'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Affected Service:</span>
                <p className="font-semibold text-indigo-400 mt-0.5">{incident.affected_service || 'Core Infra'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Affected Asset:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{incident.affected_asset?.name || 'Primary Cluster'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs pt-3 border-t border-slate-800">
              <div>
                <span className="text-slate-500 font-medium">Reporter:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{incident.reporter.full_name}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Assigned Team:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{incident.assigned_team?.name || 'Unassigned'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Assigned Agent:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{incident.assignee?.full_name || 'Unassigned'}</p>
              </div>
            </div>

            {incident.resolution_notes && (
              <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl space-y-1.5 text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Resolution Notes
                </span>
                <p className="text-slate-300 font-mono whitespace-pre-line">{incident.resolution_notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: SLA Timer & AI Resolution Assistant */}
        <div className="space-y-6">
          {/* SLA Countdown Widget */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" /> Resolution SLA Status
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Within SLA Target
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Target Resolution Time</span>
              <p className="text-xl font-mono font-bold text-indigo-400">
                {incident.sla_due_at ? new Date(incident.sla_due_at).toLocaleTimeString() : '01:00:00 Target'}
              </p>
              <p className="text-[11px] text-slate-400">Policy: {incident.priority.replace('_', ' ')} SLA</p>
            </div>
          </div>

          {/* AI Resolution Assistant */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">AI Resolution Assistant</h2>
              </div>
              <button
                onClick={runAIAnalysis}
                disabled={aiLoading}
                className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
              >
                <Sparkles className={`w-3 h-3 ${aiLoading ? 'animate-spin' : ''}`} />
                <span>{aiLoading ? 'Analyzing...' : 'Run Diagnostics'}</span>
              </button>
            </div>

            {aiData ? (
              <div className="space-y-4 text-xs">
                {/* Confidence & Recommended Team */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500">Recommended Team</span>
                    <p className="font-bold text-indigo-300">{aiData.recommended_team}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-bold text-[10px]">
                    {Math.round(aiData.confidence * 100)}% Confidence
                  </span>
                </div>

                {/* Possible Root Causes */}
                <div className="space-y-2">
                  <span className="font-semibold text-slate-300 text-[11px]">Possible Root Causes:</span>
                  {aiData.possible_root_causes.map((rc, idx) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-200">{rc.cause}</span>
                        <span className="font-mono text-indigo-400">{Math.round(rc.probability * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full" style={{ width: `${rc.probability * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recommended Troubleshooting Steps */}
                <div className="space-y-2">
                  <span className="font-semibold text-slate-300 text-[11px]">Recommended Actions:</span>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 text-[11px] font-mono text-slate-300">
                    {aiData.troubleshooting_steps.map((step, idx) => (
                      <p key={idx}>{step}</p>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={applyAIRecommendation}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Apply Recommendation
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiData.troubleshooting_steps.join('\n'));
                      alert("Steps copied to clipboard!");
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
                    title="Copy Steps"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-2">
                <BrainCircuit className="w-8 h-8 text-indigo-400 mx-auto opacity-60" />
                <p className="text-xs text-slate-300 font-semibold">AI Diagnostic Assistant Ready</p>
                <p className="text-[11px] text-slate-500">Click "Run Diagnostics" to generate root cause probability and resolution steps.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Tabs: Comments & Timeline History */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="border-b border-slate-800 flex items-center px-4 bg-slate-950/60">
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'comments'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Incident Comments ({comments.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Audit Timeline History ({history.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'comments' ? (
            <div className="space-y-6">
              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment or update note..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="internal"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-indigo-600 w-3.5 h-3.5"
                    />
                    <label htmlFor="internal" className="text-xs text-slate-400">Internal Note (Support team only)</label>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Post Comment
                  </button>
                </div>
              </form>

              {/* Comments Feed */}
              <div className="space-y-3 pt-2">
                {comments.map((comm) => (
                  <div key={comm.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{comm.author.full_name}</span>
                        {comm.is_internal && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-semibold">
                            Internal Note
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(comm.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-line">{comm.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Timeline History Tab */
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="flex items-start gap-4 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{item.field_changed}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      By <strong className="text-slate-300">{item.changed_by.full_name}</strong>: {item.new_value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Resolve Incident {incident.incident_number}</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Resolution Summary / Notes *</label>
              <textarea
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Detail technical fix applied, root cause verified, and tests performed..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange('Resolved', resolutionNotes)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Reassign Incident Support Queue</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Select Support Team *</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
              >
                <option value="">Choose Queue</option>
                <option value="Service Desk">Service Desk</option>
                <option value="Network Team">Network Team</option>
                <option value="Infrastructure Team">Infrastructure Team</option>
                <option value="Database Team">Database Team</option>
                <option value="Security Team">Security Team</option>
                <option value="Application Support">Application Support</option>
                <option value="Cloud Operations">Cloud Operations</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTeam}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg"
              >
                Assign Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
