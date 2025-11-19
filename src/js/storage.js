// ========== STORAGE MODULE ==========
// Data Loading, Saving, Export/Import

import { STATE, DEFAULT_STATE, DB_NAME, API_URL, USE_ONLINE_BACKUP } from './config.js';
import { showNotification, showConfirm, closeModal } from './ui.js';
import { addLog, encrypt } from './utils.js';

// ========== DATA MANAGEMENT ==========
export async function loadData() {
  console.log('📂 loadData() chaqirildi - SUPABASE PRIMARY MODE');
  
  // STEP 1: Supabase-dan users yuklash (majburiy)
  try {
    await loadUsersFromSupabase();
    console.log('✅ Supabase users yuklandi:', STATE.users.length);
    console.log('📋 Users list:', STATE.users);
    
    if (STATE.users.length === 0) {
      console.error('❌ CRITICAL: Supabase-da userlar yo\'q!');
      showNotification('❌ Supabase-da foydalanuvchilar topilmadi!');
      return false;
    }
  } catch (e) {
    console.error('❌ CRITICAL: Supabase users yuklanmadi:', e);
    showNotification('❌ Server bilan aloqa yo\'q! Dasturni qayta yuklang.');
    return false;
  }
  
  // STEP 2: Agar user login qilgan bo'lsa, uning ma'lumotlarini Supabase-dan yuklash
  if (STATE.currentUser) {
    console.log(`☁️ ${STATE.currentUser} ma'lumotlari yuklanmoqda...`);
    try {
      const supabaseData = await loadFromSupabase(STATE.currentUser);
      if (supabaseData) {
        console.log('✅ User ma\'lumotlari Supabase-dan yuklandi');
        
        // Supabase ma'lumotlarini STATE-ga ko'chirish
        const persistentKeys = Object.keys(DEFAULT_STATE).filter(k => ![
            'settingsPassword', 'transferCardNumber', 'users',
            'isLoggedIn', 'currentUser', 'lastActivity', 'sessionTimeout'
        ].includes(k));
        
        persistentKeys.forEach(key => {
          if (supabaseData[key] !== undefined) {
            STATE[key] = supabaseData[key];
          }
        });
        
        // Tables-ni alohida handle qilish
        if (supabaseData.tables) {
          Object.keys(DEFAULT_STATE.tables).forEach(key => {
            if (supabaseData.tables[key]) {
              Object.assign(STATE.tables[key], supabaseData.tables[key]);
              STATE.tables[key].interval = null;
              if (STATE.tables[key].active && window.gameModule && window.gameModule.startTimer) {
                window.gameModule.startTimer(key);
              }
            }
          });
        }
        
        // Qarz balansini hisoblash
        STATE.debtBalance = STATE.debtors.reduce((sum, d) => sum + d.totalDebt, 0);
      } else {
        console.log('ℹ️ User ma\'lumotlari topilmadi (yangi user)');
      }
    } catch (e) {
      console.warn('⚠️ User ma\'lumotlarini yuklashda xato:', e);
    }
  }
  
  // STEP 3: localStorage-dan fallback yuklash (faqat offline)
  const db = localStorage.getItem(DB_NAME);
  if (db) {
    try {
      const database = JSON.parse(db);
      if (database.data) {
        const data = database.data;
        console.log('📦 Database data topildi:', Object.keys(data));
        
        const persistentKeys = Object.keys(DEFAULT_STATE).filter(k => ![
            'settingsPassword', 'transferCardNumber', 
            'isLoggedIn', 'tables', 'currentUser', 'lastActivity', 'sessionTimeout',
            'users' // NEVER overwrite users from localStorage - Supabase is primary source
        ].includes(k));
        // receipts is now persistent - will be saved and loaded
        
        persistentKeys.forEach(key => {
          if (data[key] !== undefined) {
            STATE[key] = data[key];
          }
        });
        
        // Qarz balansini yangilash
        STATE.debtBalance = STATE.debtors.reduce((sum, d) => sum + d.totalDebt, 0);

        if (data.tables) {
           Object.keys(DEFAULT_STATE.tables).forEach(key => {
              if (data.tables[key]) {
                  Object.assign(STATE.tables[key], data.tables[key]);
                  
                  STATE.tables[key].interval = null; 
                  if (STATE.tables[key].active && window.gameModule && window.gameModule.startTimer) {
                      window.gameModule.startTimer(key);
                  }
              }
           });
        }
      }
    } catch (e) {
      console.error('❌ Database load error:', e);
      loadLegacyData();
    }
  } else {
    console.log('ℹ️ localStorage cache topilmadi (normal)');
  }
  
  console.log(`📊 loadData() tugadi. Users: ${STATE.users.length}`);
        
  cleanOldHistory();
  cleanOldReceipts();
  cleanOldLogs();
  if (window.uiModule && window.uiModule.updateUI) {
    window.uiModule.updateUI();
  }
}

function loadLegacyData() {
  console.log('🗂️ loadLegacyData() chaqirildi');
  
  const saved = localStorage.getItem('noorData');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      console.log('📜 Legacy data topildi:', Object.keys(data));
      
      const persistentKeys = Object.keys(DEFAULT_STATE).filter(k => ![
          'settingsPassword', 'transferCardNumber', 
          'isLoggedIn', 'tables', 'currentUser', 'lastActivity', 'sessionTimeout'
      ].includes(k));
      
      persistentKeys.forEach(key => {
        if (data[key] !== undefined) {
          STATE[key] = data[key];
          if (key === 'users') {
            console.log(`👥 Legacy users yuklandi: ${STATE.users.length} ta`);
          }
        }
      });
      
      // Qarz balansini yangilash
      STATE.debtBalance = STATE.debtors.reduce((sum, d) => sum + d.totalDebt, 0);

      if (data.tables) {
         Object.keys(DEFAULT_STATE.tables).forEach(key => {
            if (data.tables[key]) {
                Object.assign(STATE.tables[key], data.tables[key]);
                
                STATE.tables[key].interval = null; 
                if (STATE.tables[key].active && window.gameModule && window.gameModule.startTimer) {
                    window.gameModule.startTimer(key);
                }
            }
         });
      }

    } catch (e) {
      console.error('❌ Legacy data load error:', e);
      showNotification('⚠️ Ma\'lumot yuklashda xatolik yuz berdi. Dastur toza holatda ishga tushirildi.');
      Object.assign(STATE, JSON.parse(JSON.stringify(DEFAULT_STATE)));
    }
  } else {
    console.log('⚠️ Legacy data ham topilmadi');
  }
}

export async function saveData() {
  try {
    const toSave = {};
    const persistentKeys = Object.keys(DEFAULT_STATE).filter(k => ![
      'settingsPassword', 'transferCardNumber', 'isLoggedIn', 
      'currentTableKey', 'currentInputType', 'currentDebtData', 'currentDebtorToDelete', 
      'currentDebtorToPay', 'confirmCallback', 'selectedProduct', 'currentPaymentType', 'currentUser',
      'lastActivity', 'sessionTimeout'
    ].includes(k));
    
    persistentKeys.forEach(key => {
      toSave[key] = STATE[key];
    });

    toSave.tables = JSON.parse(JSON.stringify(STATE.tables));
    Object.keys(toSave.tables).forEach(key => {
        toSave.tables[key].interval = null;
    });
    
    // PRIMARY: Supabase-ga saqlash (asosiy)
    if (STATE.currentUser) {
      console.log(`💾 Supabase-ga saqlash: ${STATE.currentUser}`);
      await saveToSupabase(toSave);
    } else {
      console.warn('⚠️ User login qilmagan, ma\'lumot saqlanmadi!');
      return;
    }
    
    // SECONDARY: localStorage cache (fallback)
    const db = JSON.parse(localStorage.getItem(DB_NAME) || '{}');
    db.data = toSave;
    db.lastModified = new Date().toISOString();
    db.lastUser = STATE.currentUser;
    localStorage.setItem(DB_NAME, JSON.stringify(db));
    console.log('📦 localStorage cache yangilandi');
    
  } catch (e) {
    console.error('❌ Save error:', e);
    showNotification('❌ Ma\'lumot saqlanmadi! Server bilan aloqa yo\'q.');
  }
}

// YANGI: Supabase-dan users yuklash
export async function loadUsersFromSupabase() {
  if (!USE_ONLINE_BACKUP) {
    console.log('⚠️ Online backup o\'chirilgan');
    return;
  }
  
  console.log('☁️ Supabase-dan users yuklanmoqda...');
  
  try {
    const response = await fetch(`${API_URL}/load-all-users`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      console.warn('❌ Users yuklab bo\'lmadi:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('📥 Supabase javob:', data);
    
    if (data.success && data.users && data.users.length > 0) {
      // Supabase is the source of truth for users
      // Backward compatible: support both 'pass' and 'password' fields
      STATE.users = data.users.map(u => ({ 
        username: u.username, 
        pass: u.password || u.pass  // Backend qaytargan password-ni pass ga o'zlashtirish
      }));
      console.log(`✅ ${STATE.users.length} ta user Supabase-dan yuklandi`);
      console.log('👥 Users:', STATE.users.map(u => `${u.username} (${u.pass ? 'OK' : 'NO PASS'})`).join(', '));
    } else {
      console.error('❌ CRITICAL: Supabase-da userlar topilmadi yoki xato');
    }
  } catch (error) {
    console.error('❌ Supabase-dan users yuklashda xato:', error);
  }
}

// YANGI: Supabase'ga saqlash (awaited retry logic bilan)
async function saveToSupabase(data) {
  console.log('☁️ saveToSupabase() chaqirildi');
  console.log(`👤 User: ${STATE.currentUser}`);
  if (!STATE.currentUser) {
    console.error('❌ currentUser yo\'q! Supabase-ga saqlab bo\'lmaydi.');
    return false;
  }
  const payload = {
    userId: STATE.currentUser,
    data: data,
    timestamp: new Date().toISOString()
  };
  const tryCount = 3;
  const delay = (ms) => new Promise(res => setTimeout(res, ms));
  for (let attempt = 1; attempt <= tryCount; attempt++) {
    try {
      console.log(`📤 Yuborilmoqda (urinish ${attempt}/${tryCount})`, { userId: payload.userId, dataKeys: Object.keys(payload.data) });
      const response = await fetch(`${API_URL}/save-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('📥 Supabase javob:', response.status, response.statusText);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const result = await response.json();
      console.log('📊 Supabase natija:', result);
      if (result.success) {
        console.log('✅ Supabase-ga saqlandi (primary storage)');
        return true;
      }
      throw new Error(result.error || 'Unknown error');
    } catch (err) {
      console.error(`❌ Supabase saqlash xatosi (urinish ${attempt}/${tryCount}):`, err);
      if (attempt < tryCount) {
        const ms = 2000 * attempt;
        console.log(`🔄 ${ms}ms dan keyin qayta urinish...`);
        await delay(ms);
        continue;
      }
      console.error('❌ Supabase-ga saqlash 3 marta muvaffaqiyatsiz bo\'ldi');
      showNotification('⚠️ Ma\'lumot Supabase-ga saqlanmadi. Internet aloqasini tekshiring.');
      return false;
    }
  }
  return false;
}

// YANGI: Supabase'dan yuklash
async function loadFromSupabase(username) {
  try {
    const response = await fetch(`${API_URL}/load-data/${username}`);
    
    if (!response.ok) {
      console.error('Supabase load failed');
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (e) {
    console.error('Supabase load error:', e);
    return null;
  }
}

// ========== CLEANUP FUNCTIONS ==========
function cleanOldHistory() {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  STATE.history = STATE.history.filter(h => (now - h.timestamp) < sevenDays);
}

function cleanOldReceipts() {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  STATE.receipts = STATE.receipts.filter(r => (now - r.timestamp) < sevenDays);
}

function cleanOldLogs() {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  STATE.logs = STATE.logs.filter(l => (now - new Date(l.timestamp).getTime()) < thirtyDays);
}

// ========== DATA EXPORT/IMPORT ==========
export function exportData() {
  saveData(); 
  const data = localStorage.getItem('noorData');
  const passwords = {
      settingsPassword: encrypt(STATE.settingsPassword),
      transferCardNumber: encrypt(STATE.transferCardNumber)
  };
  
  const exportObj = {
      version: '1.3', 
      timestamp: Date.now(),
      data: data,
      passwords: passwords
  };
  
  const json = JSON.stringify(exportObj, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `noor_data_export_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification('✅ Ma\'lumotlar muvaffaqiyatli eksport qilindi!');
}

export function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
      try {
          const importObj = JSON.parse(e.target.result);
          
          if (importObj.data && importObj.passwords) {
              showConfirm("⚠️ Ma'lumotlarni import qilish mavjud ma'lumotlaringizni o'chiradi. Davom etishni tasdiqlaysizmi?", () => {
                  localStorage.setItem('noorData', importObj.data);
                  localStorage.setItem('noorSettingsPassword', importObj.passwords.settingsPassword);
                  localStorage.setItem('noorTransferCard', importObj.passwords.transferCardNumber);
                  
                  Object.keys(STATE.tables).forEach(key => {
                      if (STATE.tables[key].interval) {
                          clearInterval(STATE.tables[key].interval);
                      }
                  });

                  // Initalize passwords from main.js
          // Initialize passwords will be handled by main.js                  loadData(); 
                  closeModal('settingsModal');
                  
                  const { renderPage, getCurrentPage } = require('./game.js');
                  renderPage(getCurrentPage());
                  showNotification('✅ Ma\'lumotlar muvaffaqiyatli import qilindi!');
              });
          } else {
              showNotification('❌ Import fayli formati noto\'g\'ri!');
          }
      } catch (error) {
          showNotification('❌ Import faylini o\'qishda xatolik: ' + error.message);
      }
      event.target.value = '';
  };
  reader.readAsText(file);
}
