import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ContactRole } from '../types';
import {
  ArrowLeft,
  Building,
  CheckSquare,
  Square,
  Plus,
  UserPlus,
  Users,
  Trash2
} from 'lucide-react';

export const StudyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    studies,
    milestones,
    contacts,
    updateStudy,
    toggleMilestone,
    addMilestone,
    deleteMilestone,
    addContact,
    deleteContact
  } = useData();

  const study = studies.find((s) => s.id === id);

  // New Milestone State
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDue, setNewMilestoneDue] = useState('');

  // New Contact State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState<ContactRole>('CRA');
  const [contactOrg, setContactOrg] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  if (!study) {
    return (
      <div className="p-8 text-center text-gray-500 space-y-4">
        <p>존재하지 않는 과제입니다.</p>
        <Link to="/studies" className="text-blue-400 underline">과제 목록으로 돌아가기</Link>
      </div>
    );
  }

  const studyMilestones = milestones.filter((m) => m.study_id === study.id);
  const studyContacts = contacts.filter((c) => c.study_id === study.id);

  const progressPercent = study.site_total > 0 ? Math.round((study.site_closed / study.site_total) * 100) : 0;

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    await addMilestone({
      study_id: study.id,
      title: newMilestoneTitle,
      due_date: newMilestoneDue || undefined,
      done: false,
    });

    setNewMilestoneTitle('');
    setNewMilestoneDue('');
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) return;

    await addContact({
      study_id: study.id,
      name: contactName,
      role: contactRole,
      org: contactOrg || undefined,
      email: contactEmail || undefined,
      phone: contactPhone || undefined,
    });

    setContactName('');
    setContactOrg('');
    setContactEmail('');
    setContactPhone('');
    setIsContactModalOpen(false);
  };

  const ROLES: ContactRole[] = ['CRA', 'DM', 'Safety', 'PV', '통계', '의뢰자', '기타'];

  return (
    <div className="space-y-8">
      {/* Top Bar with Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/studies')}
          className="p-2.5 bg-white border border-gray-100 hover:border-gray-200 text-gray-700 rounded-2xl transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xs text-blue-400 font-semibold tracking-wider uppercase">{study.phase}</span>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">{study.name}</h1>
        </div>
      </div>

      {/* Overview & Site Counter Card */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Building className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500 text-xs font-semibold">Sponsor:</span>
              <input
                type="text"
                defaultValue={study.sponsor || ''}
                onBlur={e => {
                  const val = e.target.value.trim();
                  if (val !== (study.sponsor || '')) updateStudy(study.id, { sponsor: val || undefined });
                }}
                placeholder="의뢰자명 입력"
                className="bg-gray-100 border border-gray-200 text-gray-900 text-sm font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 min-w-[160px]"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-gray-500 text-xs font-semibold">Phase:</span>
              <select
                value={study.phase || ''}
                onChange={e => updateStudy(study.id, { phase: e.target.value })}
                className="bg-gray-100 border border-gray-200 text-gray-900 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500"
              >
                {['Phase I', 'Phase II', 'Phase III', 'Phase IV', 'PMS', '기타'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">상태:</span>
            <select
              value={study.status}
              onChange={(e) => updateStudy(study.id, { status: e.target.value as any })}
              className="bg-gray-100 border border-gray-200 text-xs font-bold text-gray-900 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Closed">Closed</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Site Progress Adjuster */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-gray-700">Site 진행 현황 ({study.site_closed} / {study.site_total} Closed)</span>
            <span className="text-blue-400 font-mono text-sm font-bold">{progressPercent}%</span>
          </div>

          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs text-gray-500">Closed Site 수 조절:</span>
            <button
              onClick={() => updateStudy(study.id, { site_closed: Math.max(0, study.site_closed - 1) })}
              className="w-7 h-7 bg-gray-100 hover:bg-gray-100 text-gray-900 rounded-lg text-xs font-bold"
            >
              -
            </button>
            <span className="text-xs font-mono font-bold text-gray-900">{study.site_closed}</span>
            <button
              onClick={() => updateStudy(study.id, { site_closed: Math.min(study.site_total, study.site_closed + 1) })}
              className="w-7 h-7 bg-gray-100 hover:bg-gray-100 text-gray-900 rounded-lg text-xs font-bold"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Grid Section: Milestones & Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customizable Milestones Checklist Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-gray-900">마일스톤 체크리스트</h2>
            </div>
            <span className="text-xs text-gray-500">
              {studyMilestones.filter((m) => m.done).length} / {studyMilestones.length} 완료
            </span>
          </div>

          {/* New Milestone Input */}
          <form onSubmit={handleAddMilestone} className="flex gap-2">
            <input
              type="text"
              placeholder="새 마일스톤 (예: IRB 종료 보고)"
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none"
            />
            <input
              type="date"
              value={newMilestoneDue}
              onChange={(e) => setNewMilestoneDue(e.target.value)}
              className="w-32 bg-gray-100 border border-gray-200 rounded-xl px-2 py-2 text-xs text-gray-900 focus:outline-none"
            />
            <button
              type="submit"
              className="p-2 bg-blue-600 hover:-white rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Milestones List */}
          <div className="space-y-2">
            {studyMilestones.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">등록된 마일스톤이 없습니다.</p>
            ) : (
              studyMilestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-2xl hover:border-gray-200 transition"
                >
                  <button
                    onClick={() => toggleMilestone(m.id)}
                    className="flex items-center gap-3 text-left flex-1"
                  >
                    {m.done ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                    <span className={`text-xs font-semibold ${m.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {m.title}
                    </span>
                  </button>

                  <div className="flex items-center gap-3">
                    {m.due_date && (
                      <span className="text-[11px] font-mono text-gray-400">Due: {m.due_date}</span>
                    )}
                    <button
                      onClick={() => deleteMilestone(m.id)}
                      className="p-1 text-gray-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Study Contacts Directory Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-gray-900">과제 담당자 연락처</h2>
            </div>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-semibold text-xs rounded-xl transition flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>담당자 추가</span>
            </button>
          </div>

          <div className="space-y-3">
            {studyContacts.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">등록된 담당자 연락처가 없습니다.</p>
            ) : (
              studyContacts.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-indigo-300 text-[10px] font-bold">
                        {c.role}
                      </span>
                      <strong className="text-xs text-gray-900">{c.name}</strong>
                      {c.org && <span className="text-[11px] text-gray-500">({c.org})</span>}
                    </div>
                    <div className="text-[11px] text-gray-500 flex flex-wrap gap-3">
                      {c.email && <span>📧 {c.email}</span>}
                      {c.phone && <span>📞 {c.phone}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteContact(c.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">신규 담당자 등록</h2>
            <form onSubmit={handleAddContact} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">이름</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="예: 홍길동 CRA"
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">역할 (Role)</label>
                <select
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value as ContactRole)}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">소속 / 병원</label>
                <input
                  type="text"
                  value={contactOrg}
                  onChange={(e) => setContactOrg(e.target.value)}
                  placeholder="예: 서울대병원 임상시험센터"
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">이메일</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">전화번호</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl -white text-xs font-semibold"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
