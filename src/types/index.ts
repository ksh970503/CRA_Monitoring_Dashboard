export type StudyStatus = 'Active' | 'Closed' | 'Suspended' | 'Completed';
export type ContactRole = 'CRA' | 'DM' | 'Safety' | 'PV' | '통계' | '의뢰자' | '기타';
export type WorkType = 'CRA' | 'PL' | 'Client communication' | 'Meeting' | 'Admin' | 'IRB' | 'Monitoring' | 'Report' | '기타';
export type TrainingStatus = '완료' | '예정' | '미수강';
export type IssueStatus = '진행중' | '보류' | '해결';

export interface Study {
  id: string;
  user_id?: string;
  name: string;
  sponsor?: string;
  phase?: string;
  status: StudyStatus;
  site_total: number;
  site_closed: number;
  created_at?: string;
  updated_at?: string;
}

export interface StudyContact {
  id: string;
  user_id?: string;
  study_id: string;
  role: ContactRole;
  name: string;
  org?: string;
  email?: string;
  phone?: string;
}

export interface StudyMilestone {
  id: string;
  user_id?: string;
  study_id: string;
  title: string;
  done: boolean;
  due_date?: string;
  done_date?: string;
  sort_order?: number;
}

export interface WorkLog {
  id: string;
  user_id?: string;
  date: string;
  study_id?: string | null;
  work_type: WorkType;
  content: string;
  hours: number;
  needs_followup: boolean;
  next_action?: string;
  due_date?: string;
  created_at?: string;
  studies?: { name: string } | null;
}

export interface Training {
  id: string;
  user_id?: string;
  name: string;
  status: TrainingStatus;
  due_date?: string;
  link?: string;
  completed_date?: string;
  certificate_file_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Issue {
  id: string;
  user_id?: string;
  study_id?: string | null;
  title: string;
  description?: string;
  category: string;
  owner?: string;
  due_date: string;
  status: IssueStatus;
  is_waiting_item?: boolean;
  waiting_target?: string;
  discovered_date?: string;
  related_files?: string;
  last_updated?: string;
  created_at?: string;
  source_log_id?: string;
  studies?: { name: string } | null;
}

export interface WaitingItem {
  id: string;
  user_id?: string;
  issue_id?: string | null;
  study_id?: string | null;
  title: string;
  waiting_on: string;
  created_date: string;
  resolved: boolean;
  created_at?: string;
  studies?: { name: string } | null;
  issues?: { title: string } | null;
}

export interface DashboardSummary {
  dueTodayCount: number;
  dueWithin3DaysCount: number;
  waitingCount: number;
  overdueCount: number;
  trainingUpcomingCount: number;
  workLogMissingToday: boolean;
}
