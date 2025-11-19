-- NOOR GMS (Game Management System) Supabase Database Setup
-- Created by Noor developers
-- Last Updated: 2025-01-19

-- 1. Foydalanuvchilar jadvali
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  club_name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Ma'lumotlar jadvali (STATE objektini saqlash)
CREATE TABLE IF NOT EXISTS game_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE
);

-- 3. Qarzdorlar jadvali (qarz ma'lumotlari)
CREATE TABLE IF NOT EXISTS debtors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE
);

-- 4. Tarix jadvali (smena va to'lovlar tarixi)
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE
);

-- 5. Jurnallar (tizim harakatlari loglari)
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE SET NULL
);

-- 6. Obuna (subscription) ma'lumotlari
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,
  end_date TIMESTAMP,
  days_remaining INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE
);

-- Indekslar (tezlik uchun)
CREATE INDEX IF NOT EXISTS idx_game_data_user_id ON game_data(user_id);
CREATE INDEX IF NOT EXISTS idx_debtors_user_id ON debtors(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON history(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

-- RLS (Row Level Security) - Har bir jadval uchun xavfsizlik
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

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

-- SUBSCRIPTIONS jadvali policies
CREATE POLICY "Allow insert for service_role" ON subscriptions FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow select for service_role" ON subscriptions FOR SELECT USING (auth.role() = 'service_role' OR true);
CREATE POLICY "Allow update for service_role" ON subscriptions FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Allow delete for service_role" ON subscriptions FOR DELETE USING (auth.role() = 'service_role');

-- Trigger: updated_at avtomatik yangilanishi
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ISHGA TUSHIRISH YO'RIQNOMASI:
-- 1. Supabase.com → Loyihangiz → SQL Editor
-- 2. Bu faylni to'liq copy-paste qiling
-- 3. RUN bosing
-- 4. ✅ Barcha jadvallar, indekslar va policies yaratiladi!
