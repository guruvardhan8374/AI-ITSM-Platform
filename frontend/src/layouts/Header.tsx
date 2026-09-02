import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Bell, 
  Shield, 
  Sparkles, 
  Server, 
  LogOut, 
  Settings, 
  ChevronDown,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HealthCheckResponse } from '../types';
import { governanceService, GlobalSearchResult } from '../services/governanceService';

interface HeaderProps {
  healthStatus?: HealthCheckResponse | null;
}

export const Header: React.FC<HeaderProps> = ({ healthStatus }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const isHealthy = healthStatus?.status === 'healthy';
  const roleName = user?.role?.name || 'End User';

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDrawer(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowSearchDrawer(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await governanceService.search(searchQuery.trim());
        setSearchResults(res.results);
        setShowSearchDrawer(true);
      } catch (err) {
        console.error("Global search error", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResultClick = (link: string) => {
    setShowSearchDrawer(false);
    setSearchQuery('');
    navigate(link);
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input with Live Categorized Dropdown */}
      <div className="relative flex items-center gap-4 w-80 lg:w-96" ref={searchRef}>
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowSearchDrawer(true); }}
            placeholder="Search incidents, requests, changes, assets, KB..."
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setShowSearchDrawer(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown Drawer */}
        {showSearchDrawer && (
          <div className="absolute top-full left-0 mt-2 w-[420px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 p-2 space-y-2">
            <div className="p-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                Categorized Results ({searchResults.length})
              </span>
              {isSearching && <span className="text-[10px] text-slate-500 animate-pulse">Searching...</span>}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No matching records found.</div>
              ) : (
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleResultClick(item.link)}
                    className="p-2.5 hover:bg-slate-800/60 cursor-pointer rounded-lg transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100">{item.title}</span>
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[9px] font-bold rounded">
                        {item.type}
                      </span>
                    </div>
                    {item.subtitle && <p className="text-[10px] text-slate-400 font-mono">{item.subtitle}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right System Indicators & Profile Dropdown */}
      <div className="flex items-center gap-3">
        {/* Backend API Health Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 px-3 py-1 rounded-full text-xs">
          <Server className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">API:</span>
          <span className={`inline-flex items-center gap-1.5 font-semibold ${isHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            {isHealthy ? 'Online' : 'Connecting...'}
          </span>
        </div>

        {/* AI Engine Status */}
        <div className="hidden md:flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full text-xs text-indigo-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>AI Engine Ready</span>
        </div>

        {/* Notifications Icon Button */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Notification Center"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </Link>

        {/* User Profile Dropdown */}
        {user && (
          <div className="relative border-l border-slate-800 pl-3">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center font-bold text-xs text-indigo-300">
                {user.full_name.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block text-xs">
                <p className="font-semibold text-slate-200 leading-tight">{user.full_name}</p>
                <p className="text-[10px] text-indigo-400 font-medium">{roleName}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 p-2 space-y-1 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-lg space-y-1 border border-slate-800">
                  <p className="font-bold text-slate-100">{user.full_name}</p>
                  <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
                  <div className="mt-2 inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                    <Shield className="w-3 h-3 text-indigo-400" />
                    <span>{roleName}</span>
                  </div>
                </div>

                <Link
                  to="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Platform Settings</span>
                </Link>

                <div className="border-t border-slate-800 pt-1">
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors font-semibold"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
