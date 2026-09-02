import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X,
  FileText
} from 'lucide-react';
import { auditService, AuditLogItem } from '../services/auditService';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.listLogs({
        module: moduleFilter || undefined,
        action: actionFilter || undefined,
        search: search || undefined,
        page
      });
      setLogs(data);
    } catch (err) {
      console.error("Error loading audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [search, moduleFilter, actionFilter, page]);

  const getActionBadge = (action: string) => {
    if (action.includes("APPROVED") || action.includes("SUCCESS")) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{action}</span>;
    }
    if (action.includes("CREATED") || action.includes("ASSIGNED")) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">{action}</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">{action}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" /> Immutable Audit & Governance Trail
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Audit Logs Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Append-only security log tracking all authentication, change approvals, SLA updates, and system operations.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, details, module..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Modules</option>
              <option value="Authentication">Authentication</option>
              <option value="Incidents">Incidents</option>
              <option value="Change Management">Change Management</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Governance">Governance</option>
              <option value="Organization">Organization</option>
            </select>
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Actions</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="INCIDENT_CREATED">INCIDENT_CREATED</option>
              <option value="CHANGE_APPROVED">CHANGE_APPROVED</option>
              <option value="AUTOMATIC_INCIDENT_CREATED">AUTOMATIC_INCIDENT_CREATED</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Module</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5">Details</th>
                <th className="p-3.5">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">No Audit Logs Found</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-200">
                      {log.user ? log.user.full_name : 'System Engine'}
                    </td>
                    <td className="p-3.5">{getActionBadge(log.action)}</td>
                    <td className="p-3.5 text-slate-300 font-medium">{log.module}</td>
                    <td className="p-3.5 font-mono text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                    <td className="p-3.5 text-slate-400 max-w-md truncate">{log.details}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {logs.length} append-only audit entries</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-1 rounded bg-slate-800 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-200">Page {page}</span>
            <button disabled={logs.length < 20} onClick={() => setPage(page + 1)} className="p-1 rounded bg-slate-800 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-slate-100">Audit Log Details</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold">Action Event:</span>
                <p className="font-bold text-indigo-400 font-mono text-sm">{selectedLog.action}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-semibold">Module:</span>
                  <p className="font-semibold text-slate-200">{selectedLog.module}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-semibold">IP Address:</span>
                  <p className="font-mono text-slate-200">{selectedLog.ip_address || '127.0.0.1'}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold">Actor / User:</span>
                <p className="font-semibold text-slate-200">{selectedLog.user ? `${selectedLog.user.full_name} (${selectedLog.user.email})` : 'System Engine'}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold">Event Details:</span>
                <p className="text-slate-300 leading-relaxed font-mono whitespace-pre-line">{selectedLog.details}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
