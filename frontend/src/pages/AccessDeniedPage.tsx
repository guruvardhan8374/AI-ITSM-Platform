import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">Access Denied</h1>
          <p className="text-xs text-slate-400">
            Your role (<span className="text-indigo-400 font-semibold">{user?.role?.name || 'End User'}</span>) does not have authorization to view this module.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-left text-xs space-y-1 font-mono text-slate-400">
          <p><span className="text-slate-500">User:</span> {user?.email}</p>
          <p><span className="text-slate-500">Status:</span> 403 Forbidden</p>
          <p><span className="text-slate-500">Policy:</span> Enterprise Role-Based Access Control</p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </button>
      </div>
    </div>
  );
};
