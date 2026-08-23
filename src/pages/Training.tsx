import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Training, TrainingStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  GraduationCap,
  Plus,
  ExternalLink,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Trash2,
  X,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

export const TrainingPage: React.FC = () => {
  const { trainings, addTraining, updateTraining, deleteTraining } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [status, setStatus] = useState<TrainingStatus>('미수강');
  const [dueDate, setDueDate] = useState('');
  const [link, setLink] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState('');

  const openAddModal = () => {
    setSelectedTraining(null);
    setName('');
    setStatus('미수강');
    setDueDate(format(new Date(), 'yyyy-MM-dd'));
    setLink('');
    setCompletedDate('');
    setCertificateUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Training) => {
    setSelectedTraining(t);
    setName(t.name);
    setStatus(t.status);
    setDueDate(t.due_date || '');
    setLink(t.link || '');
    setCompletedDate(t.completed_date || '');
    setCertificateUrl(t.certificate_file_url || '');
    setIsModalOpen(true);
  };

  // Handle Certificate Upload to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSupabaseConfigured) {
      // Local fallback simulation
      const fakeUrl = URL.createObjectURL(file);
      setCertificateUrl(fakeUrl);
      alert('로컬 데모 모드: 수료증 파일이 가상으로 첨부되었습니다.');
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `certificates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath);

      setCertificateUrl(data.publicUrl);
      alert('수료증 파일이 업로드되었습니다.');
    } catch (err: any) {
      alert('파일 업로드 오류: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (selectedTraining) {
      await updateTraining(selectedTraining.id, {
        name,
        status,
        due_date: dueDate || undefined,
        link: link || undefined,
        completed_date: status === '완료' ? (completedDate || format(new Date(), 'yyyy-MM-dd')) : undefined,
        certificate_file_url: certificateUrl || undefined,
      });
    } else {
      await addTraining({
        name,
        status,
        due_date: dueDate || undefined,
        link: link || undefined,
        completed_date: status === '완료' ? (completedDate || format(new Date(), 'yyyy-MM-dd')) : undefined,
        certificate_file_url: certificateUrl || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const getStatusBadge = (st: TrainingStatus) => {
    switch (st) {
      case '완료':
        return <span className="px-2.5 py-1 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-xs font-bold flex items-center gap-1 shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /> 완료</span>;
      case '예정':
        return <span className="px-2.5 py-1 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-800 text-xs font-bold flex items-center gap-1 shrink-0"><Clock className="w-3.5 h-3.5" /> 예정</span>;
      case '미수강':
        return <span className="px-2.5 py-1 rounded-xl bg-rose-950/60 text-rose-300 border border-rose-800 text-xs font-bold flex items-center gap-1 shrink-0"><AlertCircle className="w-3.5 h-3.5" /> 미수강</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-6 rounded-3xl shadow-xl backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">RMP & 필수 교육관리</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            수강 기한 모니터링, 교육 링크 연결 및 수료증 파일 저장
          </p>
        </div>
        
        <button
          onClick={openAddModal}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>신규 교육 등록</span>
        </button>
      </div>

      {/* 📱 Mobile Card List (md:hidden) */}
      <div className="space-y-3 md:hidden">
        {trainings.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
            등록된 교육이 없습니다.
          </div>
        ) : (
          trainings.map((t) => (
            <div
              key={t.id}
              onClick={() => openEditModal(t)}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg hover:border-slate-700 active:scale-[0.99] transition card-spring cursor-pointer"
            >
              {/* Header: Name + Badge */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-white text-base leading-snug break-keep">
                  {t.name}
                </h3>
                {getStatusBadge(t.status)}
              </div>

              {/* Info Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>수강기한: <strong className="text-white font-mono">{t.due_date || '-'}</strong></span>
                </div>

                {t.completed_date && (
                  <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>완료일: <strong className="text-emerald-300 font-mono">{t.completed_date}</strong></span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {t.link && (
                    <a
                      href={t.link}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-blue-950/70 hover:bg-blue-900 border border-blue-800 text-blue-300 font-medium rounded-lg flex items-center gap-1.5 active:scale-95 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span>교육 접속</span>
                    </a>
                  )}

                  {t.certificate_file_url && (
                    <a
                      href={t.certificate_file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-medium rounded-lg flex items-center gap-1.5 active:scale-95 transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>수료증 보기</span>
                    </a>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    if (!window.confirm('이 교육 항목을 삭제하시겠습니까?')) return;
                    deleteTraining(t.id);
                  }}
                  className="p-2 text-slate-500 hover:text-rose-400 rounded-lg active:scale-90 transition"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 🖥️ Desktop Trainings Table (hidden md:block) */}
      <div className="hidden md:block bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur-sm card-spring">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">교육명</th>
                <th className="px-6 py-4">상태</th>
                <th className="px-6 py-4">수강기한 (Due Date)</th>
                <th className="px-6 py-4">완료일</th>
                <th className="px-6 py-4 text-center">수료증/링크</th>
                <th className="px-6 py-4 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {trainings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                    등록된 교육이 없습니다.
                  </td>
                </tr>
              ) : (
                trainings.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => openEditModal(t)}
                    className="hover:bg-slate-800/60 cursor-pointer transition-colors duration-150"
                  >
                    <td className="px-6 py-4 font-semibold text-white">{t.name}</td>
                    <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-300">
                      {t.due_date || '-'}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {t.completed_date || '-'}
                    </td>
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {t.link && (
                          <a
                            href={t.link}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-xs flex items-center gap-1 active:scale-95 transition"
                            title="교육 링크 이동"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {t.certificate_file_url && (
                          <a
                            href={t.certificate_file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs flex items-center gap-1 active:scale-95 transition"
                            title="수료증 보기"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { if (window.confirm('이 교육 항목을 삭제하시겠습니까?')) deleteTraining(t.id); }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition active:scale-90"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">
                  {selectedTraining ? '교육 정보 수정' : '신규 교육 등록'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg active:scale-95 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">교육명</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 2026 RMP 정기 GCP 교육"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">상태</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TrainingStatus)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="미수강">미수강</option>
                    <option value="예정">예정</option>
                    <option value="완료">완료</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">수강기한 (Due Date)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">교육 접속 URL 링크 (선택)</label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {status === '완료' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">완료일</label>
                  <input
                    type="date"
                    value={completedDate}
                    onChange={(e) => setCompletedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Certificate File Upload */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                <label className="block text-xs font-semibold text-slate-300">수료증 파일 첨부 (Supabase Storage)</label>
                
                {certificateUrl ? (
                  <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl text-xs">
                    <span className="text-emerald-400 font-semibold truncate max-w-[240px]">
                      ✅ 수료증 파일 첨부됨
                    </span>
                    <a
                      href={certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 underline font-medium"
                    >
                      보기
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95">
                      <Upload className="w-4 h-4 text-blue-400" />
                      <span>{uploading ? '업로드 중...' : '파일 선택'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-400">PDF, PNG, JPG 지원</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 active:scale-95 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 active:scale-95 transition"
                >
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
