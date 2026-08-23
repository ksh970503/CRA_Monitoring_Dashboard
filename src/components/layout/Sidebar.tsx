import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { LogOut, Stethoscope, Wifi, WifiOff, CloudUpload } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

export const Sidebar: React.FC = () => {
  const { user, signOut, guestUser } = useAuth();
  const { syncAllToSupabase, isSyncing } = useData();

  const handleSync = async () => {
    const res = await syncAllToSupabase();
    alert(res.message);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen p-4 border-r border-slate-800 shrink-0 select-none">
      {/* Header / Brand */}
      <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight text-white">CRA/PL Manager</h1>
          <p className="text-xs text-slate-400 font-medium">임상시험 업무 대시보드</p>
        </div>
      </div>

      {/* Connection Mode Status Badge */}
      <div className="px-3 mb-4">
        <div className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
          isSupabaseConfigured 
            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' 
            : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
        }`}>
          {isSupabaseConfigured ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <Wifi className="w-3.5 h-3.5" /> Supabase 연동됨
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" /> 로컬 데모 모드 (로컬 저장)
            </>
          )}
        </div>
      </div>

      {/* Manual Server Save / Sync Button for Logged in Google Users */}
      {user && !guestUser && isSupabaseConfigured && (
        <div className="px-3 mb-4">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full px-3 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? '서버에 저장 중...' : '데이터 서버 저장 (Sync)'}</span>
          </button>
        </div>
      )}

      {/* Nav Menu */}
      <nav className="flex-1 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User Session */}
      <div className="pt-4 border-t border-slate-800 mt-auto">
        <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-400">
          <div className="truncate max-w-[140px]">
            <p className="font-semibold text-slate-200 truncate">{user?.email || (guestUser ? '게스트 모드' : '사용자')}</p>
            <p className="text-[11px] text-slate-400">CRA/PL Personal</p>
          </div>
          <button
            onClick={signOut}
            title="로그아웃"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
