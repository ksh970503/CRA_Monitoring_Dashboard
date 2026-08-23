import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Stethoscope, LogOut, RefreshCw, LogIn, Sparkles, CloudUpload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut, guestUser } = useAuth();
  const { isDemoMode, resetDemoData, syncAllToSupabase, isSyncing } = useData();

  const showDemoBanner = guestUser || isDemoMode || !user;

  const handleSync = async () => {
    const res = await syncAllToSupabase();
    alert(res.message);
  };

  return (
    <div className="min-h-screen flex bg-slate-900 md:bg-slate-950 font-sans text-slate-100 antialiased">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        
        {/* Demo Mode Top Banner */}
        {showDemoBanner && (
          <div className="bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-slate-900 border-b border-blue-800/50 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md">
            <div className="flex items-center gap-2 text-blue-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span>
                <strong>활용 예시 (데모 모드)</strong>로 접속 중입니다. 마음껏 수정/테스트 해보세요!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetDemoData}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 flex items-center gap-1.5 transition text-[11px]"
                title="예시 데이터를 초기 상태로 리셋합니다"
              >
                <RefreshCw className="w-3 h-3 text-blue-400" />
                <span>예시 데이터 리셋</span>
              </button>

              <button
                onClick={signOut}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md flex items-center gap-1.5 transition text-[11px] shadow"
              >
                <LogIn className="w-3 h-3" />
                <span>Google 로그인</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Header Bar */}
        <header className="md:hidden sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-white">CRA/PL Manager</span>
              {showDemoBanner && (
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-300 font-normal">
                  데모 모드
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && !guestUser && isSupabaseConfigured && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                title="Supabase 서버에 데이터 저장"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? '저장 중...' : '서버 저장'}</span>
              </button>
            )}
            <button
              onClick={signOut}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
              title="로그아웃 / 로그인 화면"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
