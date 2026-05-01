-- ============================================================
-- CCDA 语境识字引擎 :: Supabase 数据库 Schema
-- 
-- 核心表：
--   hsk_words     — HSK 词表（静态数据，初始化时导入）
--   profiles      — 用户档案（扩展 auth.users）
--   user_lexicon_chars  — 字级画像（每用户每字一条记录）
--   user_lexicon_words  — 词级画像（每用户每词一条记录）
--   articles      — 每日文章
--   quiz_results  — 互动题答题记录
--   parent_reports — 家长每日报告（缓存）
-- ============================================================

-- ---- 扩展 UUID 生成 ----
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---- 1. HSK 词表（静态数据） ----

CREATE TABLE IF NOT EXISTS public.hsk_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  meaning TEXT NOT NULL,
  hsk_level INTEGER NOT NULL CHECK (hsk_level BETWEEN 1 AND 3),
  chars TEXT[] NOT NULL,           -- 组成字数组
  pos TEXT,                        -- 词性
  example_sentence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(word, hsk_level)          -- 同一词在不同等级可能有不同释义
);

CREATE INDEX idx_hsk_words_level ON public.hsk_words(hsk_level);
CREATE INDEX idx_hsk_words_chars ON public.hsk_words USING GIN(chars);

-- ---- 2. HSK 字表（静态数据） ----

CREATE TABLE IF NOT EXISTS public.hsk_chars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  char TEXT UNIQUE NOT NULL,
  pinyin TEXT NOT NULL,
  meaning TEXT NOT NULL,
  hsk_level INTEGER NOT NULL CHECK (hsk_level BETWEEN 1 AND 3),
  common_words TEXT[] DEFAULT '{}',  -- 常用组词
  etymology_hint TEXT,               -- 字源提示（P0 可选）
  stroke_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hsk_chars_level ON public.hsk_chars(hsk_level);

-- ---- 3. 用户档案 ----

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  child_name TEXT NOT NULL,             -- 孩子名字（用于报告）
  parent_name TEXT,                     -- 家长名字
  age INTEGER CHECK (age BETWEEN 6 AND 14),
  hsk_level INTEGER DEFAULT 1 CHECK (hsk_level BETWEEN 1 AND 3),
  interests TEXT[] DEFAULT '{}',        -- 兴趣标签
  custom_interests TEXT[] DEFAULT '{}', -- 自定义兴趣
  streak_days INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,
  total_chars_mastered INTEGER DEFAULT 0,
  last_active_date DATE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- 4. 字级画像 ----

CREATE TABLE IF NOT EXISTS public.user_lexicon_chars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  char TEXT NOT NULL,
  mastery REAL NOT NULL DEFAULT 0 CHECK (mastery >= 0 AND mastery <= 1),
  last_seen DATE,
  exposure_count INTEGER DEFAULT 0,
  next_review DATE,
  activated_in_words TEXT[] DEFAULT '{}',  -- 已激活的词
  pending_words TEXT[] DEFAULT '{}',        -- 待激活的词
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, char)
);

CREATE INDEX idx_ulc_user ON public.user_lexicon_chars(user_id);
CREATE INDEX idx_ulc_review ON public.user_lexicon_chars(user_id, next_review)
  WHERE next_review IS NOT NULL;

-- ---- 5. 词级画像 ----

CREATE TABLE IF NOT EXISTS public.user_lexicon_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  char_mastery_avg REAL DEFAULT 0,
  word_mastery REAL DEFAULT 0 CHECK (word_mastery >= 0 AND word_mastery <= 1),
  has_been_seen BOOLEAN DEFAULT FALSE,
  last_seen DATE,
  next_review DATE,
  quiz_accuracy REAL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word)
);

CREATE INDEX idx_ulw_user ON public.user_lexicon_words(user_id);

-- ---- 6. 每日文章 ----

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hsk_level INTEGER NOT NULL CHECK (hsk_level BETWEEN 1 AND 3),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  weak_chars_embedded TEXT[] DEFAULT '{}',
  pending_words_embedded TEXT[] DEFAULT '{}',
  new_chars_introduced TEXT[] DEFAULT '{}',
  interest_tag TEXT,
  culture_level INTEGER DEFAULT 30,
  qc_passed BOOLEAN DEFAULT FALSE,
  qc_issues TEXT[] DEFAULT '{}',
  read_duration INTEGER,              -- 阅读时长（秒）
  completed BOOLEAN DEFAULT FALSE,
  parent_reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_articles_user_date ON public.articles(user_id, date DESC);
CREATE INDEX idx_articles_qc ON public.articles(qc_passed)
  WHERE qc_passed = FALSE;

-- ---- 7. 互动题答题记录 ----

CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  q1_correct BOOLEAN,
  q2_correct BOOLEAN,
  q3_correct BOOLEAN,
  total_score INTEGER DEFAULT 0,
  response_times INTEGER[] DEFAULT '{}',  -- 每题答题时长（秒）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_article ON public.quiz_results(article_id);
CREATE INDEX idx_quiz_user ON public.quiz_results(user_id, created_at DESC);

-- ---- 8. 家长报告（缓存） ----

CREATE TABLE IF NOT EXISTS public.parent_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  report_data JSONB NOT NULL,          -- 完整报告数据（Denormalized for performance）
  sent BOOLEAN DEFAULT FALSE,          -- 是否已推送
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_reports_user_date ON public.parent_reports(user_id, date DESC);
CREATE INDEX idx_reports_unsent ON public.parent_reports(sent)
  WHERE sent = FALSE;

-- ---- 行级安全策略（RLS） ----

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lexicon_chars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lexicon_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_reports ENABLE ROW LEVEL SECURITY;

-- 用户只能读写自己的数据
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can read own lexicon chars"
  ON public.user_lexicon_chars FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own lexicon words"
  ON public.user_lexicon_words FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own articles"
  ON public.articles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own quiz results"
  ON public.quiz_results FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own reports"
  ON public.parent_reports FOR ALL
  USING (auth.uid() = user_id);

-- HSK 词表公开可读
ALTER TABLE public.hsk_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HSK words public read"
  ON public.hsk_words FOR SELECT
  USING (TRUE);

ALTER TABLE public.hsk_chars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HSK chars public read"
  ON public.hsk_chars FOR SELECT
  USING (TRUE);
