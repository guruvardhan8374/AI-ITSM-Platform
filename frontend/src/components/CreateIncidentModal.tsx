import React, { useState } from 'react';
import { X, Sparkles, AlertOctagon, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { incidentService } from '../services/incidentService';
import { aiService, AIAnalysisResponse } from '../services/aiService';

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CATEGORIES = [
  "Network",
  "Hardware",
  "Software",
  "Database",
  "Security",
  "Access Management",
  "Email",
  "Cloud",
  "Application",
  "Infrastructure",
  "Other"
];

export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Infrastructure');
  const [subcategory, setSubcategory] = useState('General Issue');
  const [impact, setImpact] = useState(2); // 1-Low, 2-Med, 3-High
  const [urgency, setUrgency] = useState(2); // 1-Low, 2-Med, 3-High
  const [affectedService, setAffectedService] = useState('Core Infrastructure');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate recommended priority
  const calculatePriority = (imp: number, urg: number) => {
    const score = imp + urg;
    if (score === 6) return { code: 'P1_Critical', label: 'P1 - Critical', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' };
    if (score === 5) return { code: 'P2_High', label: 'P2 - High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' };
    if (score >= 3) return { code: 'P3_Medium', label: 'P3 - Medium', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
    return { code: 'P4_Low', label: 'P4 - Low', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
  };

  const prioInfo = calculatePriority(impact, urgency);

  const handleRunAIAnalysis = async () => {
    if (!title || !description) {
      setError("Please fill title and description before running AI analysis.");
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    try {
      const res = await aiService.analyzeIncident({
        title,
        description,
        category,
        impact,
        urgency,
        affected_service: affectedService
      });
      setAiResult(res);
    } catch {
      setError("Failed to fetch AI diagnostics.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setError("Title and description are required.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      await incidentService.createIncident({
        title,
        description,
        category,
        subcategory,
        impact,
        urgency,
        priority: prioInfo.code,
        affected_service: affectedService
      });
      onSuccess();
      onClose();
      setTitle('');
      setDescription('');
      setAiResult(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create incident.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Create New IT Incident</h2>
              <p className="text-xs text-slate-400">Register incident ticket & trigger SLA target tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Title & AI Analysis Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Incident Title *</label>
              <button
                type="button"
                onClick={handleRunAIAnalysis}
                disabled={isAnalyzing}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Database connection pool exhaustion on primary cluster"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* AI Result Card Banner */}
          {aiResult && (
            <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-indigo-400" /> AI Diagnostic Recommendation
                </span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded">
                  {Math.round(aiResult.confidence * 100)}% Confidence
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <p><span className="text-slate-400">Prio:</span> <strong className="text-indigo-300">{aiResult.recommended_priority}</strong></p>
                <p><span className="text-slate-400">Team:</span> <strong className="text-indigo-300">{aiResult.recommended_team}</strong></p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Detailed Description *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe symptoms, error codes, affected users, and recent system changes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Subcategory</label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Gateway Timeout"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Impact + Urgency Matrix = Priority Recommendation */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Impact (1-3) *</label>
              <select
                value={impact}
                onChange={(e) => setImpact(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>1 - Low (Single User)</option>
                <option value={2}>2 - Medium (Department)</option>
                <option value={3}>3 - High (Enterprise)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Urgency (1-3) *</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>1 - Low (Workaround Available)</option>
                <option value={2}>2 - Medium (Time Sensitive)</option>
                <option value={3}>3 - High (Critical Service Down)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Calculated Priority</label>
              <div className="pt-1">
                <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold border ${prioInfo.color}`}>
                  {prioInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Affected Service */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Affected Service / Component</label>
            <input
              type="text"
              value={affectedService}
              onChange={(e) => setAffectedService(e.target.value)}
              placeholder="e.g. Core Infrastructure / SSO Gateway"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Submit Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register Incident</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
