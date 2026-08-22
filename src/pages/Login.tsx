import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export const Login: React.FC = () => {
  const { signInWithGoogle, enterAsGuest } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
        
        {/* App Logo & Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20">
            <Stethoscope className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">CRA / PL 업무관리</h1>
            <p className="text-sm text-slate-400 mt-1">임상시험 일정 & Outstanding Issue 모니터링</p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-slate-800/50 rounded-2xl p-4 space-y-2.5 border border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>오늘 / 3일 내 마감 임박 항목 자동 알림</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>업무일지 작성 시 Follow-up Issue 자동 연동</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>RMP 교육 수료증 관리 및 Waiting for 추적</span>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="space-y-3">
          <button
            onClick={signInWithGoogle}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3 transition active:scale-[0.99]"
          >
            <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.23v3.14C3.2 21.3 7.31 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.23C.44 8.16 0 9.98 0 12s.44 3.84 1.23 5.41l4.05-3.14z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.2 2.7 1.23 6.59l4.05 3.14c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Google 계정으로 로그인</span>
          </button>

          <button
            onClick={enterAsGuest}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition text-sm"
          >
            <span>로그인 없이 둘러보기 (데모 모드)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs text-center">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>보안된 개인 대시보드 환경</span>
        </div>

      </div>
    </div>
  );
};
