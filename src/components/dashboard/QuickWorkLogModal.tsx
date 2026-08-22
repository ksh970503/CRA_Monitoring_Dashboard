import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { WorkType } from '../../types';
import { X, Plus, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface QuickWorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickWorkLogModal: React.FC<QuickWorkLogModalProps> = ({ isOpen, onClose }) => {
  const { studies, addWorkLog } = useData();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [studyId, setStudyId] = useState<string>('');
  const [workType, setWorkType] = useState<WorkType>('CRA');
  const [content, setContent] = useState('');
  const [hours, setHours] = useState(1);
  const [needsFollowup, setNeedsFollowup] = useState(false);
  const [nextAction, setNextAction] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  if (!isOpen) return null;

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

    // Reset & Close
    setContent('');
    setNeedsFollowup(false);
    setNextAction('');
    onClose();
  };

  const WORK_TYPES: WorkType[] = [
    'CRA', 'PL', 'Client communication', 'Meeting', 'Admin', 'IRB', 'Monitoring', 'Report', '기타'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">오늘 업무 추가</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">날짜</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">과제 선택 (선택)</label>
              <select
                value={studyId}
                onChange={(e) => setStudyId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">공통 / 과제 지정 안 함</option>
                {studies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">업무 유형</label>
            <div className="flex flex-wrap gap-1.5">
              {WORK_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setWorkType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    workType === type
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
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
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              required
            />
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
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Follow-up Section */}
          <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={needsFollowup}
                onChange={(e) => setNeedsFollowup(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Follow-up 필요 (Issue 자동 생성)
              </span>
            </label>

            {needsFollowup && (
              <div className="space-y-3 pt-2 border-t border-slate-700/50 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Next Action</label>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    placeholder="예: 이상반응 보고서 서명 회수 및 CRC 확인 요청"
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

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30"
            >
              업무일지 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
