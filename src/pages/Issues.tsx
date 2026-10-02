import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Issue, IssueStatus, IssuePriority } from '../types';
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  Hourglass,
  Filter,
  User,
  Calendar,
  X,
  Trash2,
  Flag
} from 'lucide-react';
import { format } from 'date-fns';

const PRIORITY_CONFIG: Record<IssuePriority, { label: string; cls: string }> = {
  High:   { label: '🔴 High',   cls: 'bg-red-950/60 text-red-300 border-red-800' },
  Medium: { label: '🟡 Medium', cls: 'bg-amber-950/60 text-amber-300 border-amber-800' },
  Low:    { label: '🟢 Low',    cls: 'bg-emerald-950/60 text-emerald-300 border-emerald-800' },
};

export const IssuesPage: React.FC = () => {
  const { issues, studies, addIssue, updateIssue, deleteIssue } = useData();

  const [activeTab, setActiveTab] = useState<'all' | 'waiting' | 'in_progress' | 'resolved'>('all');
  const [selectedStudyFilter, setSelectedStudyFilter] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [studyId, setStudyId] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('과제');
  const [priority, setPriority] = useState<IssuePriority>('Medium');
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [discoveredDate, setDiscoveredDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<IssueStatus>('진행중');
  const [isWaitingItem, setIsWaitingItem] = useState(false);
  const [waitingTarget, setWaitingTarget] = useState('');

  const openAddModal = () => {
    setSelectedIssue(null);
    setTitle('');
    setStudyId(studies[0]?.id || '');
    setDescription('');
    setCategory('과제');
    setPriority('Medium');
    setOwner('');
    setDueDate(format(new Date(), 'yyyy-MM-dd'));
    setDiscoveredDate(format(new Date(), 'yyyy-MM-dd'));
    setStatus('진행중');
    setIsWaitingItem(false);
    setWaitingTarget('');
    setIsModalOpen(true);
  };

  const openEditModal = (issue: Issue) => {
    setSelectedIssue(issue);
    setTitle(issue.title);
    setStudyId(issue.study_id || '');
    setDescription(issue.description || '');
    setCategory(issue.category);
    setPriority(issue.priority || 'Medium');
    setOwner(issue.owner || '');
    setDueDate(issue.due_date);
    setDiscoveredDate(issue.discovered_date || format(new Date(), 'yyyy-MM-dd'));
    setStatus(issue.status);
    setIsWaitingItem(issue.is_waiting_item || false);
    setWaitingTarget(issue.waiting_target || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title,
      study_id: studyId || undefined,
      description: description || undefined,
      category,
      priority,
      owner: owner || undefined,
      due_date: dueDate,
      discovered_date: discoveredDate || undefined,
      status,
      is_waiting_item: isWaitingItem,
      waiting_target: isWaitingItem ? waitingTarget : undefined,
    };

    if (selectedIssue) {
      await updateIssue(selectedIssue.id, payload);
    } else {
      await addIssue(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 이슈를 삭제하시겠습니까?')) return;
    await deleteIssue(id);
  };

  // Filter Issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (selectedStudyFilter && issue.study_id !== selectedStudyFilter) return false;
      if (activeTab === 'waiting') return issue.is_waiting_item;
      if (activeTab === 'in_progress') return issue.status === '진행중';
      if (activeTab === 'resolved') return issue.status === '해결';
      return true;
    });
  }, [issues, activeTab, selectedStudyFilter]);

  const getStatusBadge = (st: IssueStatus) => {
    switch (st) {
      case '진행중': return <span className="px-2.5 py-1 rounded-xl bg-blue-950/60 text-blue-300 border border-blue-800 text-xs font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 진행중</span>;
      case '보류':   return <span className="px-2.5 py-1 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-800 text-xs font-bold flex items-center gap-1"><Hourglass className="w-3.5 h-3.5" /> 보류</span>;
      case '해결':   return <span className="px-2.5 py-1 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 해결</span>;
    }
  };

  const getPriorityBadge = (p?: IssuePriority) => {
    if (!p) return null;
    const cfg = PRIORITY_CONFIG[p];
    return <span className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1 ${cfg.cls}`}><Flag className="w-3 h-3" />{cfg.label}</span>;
  };

  const waitingCount = useMemo(() => issues.filter(i => i.is_waiting_item).length, [issues]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Outstanding Issue & Waiting For</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            과제별 미결 이슈 관리 및 외부 회신 대기(Waiting for...) 모아보기
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-[0.98] shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>신규 이슈 등록</span>
        </button>
      </div>

      {/* Filter Tabs & Study Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: `전체 이슈 (${issues.length})`, activeClass: 'bg-blue-600 text-white shadow-md shadow-blue-600/30' },
            { key: 'waiting', label: `Waiting for... (${waitingCount})`, activeClass: 'bg-amber-600 text-white shadow-md shadow-amber-600/30' },
            { key: 'in_progress', label: '진행중', activeClass: 'bg-blue-600 text-white shadow-md shadow-blue-600/30' },
            { key: 'resolved', label: '해결 완료', activeClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
                activeTab === tab.key ? tab.activeClass : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tab.key === 'waiting' && <Hourglass className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-2xl border border-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStudyFilter}
            onChange={e => setSelectedStudyFilter(e.target.value)}
            className="bg-transparent text-xs font-semibold text-white focus:outline-none"
          >
            <option value="">전체 과제 필터</option>
            {studies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Issue Cards List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl text-xs">
            조건에 해당하는 이슈가 없습니다.
          </div>
        ) : (
          filteredIssues.map(issue => {
            const isOverdue = issue.status !== '해결' && new Date(issue.due_date) < new Date(format(new Date(), 'yyyy-MM-dd'));
            return (
              <div
                key={issue.id}
                onClick={() => openEditModal(issue)}
                className={`p-5 bg-slate-900 border rounded-3xl shadow-xl hover:border-blue-500/60 cursor-pointer transition space-y-3 ${
                  isOverdue ? 'border-rose-900/80 bg-rose-950/10' : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(issue.status)}
                    {getPriorityBadge(issue.priority)}
                    {issue.is_waiting_item && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-800/80 text-xs font-bold flex items-center gap-1">
                        <Hourglass className="w-3.5 h-3.5 text-amber-400" />
                        <span>Waiting: {issue.waiting_target || '회신대기'}</span>
                      </span>
                    )}
                    <span className="text-xs font-semibold text-blue-400">{issue.studies?.name || '공통 과제'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      Due: {issue.due_date} {isOverdue && '(지연됨)'}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white hover:text-blue-300 transition">{issue.title}</h3>
                  {issue.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{issue.description}</p>}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    {issue.owner && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>담당자: {issue.owner}</span>
                      </span>
                    )}
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300 font-medium">{issue.category}</span>
                    {issue.discovered_date && (
                      <span className="text-slate-500 text-[10px]">발견: {issue.discovered_date}</span>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(issue.id); }}
                    className="p-1 text-slate-600 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 my-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">
                  {selectedIssue ? '이슈 상세 및 수정' : '신규 이슈 등록'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 이슈 제목 */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">이슈 제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="예: IRB 변경 승인서 미회수건"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* 관련 과제 + 상태 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">관련 과제</label>
                  <select
                    value={studyId}
                    onChange={e => setStudyId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">과제 선택 안함 (공통)</option>
                    {studies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">상태</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as IssueStatus)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="진행중">진행중</option>
                    <option value="보류">보류</option>
                    <option value="해결">해결</option>
                  </select>
                </div>
              </div>

              {/* 우선순위 + 카테고리 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">우선순위</label>
                  <div className="flex gap-1.5">
                    {(['High', 'Medium', 'Low'] as IssuePriority[]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          priority === p
                            ? PRIORITY_CONFIG[p].cls
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {p === 'High' ? '🔴' : p === 'Medium' ? '🟡' : '🟢'} {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">카테고리</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="예: 과제 / IRB / Admin"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 담당자 + Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">담당자 (Owner)</label>
                  <input
                    type="text"
                    value={owner}
                    onChange={e => setOwner(e.target.value)}
                    placeholder="예: 김CRA / CRC"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Due Date (마감일)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* 발견일 */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">발견일 (Discovered Date)</label>
                <input
                  type="date"
                  value={discoveredDate}
                  onChange={e => setDiscoveredDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 이슈 상세 */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">이슈 상세 내용</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="이슈 배경, 전달사항 및 경과 내역..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Waiting For Section */}
              <div className="p-4 bg-slate-800/70 border border-slate-700/60 rounded-2xl space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isWaitingItem}
                    onChange={e => setIsWaitingItem(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Hourglass className="w-4 h-4" /> 외부/회신 대기 항목 (Waiting for...)
                  </span>
                </label>
                {isWaitingItem && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">대기 대상 (Target)</label>
                    <input
                      type="text"
                      value={waitingTarget}
                      onChange={e => setWaitingTarget(e.target.value)}
                      placeholder="예: 서울대병원 IRB 승인팀 / 의뢰자 안전성 관리팀"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      required={isWaitingItem}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700">
                  취소
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30">
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
