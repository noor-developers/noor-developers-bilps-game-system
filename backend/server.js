const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS sozlash - Hammasini ruxsat berish
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Agar Supabase sozlanmagan bo'lsa, API chaqiruvlariga mos xabar qaytarish uchun middleware
app.use('/api', (req, res, next) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured on server. Set SUPABASE_URL and SUPABASE_KEY in .env.' });
  }
  next();
});

// Supabase client (optional)
let supabase = null;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Optional service role key (required for server-side writes when RLS is enabled)
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
let supabaseAdmin = null;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ SUPABASE_URL or SUPABASE_KEY not set. Supabase integration is disabled.');
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  console.log('✅ Supabase admin client configured (service_role provided).');
}

function getDbClient() {
  return supabaseAdmin || supabase;
}

// ========== ROUTES ==========

// 1. Ma'lumotlarni saqlash
app.post('/api/save-data', async (req, res) => {
  try {
    const dbClient = getDbClient();
    if (!dbClient) return res.status(500).json({ error: 'Supabase not configured on server' });

    const { userId, data, timestamp } = req.body;
    if (!userId || !data) return res.status(400).json({ error: 'userId va data kerak' });

    // Agar mavjud bo'lsa update, yo'q bo'lsa insert
    const { data: existing, error: selErr } = await dbClient
      .from('game_data')
      .select('id')
      .eq('user_id', userId)
      .single();
    if (selErr && selErr.code !== 'PGRST116') throw selErr;

    let result;
    if (existing) {
      result = await dbClient
        .from('game_data')
        .update({
          data: data,
          last_modified: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      result = await dbClient
        .from('game_data')
        .insert([{ user_id: userId, data: data, created_at: new Date().toISOString(), last_modified: new Date().toISOString() }]);
    }

    if (result.error) throw result.error;

    res.json({ success: true, message: 'Ma\'lumotlar saqlandi', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Ma'lumotlarni yuklash
app.get('/api/load-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

      const dbClient = getDbClient();
      if (!dbClient) return res.status(500).json({ error: 'Supabase not configured on server' });

      const { data, error } = await dbClient
      .from('game_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({
      success: true,
      data: data ? data.data : null,
      lastModified: data ? data.last_modified : null
    });
  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Foydalanuvchi ro'yxati yuklash
app.get('/api/get-users', async (req, res) => {
  try {
    const dbClient = getDbClient();
    if (!dbClient) return res.status(500).json({ error: 'Supabase not configured on server' });

    const { data, error } = await dbClient
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      users: data || []
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Yangi foydalanuvchi qo'shish
app.post('/api/add-user', async (req, res) => {
  try {
    const { username, password } = req.body;
    const dbClient = getDbClient();
    if (!dbClient) return res.status(500).json({ error: 'Supabase not configured on server' });

    if (!username || !password) {
      return res.status(400).json({ error: 'Login va parol kerak' });
    }

    // Tekshirish - mavjud bo'lsami
    const { data: existing } = await dbClient
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Bu login band' });
    }

    const { data, error } = await dbClient
      .from('users')
      .insert([{
        username: username,
        password: password, // SHA256 bilan encrypt qilish kerak production'da!
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Foydalanuvchi qo\'shildi',
      user: data[0]
    });
  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Barcha foydalanuvchilarni yuklash (cross-device uchun)
app.get('/api/load-all-users', async (req, res) => {
  try {
    const dbClient = getDbClient();
    if (!dbClient) return res.status(500).json({ error: 'Supabase not configured on server' });

    const { data, error } = await dbClient
      .from('users')
      .select('username, password')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      users: data || []
    });
  } catch (error) {
    console.error('Load all users error:', error);
    res.status(500).json({ error: error.message, users: [] });
  }
});

// 6. Login tekshirish
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const dbClient = getDbClient();
    if (!dbClient) return res.status(500).json({ error: 'Supabase not configured on server' });

    const { data, error } = await dbClient
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      return res.status(401).json({ 
        success: false, 
        error: 'Noto\'g\'ri login yoki parol' 
      });
    }

    res.json({
      success: true,
      user: data,
      message: 'Tizimga kirildi'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Qarzdorlar ro'yxati
app.post('/api/save-debtors', async (req, res) => {
  try {
    const { userId, debtors } = req.body;
    const dbClient = getDbClient();
    if (!dbClient) return res.status(500).json({ error: 'Supabase not configured on server' });

    const { error } = await dbClient
      .from('debtors')
      .upsert({
        user_id: userId,
        data: debtors,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;

    res.json({
      success: true,
      message: 'Qarzdorlar saqlandi'
    });
  } catch (error) {
    console.error('Save debtors error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Tarix saqlash
app.post('/api/save-history', async (req, res) => {
  try {
    const { userId, history } = req.body;
    const dbClient = getDbClient();
    if (!dbClient) return res.status(500).json({ error: 'Supabase not configured on server' });

    const { error } = await dbClient
      .from('history')
      .insert({
        user_id: userId,
        data: history,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    res.json({
      success: true,
      message: 'Tarix saqlandi'
    });
  } catch (error) {
    console.error('Save history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. User settings-ni yangilash
app.post('/api/update-user-settings', async (req, res) => {
  try {
    const { username, settings } = req.body;
    if (!username || !settings) {
      return res.status(400).json({ error: 'username va settings kerak' });
    }

    const dbClient = getDbClient();
    if (!dbClient) return res.status(500).json({ error: 'Supabase not configured on server' });

    const { data, error } = await dbClient
      .from('users')
      .update({ 
        settings: settings,
        updated_at: new Date().toISOString()
      })
      .eq('username', username)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: 'User sozlamalari yangilandi',
      data: data
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server ishga tushgan' });
});

// Server ishga tushirish
app.listen(PORT, () => {
  console.log(`🚀 Server ishga tushdi: http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/health`);
});
