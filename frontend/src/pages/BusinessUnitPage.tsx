import React, { useEffect, useState } from 'react';
import { Building2, Layers } from 'lucide-react';
import { orgService, BusinessUnitItem } from '../services/orgService';

export const BusinessUnitPage: React.FC = () => {
  const [buList, setBuList] = useState<BusinessUnitItem[]>([]);

  useEffect(() => {
    orgService.listBusinessUnits().then(setBuList).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Enterprise Organizational Hierarchy
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Business Unit Management</h1>
          <p className="text-xs text-slate-400 mt-1">High-level enterprise business units and division boundaries.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buList.map((bu) => (
          <div key={bu.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-base text-slate-100">{bu.name}</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-xs text-slate-400">{bu.description || 'Core technology and operational business unit.'}</p>
            <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800/60">
              <span className="text-slate-400">{bu.departments_count} Departments</span>
              <span className="text-indigo-400">{bu.users_count} Users</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
