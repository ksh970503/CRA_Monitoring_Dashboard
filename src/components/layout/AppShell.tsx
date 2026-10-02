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
    <div className="min-h-screen flex bg-[#F2F4F6] font-sans text-gray-900 antialiased">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        
        {/* Demo Mode Top Banner */}
        {showDemoBanner && (
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-blue-800">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                <strong>활용 예시 (데모 모드)</strong>로 접속 중입니다. 마음껏 수정/테스트 해보세요!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetDemoData}
                className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 flex items-center gap-1.5 transition text-[11px] shadow-sm"
                title="예시 데이터를 초기 상태로 리셋합니다"
              >
                <RefreshCw className="w-3 h-3 text-gray-500" />
                <span>예시 데이터 리셋</span>
              </button>

              <button
                onClick={signOut}
                className="px-2.5 py-1 -white font-medium rounded-lg flex items-center gap-1.5 transition text-[11px] shadow-sm"
              >
                <LogIn className="w-3 h-3" />
                <span>Google 로그인</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Header Bar */}
        <header className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl -white shadow-sm shadow-blue-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-gray-900">CRA/PL Manager</span>
              {showDemoBanner && (
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
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
                className="px-2.5 py-1 -white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                title="Supabase 서버에 데이터 저장"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? '저장 중...' : '서버 저장'}</span>
              </button>
            )}
            <button
              onClick={signOut}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
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
