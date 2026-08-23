import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { QuickWorkLogModal } from '../components/dashboard/QuickWorkLogModal';
import {
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Hourglass,
  GraduationCap,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Layers
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { issues, trainings, workLogs, waitingItems, getDashboardSummary, toggleWaitingResolved } = useData();
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [activeMobileCardIndex, setActiveMobileCardIndex] = useState(0);

  const summary = getDashboardSummary();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const in3DaysStr = format(addDays(new Date(), 3), 'yyyy-MM-dd');

  // Filtered Lists
  const dueTodayItems = [
    ...issues.filter(i => i.status !== '해결' && i.due_date === todayStr).map(i => ({ type: 'issue', id: i.id, title: i.title, study: i.studies?.name, due: i.due_date, badge: i.status })),
    ...trainings.filter(t => t.status !== '완료' && t.due_date === todayStr).map(t => ({ type: 'training', id: t.id, title: t.name, study: 'RMP 교육', due: t.due_date, badge: t.status }))
  ];

  const dueWithin3DaysItems = [
    ...issues.filter(i => i.status !== '해결' && i.due_date && i.due_date > todayStr && i.due_date <= in3DaysStr).map(i => ({ type: 'issue', id: i.id, title: i.title, study: i.studies?.name, due: i.due_date, badge: i.status })),
    ...trainings.filter(t => t.status !== '완료' && t.due_date && t.due_date > todayStr && t.due_date <= in3DaysStr).map(t => ({ type: 'training', id: t.id, title: t.name, study: 'RMP 교육', due: t.due_date, badge: t.status }))
  ];

  const overdueItems = [
    ...issues.filter(i => i.status !== '해결' && i.due_date && i.due_date < todayStr).map(i => ({ type: 'issue', id: i.id, title: i.title, study: i.studies?.name, due: i.due_date, badge: i.status })),
    ...trainings.filter(t => t.status !== '완료' && t.due_date && t.due_date < todayStr).map(t => ({ type: 'training', id: t.id, title: t.name, study: 'RMP 교육', due: t.due_date, badge: t.status }))
  ];

  const activeIssues = issues.filter(i => i.status !== '해결');
  const unresolvedWaiting = waitingItems.filter(w => !w.resolved);

  const cardsData = [
    {
      id: 'today',
      title: '오늘 Due',
      count: summary.dueTodayCount,
      unit: '건',
      icon: Clock,
      urgent: summary.dueTodayCount > 0,
      activeBg: 'bg-rose-950/40 border-rose-800/80 text-rose-200 shadow-rose-950/50',
      dotColor: summary.dueTodayCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-slate-600',
      link: '/issues',
    },
    {
      id: '3days',
      title: '3일 내 Due',
      count: summary.dueWithin3DaysCount,
      unit: '건',
      icon: Clock,
      urgent: summary.dueWithin3DaysCount > 0,
      activeBg: 'bg-amber-950/40 border-amber-800/80 text-amber-200',
      dotColor: 'bg-amber-400',
      link: '/issues',
    },
    {
      id: 'waiting',
      title: 'Waiting for',
      count: summary.waitingCount,
      unit: '건',
      icon: Hourglass,
      urgent: false,
      activeBg: 'bg-purple-950/30 border-purple-800/60 text-purple-200',
      dotColor: 'bg-purple-400',
      link: '/issues',
    },
    {
      id: 'overdue',
      title: 'Overdue',
      count: summary.overdueCount,
      unit: '건',
      icon: AlertTriangle,
      urgent: summary.overdueCount > 0,
      activeBg: 'bg-red-950/60 border-red-700 text-red-200 animate-glow-rose',
      dotColor: 'bg-red-500',
      link: '/issues',
    },
    {
      id: 'training',
      title: 'RMP 교육',
      count: summary.trainingUpcomingCount,
      unit: '건',
      icon: GraduationCap,
      urgent: false,
      activeBg: 'bg-indigo-950/30 border-indigo-800/60 text-indigo-200',
      dotColor: 'bg-indigo-400',
      link: '/trainings',
    },
    {
      id: 'log',
      title: '오늘 일지',
      statusText: summary.workLogMissingToday ? '🔴 작성 필요' : '✅ 작성 완료',
      urgent: summary.workLogMissingToday,
      activeBg: summary.workLogMissingToday ? 'bg-amber-950/40 border-amber-800 text-amber-200' : 'bg-emerald-950/40 border-emerald-800 text-emerald-200',
      dotColor: summary.workLogMissingToday ? 'bg-amber-400' : 'bg-emerald-400',
      link: '/worklog',
    }
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* 📱 Mobile Top Urgent Alert Bank (Shown only on mobile if urgent tasks exist) */}
      {(summary.overdueCount > 0 || summary.dueTodayCount > 0 || summary.workLogMissingToday) && (
        <div className="md:hidden glass-panel border border-rose-800/60 rounded-2xl p-3.5 flex items-center justify-between shadow-lg shadow-rose-950/30 animate-pulse">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <div className="truncate text-xs">
              <span className="font-bold text-rose-300">긴급 점검: </span>
              <span className="text-slate-200">
                {summary.overdueCount > 0 ? `Overdue ${summary.overdueCount}건 ` : ''}
                {summary.dueTodayCount > 0 ? `오늘마감 ${summary.dueTodayCount}건 ` : ''}
                {summary.workLogMissingToday ? `일지 미작성` : ''}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsQuickLogOpen(true)}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg shrink-0 active:scale-95 transition"
          >
            빠른 대응
          </button>
        </div>
      )}

      {/* Top Header & Sticky Quick Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-6 rounded-3xl shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">대시보드 Overview</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            오늘 {format(new Date(), 'yyyy년 MM월 dd일')} 기준 마감 & Outstanding Issue
          </p>
        </div>
        
        {/* Desktop "오늘 업무 추가" Button */}
        <button
          onClick={() => setIsQuickLogOpen(true)}
          className="hidden sm:flex px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>오늘 업무 추가</span>
        </button>
      </div>

      {/* 💻 DESKTOP GRID LAYOUT (6 Columns) */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cardsData.map((card) => (
          <Link
            key={card.id}
            to={card.link}
            className={`p-4 rounded-2xl border card-spring cursor-pointer ${
              card.urgent ? card.activeBg : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{card.title}</span>
              <div className={`w-2.5 h-2.5 rounded-full ${card.dotColor}`} />
            </div>
            {card.statusText ? (
              <p className="text-xs font-bold mt-3 text-white">{card.statusText}</p>
            ) : (
              <p className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-white">
                {card.count}<span className="text-xs font-normal text-slate-400 ml-1">{card.unit}</span>
              </p>
            )}
          </Link>
        ))}
      </div>

      {/* 📱 MOBILE HORIZONTAL SNAP SCROLL LAYOUT (Swipeable Cards on Mobile) */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between px-1 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-semibold text-slate-300">
            <Layers className="w-3.5 h-3.5 text-blue-400" /> 요약 카드 스와이프
          </span>
          <span className="text-[10px] text-slate-500 font-mono">1 / 6 항목</span>
        </div>
        
        <div 
          className="flex overflow-x-auto snap-x snap-mandatory space-x-3 no-scrollbar py-1 px-0.5"
          onScroll={(e) => {
            const target = e.currentTarget;
            const index = Math.round(target.scrollLeft / (target.clientWidth * 0.45));
            setActiveMobileCardIndex(Math.min(5, Math.max(0, index)));
          }}
        >
          {cardsData.map((card) => (
            <Link
              key={card.id}
              to={card.link}
              className={`snap-start shrink-0 w-[145px] p-4 rounded-2xl border card-spring ${
                card.urgent ? card.activeBg : 'bg-slate-900/90 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300">{card.title}</span>
                <div className={`w-2 h-2 rounded-full ${card.dotColor}`} />
              </div>
              {card.statusText ? (
                <p className="text-xs font-bold mt-2.5 text-white">{card.statusText}</p>
              ) : (
                <p className="text-2xl font-black mt-1.5 tracking-tight text-white">
                  {card.count}<span className="text-xs font-normal text-slate-400 ml-0.5">{card.unit}</span>
                </p>
              )}
            </Link>
          ))}
        </div>

        {/* Scroll indicator dots */}
        <div className="flex justify-center gap-1.5 pt-1">
          {cardsData.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                activeMobileCardIndex === idx ? 'w-4 bg-blue-500' : 'w-1.5 bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Urgent Color-Coded Due Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 🔴 오늘 마감 & Overdue */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 backdrop-blur-sm card-spring">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              🔴 오늘 마감 & Overdue ({dueTodayItems.length + overdueItems.length})
            </h2>
            <span className="text-xs text-rose-400 font-semibold bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800/40">우선 처리</span>
          </div>

          {dueTodayItems.length === 0 && overdueItems.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-slate-950/40 rounded-2xl text-xs">
              오늘 마감되거나 지연된 업무가 없습니다 🎉
            </div>
          ) : (
            <div className="space-y-2.5">
              {overdueItems.map(item => (
                <div key={item.id} className="p-3 bg-red-950/50 border border-red-800/80 rounded-2xl flex items-center justify-between card-spring">
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-800 text-red-100 text-[10px] font-bold">OVERDUE</span>
                      <span className="text-xs text-slate-400 truncate">{item.study || '공통'}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">{item.title}</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-red-300 shrink-0">{item.due}</span>
                </div>
              ))}

              {dueTodayItems.map(item => (
                <div key={item.id} className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-2xl flex items-center justify-between card-spring">
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">오늘 마감</span>
                      <span className="text-xs text-slate-400 truncate">{item.study || '공통'}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">{item.title}</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-rose-300 shrink-0">오늘</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🟠 3일 이내 마감 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 backdrop-blur-sm card-spring">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              🟠 3일 이내 마감 ({dueWithin3DaysItems.length})
            </h2>
            <span className="text-xs text-amber-400 font-medium font-mono">D-1 ~ D-3</span>
          </div>

          {dueWithin3DaysItems.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-slate-950/40 rounded-2xl text-xs">
              3일 이내 마감 예정인 항목이 없습니다.
            </div>
          ) : (
            <div className="space-y-2.5">
              {dueWithin3DaysItems.map(item => (
                <div key={item.id} className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-2xl flex items-center justify-between card-spring">
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold">임박</span>
                      <span className="text-xs text-slate-400 truncate">{item.study || '공통'}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">{item.title}</p>
                  </div>
                  <span className="text-xs font-mono font-medium text-amber-300 shrink-0">{item.due}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Secondary Lists: Outstanding Issues & Waiting For */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ⚠️ Outstanding Issue Summary */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 backdrop-blur-sm card-spring">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              ⚠️ Outstanding Issues ({activeIssues.length})
            </h2>
            <Link to="/issues" className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium active:scale-95 transition">
              전체보기 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeIssues.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-slate-950/40 rounded-2xl text-xs">
              진행 중인 Issue가 없습니다.
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeIssues.slice(0, 4).map(issue => (
                <div key={issue.id} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between card-spring">
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-400 font-medium truncate">{issue.studies?.name || '공통'}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-semibold shrink-0">{issue.status}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">{issue.title}</p>
                    <p className="text-xs text-slate-400">담당: {issue.owner || '미지정'}</p>
                  </div>
                  {issue.due_date && (
                    <span className="text-xs font-mono text-slate-400 shrink-0">{issue.due_date}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🟣 Waiting For List */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 backdrop-blur-sm card-spring">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Hourglass className="w-4 h-4 text-purple-400" />
              🟣 Waiting For ({unresolvedWaiting.length})
            </h2>
            <Link to="/issues" className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 font-medium active:scale-95 transition">
              Waiting 탭 바로가기 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {unresolvedWaiting.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-slate-950/40 rounded-2xl text-xs">
              기다리는 항목이 없습니다.
            </div>
          ) : (
            <div className="space-y-2.5">
              {unresolvedWaiting.map(item => (
                <div key={item.id} className="p-3.5 bg-purple-950/20 border border-purple-800/40 rounded-2xl flex items-center justify-between card-spring">
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-purple-300 truncate">대기 대상: {item.waiting_on}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">{item.title}</p>
                  </div>
                  <button
                    onClick={() => toggleWaitingResolved(item.id)}
                    className="px-2.5 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs rounded-xl font-medium shrink-0 active:scale-95 transition"
                  >
                    해결 완료
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 📱 MOBILE FLOATING ACTION BUTTON (FAB for Quick Work Log Entry) */}
      <button
        onClick={() => setIsQuickLogOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 w-13 h-13 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-full shadow-2xl shadow-blue-500/50 flex items-center justify-center animate-glow-blue active:scale-90 transition-transform duration-150"
        aria-label="오늘 업무 추가"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Quick Work Log Modal */}
      <QuickWorkLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
      />
    </div>
  );
};
