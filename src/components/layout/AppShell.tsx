import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Stethoscope, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut, guestUser } = useAuth();

  return (
    <div className="min-h-screen flex bg-slate-900 md:bg-slate-950 font-sans text-slate-100 antialiased">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Mobile Header Bar */}
        <header className="md:hidden sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-white">CRA/PL Manager</span>
              {!isSupabaseConfigured && (
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-300 font-normal">
                  데모 모드
                </span>
              )}
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4" />
          </button>
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
