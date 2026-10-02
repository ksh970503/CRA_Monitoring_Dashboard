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
    <aside className="hidden md:flex flex-col w-64 bg-white text-gray-900 min-h-screen p-4 border-r border-gray-100 shrink-0 select-none shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
      {/* Header / Brand */}
      <div className="flex items-center gap-3 px-3 py-4 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center shadow-sm shadow-blue-500/20">
          <Stethoscope className="w-6 h-6 text-gray-900" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight text-gray-900">CRA/PL Manager</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">임상시험 업무 대시보드</p>
        </div>
      </div>

      {/* Connection Mode Status Badge */}
      <div className="px-3 mb-4">
        <div className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          isSupabaseConfigured 
            ? 'bg-blue-50 text-blue-600' 
            : 'bg-orange-50 text-orange-600'
        }`}>
          {isSupabaseConfigured ? (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
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
        <div className="px-3 mb-6">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full px-3 py-3 -white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? '서버에 저장 중...' : '데이터 서버 저장'}</span>
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
                `flex items-center gap-3 px-3.5 py-3.5 rounded-2xl font-semibold text-[15px] transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${
                    isActive ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User Session */}
      <div className="pt-4 mt-auto px-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
          <div className="truncate max-w-[130px]">
            <p className="font-bold text-sm text-gray-900 truncate">{user?.email || (guestUser ? '게스트 모드' : '사용자')}</p>
            <p className="text-[11px] text-gray-500 font-medium">CRA/PL Personal</p>
          </div>
          <button
            onClick={signOut}
            title="로그아웃"
            className="p-2 text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-200 rounded-xl transition shadow-sm"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
