import React, { useEffect, useState } from 'react';
import { Briefcase } from 'lucide-react';
import { orgService, DepartmentItem } from '../services/orgService';

export const DepartmentPage: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);

  useEffect(() => {
    orgService.listDepartments().then(setDepartments).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4" /> Enterprise Departments
          </div>
          <h1 className="text-2xl font-bold text-slate-100">IT Department Management</h1>
          <p className="text-xs text-slate-400 mt-1">Manage operational departments across business units.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d) => (
          <div key={d.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-base text-slate-100">{d.name}</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono border border-indigo-500/30">
                {d.business_unit_name || 'Enterprise'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800/60">
              <span className="text-slate-400">{d.teams_count} Support Teams</span>
              <span className="text-indigo-400">{d.users_count} Personnel</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
