import React, { useEffect, useState } from 'react';
import { Users2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { orgService, TeamItem } from '../services/orgService';

export const TeamManagementPage: React.FC = () => {
  const [teams, setTeams] = useState<TeamItem[]>([]);

  useEffect(() => {
    orgService.listTeams().then(setTeams).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Users2 className="w-4 h-4" /> Support Engineering Operations
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Support Team Management</h1>
          <p className="text-xs text-slate-400 mt-1">Configure specialized tier 1 to tier 3 support engineering teams.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((t) => (
          <div key={t.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 shadow-xl flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-base text-slate-100">{t.name}</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">{t.department_name}</span>
              </div>
              <p className="text-xs text-slate-400">{t.description || 'Specialized IT support team.'}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs font-mono space-x-3">
                <span className="text-indigo-400">{t.members_count} Members</span>
                <span className="text-amber-400">{t.open_incidents_count} Open Incidents</span>
              </div>
              <Link to={`/teams/${t.id}`} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
