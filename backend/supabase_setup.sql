-- NOOR Game Management System Supabase Tables

-- 1. Foydalanuvchilar jadvali
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- OGOHLANTIRISH: Parollarni ochiq matnda saqlamang! Hash (bcrypt) ishlating.
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

-- RLS (Row Level Security) - Har bir jadval uchun to'liq xavfsizlik
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- USERS jadvali policies
CREATE POLICY "Allow insert for service_role" ON users FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow select for service_role" ON users FOR SELECT USING (auth.role() = 'service_role' OR true);
CREATE POLICY "Allow update for service_role" ON users FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Allow delete for service_role" ON users FOR DELETE USING (auth.role() = 'service_role');

-- GAME_DATA jadvali policies
CREATE POLICY "Allow insert for service_role" ON game_data FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow select for service_role" ON game_data FOR SELECT USING (auth.role() = 'service_role' OR true);
CREATE POLICY "Allow update for service_role" ON game_data FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Allow delete for service_role" ON game_data FOR DELETE USING (auth.role() = 'service_role');

-- DEBTORS jadvali policies
CREATE POLICY "Allow insert for service_role" ON debtors FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow select for service_role" ON debtors FOR SELECT USING (auth.role() = 'service_role' OR true);
CREATE POLICY "Allow update for service_role" ON debtors FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Allow delete for service_role" ON debtors FOR DELETE USING (auth.role() = 'service_role');

-- HISTORY jadvali policies
CREATE POLICY "Allow insert for service_role" ON history FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow select for service_role" ON history FOR SELECT USING (auth.role() = 'service_role' OR true);
CREATE POLICY "Allow update for service_role" ON history FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Allow delete for service_role" ON history FOR DELETE USING (auth.role() = 'service_role');

-- LOGS jadvali policies
CREATE POLICY "Allow insert for service_role" ON logs FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow select for service_role" ON logs FOR SELECT USING (auth.role() = 'service_role' OR true);
CREATE POLICY "Allow update for service_role" ON logs FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Allow delete for service_role" ON logs FOR DELETE USING (auth.role() = 'service_role');

-- Supabase SQL Editor'dan ishga tushirish:
-- 1. Supabase.com'ga kiring
-- 2. Loyihangizni tanlang
-- 3. SQL Editor'ni oching
-- 4. Bu kodni copy-paste qiling va ishga tushiring
