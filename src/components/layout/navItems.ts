import { LayoutDashboard, BookOpen, GraduationCap, FolderKanban, AlertCircle, LogOut } from 'lucide-react';

export const NAV_ITEMS = [
  { path: '/', label: '홈 대시보드', icon: LayoutDashboard },
  { path: '/worklog', label: '업무일지', icon: BookOpen },
  { path: '/trainings', label: 'RMP 교육', icon: GraduationCap },
  { path: '/studies', label: '과제별 현황', icon: FolderKanban },
  { path: '/issues', label: 'Issue 관리', icon: AlertCircle },
];
