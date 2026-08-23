import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  isSyncing: boolean;
  resetDemoData: () => void;
  syncAllToSupabase: (silent?: boolean) => Promise<{ success: boolean; message: string }>;
  
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
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSupabaseError = (error: any, actionDesc: string) => {
    if (error) {
      console.error(`${actionDesc} Supabase Error:`, error);
      alert(`[서버 동기화 오류] ${actionDesc} 실패: ${error.message}\n데이터는 기기에 임시 저장되었습니다. 상단 '서버 저장' 버튼을 눌러 동기화해주세요.`);
      return true;
    }
    return false;
  };

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
    if (!isSupabaseConfigured || isGuest || !userId) return;
    try {
      // 1. Insert studies with explicit user_id
      const studyIdMap: Record<string, string> = {};
      for (const s of MOCK_STUDIES) {
        const { data, error } = await supabase.from('studies').insert([{
          user_id: userId,
          name: s.name,
          sponsor: s.sponsor || null,
          phase: s.phase || null,
          status: s.status,
          site_total: s.site_total,
          site_closed: s.site_closed
        }]).select().single();
        if (error) console.error('Seed studies error:', error);
        if (data) studyIdMap[s.id] = data.id;
      }

      // 2. Insert contacts
      for (const c of MOCK_CONTACTS) {
        await supabase.from('study_contacts').insert([{
          user_id: userId,
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
          user_id: userId,
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
          user_id: userId,
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
          user_id: userId,
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
          user_id: userId,
          study_id: i.study_id ? (studyIdMap[i.study_id] || null) : null,
          title: i.title,
          description: i.description || null,
          category: i.category || null,
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
          user_id: userId,
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

  // Sync All current local state to Supabase manually/automatically
  const syncAllToSupabase = async (silent: boolean = false) => {
    if (!isSupabaseConfigured || isGuest || !userId) {
      if (!silent) return { success: false, message: 'Supabase 로그인 상태가 아닙니다.' };
      return { success: false, message: '' };
    }
    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;
    let lastError: any = null;

    const recordResult = (error: any) => {
      if (error) {
        failCount++;
        lastError = error;
      } else {
        successCount++;
      }
    };

    try {
      // 1. Studies
      const studyIdMap: Record<string, string> = {};
      for (const s of studies) {
        if (isUUID(s.id)) {
          const { error } = await supabase.from('studies').upsert({
            id: s.id,
            user_id: userId,
            name: s.name,
            sponsor: s.sponsor || null,
            phase: s.phase || null,
            status: s.status,
            site_total: s.site_total,
            site_closed: s.site_closed
          });
          recordResult(error);
          studyIdMap[s.id] = s.id;
        } else {
          const { data, error } = await supabase.from('studies').insert([{
            user_id: userId,
            name: s.name,
            sponsor: s.sponsor || null,
            phase: s.phase || null,
            status: s.status,
            site_total: s.site_total,
            site_closed: s.site_closed
          }]).select().single();
          recordResult(error);
          if (data) studyIdMap[s.id] = data.id;
        }
      }

      // 1-1. Contacts
      for (const c of contacts) {
        const studyId = isUUID(c.study_id) ? c.study_id : (studyIdMap[c.study_id] || null);
        if (isUUID(c.id)) {
          const { error } = await supabase.from('study_contacts').upsert({
            id: c.id,
            user_id: userId,
            study_id: studyId,
            role: c.role,
            name: c.name,
            email: c.email || null,
            phone: c.phone || null
          });
          recordResult(error);
        } else {
          const { error } = await supabase.from('study_contacts').insert([{
            user_id: userId,
            study_id: studyId,
            role: c.role,
            name: c.name,
            email: c.email || null,
            phone: c.phone || null
          }]);
          recordResult(error);
        }
      }

      // 1-2. Milestones
      for (const m of milestones) {
        const studyId = isUUID(m.study_id) ? m.study_id : (studyIdMap[m.study_id] || null);
        if (isUUID(m.id)) {
          const { error } = await supabase.from('study_milestones').upsert({
            id: m.id,
            user_id: userId,
            study_id: studyId,
            title: m.title,
            done: m.done,
            done_date: m.done_date || null,
            sort_order: m.sort_order || 0
          });
          recordResult(error);
        } else {
          const { error } = await supabase.from('study_milestones').insert([{
            user_id: userId,
            study_id: studyId,
            title: m.title,
            done: m.done,
            done_date: m.done_date || null,
            sort_order: m.sort_order || 0
          }]);
          recordResult(error);
        }
      }

      // 2. WorkLogs
      for (const w of workLogs) {
        const studyId = isUUID(w.study_id) ? w.study_id : (studyIdMap[w.study_id || ''] || null);
        if (isUUID(w.id)) {
          const { error } = await supabase.from('work_logs').upsert({
            id: w.id,
            user_id: userId,
            date: w.date,
            study_id: studyId,
            work_type: w.work_type,
            content: w.content,
            hours: w.hours,
            needs_followup: w.needs_followup,
            next_action: w.next_action || null,
            due_date: w.due_date || null
          });
          recordResult(error);
        } else {
          const { error } = await supabase.from('work_logs').insert([{
            user_id: userId,
            date: w.date,
            study_id: studyId,
            work_type: w.work_type,
            content: w.content,
            hours: w.hours,
            needs_followup: w.needs_followup,
            next_action: w.next_action || null,
            due_date: w.due_date || null
          }]);
          recordResult(error);
        }
      }

      // 3. Issues
      for (const i of issues) {
        const studyId = isUUID(i.study_id) ? i.study_id : (studyIdMap[i.study_id || ''] || null);
        if (isUUID(i.id)) {
          const { error } = await supabase.from('issues').upsert({
            id: i.id,
            user_id: userId,
            study_id: studyId,
            title: i.title,
            description: i.description || null,
            category: i.category || null,
            owner: i.owner || null,
            due_date: i.due_date || null,
            status: i.status,
            discovered_date: i.discovered_date || null,
            related_files: i.related_files || null
          });
          recordResult(error);
        } else {
          const { error } = await supabase.from('issues').insert([{
            user_id: userId,
            study_id: studyId,
            title: i.title,
            description: i.description || null,
            category: i.category || null,
            owner: i.owner || null,
            due_date: i.due_date || null,
            status: i.status,
            discovered_date: i.discovered_date || null,
            related_files: i.related_files || null
          }]);
          recordResult(error);
        }
      }

      // 4. Trainings
      for (const t of trainings) {
        if (isUUID(t.id)) {
          const { error } = await supabase.from('trainings').upsert({
            id: t.id,
            user_id: userId,
            name: t.name,
            status: t.status,
            due_date: t.due_date || null,
            link: t.link || null,
            completed_date: t.completed_date || null
          });
          recordResult(error);
        } else {
          const { error } = await supabase.from('trainings').insert([{
            user_id: userId,
            name: t.name,
            status: t.status,
            due_date: t.due_date || null,
            link: t.link || null,
            completed_date: t.completed_date || null
          }]);
          recordResult(error);
        }
      }

      // 5. Waiting Items
      for (const wt of waitingItems) {
        const studyId = isUUID(wt.study_id) ? wt.study_id : (studyIdMap[wt.study_id || ''] || null);
        if (isUUID(wt.id)) {
          const { error } = await supabase.from('waiting_items').upsert({
            id: wt.id,
            user_id: userId,
            study_id: studyId,
            title: wt.title,
            waiting_on: wt.waiting_on,
            created_date: wt.created_date,
            resolved: wt.resolved
          });
          recordResult(error);
        } else {
          const { error } = await supabase.from('waiting_items').insert([{
            user_id: userId,
            study_id: studyId,
            title: wt.title,
            waiting_on: wt.waiting_on,
            created_date: wt.created_date,
            resolved: wt.resolved
          }]);
          recordResult(error);
        }
      }

      setIsSyncing(false);
      
      if (failCount === 0) {
        // 성공 시 완전한 UUID 동기화를 위해 서버에서 최신 상태를 강제로 가져와 리셋합니다.
        const [sRes, cRes, mRes, wRes, tRes, iRes, wtRes] = await Promise.all([
          supabase.from('studies').select('*'),
          supabase.from('study_contacts').select('*'),
          supabase.from('study_milestones').select('*'),
          supabase.from('work_logs').select('*, studies(name)'),
          supabase.from('trainings').select('*'),
          supabase.from('issues').select('*, studies(name)'),
          supabase.from('waiting_items').select('*, studies(name)')
        ]);
        if (sRes.data) setStudies(sRes.data);
        if (cRes.data) setContacts(cRes.data);
        if (mRes.data) setMilestones(mRes.data);
        if (wRes.data) setWorkLogs(wRes.data);
        if (tRes.data) setTrainings(tRes.data);
        if (iRes.data) setIssues(iRes.data);
        if (wtRes.data) setWaitingItems(wtRes.data);
      }

      if (failCount > 0) {
        console.error('syncAllToSupabase Error:', lastError);
        if (!silent) return { success: false, message: `⚠️ ${failCount}건 저장 실패: ${lastError?.message || '알 수 없는 오류'} (다시 시도해주세요)` };
        return { success: false, message: '' };
      }
      if (!silent) return { success: true, message: `✅ 서버 저장 성공 (동기화 ${successCount}건 완료)` };
      return { success: true, message: '' };

    } catch (err: any) {
      setIsSyncing(false);
      console.error('syncAllToSupabase Exception:', err);
      return { success: false, message: '저장 중 예기치 않은 예외 발생: ' + (err?.message || err) };
    }
  };

  // Initialize data from Supabase or localStorage/Mock
  useEffect(() => {
    const keys = getStorageKeys(storagePrefix);

    async function loadData() {
      setLoading(true);

      // 데모(게스트) 모드 또는 Supabase 미설정시: mock 데이터(localStorage)에서 로드
      if (isGuest || !isSupabaseConfigured || !userId) {
        loadFromLocalOrMock(keys);
        setLoading(false);
        return;
      }

      // Supabase 세션 가드 (Auth Race Condition 방지)
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session || session.user.id !== userId) {
          console.warn('Supabase session not fully ready or mismatch. Falling back to local data.');
          loadFromLocalOrMock(keys, true); // true = safeguard (do not wipe)
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Session check failed:', e);
        loadFromLocalOrMock(keys, true);
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

        if (sRes.error) throw sRes.error;

        setStudies(sRes.data || []);
        setContacts(cRes.data || []);
        setMilestones(mRes.data || []);
        setWorkLogs(wRes.data || []);
        setTrainings(tRes.data || []);
        setIssues(iRes.data || []);
        setWaitingItems(wtRes.data || []);

      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local data gracefully:', err);
        loadFromLocalOrMock(keys, true); // safeguard enabled
      }
      setLoading(false);
    }

    function loadFromLocalOrMock(k: ReturnType<typeof getStorageKeys>, safeguard: boolean = false) {
      const getLocal = <T,>(key: string, fallback: T): T => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      };

      const loadedStudies = getLocal(k.STUDIES, null as unknown as Study[]);

      // 如果 safeguard가 true이면, 로컬 데이터가 로드되지 않았다고 해서 상태를 비우면 안 됩니다.
      if (!loadedStudies || loadedStudies.length === 0) {
        if (isGuest) {
          loadMockData(k);
        } else if (!safeguard) {
          // safeguard가 아닐 때만 초기화 (신규 유저)
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

  const syncRef = useRef(syncAllToSupabase);
  syncRef.current = syncAllToSupabase;

  // 1시간 간격 자동 서버 동기화
  useEffect(() => {
    if (isGuest || !isSupabaseConfigured || !userId) return;
    const interval = setInterval(() => {
      console.log('--- 1시간 자동 서버 저장 실행 ---');
      syncRef.current(true);
    }, 3600000);
    return () => clearInterval(interval);
  }, [isGuest, isSupabaseConfigured, userId]);

  // WorkLog Add + Auto Issue creation
  const addWorkLog = async (logData: Omit<WorkLog, 'id' | 'created_at'>) => {
    const newLog: WorkLog = {
      ...logData,
      id: 'wl-' + Date.now(),
      created_at: new Date().toISOString(),
      studies: studies.find(s => s.id === logData.study_id) ? { name: studies.find(s => s.id === logData.study_id)!.name } : null
    };

    if (isSupabaseConfigured && !isGuest && userId) {
      const { data, error } = await supabase.from('work_logs').insert([{
        user_id: userId,
        date: logData.date,
        study_id: isUUID(logData.study_id) ? logData.study_id : null,
        work_type: logData.work_type,
        content: logData.content,
        hours: logData.hours,
        needs_followup: logData.needs_followup,
        next_action: logData.next_action || null,
        due_date: logData.due_date || null
      }]).select('*, studies(name)').single();
      
      handleSupabaseError(error, '업무일지 추가');
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
    if (isSupabaseConfigured && !isGuest && userId) {
      if (isUUID(id)) {
        const { error } = await supabase.from('work_logs').update({
          date: updates.date,
          study_id: isUUID(updates.study_id) ? updates.study_id : null,
          work_type: updates.work_type,
          content: updates.content,
          hours: updates.hours,
          needs_followup: updates.needs_followup,
          next_action: updates.next_action ?? null,
          due_date: updates.due_date ?? null,
        }).eq('id', id);
        handleSupabaseError(error, '업무일지 수정(업데이트)');
      } else {
        // non-UUID (legacy string ID): insert as new row into Supabase
        const { data, error } = await supabase.from('work_logs').insert([{
          user_id: userId,
          date: updates.date || format(new Date(), 'yyyy-MM-dd'),
          study_id: isUUID(updates.study_id) ? updates.study_id : null,
          work_type: updates.work_type || 'Monitoring',
          content: updates.content || '',
          hours: updates.hours || 1.0,
          needs_followup: updates.needs_followup || false,
          next_action: updates.next_action ?? null,
          due_date: updates.due_date ?? null,
        }]).select('*, studies(name)').single();
        handleSupabaseError(error, '업무일지 수정(신규 삽입)');
        if (data) updates.id = data.id;
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
    if (isSupabaseConfigured && !isGuest && userId) {
      const { data, error } = await supabase.from('studies').insert([{
        user_id: userId,
        ...studyData
      }]).select().single();
      handleSupabaseError(error, '과제 추가');
      if (data) newStudy.id = data.id;
    }
    setStudies(prev => [newStudy, ...prev]);
    return newStudy;
  };

  const updateStudy = async (id: string, updates: Partial<Study>) => {
    if (isSupabaseConfigured && !isGuest && isUUID(id)) {
      const { error } = await supabase.from('studies').update(updates).eq('id', id);
      handleSupabaseError(error, '과제 수정');
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
    if (isSupabaseConfigured && !isGuest && userId) {
      const insertData = {
        user_id: userId,
        study_id: isUUID(contactData.study_id) ? contactData.study_id : null,
        role: contactData.role,
        name: contactData.name,
        email: contactData.email || null,
        phone: contactData.phone || null
      };
      const { data, error } = await supabase.from('study_contacts').insert([insertData]).select().single();
      handleSupabaseError(error, '담당자 추가');
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
    if (isSupabaseConfigured && !isGuest && userId) {
      const insertData = {
        user_id: userId,
        study_id: isUUID(m.study_id) ? m.study_id : null,
        title: m.title,
        done: m.done,
        done_date: m.done_date || null,
        sort_order: m.sort_order || 0
      };
      const { data, error } = await supabase.from('study_milestones').insert([insertData]).select().single();
      handleSupabaseError(error, '마일스톤 추가');
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
    if (isSupabaseConfigured && !isGuest && userId) {
      const { data, error } = await supabase.from('trainings').insert([{
        user_id: userId,
        ...t
      }]).select().single();
      handleSupabaseError(error, '교육 추가');
      if (data) newT.id = data.id;
    }
    setTrainings(prev => [newT, ...prev]);
  };

  const updateTraining = async (id: string, updates: Partial<Training>) => {
    if (isSupabaseConfigured && !isGuest && isUUID(id)) {
      const { error } = await supabase.from('trainings').update(updates).eq('id', id);
      handleSupabaseError(error, '교육 수정');
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

    if (isSupabaseConfigured && !isGuest && userId) {
      const { data, error } = await supabase.from('issues').insert([{
        user_id: userId,
        study_id: isUUID(issueData.study_id) ? issueData.study_id : null,
        title: issueData.title,
        description: issueData.description || null,
        category: issueData.category || null,
        owner: issueData.owner || null,
        due_date: issueData.due_date || null,
        status: issueData.status,
        discovered_date: issueData.discovered_date || null,
        related_files: issueData.related_files || null,
        source_log_id: isUUID(issueData.source_log_id) ? issueData.source_log_id : null
      }]).select('*, studies(name)').single();
      handleSupabaseError(error, '이슈 추가');
      if (data) newIssue.id = data.id;
    }

    setIssues(prev => [newIssue, ...prev]);
  };

  const updateIssue = async (id: string, updates: Partial<Issue>) => {
    const patch = { ...updates, last_updated: new Date().toISOString() };
    if (isSupabaseConfigured && !isGuest && userId) {
      if (isUUID(id)) {
        const { error } = await supabase.from('issues').update({
          study_id: isUUID(patch.study_id) ? patch.study_id : undefined,
          title: patch.title,
          description: patch.description,
          category: patch.category,
          owner: patch.owner,
          due_date: patch.due_date,
          status: patch.status,
          discovered_date: patch.discovered_date,
          related_files: patch.related_files,
          last_updated: patch.last_updated
        }).eq('id', id);
        handleSupabaseError(error, '이슈 수정(업데이트)');
      } else {
        // non-UUID legacy string: insert into Supabase
        const { data, error } = await supabase.from('issues').insert([{
          user_id: userId,
          study_id: isUUID(patch.study_id) ? patch.study_id : null,
          title: patch.title || '신규 이슈',
          description: patch.description || null,
          category: patch.category || null,
          owner: patch.owner || null,
          due_date: patch.due_date || null,
          status: patch.status || '진행중',
          discovered_date: patch.discovered_date || null,
          related_files: patch.related_files || null,
          source_log_id: isUUID(patch.source_log_id) ? patch.source_log_id : null
        }]).select('*, studies(name)').single();
        handleSupabaseError(error, '이슈 수정(신규 삽입)');
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

    if (isSupabaseConfigured && !isGuest && userId) {
      const { data, error } = await supabase.from('waiting_items').insert([{
        user_id: userId,
        issue_id: isUUID(item.issue_id) ? item.issue_id : null,
        study_id: isUUID(item.study_id) ? item.study_id : null,
        title: item.title,
        waiting_on: item.waiting_on,
        created_date: item.created_date,
        resolved: false
      }]).select('*, studies(name)').single();
      handleSupabaseError(error, '대기 항목 추가');
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
        isSyncing,
        resetDemoData,
        syncAllToSupabase,
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
