import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { governanceService, NotificationItem } from '../services/governanceService';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const fetchNotifications = async () => {
    try {
      const data = await governanceService.listNotifications(activeTab === 'unread' ? false : undefined);
      setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const handleMarkAllRead = async () => {
    try {
      await governanceService.markAllRead();
      fetchNotifications();
    } catch {
      alert("Failed to mark all notifications read.");
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await governanceService.markRead(id);
      fetchNotifications();
    } catch {
      console.error("Error marking read");
    }
  };

  const filteredNotifs = notifications.filter(n => activeCategory === 'all' || n.category === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" /> Real-time Alerting Center
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Enterprise Notification Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Operational alerts across Incidents, Infrastructure Failures, SLA Warnings, Change Approvals, and AI Insights.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all flex items-center gap-2"
        >
          <CheckCheck className="w-4 h-4 text-emerald-400" />
          <span>Mark All as Read</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400'
            }`}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'unread' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400'
            }`}
          >
            Unread ({notifications.filter(n => !n.is_read).length})
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['all', 'Incidents', 'Infrastructure', 'Changes', 'SLA', 'AI'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeCategory === cat ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30' : 'bg-slate-950 text-slate-400'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-12 text-center text-slate-400 rounded-xl space-y-2">
            <Bell className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-200">No Notifications</p>
          </div>
        ) : (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                n.priority === 'CRITICAL'
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : !n.is_read
                  ? 'bg-indigo-500/10 border-indigo-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    n.priority === 'CRITICAL' ? 'bg-rose-500/30 text-rose-300' : 'bg-indigo-500/30 text-indigo-300'
                  }`}>
                    {n.category} • {n.priority}
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">{n.title}</h4>
                </div>
                <p className="text-xs text-slate-300">{n.message}</p>
                <span className="text-[10px] font-mono text-slate-500">{new Date(n.created_at).toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-2">
                {n.link && (
                  <Link to={n.link} className="p-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
                {!n.is_read && (
                  <button onClick={() => handleMarkRead(n.id)} className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[10px] font-semibold">
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
