import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Study, WorkLog, Training, Issue, WaitingItem, StudyContact, StudyMilestone, DashboardSummary } from '../types';
import { MOCK_STUDIES, MOCK_CONTACTS, MOCK_MILESTONES, MOCK_WORK_LOGS, MOCK_TRAININGS, MOCK_ISSUES, MOCK_WAITING } from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { format, addDays } from 'date-fns';

interface DataContextType {
  studies: Study[];
  contacts: StudyContact[];
  milestones: StudyMilestone[];
  workLogs: WorkLog[];
  trainings: Training[];
  issues: Issue[];
  waitingItems: WaitingItem[];
  loading: boolean;
  isOnline: boolean;
  isDemoMode: boolean;
  resetDemoData: () => void;
  
  // Handlers
  addWorkLog: (log: Omit<WorkLog, 'id' | 'created_at'>) => Promise<void>;
  deleteWorkLog: (id: string) => Promise<void>;
  
  addStudy: (study: Omit<Study, 'id' | 'created_at' | 'updated_at'>) => Promise<Study>;
  updateStudy: (id: string, updates: Partial<Study>) => Promise<void>;
  deleteStudy: (id: string) => Promise<void>;

  addContact: (contact: Omit<StudyContact, 'id'>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  
  toggleMilestone: (id: string) => Promise<void>;
  addMilestone: (milestone: Omit<StudyMilestone, 'id'>) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;

  addTraining: (training: Omit<Training, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTraining: (id: string, updates: Partial<Training>) => Promise<void>;
  deleteTraining: (id: string) => Promise<void>;

  addIssue: (issue: Omit<Issue, 'id' | 'created_at' | 'last_updated'>) => Promise<void>;
  updateIssue: (id: string, updates: Partial<Issue>) => Promise<void>;
  deleteIssue: (id: string) => Promise<void>;

  addWaitingItem: (item: Omit<WaitingItem, 'id' | 'created_at'>) => Promise<void>;
  toggleWaitingResolved: (id: string) => Promise<void>;

  getDashboardSummary: () => DashboardSummary;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const getStorageKeys = (prefix: string) => ({
  STUDIES: `${prefix}_cra_monitoring_studies`,
  CONTACTS: `${prefix}_cra_monitoring_contacts`,
  MILESTONES: `${prefix}_cra_monitoring_milestones`,
  WORK_LOGS: `${prefix}_cra_monitoring_work_logs`,
  TRAININGS: `${prefix}_cra_monitoring_trainings`,
  ISSUES: `${prefix}_cra_monitoring_issues`,
  WAITING: `${prefix}_cra_monitoring_waiting`,
});

interface DataProviderProps {
  children: React.ReactNode;
  userId?: string | null;   // null/undefined = guest (demo) mode
  isGuest?: boolean;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children, userId, isGuest = false }) => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [contacts, setContacts] = useState<StudyContact[]>([]);
  const [milestones, setMilestones] = useState<StudyMilestone[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [waitingItems, setWaitingItems] = useState<WaitingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // localStorage 키 prefix: 로그인 유저는 userId, 데모는 'guest'
  const storagePrefix = userId ? `user_${userId}` : 'guest';

  // Helper to load sample mock data into state
  const loadMockData = useCallback((keys: ReturnType<typeof getStorageKeys>) => {
    setStudies(MOCK_STUDIES);
    setContacts(MOCK_CONTACTS);
    setMilestones(MOCK_MILESTONES);
    setWorkLogs(MOCK_WORK_LOGS);
    setTrainings(MOCK_TRAININGS);
    setIssues(MOCK_ISSUES);
    setWaitingItems(MOCK_WAITING);

    localStorage.setItem(keys.STUDIES, JSON.stringify(MOCK_STUDIES));
    localStorage.setItem(keys.CONTACTS, JSON.stringify(MOCK_CONTACTS));
    localStorage.setItem(keys.MILESTONES, JSON.stringify(MOCK_MILESTONES));
    localStorage.setItem(keys.WORK_LOGS, JSON.stringify(MOCK_WORK_LOGS));
    localStorage.setItem(keys.TRAININGS, JSON.stringify(MOCK_TRAININGS));
    localStorage.setItem(keys.ISSUES, JSON.stringify(MOCK_ISSUES));
    localStorage.setItem(keys.WAITING, JSON.stringify(MOCK_WAITING));
  }, []);

  // Reset/restore sample data manually
  const resetDemoData = useCallback(() => {
    const keys = getStorageKeys(storagePrefix);
    localStorage.removeItem(keys.STUDIES);
    localStorage.removeItem(keys.CONTACTS);
    localStorage.removeItem(keys.MILESTONES);
    localStorage.removeItem(keys.WORK_LOGS);
    localStorage.removeItem(keys.TRAININGS);
    localStorage.removeItem(keys.ISSUES);
    localStorage.removeItem(keys.WAITING);
    loadMockData(keys);
  }, [storagePrefix, loadMockData]);

  // Initialize data from Supabase or localStorage/Mock
  // userId 변경 시 재로드 (로그인/로그아웃/유저 전환)
  useEffect(() => {
    const keys = getStorageKeys(storagePrefix);

    async function loadData() {
      setLoading(true);

      // 데모(게스트) 모드: mock 데이터(localStorage)에서 로드
      if (isGuest || !isSupabaseConfigured || !userId) {
        loadFromLocalOrMock(keys);
        setLoading(false);
        return;
      }

      // Supabase 연결 + 로그인 유저: DB에서 로드
      try {
        const [sRes, cRes, mRes, wRes, tRes, iRes, wtRes] = await Promise.all([
          supabase.from('studies').select('*').order('created_at', { ascending: false }),
          supabase.from('study_contacts').select('*'),
          supabase.from('study_milestones').select('*').order('sort_order'),
          supabase.from('work_logs').select('*, studies(name)').order('date', { ascending: false }),
          supabase.from('trainings').select('*').order('due_date'),
          supabase.from('issues').select('*, studies(name)').order('due_date'),
          supabase.from('waiting_items').select('*, studies(name), issues(title)'),
        ]);

        if (sRes.data && sRes.data.length > 0) {
          setStudies(sRes.data);
          if (cRes.data) setContacts(cRes.data);
          if (mRes.data) setMilestones(mRes.data);
          if (wRes.data) setWorkLogs(wRes.data);
          if (tRes.data) setTrainings(tRes.data);
          if (iRes.data) setIssues(iRes.data);
          if (wtRes.data) setWaitingItems(wtRes.data);
        } else {
          // 이 유저의 DB 데이터가 없으면 → 해당 유저 localStorage 확인 후 빈 상태로 시작
          loadFromLocalOrMock(keys);
        }

      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local/mock data:', err);
        loadFromLocalOrMock(keys);
      }
      setLoading(false);
    }

    function loadFromLocalOrMock(k: ReturnType<typeof getStorageKeys>) {
      const getLocal = <T,>(key: string, fallback: T): T => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      };

      const loadedStudies = getLocal(k.STUDIES, null as unknown as Study[]);

      // 해당 prefix의 localStorage가 비어 있으면:
      // - 게스트 모드: mock 데이터 로드
      // - 로그인 유저: 빈 상태(새 유저)로 시작
      if (!loadedStudies || loadedStudies.length === 0) {
        if (isGuest) {
          loadMockData(k);
        } else {
          // 신규 로그인 유저 - 빈 상태
          setStudies([]);
          setContacts([]);
          setMilestones([]);
          setWorkLogs([]);
          setTrainings([]);
          setIssues([]);
          setWaitingItems([]);
        }
        return;
      }

      const emptyArr: never[] = [];
      setStudies(loadedStudies);
      setContacts(getLocal(k.CONTACTS, emptyArr));
      setMilestones(getLocal(k.MILESTONES, emptyArr));
      setWorkLogs(getLocal(k.WORK_LOGS, emptyArr));
      setTrainings(getLocal(k.TRAININGS, emptyArr));
      setIssues(getLocal(k.ISSUES, emptyArr));
      setWaitingItems(getLocal(k.WAITING, emptyArr));
    }

    loadData();
  }, [userId, isGuest, storagePrefix, loadMockData]);

  // Sync to localStorage (유저별 prefix로 저장)
  useEffect(() => {
    if (!loading) {
      const keys = getStorageKeys(storagePrefix);
      localStorage.setItem(keys.STUDIES, JSON.stringify(studies));
      localStorage.setItem(keys.CONTACTS, JSON.stringify(contacts));
      localStorage.setItem(keys.MILESTONES, JSON.stringify(milestones));
      localStorage.setItem(keys.WORK_LOGS, JSON.stringify(workLogs));
      localStorage.setItem(keys.TRAININGS, JSON.stringify(trainings));
      localStorage.setItem(keys.ISSUES, JSON.stringify(issues));
      localStorage.setItem(keys.WAITING, JSON.stringify(waitingItems));
    }
  }, [studies, contacts, milestones, workLogs, trainings, issues, waitingItems, loading, storagePrefix]);

  // WorkLog Add + Auto Issue creation
  const addWorkLog = async (logData: Omit<WorkLog, 'id' | 'created_at'>) => {
    const newLog: WorkLog = {
      ...logData,
      id: 'wl-' + Date.now(),
      created_at: new Date().toISOString(),
      studies: studies.find(s => s.id === logData.study_id) ? { name: studies.find(s => s.id === logData.study_id)!.name } : null
    };

    if (isSupabaseConfigured && !isGuest) {
      const { data, error } = await supabase.from('work_logs').insert([{
        date: logData.date,
        study_id: logData.study_id || null,
        work_type: logData.work_type,
        content: logData.content,
        hours: logData.hours,
        needs_followup: logData.needs_followup,
        next_action: logData.next_action || null,
        due_date: logData.due_date || null
      }]).select('*, studies(name)').single();
      
      if (!error && data) {
        newLog.id = data.id;
      }
    }

    setWorkLogs(prev => [newLog, ...prev]);

    // Requirements: If Follow-up = Yes, automatically create an Issue
    if (logData.needs_followup && logData.next_action) {
      await addIssue({
        study_id: logData.study_id || null,
        title: `[Follow-up] ${logData.next_action}`,
        description: `업무일지 자동 생성 (${logData.date} ${logData.work_type}): ${logData.content}`,
        category: logData.work_type,
        owner: '담당 CRA/PL',
        due_date: logData.due_date || logData.date,
        status: '진행중',
        discovered_date: logData.date,
        source_log_id: newLog.id
      });
    }
  };

  const deleteWorkLog = async (id: string) => {
    if (isSupabaseConfigured && !isGuest) {
      await supabase.from('work_logs').delete().eq('id', id);
    }
    setWorkLogs(prev => prev.filter(w => w.id !== id));
  };

  // Study CRUD
  const addStudy = async (studyData: Omit<Study, 'id' | 'created_at' | 'updated_at'>) => {
    const newStudy: Study = {
      ...studyData,
      id: 's-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured && !isGuest) {
      const { data } = await supabase.from('studies').insert([studyData]).select().single();
      if (data) newStudy.id = data.id;
    }
    setStudies(prev => [newStudy, ...prev]);
    return newStudy;
  };

  const updateStudy = async (id: string, updates: Partial<Study>) => {
    if (isSupabaseConfigured && !isGuest) {
      await supabase.from('studies').update(updates).eq('id', id);
    }
    setStudies(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStudy = async (id: string) => {
    if (isSupabaseConfigured && !isGuest) {
      await supabase.from('studies').delete().eq('id', id);
    }
    setStudies(prev => prev.filter(s => s.id !== id));
  };

  // Contacts
  const addContact = async (contactData: Omit<StudyContact, 'id'>) => {
    const newContact: StudyContact = { ...contactData, id: 'c-' + Date.now() };
    if (isSupabaseConfigured && !isGuest) {
      const { data } = await supabase.from('study_contacts').insert([contactData]).select().single();
      if (data) newContact.id = data.id;
    }
    setContacts(prev => [...prev, newContact]);
  };

  const deleteContact = async (id: string) => {
    if (isSupabaseConfigured && !isGuest) {
      await supabase.from('study_contacts').delete().eq('id', id);
    }
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  // Milestones
  const toggleMilestone = async (id: string) => {
    const target = milestones.find(m => m.id === id);
    if (!target) return;

    const newDone = !target.done;
    const newDate = newDone ? format(new Date(), 'yyyy-MM-dd') : undefined;

    if (isSupabaseConfigured && !isGuest) {
      await supabase.from('study_milestones').update({ done: newDone, done_date: newDate }).eq('id', id);
    }

    setMilestones(prev => prev.map(m => m.id === id ? { ...m, done: newDone, done_date: newDate } : m));
  };

  const addMilestone = async (m: Omit<StudyMilestone, 'id'>) => {
    const newM: StudyMilestone = { ...m, id: 'm-' + Date.now() };
    if (isSupabaseConfigured && !isGuest) {
      const { data } = await supabase.from('study_milestones').insert([m]).select().single();
      if (data) newM.id = data.id;
    }
    setMilestones(prev => [...prev, newM]);
  };

  const deleteMilestone = async (id: string) => {
    if (isSupabaseConfigured && !isGuest) {
      await supabase.from('study_milestones').delete().eq('id', id);
    }
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  // Trainings
  const addTraining = async (t: Omit<Training, 'id' | 'created_at' | 'updated_at'>) => {
    const newT: Training = { ...t, id: 't-' + Date.now() };
    if (isSupabaseConfigured && !isGuest) {
      const { data } = await supabase.from('trainings').insert([t]).select().single();
      if (data) newT.id = data.id;
    }
    setTrainings(prev => [newT, ...prev]);
  };

  const updateTraining = async (id: string, updates: Partial<Training>) => {
    if (isSupabaseConfigured && !isGuest) {
      await supabase.from('trainings').update(updates).eq('id', id);
    }
    setTrainings(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTraining = async (id: string) => {
    if (isSupabaseConfigured && !isGuest) {
      await supabase.from('trainings').delete().eq('id', id);
    }
    setTrainings(prev => prev.filter(t => t.id !== id));
  };

  // Issues
  const addIssue = async (issueData: Omit<Issue, 'id' | 'created_at' | 'last_updated'>) => {
    const newIssue: Issue = {
      ...issueData,
      id: 'i-' + Date.now(),
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      studies: studies.find(s => s.id === issueData.study_id) ? { name: studies.find(s => s.id === issueData.study_id)!.name } : null
    };

    if (isSupabaseConfigured && !isGuest) {
      const { data } = await supabase.from('issues').insert([{
        study_id: issueData.study_id || null,
        title: issueData.title,
        description: issueData.description || null,
        category: issueData.category || null,
        owner: issueData.owner || null,
        due_date: issueData.due_date || null,
        status: issueData.status,
        discovered_date: issueData.discovered_date,
        related_files: issueData.related_files || null,
        source_log_id: issueData.source_log_id || null
      }]).select('*, studies(name)').single();
      if (data) newIssue.id = data.id;
    }

    setIssues(prev => [newIssue, ...prev]);
  };

  const updateIssue = async (id: string, updates: Partial<Issue>) => {
    const patch = { ...updates, last_updated: new Date().toISOString() };
    if (isSupabaseConfigured && !isGuest) {
      await supabase.from('issues').update(patch).eq('id', id);
    }
    setIssues(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  const deleteIssue = async (id: string) => {
    if (isSupabaseConfigured && !isGuest) {
      await supabase.from('issues').delete().eq('id', id);
    }
    setIssues(prev => prev.filter(i => i.id !== id));
  };

  // Waiting Items
  const addWaitingItem = async (item: Omit<WaitingItem, 'id' | 'created_at'>) => {
    const newItem: WaitingItem = {
      ...item,
      id: 'w-' + Date.now(),
      created_at: new Date().toISOString(),
      studies: studies.find(s => s.id === item.study_id) ? { name: studies.find(s => s.id === item.study_id)!.name } : null
    };

    if (isSupabaseConfigured && !isGuest) {
      const { data } = await supabase.from('waiting_items').insert([{
        issue_id: item.issue_id || null,
        study_id: item.study_id || null,
        title: item.title,
        waiting_on: item.waiting_on,
        created_date: item.created_date,
        resolved: false
      }]).select('*, studies(name)').single();
      if (data) newItem.id = data.id;
    }

    setWaitingItems(prev => [newItem, ...prev]);
  };

  const toggleWaitingResolved = async (id: string) => {
    const item = waitingItems.find(w => w.id === id);
    if (!item) return;

    const newRes = !item.resolved;
    if (isSupabaseConfigured && !isGuest) {
      await supabase.from('waiting_items').update({ resolved: newRes }).eq('id', id);
    }
    setWaitingItems(prev => prev.map(w => w.id === id ? { ...w, resolved: newRes } : w));
  };

  // Dashboard summary calculation
  const getDashboardSummary = (): DashboardSummary => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const threeDaysLaterStr = format(addDays(new Date(), 3), 'yyyy-MM-dd');

    // 1. Due Today (Issues or WorkLogs or Trainings due today)
    const dueTodayIssues = issues.filter(i => i.status !== '해결' && i.due_date === todayStr);
    const dueTodayTrainings = trainings.filter(t => t.status !== '완료' && t.due_date === todayStr);
    const dueTodayCount = dueTodayIssues.length + dueTodayTrainings.length;

    // 2. Due within 3 days (after today up to +3 days)
    const dueWithin3DaysIssues = issues.filter(i => {
      if (i.status === '해결' || !i.due_date) return false;
      return i.due_date > todayStr && i.due_date <= threeDaysLaterStr;
    });
    const dueWithin3DaysTrainings = trainings.filter(t => {
      if (t.status === '완료' || !t.due_date) return false;
      return t.due_date > todayStr && t.due_date <= threeDaysLaterStr;
    });
    const dueWithin3DaysCount = dueWithin3DaysIssues.length + dueWithin3DaysTrainings.length;

    // 3. Waiting for count
    const waitingCount = issues.filter(i => i.is_waiting_item && i.status !== '해결').length + waitingItems.filter(w => !w.resolved).length;

    // 4. Overdue count (due_date < today and not completed)
    const overdueIssues = issues.filter(i => {
      if (i.status === '해결' || !i.due_date) return false;
      return i.due_date < todayStr;
    });
    const overdueTrainings = trainings.filter(t => {
      if (t.status === '완료' || !t.due_date) return false;
      return t.due_date < todayStr;
    });
    const overdueCount = overdueIssues.length + overdueTrainings.length;

    // 5. Training upcoming (due within 3 days or overdue)
    const trainingUpcomingCount = trainings.filter(t => {
      if (t.status === '완료' || !t.due_date) return false;
      return t.due_date <= threeDaysLaterStr;
    }).length;

    // 6. Work Log missing today check
    const loggedToday = workLogs.some(w => w.date === todayStr);

    return {
      dueTodayCount,
      dueWithin3DaysCount,
      waitingCount,
      overdueCount,
      trainingUpcomingCount,
      workLogMissingToday: !loggedToday,
    };
  };

  return (
    <DataContext.Provider
      value={{
        studies,
        contacts,
        milestones,
        workLogs,
        trainings,
        issues,
        waitingItems,
        loading,
        isOnline: isSupabaseConfigured,
        isDemoMode: isGuest || !userId,
        resetDemoData,
        addWorkLog,
        deleteWorkLog,
        addStudy,
        updateStudy,
        deleteStudy,
        addContact,
        deleteContact,
        toggleMilestone,
        addMilestone,
        deleteMilestone,
        addTraining,
        updateTraining,
        deleteTraining,
        addIssue,
        updateIssue,
        deleteIssue,
        addWaitingItem,
        toggleWaitingResolved,
        getDashboardSummary,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
