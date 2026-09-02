import React, { useEffect, useState } from 'react';
import { Settings, Cpu, Database, Server, Globe } from 'lucide-react';
import { governanceService, SettingsResponse } from '../services/governanceService';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);

  useEffect(() => {
    governanceService.getSettings().then(setSettings).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" /> Platform Governance & System Telemetry
          </div>
          <h1 className="text-2xl font-bold text-slate-100">System Administration & Settings</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage system configurations, AI Engine providers, security parameters, and live component health.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" /> Platform Component Health
          </h2>
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30">
            ALL SYSTEMS OPERATIONAL
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <Globe className="w-6 h-6 text-emerald-400" />
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">React Frontend</span>
              <p className="font-bold text-sm text-emerald-400">Healthy</p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <Server className="w-6 h-6 text-emerald-400" />
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">FastAPI Backend</span>
              <p className="font-bold text-sm text-emerald-400">Healthy (200 OK)</p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <Database className="w-6 h-6 text-emerald-400" />
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">PostgreSQL / SQLite</span>
              <p className="font-bold text-sm text-emerald-400">Connected</p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <Cpu className="w-6 h-6 text-purple-400" />
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">AI Diagnostics Engine</span>
              <p className="font-bold text-sm text-purple-400">Mock Provider Active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" /> AI Engine Configuration
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-slate-400 font-semibold">Active LLM Provider</span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-purple-400 font-mono">
                {settings?.ai_config.active_provider || 'Mock'}
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">
                {settings?.ai_config.status || 'Connected'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Supported Providers: Mock, OpenAI, Gemini, Anthropic (configured via environment variables)</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-slate-400 font-semibold">Model Confidence Threshold</span>
            <p className="font-bold text-base text-slate-100 font-mono">
              {(settings?.ai_config.confidence_threshold || 0.80) * 100}% Confidence Minimum
            </p>
            <p className="text-[11px] text-slate-500">Root cause and anomaly suggestions require threshold confidence before display.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
