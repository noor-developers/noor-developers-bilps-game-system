-- NOOR Game Management System Supabase Tables

-- 1. Foydalanuvchilar jadvali
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Ma'lumotlar jadvali (asosiy backup)
CREATE TABLE IF NOT EXISTS game_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(username)
);

-- 3. Qarzdorlar jadvali
CREATE TABLE IF NOT EXISTS debtors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(username)
);

-- 4. Tarix jadvali (smenalar)
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(username)
);

-- 5. Jurnallar (Logs)
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(username)
);

-- Indekslar (tezlik uchun)
CREATE INDEX IF NOT EXISTS idx_game_data_user_id ON game_data(user_id);
CREATE INDEX IF NOT EXISTS idx_debtors_user_id ON debtors(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON history(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);

-- RLS (Row Level Security) - Har bir foydalanuvchi faqat o'z ma'lumotlarini ko'radi
ALTER TABLE game_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Policy: Foydalanuvchi o'z ma'lumotlarini o'qishi mumkin
CREATE POLICY "Users can read their own game_data"
  ON game_data FOR SELECT
  USING (auth.uid()::text = user_id OR true);

-- Supabase SQL Editor'dan ishga tushirish:
-- 1. Supabase.com'ga kiring
-- 2. Loyihangizni tanlang
-- 3. SQL Editor'ni oching
-- 4. Bu kodni copy-paste qiling va ishga tushiring
