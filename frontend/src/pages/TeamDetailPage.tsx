import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { orgService, TeamItem } from '../services/orgService';

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<TeamItem | null>(null);

  useEffect(() => {
    if (id) {
      orgService.getTeam(id).then(setTeam).catch(console.error);
    }
  }, [id]);

  if (!team) {
    return <div className="p-12 text-center text-slate-400">Loading team details...</div>;
  }

  return (
    <div className="space-y-6">
      <Link to="/teams" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-semibold hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Teams List
      </Link>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{team.name}</h1>
            <p className="text-xs text-slate-400 mt-1">{team.description}</p>
          </div>
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-mono text-xs rounded border border-indigo-500/30">
            Lead: {team.lead_name}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 font-mono text-xs text-center">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-500 block">Team Members</span>
            <span className="text-xl font-bold text-slate-100">{team.members_count} Engineers</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-500 block">Assigned Workload</span>
            <span className="text-xl font-bold text-amber-400">{team.open_incidents_count} Incidents</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-500 block">SLA Compliance</span>
            <span className="text-xl font-bold text-emerald-400">97.8%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
