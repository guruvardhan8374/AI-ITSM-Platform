import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  Plus, 
  Eye, 
  Tag, 
  User, 
  CheckCircle2, 
  Calendar
} from 'lucide-react';
import { knowledgeBaseService, KnowledgeArticle } from '../services/knowledgeBaseService';

export const KnowledgeArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState<'helpful' | 'not-helpful' | null>(null);

  const loadArticle = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await knowledgeBaseService.getArticle(id);
      setArticle(data);
    } catch (err) {
      console.error("Error loading article", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticle();
  }, [id]);

  const handleVoteHelpful = async () => {
    if (!article || voted) return;
    try {
      const updated = await knowledgeBaseService.voteHelpful(article.id);
      setArticle(updated);
      setVoted('helpful');
    } catch {
      alert("Failed to submit feedback");
    }
  };

  const handleVoteNotHelpful = async () => {
    if (!article || voted) return;
    try {
      const updated = await knowledgeBaseService.voteNotHelpful(article.id);
      setArticle(updated);
      setVoted('not-helpful');
    } catch {
      alert("Failed to submit feedback");
    }
  };

  const handleCopyResolution = () => {
    if (!article) return;
    navigator.clipboard.writeText(article.resolution);
    alert("Resolution steps copied to clipboard!");
  };

  const handleCreateIncidentShortcut = () => {
    if (!article) return;
    navigate('/incidents');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading Knowledge Article...</span>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-4">
        <BookOpen className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-200">Article Not Found</h2>
        <button onClick={() => navigate('/knowledge-base')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
          Return to Knowledge Base
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
        <button
          onClick={() => navigate('/knowledge-base')}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Knowledge Base Search
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xl font-mono font-bold text-indigo-400">{article.article_number}</span>
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-slate-950 text-slate-400 border border-slate-800">
            {article.category}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-slate-100">{article.title}</h1>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80 gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" /> {article.author.full_name}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(article.published_at || article.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" /> {article.views} Views
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> {article.helpful_count} Helpful
            </span>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Was this article helpful?</span>
          <button
            onClick={handleVoteHelpful}
            disabled={voted !== null}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-semibold transition-colors ${
              voted === 'helpful' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({article.helpful_count})
          </button>
          <button
            onClick={handleVoteNotHelpful}
            disabled={voted !== null}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-semibold transition-colors ${
              voted === 'not-helpful' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" /> Not Helpful ({article.not_helpful_count})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyResolution}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" /> Copy Resolution
          </button>
          <button
            onClick={handleCreateIncidentShortcut}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Create Incident
          </button>
        </div>
      </div>

      {/* Main Article Body */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl space-y-6 text-xs text-slate-300 leading-relaxed shadow-xl">
        {article.problem && (
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Problem Description</h2>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300">
              {article.problem}
            </div>
          </div>
        )}

        {article.symptoms && (
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Symptoms & Error Indicators</h2>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 font-mono">
              {article.symptoms}
            </div>
          </div>
        )}

        {article.root_cause && (
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Root Cause Analysis</h2>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300">
              {article.root_cause}
            </div>
          </div>
        )}

        {/* Step-by-Step Resolution */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Step-by-Step Resolution Instructions
          </h2>
          <div className="bg-slate-950 p-5 rounded-xl border border-emerald-500/30 text-slate-200 font-mono whitespace-pre-line leading-relaxed">
            {article.resolution}
          </div>
        </div>

        {article.workaround && (
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Temporary Workaround</h2>
            <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-500/30 text-amber-300 font-mono">
              {article.workaround}
            </div>
          </div>
        )}

        {article.tags && (
          <div className="pt-4 border-t border-slate-800 flex items-center gap-2 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 font-semibold text-[11px]">Tags:</span>
            {article.tags.split(',').map((tag, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded bg-slate-950 text-indigo-300 border border-slate-800 text-[10px] font-mono">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
