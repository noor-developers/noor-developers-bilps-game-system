-- NOOR GMS - SUPABASE POLICIES YANGILASH
-- Created by Noor developers
-- Last Updated: 2025-01-19

-- 1. BARCHA ESKI POLICIES-NI O'CHIRISH
DROP POLICY IF EXISTS "Users can read their own game_data" ON game_data;
DROP POLICY IF EXISTS "Users can read their own debtors" ON debtors;
DROP POLICY IF EXISTS "Users can read their own history" ON history;
DROP POLICY IF EXISTS "Users can read their own logs" ON logs;
DROP POLICY IF EXISTS "Allow insert for service_role" ON users;
DROP POLICY IF EXISTS "Allow select for service_role" ON users;
DROP POLICY IF EXISTS "Allow update for service_role" ON users;
DROP POLICY IF EXISTS "Allow delete for service_role" ON users;
DROP POLICY IF EXISTS "Allow insert for service_role" ON game_data;
DROP POLICY IF EXISTS "Allow select for service_role" ON game_data;
DROP POLICY IF EXISTS "Allow update for service_role" ON game_data;
DROP POLICY IF EXISTS "Allow delete for service_role" ON game_data;
DROP POLICY IF EXISTS "Allow insert for service_role" ON debtors;
DROP POLICY IF EXISTS "Allow select for service_role" ON debtors;
DROP POLICY IF EXISTS "Allow update for service_role" ON debtors;
DROP POLICY IF EXISTS "Allow delete for service_role" ON debtors;
DROP POLICY IF EXISTS "Allow insert for service_role" ON history;
DROP POLICY IF EXISTS "Allow select for service_role" ON history;
DROP POLICY IF EXISTS "Allow update for service_role" ON history;
DROP POLICY IF EXISTS "Allow delete for service_role" ON history;
DROP POLICY IF EXISTS "Allow insert for service_role" ON logs;
DROP POLICY IF EXISTS "Allow select for service_role" ON logs;
DROP POLICY IF EXISTS "Allow update for service_role" ON logs;
DROP POLICY IF EXISTS "Allow delete for service_role" ON logs;
DROP POLICY IF EXISTS "Allow insert for service_role" ON subscriptions;
DROP POLICY IF EXISTS "Allow select for service_role" ON subscriptions;
DROP POLICY IF EXISTS "Allow update for service_role" ON subscriptions;
DROP POLICY IF EXISTS "Allow delete for service_role" ON subscriptions;

-- 2. USERS jadvali RLS yoqish va policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for service_role" ON users 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
  
CREATE POLICY "Allow select for service_role" ON users 
  FOR SELECT USING (auth.role() = 'service_role' OR true);
  
CREATE POLICY "Allow update for service_role" ON users 
  FOR UPDATE USING (auth.role() = 'service_role');
  
CREATE POLICY "Allow delete for service_role" ON users 
  FOR DELETE USING (auth.role() = 'service_role');

-- 3. GAME_DATA jadvali yangi policies
CREATE POLICY "Allow insert for service_role" ON game_data 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
  
CREATE POLICY "Allow select for service_role" ON game_data 
  FOR SELECT USING (auth.role() = 'service_role' OR true);
  
CREATE POLICY "Allow update for service_role" ON game_data 
  FOR UPDATE USING (auth.role() = 'service_role');
  
CREATE POLICY "Allow delete for service_role" ON game_data 
  FOR DELETE USING (auth.role() = 'service_role');

-- 4. DEBTORS jadvali yangi policies
CREATE POLICY "Allow insert for service_role" ON debtors 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
  
CREATE POLICY "Allow select for service_role" ON debtors 
  FOR SELECT USING (auth.role() = 'service_role' OR true);
  
CREATE POLICY "Allow update for service_role" ON debtors 
  FOR UPDATE USING (auth.role() = 'service_role');
  
CREATE POLICY "Allow delete for service_role" ON debtors 
  FOR DELETE USING (auth.role() = 'service_role');

-- 5. HISTORY jadvali yangi policies
CREATE POLICY "Allow insert for service_role" ON history 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
  
CREATE POLICY "Allow select for service_role" ON history 
  FOR SELECT USING (auth.role() = 'service_role' OR true);
  
CREATE POLICY "Allow update for service_role" ON history 
  FOR UPDATE USING (auth.role() = 'service_role');
  
CREATE POLICY "Allow delete for service_role" ON history 
  FOR DELETE USING (auth.role() = 'service_role');

-- 6. LOGS jadvali yangi policies
CREATE POLICY "Allow insert for service_role" ON logs 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
  
CREATE POLICY "Allow select for service_role" ON logs 
  FOR SELECT USING (auth.role() = 'service_role' OR true);
  
CREATE POLICY "Allow update for service_role" ON logs 
  FOR UPDATE USING (auth.role() = 'service_role');
  
CREATE POLICY "Allow delete for service_role" ON logs 
  FOR DELETE USING (auth.role() = 'service_role');

-- 7. SUBSCRIPTIONS jadvali yangi policies
CREATE POLICY "Allow insert for service_role" ON subscriptions 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
  
CREATE POLICY "Allow select for service_role" ON subscriptions 
  FOR SELECT USING (auth.role() = 'service_role' OR true);
  
CREATE POLICY "Allow update for service_role" ON subscriptions 
  FOR UPDATE USING (auth.role() = 'service_role');
  
CREATE POLICY "Allow delete for service_role" ON subscriptions 
  FOR DELETE USING (auth.role() = 'service_role');

-- ISHGA TUSHIRISH YO'RIQNOMASI:
-- 1. Supabase.com → Loyihangiz → SQL Editor
-- 2. Bu faylni to'liq copy-paste qiling
-- 3. RUN bosing
-- 4. ✅ Barcha policies yangilanadi va subscriptions qo'shiladi!

-- ESLATMA:
-- Agar yangi subscriptions jadvali yo'q bo'lsa, avval supabase_setup.sql faylini ishga tushiring!
