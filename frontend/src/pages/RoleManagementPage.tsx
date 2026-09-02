import React, { useEffect, useState } from 'react';
import { Key, Check, Lock } from 'lucide-react';
import { orgService, RoleItem, PermissionItem } from '../services/orgService';

export const RoleManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);

  const fetchRoleData = async () => {
    try {
      const [rData, pData] = await Promise.all([
        orgService.listRoles(),
        orgService.listPermissions()
      ]);
      setRoles(rData);
      setPermissions(pData);
      if (rData.length > 0) setSelectedRole(rData[0]);
    } catch (err) {
      console.error("Error loading role management data", err);
    }
  };

  useEffect(() => {
    fetchRoleData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Key className="w-4 h-4" /> Role-Based Access Control (RBAC)
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Role & Permission Governance</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure system access control policies and permission matrices across all 12 platform modules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-4 space-y-3">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">Defined Roles</h2>
          
          <div className="space-y-2">
            {roles.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRole(r)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedRole?.id === r.id
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{r.name}</span>
                  {r.name === 'SUPER_ADMIN' && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{r.description || 'Enterprise role definition'}</p>
                <div className="mt-2 text-[10px] font-mono text-indigo-400">
                  {r.permissions.length} Active Permissions
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          {selectedRole ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-indigo-400">Inspecting Role</span>
                  <h2 className="text-lg font-bold text-slate-100">{selectedRole.name}</h2>
                </div>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded font-mono text-xs border border-indigo-500/30">
                  {selectedRole.permissions.length} / {permissions.length} Enabled
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Module Permission Scope</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permissions.map((perm) => {
                    const isGranted = selectedRole.permissions.some(p => p.id === perm.id);
                    return (
                      <div
                        key={perm.id}
                        className={`p-3 rounded-lg border flex items-center justify-between ${
                          isGranted
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-xs text-slate-200">{perm.name}</span>
                          <span className="block text-[10px] text-slate-400">{perm.module} Module</span>
                        </div>

                        {isGranted ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <span className="text-[10px] font-mono text-slate-600">Denied</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400">Select a role to inspect permission matrix.</div>
          )}
        </div>
      </div>
    </div>
  );
};
