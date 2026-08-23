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
  updateWorkLog: (id: string, updates: Partial<WorkLog>) => Promise<void>;
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

const isUUID = (str?: string | null) => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

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

  // Seed user data to Supabase if newly registered user has an empty DB
  const seedUserDataToSupabase = async () => {
    if (!isSupabaseConfigured || isGuest) return;
    try {
      // 1. Insert studies
      const studyIdMap: Record<string, string> = {};
      for (const s of MOCK_STUDIES) {
        const { data } = await supabase.from('studies').insert([{
          name: s.name,
          sponsor: s.sponsor || null,
          phase: s.phase || null,
          status: s.status,
          site_total: s.site_total,
          site_closed: s.site_closed
        }]).select().single();
        if (data) studyIdMap[s.id] = data.id;
      }

      // 2. Insert contacts
      for (const c of MOCK_CONTACTS) {
        await supabase.from('study_contacts').insert([{
          study_id: studyIdMap[c.study_id] || null,
          role: c.role,
          name: c.name,
          email: c.email || null,
          phone: c.phone || null
        }]);
      }

      // 3. Insert milestones
      for (const m of MOCK_MILESTONES) {
        await supabase.from('study_milestones').insert([{
          study_id: studyIdMap[m.study_id] || null,
          title: m.title,
          done: m.done,
          done_date: m.done_date || null,
          sort_order: m.sort_order
        }]);
      }

      // 4. Insert work_logs
      const workLogIdMap: Record<string, string> = {};
      for (const w of MOCK_WORK_LOGS) {
        const { data } = await supabase.from('work_logs').insert([{
          date: w.date,
          study_id: w.study_id ? (studyIdMap[w.study_id] || null) : null,
          work_type: w.work_type,
          content: w.content,
          hours: w.hours,
          needs_followup: w.needs_followup,
          next_action: w.next_action || null,
          due_date: w.due_date || null
        }]).select().single();
        if (data) workLogIdMap[w.id] = data.id;
      }

      // 5. Insert trainings
      for (const t of MOCK_TRAININGS) {
        await supabase.from('trainings').insert([{
          name: t.name,
          status: t.status,
          due_date: t.due_date || null,
          link: t.link || null,
          completed_date: t.completed_date || null
        }]);
      }

      // 6. Insert issues
      const issueIdMap: Record<string, string> = {};
      for (const i of MOCK_ISSUES) {
        const { data } = await supabase.from('issues').insert([{
          study_id: i.study_id ? (studyIdMap[i.study_id] || null) : null,
          title: i.title,
          description: i.description || null,
          category: i.category || null,
          priority: i.priority || null,
          owner: i.owner || null,
          due_date: i.due_date || null,
          status: i.status,
          discovered_date: i.discovered_date || null,
          related_files: i.related_files || null,
          source_log_id: i.source_log_id ? (workLogIdMap[i.source_log_id] || null) : null
        }]).select().single();
        if (data) issueIdMap[i.id] = data.id;
      }

      // 7. Insert waiting_items
      for (const wt of MOCK_WAITING) {
        await supabase.from('waiting_items').insert([{
          issue_id: wt.issue_id ? (issueIdMap[wt.issue_id] || null) : null,
          study_id: wt.study_id ? (studyIdMap[wt.study_id] || null) : null,
          title: wt.title,
          waiting_on: wt.waiting_on,
          created_date: wt.created_date,
          resolved: wt.resolved
        }]);
      }
    } catch (err) {
      console.error('Failed to seed user data into Supabase:', err);
    }
  };

  // Initialize data from Supabase or localStorage/Mock
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

      // Supabase 연결 + 로그인 유저: DB에서 독립적으로 로드
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

        const totalCount = (sRes.data?.length || 0) + (wRes.data?.length || 0) + (tRes.data?.length || 0) + (iRes.data?.length || 0);

        // 최초 구글 로그인으로 Supabase에 아무 데이터도 없으면 -> 자동 시딩 후 재로드
        if (totalCount === 0) {
          await seedUserDataToSupabase();
          const [sRes2, cRes2, mRes2, wRes2, tRes2, iRes2, wtRes2] = await Promise.all([
            supabase.from('studies').select('*').order('created_at', { ascending: false }),
            supabase.from('study_contacts').select('*'),
            supabase.from('study_milestones').select('*').order('sort_order'),
            supabase.from('work_logs').select('*, studies(name)').order('date', { ascending: false }),
            supabase.from('trainings').select('*').order('due_date'),
            supabase.from('issues').select('*, studies(name)').order('due_date'),
            supabase.from('waiting_items').select('*, studies(name), issues(title)'),
          ]);
          setStudies(sRes2.data || []);
          setContacts(cRes2.data || []);
          setMilestones(mRes2.data || []);
          setWorkLogs(wRes2.data || []);
          setTrainings(tRes2.data || []);
          setIssues(iRes2.data || []);
          setWaitingItems(wtRes2.data || []);
        } else {
          // 테이블별 독립 반영
          setStudies(sRes.data || []);
          setContacts(cRes.data || []);
          setMilestones(mRes.data || []);
          setWorkLogs(wRes.data || []);
          setTrainings(tRes.data || []);
          setIssues(iRes.data || []);
          setWaitingItems(wtRes.data || []);
        }

      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local data:', err);
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

      if (!loadedStudies || loadedStudies.length === 0) {
        if (isGuest) {
          loadMockData(k);
        } else {
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
        study_id: isUUID(logData.study_id) ? logData.study_id : null,
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
        study_id: isUUID(logData.study_id) ? logData.study_id : null,
        title: `[Follow-up] ${logData.next_action}`,
        description: `업무일지 자동 생성 (${logData.date} ${logData.work_type}): ${logData.content}`,
        category: logData.work_type,
        owner: '담당 CRA/PL',
        due_date: logData.due_date || logData.date,
        status: '진행중',
        discovered_date: logData.date,
        source_log_id: isUUID(newLog.id) ? newLog.id : undefined
      });
    }
  };

  const deleteWorkLog = async (id: string) => {
    if (isSupabaseConfigured && !isGuest && isUUID(id)) {
      await supabase.from('work_logs').delete().eq('id', id);
    }
    setWorkLogs(prev => prev.filter(w => w.id !== id));
  };

  const updateWorkLog = async (id: string, updates: Partial<WorkLog>) => {
    if (isSupabaseConfigured && !isGuest) {
      if (isUUID(id)) {
        await supabase.from('work_logs').update({
          date: updates.date,
          study_id: isUUID(updates.study_id) ? updates.study_id : null,
          work_type: updates.work_type,
          content: updates.content,
          hours: updates.hours,
          needs_followup: updates.needs_followup,
          next_action: updates.next_action ?? null,
          due_date: updates.due_date ?? null,
        }).eq('id', id);
      } else {
        // non-UUID (legacy string ID): insert as new row into Supabase
        const { data } = await supabase.from('work_logs').insert([{
          date: updates.date || format(new Date(), 'yyyy-MM-dd'),
          study_id: isUUID(updates.study_id) ? updates.study_id : null,
          work_type: updates.work_type || 'Monitoring',
          content: updates.content || '',
          hours: updates.hours || 1.0,
          needs_followup: updates.needs_followup || false,
          next_action: updates.next_action ?? null,
          due_date: updates.due_date ?? null,
        }]).select('*, studies(name)').single();
        if (data) {
          updates.id = data.id;
        }
      }
    }
    setWorkLogs(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
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
    if (isSupabaseConfigured && !isGuest && isUUID(id)) {
      await supabase.from('studies').update(updates).eq('id', id);
    }
    setStudies(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStudy = async (id: string) => {
    if (isSupabaseConfigured && !isGuest && isUUID(id)) {
      await supabase.from('studies').delete().eq('id', id);
    }
    setStudies(prev => prev.filter(s => s.id !== id));
  };

  // Contacts
  const addContact = async (contactData: Omit<StudyContact, 'id'>) => {
    const newContact: StudyContact = { ...contactData, id: 'c-' + Date.now() };
    if (isSupabaseConfigured && !isGuest) {
      const insertData = { ...contactData, study_id: isUUID(contactData.study_id) ? contactData.study_id : null };
      const { data } = await supabase.from('study_contacts').insert([insertData]).select().single();
      if (data) newContact.id = data.id;
    }
    setContacts(prev => [...prev, newContact]);
  };

  const deleteContact = async (id: string) => {
    if (isSupabaseConfigured && !isGuest && isUUID(id)) {
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

    if (isSupabaseConfigured && !isGuest && isUUID(id)) {
      await supabase.from('study_milestones').update({ done: newDone, done_date: newDate }).eq('id', id);
    }

    setMilestones(prev => prev.map(m => m.id === id ? { ...m, done: newDone, done_date: newDate } : m));
  };

  const addMilestone = async (m: Omit<StudyMilestone, 'id'>) => {
    const newM: StudyMilestone = { ...m, id: 'm-' + Date.now() };
    if (isSupabaseConfigured && !isGuest) {
      const insertData = { ...m, study_id: isUUID(m.study_id) ? m.study_id : null };
      const { data } = await supabase.from('study_milestones').insert([insertData]).select().single();
      if (data) newM.id = data.id;
    }
    setMilestones(prev => [...prev, newM]);
  };

  const deleteMilestone = async (id: string) => {
    if (isSupabaseConfigured && !isGuest && isUUID(id)) {
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
    if (isSupabaseConfigured && !isGuest && isUUID(id)) {
      await supabase.from('trainings').update(updates).eq('id', id);
    }
    setTrainings(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTraining = async (id: string) => {
    if (isSupabaseConfigured && !isGuest && isUUID(id)) {
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
        study_id: isUUID(issueData.study_id) ? issueData.study_id : null,
        title: issueData.title,
        description: issueData.description || null,
        category: issueData.category || null,
        priority: issueData.priority || null,
        owner: issueData.owner || null,
        due_date: issueData.due_date || null,
        status: issueData.status,
        discovered_date: issueData.discovered_date || null,
        related_files: issueData.related_files || null,
        source_log_id: isUUID(issueData.source_log_id) ? issueData.source_log_id : null
      }]).select('*, studies(name)').single();
      if (data) newIssue.id = data.id;
    }

    setIssues(prev => [newIssue, ...prev]);
  };

  const updateIssue = async (id: string, updates: Partial<Issue>) => {
    const patch = { ...updates, last_updated: new Date().toISOString() };
    if (isSupabaseConfigured && !isGuest) {
      if (isUUID(id)) {
        await supabase.from('issues').update({
          study_id: isUUID(patch.study_id) ? patch.study_id : undefined,
          title: patch.title,
          description: patch.description,
          category: patch.category,
          priority: patch.priority,
          owner: patch.owner,
          due_date: patch.due_date,
          status: patch.status,
          discovered_date: patch.discovered_date,
          related_files: patch.related_files,
          last_updated: patch.last_updated
        }).eq('id', id);
      } else {
        // non-UUID legacy string: insert into Supabase
        const { data } = await supabase.from('issues').insert([{
          study_id: isUUID(patch.study_id) ? patch.study_id : null,
          title: patch.title || '신규 이슈',
          description: patch.description || null,
          category: patch.category || null,
          priority: patch.priority || null,
          owner: patch.owner || null,
          due_date: patch.due_date || null,
          status: patch.status || '진행중',
          discovered_date: patch.discovered_date || null,
          related_files: patch.related_files || null,
          source_log_id: isUUID(patch.source_log_id) ? patch.source_log_id : null
        }]).select('*, studies(name)').single();
        if (data) patch.id = data.id;
      }
    }
    setIssues(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  const deleteIssue = async (id: string) => {
    if (isSupabaseConfigured && !isGuest && isUUID(id)) {
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
        issue_id: isUUID(item.issue_id) ? item.issue_id : null,
        study_id: isUUID(item.study_id) ? item.study_id : null,
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
    const target = waitingItems.find(w => w.id === id);
    if (!target) return;

    const newResolved = !target.resolved;

    if (isSupabaseConfigured && !isGuest && isUUID(id)) {
      await supabase.from('waiting_items').update({ resolved: newResolved }).eq('id', id);
    }

    setWaitingItems(prev => prev.map(w => w.id === id ? { ...w, resolved: newResolved } : w));
  };

  const getDashboardSummary = (): DashboardSummary => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const in3DaysStr = format(addDays(new Date(), 3), 'yyyy-MM-dd');

    const dueTodayCount = issues.filter(i => i.status !== '해결' && i.due_date === todayStr).length;
    const dueWithin3DaysCount = issues.filter(i => i.status !== '해결' && i.due_date && i.due_date > todayStr && i.due_date <= in3DaysStr).length;
    const overdueCount = issues.filter(i => i.status !== '해결' && i.due_date && i.due_date < todayStr).length;

    const trainingUpcomingCount = trainings.filter(t => t.status !== '완료').length;
    const waitingCount = waitingItems.filter(w => !w.resolved).length;

    const todayWorkLogs = workLogs.filter(w => w.date === todayStr);

    return {
      dueTodayCount,
      dueWithin3DaysCount,
      waitingCount,
      overdueCount,
      trainingUpcomingCount,
      workLogMissingToday: todayWorkLogs.length === 0,
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
        isOnline: true,
        isDemoMode: isGuest || !isSupabaseConfigured,
        resetDemoData,
        addWorkLog,
        updateWorkLog,
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
