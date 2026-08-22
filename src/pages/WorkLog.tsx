import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { WorkType } from '../types';
import { exportWorkLogsToExcel } from '../lib/exportExcel';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  BarChart3,
  AlertCircle,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const WorkLogPage: React.FC = () => {
  const { workLogs, studies, addWorkLog, deleteWorkLog } = useData();

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [studyId, setStudyId] = useState<string>('');
  const [workType, setWorkType] = useState<WorkType>('CRA');
  const [content, setContent] = useState('');
  const [hours, setHours] = useState<number>(1);
  const [needsFollowup, setNeedsFollowup] = useState(false);
  const [nextAction, setNextAction] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Month filter state (default current YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const WORK_TYPES: WorkType[] = [
    'CRA', 'PL', 'Client communication', 'Meeting', 'Admin', 'IRB', 'Monitoring', 'Report', '기타'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await addWorkLog({
      date,
      study_id: studyId || null,
      work_type: workType,
      content,
      hours: Number(hours),
      needs_followup: needsFollowup,
      next_action: needsFollowup ? nextAction : undefined,
      due_date: needsFollowup ? dueDate : undefined,
    });

    // Reset fields
    setContent('');
    setNeedsFollowup(false);
    setNextAction('');
  };

  // Filter logs by selected month
  const filteredLogs = useMemo(() => {
    return workLogs.filter(log => log.date.startsWith(selectedMonth));
  }, [workLogs, selectedMonth]);

  // Aggregate monthly hours by WorkType for Recharts
  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    WORK_TYPES.forEach(t => (map[t] = 0));

    filteredLogs.forEach(log => {
      if (map[log.work_type] !== undefined) {
        map[log.work_type] += Number(log.hours || 0);
      } else {
        map[log.work_type] = Number(log.hours || 0);
      }
    });

    return Object.keys(map)
      .map(type => ({
        name: type,
        hours: Number(map[type].toFixed(1)),
      }))
      .filter(item => item.hours > 0);
  }, [filteredLogs]);

  const totalMonthlyHours = useMemo(() => {
    return filteredLogs.reduce((acc, curr) => acc + Number(curr.hours || 0), 0);
  }, [filteredLogs]);

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-6 rounded-3xl shadow-xl backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">업무일지 작성 & 월별 집계</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            일일 업무 기록 및 유형별 소요시간 분석 (Follow-up 설정 시 Issue 자동 연동)
          </p>
        </div>
        
        {/* Excel Export Button */}
        <button
          onClick={() => exportWorkLogsToExcel(filteredLogs, selectedMonth)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>엑셀 내보내기 ({selectedMonth})</span>
        </button>
      </div>

      {/* Work Log Entry Form Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-5 backdrop-blur-sm card-spring">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Plus className="w-5 h-5 text-blue-400" />
          새 업무일지 작성
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">날짜</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">과제 선택 (선택)</label>
              <select
                value={studyId}
                onChange={(e) => setStudyId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">공통 / 과제 지정 안 함</option>
                {studies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">소요시간 (시간)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">업무 유형</label>
            <div className="flex flex-wrap gap-1.5">
              {WORK_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setWorkType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 ${
                    workType === type
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">오늘 한 일 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="예: 서울대병원 Site Visit & SDV 진행, SAE 보고서 2건 검토..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              required
            />
          </div>

          {/* Follow-up Section */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={needsFollowup}
                onChange={(e) => setNeedsFollowup(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Follow-up 필요 (Check 시 Issue 자동 등록)
              </span>
            </label>

            {needsFollowup && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Next Action</label>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    placeholder="예: 이상반응 보고서 서명 회수 및 CRC 확인"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    required={needsFollowup}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Due Date (마감일)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    required={needsFollowup}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              업무일지 저장
            </button>
          </div>
        </form>
      </div>

      {/* Monthly Summary & Bar Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-6 backdrop-blur-sm card-spring">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">월별 업무 유형별 소요시간 집계</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none"
              />
            </div>
            <span className="text-xs text-slate-400">
              총 소요시간: <strong className="text-blue-400 text-sm">{totalMonthlyHours}시간</strong>
            </span>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        {chartData.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl text-xs">
            {selectedMonth} 월에 기록된 업무 데이터가 없습니다.
          </div>
        ) : (
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: any) => [`${value} 시간`, '소요시간']}
                />
                <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Work Log History List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 backdrop-blur-sm card-spring">
        <h2 className="text-base font-bold text-white">업무일지 목록 ({filteredLogs.length}건)</h2>

        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl text-xs">
            이 달의 기록된 업무일지가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 card-spring"
              >
                <div className="space-y-1.5 min-w-0 pr-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-600/30 text-blue-300 font-bold text-xs">
                      {log.work_type}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{log.studies?.name || '공통'}</span>
                    <span className="text-xs font-mono text-slate-500">• {log.date}</span>
                    <span className="text-xs font-bold text-slate-300">{log.hours}시간</span>
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-white">{log.content}</p>

                  {log.needs_followup && (
                    <div className="text-xs text-amber-300 bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-800/40 inline-flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Next Action: {log.next_action} (Due: {log.due_date})</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => deleteWorkLog(log.id)}
                  className="self-end sm:self-center p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition active:scale-90"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
