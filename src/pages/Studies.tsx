import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Study, StudyStatus } from '../types';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, ChevronRight, Building, Layers, CheckSquare, Users, X } from 'lucide-react';

export const StudiesPage: React.FC = () => {
  const { studies, milestones, contacts, addStudy } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [sponsor, setSponsor] = useState('');
  const [phase, setPhase] = useState('Phase III');
  const [status, setStatus] = useState<StudyStatus>('Active');
  const [siteTotal, setSiteTotal] = useState(5);
  const [siteClosed, setSiteClosed] = useState(0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addStudy({
      name,
      sponsor,
      phase,
      status,
      site_total: Number(siteTotal),
      site_closed: Number(siteClosed),
    });

    setName('');
    setSponsor('');
    setIsModalOpen(false);
  };

  const getStatusBadge = (st: StudyStatus) => {
    switch (st) {
      case 'Active':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-bold">Active</span>;
      case 'Suspended':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800 text-xs font-bold">Suspended</span>;
      case 'Closed':
      case 'Completed':
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold">{st}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">과제별 현황 (Studies)</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            담당 과제 목록, Site 진행률, 마일스톤 및 주요 담당자 정보
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-[0.98] shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>신규 과제 등록</span>
        </button>
      </div>

      {/* Study Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studies.map((study) => {
          const studyMilestones = milestones.filter((m) => m.study_id === study.id);
          const completedCount = studyMilestones.filter((m) => m.done).length;
          const studyContacts = contacts.filter((c) => c.study_id === study.id);
          const progressPercent = study.site_total > 0 ? Math.round((study.site_closed / study.site_total) * 100) : 0;

          return (
            <Link
              key={study.id}
              to={`/studies/${study.id}`}
              className="group bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded-3xl p-6 shadow-xl transition-all duration-200 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-blue-400 tracking-wide uppercase">{study.phase || 'Phase N/A'}</span>
                    <h2 className="text-lg font-bold text-white group-hover:text-blue-300 transition line-clamp-1">
                      {study.name}
                    </h2>
                  </div>
                  {getStatusBadge(study.status)}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{study.sponsor || 'Sponsor 미지정'}</span>
                  </div>
                </div>
              </div>

              {/* Progress & Quick Stats */}
              <div className="space-y-3">
                {/* Site Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Site 진행률 ({study.site_closed}/{study.site_total} Closed)</span>
                    <span className="text-blue-400 font-mono">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Footer stats */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>마일스톤 ({completedCount}/{studyMilestones.length})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>담당자 {studyContacts.length}명</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Add Study Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">신규 과제 등록</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">과제명</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: ONCO-2024-III (위암 3상)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Sponsor (의뢰자)</label>
                <input
                  type="text"
                  value={sponsor}
                  onChange={(e) => setSponsor(e.target.value)}
                  placeholder="예: 바이오제약"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phase</label>
                  <select
                    value={phase}
                    onChange={(e) => setPhase(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Phase I">Phase I</option>
                    <option value="Phase II">Phase II</option>
                    <option value="Phase III">Phase III</option>
                    <option value="Phase IV">Phase IV</option>
                    <option value="NIS / 관찰연구">NIS / 관찰연구</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StudyStatus)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Closed">Closed</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">전체 Site 수</label>
                  <input
                    type="number"
                    min="1"
                    value={siteTotal}
                    onChange={(e) => setSiteTotal(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">종료(Closed) Site 수</label>
                  <input
                    type="number"
                    min="0"
                    max={siteTotal}
                    value={siteClosed}
                    onChange={(e) => setSiteClosed(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
