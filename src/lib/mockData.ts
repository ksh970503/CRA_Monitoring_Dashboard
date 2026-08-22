import type { Study, WorkLog, Training, Issue, WaitingItem, StudyContact, StudyMilestone } from '../types';
import { format, addDays, subDays } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');
const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
const in1Day = format(addDays(new Date(), 1), 'yyyy-MM-dd');
const in2Days = format(addDays(new Date(), 2), 'yyyy-MM-dd');

export const MOCK_STUDIES: Study[] = [
  {
    id: 's-1',
    name: 'ONCO-2024-III (위암 3상)',
    sponsor: '바이오제약',
    phase: 'Phase III',
    status: 'Active',
    site_total: 12,
    site_closed: 4,
    created_at: yesterday,
  },
  {
    id: 's-2',
    name: 'CARDIO-2025 (고혈압 2상)',
    sponsor: '한국메디컬',
    phase: 'Phase II',
    status: 'Active',
    site_total: 8,
    site_closed: 1,
    created_at: yesterday,
  },
  {
    id: 's-3',
    name: 'NEURO-101 (치매 신약 1상)',
    sponsor: '글로벌파마',
    phase: 'Phase I',
    status: 'Active',
    site_total: 3,
    site_closed: 0,
    created_at: yesterday,
  },
];

export const MOCK_CONTACTS: StudyContact[] = [
  { id: 'c-1', study_id: 's-1', role: 'CRA', name: '김철수 CRA', email: 'chulsoo@example.com', phone: '010-1234-5678' },
  { id: 'c-2', study_id: 's-1', role: 'DM', name: '이영희 Lead DM', email: 'younghee@example.com' },
  { id: 'c-3', study_id: 's-1', role: '의뢰자', name: '박이사 (Sponsor PM)', email: 'park@biopharm.com' },
  { id: 'c-4', study_id: 's-2', role: 'Safety', name: '정약사 Safety Lead' },
];

export const MOCK_MILESTONES: StudyMilestone[] = [
  { id: 'm-1', study_id: 's-1', title: 'COV (Site Visit)', done: true, done_date: '2025-10-15', sort_order: 1 },
  { id: 'm-2', study_id: 's-1', title: '재심사보고서 작성', done: false, sort_order: 2 },
  { id: 'm-3', study_id: 's-1', title: 'IRB 종료 보고', done: false, sort_order: 3 },
  { id: 'm-4', study_id: 's-1', title: 'TMF Closeout', done: false, sort_order: 4 },
  { id: 'm-5', study_id: 's-1', title: 'Study Closeout', done: false, sort_order: 5 },
];

export const MOCK_WORK_LOGS: WorkLog[] = [
  {
    id: 'wl-1',
    date: today,
    study_id: 's-1',
    work_type: 'Monitoring',
    content: '서울대병원 Site Visit & SDV 진행, Protocol deviation 2건 확인',
    hours: 5.5,
    needs_followup: true,
    next_action: '이상반응 보고서 추가 요청 및 PI 서명 회수',
    due_date: in1Day,
    created_at: today,
    studies: { name: 'ONCO-2024-III (위암 3상)' },
  },
  {
    id: 'wl-2',
    date: today,
    study_id: 's-2',
    work_type: 'Report',
    content: '세브란스병원 MVR (Monitoring Visit Report) 작성 완료',
    hours: 2.5,
    needs_followup: false,
    created_at: today,
    studies: { name: 'CARDIO-2025 (고혈압 2상)' },
  },
  {
    id: 'wl-3',
    date: yesterday,
    study_id: null,
    work_type: 'Admin',
    content: '월간 팀 미팅 참석 및 Q3 목표 점검',
    hours: 2.0,
    needs_followup: false,
    created_at: yesterday,
  },
];

export const MOCK_TRAININGS: Training[] = [
  {
    id: 't-1',
    name: '2026 RMP (위험관리계획) 정기 GCP 교육',
    status: '예정',
    due_date: in2Days,
    link: 'https://example.com/rmp-training',
  },
  {
    id: 't-2',
    name: '임상시험 종사자 보수교육 (CRA 심화)',
    status: '예정',
    due_date: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
    link: 'https://example.com/cra-advanced',
  },
  {
    id: 't-3',
    name: '보안 및 개인정보보호 교육',
    status: '완료',
    due_date: '2026-01-15',
    completed_date: '2026-01-10',
  },
];

export const MOCK_ISSUES: Issue[] = [
  {
    id: 'i-1',
    study_id: 's-1',
    title: '서울대병원 AE/SAE 미보고 건 PI 서명 지연',
    description: '102번 대상자 SAE 보고서 PI 최종 서명이 3일째 지연 중',
    category: 'Safety',
    owner: '김철수 CRA',
    due_date: today, // 🔴 오늘 마감
    status: '진행중',
    is_waiting_item: true,
    waiting_target: '서울대병원 CRC 박선생',
    discovered_date: yesterday,
    related_files: 'https://mail.google.com/mail/u/0/#inbox/12345',
    studies: { name: 'ONCO-2024-III (위암 3상)' },
  },
  {
    id: 'i-2',
    study_id: 's-2',
    title: '세브란스병원 IP (임상시험용의약품) 수량 재고 불일치',
    description: '약제실 반납분 2키트 누락 확인 필요',
    category: 'IP Management',
    owner: '이영희 DM',
    due_date: in2Days, // 🟠 3일 내 마감
    status: '진행중',
    is_waiting_item: true,
    waiting_target: '세브란스 약제부 담당자',
    discovered_date: yesterday,
    studies: { name: 'CARDIO-2025 (고혈압 2상)' },
  },
  {
    id: 'i-3',
    study_id: 's-1',
    title: 'IRB 변경승인 통보서 미수령',
    description: '시험자 변경 건 IRB 승인 문서 미수령 상태',
    category: 'IRB',
    owner: 'CRC 김선생',
    due_date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), // 🔴 Overdue
    status: '보류',
    is_waiting_item: false,
    discovered_date: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
    studies: { name: 'ONCO-2024-III (위암 3상)' },
  },
];

export const MOCK_WAITING: WaitingItem[] = [
  {
    id: 'w-1',
    issue_id: 'i-1',
    study_id: 's-1',
    title: 'SAE 서명문서 PI 스캔본 회수 대기',
    waiting_on: '서울대병원 CRC 박선생',
    created_date: yesterday,
    resolved: false,
    studies: { name: 'ONCO-2024-III (위암 3상)' },
  },
  {
    id: 'w-2',
    issue_id: 'i-2',
    study_id: 's-2',
    title: '약제실 IP 불일치 확인 답변',
    waiting_on: '세브란스 약제부 담당자',
    created_date: yesterday,
    resolved: false,
    studies: { name: 'CARDIO-2025 (고혈압 2상)' },
  },
];
