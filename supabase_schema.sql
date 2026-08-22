-- ========================================================
-- CRA/PL Work Management Web App - Supabase Schema
-- ========================================================

-- 1. studies: 과제 마스터
CREATE TABLE IF NOT EXISTS public.studies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name        TEXT NOT NULL,
  sponsor     TEXT,
  phase       TEXT,                           -- Phase I / II / III / IV / NIS 등
  status      TEXT NOT NULL DEFAULT 'Active',  -- Active / Closed / Suspended / Completed
  site_total  INTEGER DEFAULT 0,
  site_closed INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. study_contacts: 과제 담당자
CREATE TABLE IF NOT EXISTS public.study_contacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  study_id   UUID REFERENCES public.studies(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,  -- CRA / DM / Safety / PV / 통계 / 의뢰자 / 기타
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT
);

-- 3. study_milestones: 마일스톤 체크리스트
CREATE TABLE IF NOT EXISTS public.study_milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  study_id    UUID REFERENCES public.studies(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,   -- COV / 재심사보고서 / IRB 종료 / TMF close / Study close 등
  done        BOOLEAN DEFAULT FALSE,
  done_date   DATE,
  sort_order  INTEGER DEFAULT 0
);

-- 4. work_logs: 업무일지
CREATE TABLE IF NOT EXISTS public.work_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  study_id       UUID REFERENCES public.studies(id) ON DELETE SET NULL,  -- nullable: 공통업무
  work_type      TEXT NOT NULL,  -- CRA / PL / Client communication / Meeting / Admin / IRB / Monitoring / Report / 기타
  content        TEXT NOT NULL,
  hours          NUMERIC(4,1) DEFAULT 1.0,
  needs_followup BOOLEAN DEFAULT FALSE,
  next_action    TEXT,
  due_date       DATE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- 5. trainings: RMP 교육
CREATE TABLE IF NOT EXISTS public.trainings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name                 TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT '미수강', -- 완료 / 예정 / 미수강
  due_date             DATE,
  link                 TEXT,
  completed_date       DATE,
  certificate_file_url TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- 6. issues: Outstanding Issue
CREATE TABLE IF NOT EXISTS public.issues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  study_id        UUID REFERENCES public.studies(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT,       -- Protocol deviation / Query / TMF / IRB / 기타
  owner           TEXT,
  due_date        DATE,
  status          TEXT NOT NULL DEFAULT '진행',  -- 진행 / 예정 / 지연 / 완료
  discovered_date DATE DEFAULT CURRENT_DATE,
  related_files   TEXT,       -- 파일/메일 링크
  last_updated    TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  source_log_id   UUID REFERENCES public.work_logs(id) ON DELETE SET NULL
);

-- 7. waiting_items: Waiting for 목록
CREATE TABLE IF NOT EXISTS public.waiting_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  issue_id     UUID REFERENCES public.issues(id) ON DELETE SET NULL,
  study_id     UUID REFERENCES public.studies(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  waiting_on   TEXT NOT NULL,  -- 누구를 기다리는가
  created_date DATE DEFAULT CURRENT_DATE,
  resolved     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS) Enable & Policies
ALTER TABLE public.studies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_contacts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiting_items    ENABLE ROW LEVEL SECURITY;

-- User isolated RLS Policies
CREATE POLICY "Users can manage own studies"          ON public.studies          FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own study_contacts"   ON public.study_contacts   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own study_milestones" ON public.study_milestones FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own work_logs"        ON public.work_logs        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own trainings"        ON public.trainings        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own issues"           ON public.issues           FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own waiting_items"    ON public.waiting_items    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Storage bucket setup for certificates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload certificates"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view certificates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');
