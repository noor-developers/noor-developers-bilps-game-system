// ========== AUTHENTICATION MODULE ==========
// Login, Registration, Logout va Session Management

import { STATE, API_URL, USE_ONLINE_BACKUP } from './config.js';
import { saveData, loadData } from './storage.js';
import { showNotification, openModal, closeModal, showConfirm, updateUI } from './ui.js';
import { addLog } from './utils.js';
import { renderPage, clearSessionState } from './game.js';
import { syncNotesArea } from './notes.js';

// ========== AUTO-LOGIN (Session Restore) ==========
export function autoLoginIfActive() {
  const session = localStorage.getItem('noor_session');
  if (session) {
    try {
      const sessionData = JSON.parse(session);
      const loginTime = sessionData.loginTime || 0;
      const elapsed = Date.now() - loginTime;
      const maxSessionTime = STATE.sessionTimeout;

      if (sessionData.isLoggedIn && elapsed < maxSessionTime) {
        STATE.isLoggedIn = true;
        STATE.currentUser = sessionData.currentUser;
        STATE.lastActivity = Date.now();
        
        document.getElementById('loginScreen').style.opacity = '0';
        document.getElementById('loginScreen').style.visibility = 'hidden';
        
        console.log(`✅ Auto-login: ${STATE.currentUser}`);
        loadData().then(() => {
          renderPage('billiard');
          syncNotesArea();
          updateUI();
        });
      } else {
        localStorage.removeItem('noor_session');
      }
    } catch (e) {
      console.error('Auto-login xatosi:', e);
      localStorage.removeItem('noor_session');
    }
  }
}

// ========== SESSION ACTIVITY TRACKING ==========
export function updateActivity() {
  if (STATE.isLoggedIn) {
    STATE.lastActivity = Date.now();
  }
}

export function checkInactivity() {
  if (STATE.isLoggedIn && STATE.lastActivity) {
    const elapsed = Date.now() - STATE.lastActivity;
    if (elapsed > STATE.sessionTimeout) {
      logoutDueToInactivity();
    }
  }
}

function logoutDueToInactivity() {
  addLog("Avtomatik chiqish", "Faollik yo'qligi sababli (30 daqiqa)");
  STATE.isLoggedIn = false;
  STATE.currentUser = "";
  localStorage.removeItem('noor_session');
  document.getElementById('loginScreen').style.opacity = '1';
  document.getElementById('loginScreen').style.visibility = 'visible';
  const notesArea = document.getElementById('notesArea');
  if (notesArea) notesArea.value = '';
  showNotification('⚠️ 30 daqiqa faollik yo\'qligi sababli tizimdan chiqildi', 5000);
}

// ========== REGISTRATION ==========
export function showRegisterForm() {
  document.getElementById('loginFormDiv').style.display = 'none';
  document.getElementById('registerFormDiv').style.display = 'block';
}

export function showLoginForm() {
  document.getElementById('loginFormDiv').style.display = 'block';
  document.getElementById('registerFormDiv').style.display = 'none';
}

export async function register() {
  console.log('📝 register() funksiyasi chaqirildi');
  
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const clubName = document.getElementById('registerClubName').value.trim();
  const ownerName = document.getElementById('registerOwnerName').value.trim();
  const phone = document.getElementById('registerPhone').value.trim();
  const address = document.getElementById('registerAddress').value.trim();

  console.log(`👤 Ro'yxatdan o'tish: ${username}, Klub: ${clubName}`);

  // Validate account fields
  if (!username || !password || !confirmPassword) {
    showNotification('⚠️ Login va parol maydonlarini to\'ldiring!');
    return;
  }

  if (password !== confirmPassword) {
    showNotification('❌ Parollar mos kelmadi!');
    return;
  }

  if (password.length < 4) {
    showNotification('❌ Parol kamida 4 ta belgidan iborat bo\'lishi kerak!');
    return;
  }

  // Validate club fields
  if (!clubName || !ownerName || !phone) {
    showNotification('⚠️ Klub nomi, egasi va telefon raqamini kiriting!');
    return;
  }

  // Mavjud user tekshirish
  if (STATE.users.find(u => u.username === username)) {
    console.log('❌ User allaqachon mavjud');
    showNotification('❌ Bu login band! Boshqa tanlang.');
    return;
  }

  // Yangi user qo'shish (STATE.users ga club ma'lumotlarisiz)
  STATE.users.push({ username, pass: password });
  console.log(`✅ User STATE-ga qo'shildi. Jami: ${STATE.users.length}`);

  // Supabase-ga yuborish (club ma'lumotlari bilan)
  if (USE_ONLINE_BACKUP) {
    console.log('☁️ Supabase-ga yuborilmoqda...');
    try {
      const response = await fetch(`${API_URL}/add-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password,
          clubName,
          ownerName,
          phone,
          address
        })
      });
      const data = await response.json();
      if (data.success) {
        console.log('✅ User va klub ma\'lumotlari Supabase-ga qo\'shildi:', data);
        showNotification('✅ Ro\'yxatdan o\'tdingiz! Endi kirish mumkin.');
        addLog('Yangi user yaratildi', `${username} (${clubName})`);
        
        // Clear form and switch to login
        clearRegisterForm();
        showLoginForm();
      } else {
        console.warn('⚠️ Supabase xatosi:', data.error);
        showNotification('❌ Server xatosi! Qayta urinib ko\'ring.');
      }
    } catch (e) {
      console.error('❌ Backend xatosi:', e);
      showNotification('❌ Server bilan aloqa yo\'q!');
    }
  } else {
    // Offline mode
    await saveData();
    showNotification('✅ Ro\'yxatdan o\'tdingiz! Endi kirish mumkin.');
    addLog('Yangi user yaratildi', username);
    clearRegisterForm();
    showLoginForm();
  }

  console.log('✅ Ro\'yxatdan o\'tish muvaffaqiyatli');
}

function clearRegisterForm() {
  document.getElementById('registerUsername').value = '';
  document.getElementById('registerPassword').value = '';
  document.getElementById('registerConfirmPassword').value = '';
  document.getElementById('registerClubName').value = '';
  document.getElementById('registerOwnerName').value = '';
  document.getElementById('registerPhone').value = '';
  document.getElementById('registerAddress').value = '';
}

// ========== LOGIN ==========
export async function login() {
  console.log('🔑 login() funksiyasi chaqirildi');
  
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  console.log(`👤 Login urinish: ${username}`);
  console.log(`📊 Mavjud users (${STATE.users.length}):`, STATE.users.map(u => u.username));
  console.log(`🔐 Kiritilgan parol uzunligi: ${password.length}`);

  if (!username || !password) {
    showNotification('⚠️ Login va parolni kiriting!');
    return;
  }

  // Debug: har bir userni tekshirish
  STATE.users.forEach(u => {
    console.log(`🔍 Tekshirish: ${u.username} | pass: "${u.pass}" | match: ${u.username === username && u.pass === password}`);
  });

  const user = STATE.users.find(u => u.username === username && u.pass === password);
  
  console.log('🔍 User topildi:', user ? `✅ ${user.username}` : '❌ topilmadi');
  
  if (user) {
    STATE.isLoggedIn = true;
    STATE.currentUser = user.username;
    STATE.lastActivity = Date.now();
    
    // Session holatini localStorage-ga saqlash
    localStorage.setItem('noor_session', JSON.stringify({
      isLoggedIn: true,
      currentUser: user.username,
      loginTime: Date.now()
    }));
    
    document.getElementById('loginScreen').style.opacity = '0';
    document.getElementById('loginScreen').style.visibility = 'hidden';
    
    addLog("Tizimga kirish", `Foydalanuvchi: ${user.username}`);
    await loadData();
    syncNotesArea();
    updateUI();
    
    // Club ma'lumotlarini ko'rsatish
    await loadAndDisplayClubInfo(user.username);
    
    renderPage('billiard');
  } else {
    showNotification('❌ Noto\'g\'ri login yoki parol!');
    addLog("Kirishda xatolik", `Login: ${username}`);
  }
}

// Club ma'lumotlarini yuklash va UI da ko'rsatish
async function loadAndDisplayClubInfo(username) {
  console.log(`🏢 ${username} klub ma'lumotlari yuklanmoqda...`);
  
  try {
    const response = await fetch(`${API_URL}/load-all-users`);
    if (!response.ok) {
      console.warn('❌ Club info yuklab bo\'lmadi');
      return;
    }
    
    const data = await response.json();
    if (data.success && data.users) {
      const userInfo = data.users.find(u => u.username === username);
      
      if (userInfo) {
        console.log('✅ User ma\'lumotlari topildi:', userInfo);
        
        // STATE ga club ma'lumotlarini saqlash
        STATE.clubName = userInfo.club_name || '';
        STATE.userEmail = userInfo.email || '';
        STATE.clubPhone = userInfo.phone || '';
        
        // User settings-ni yuklash (agar mavjud bo'lsa)
        if (userInfo.settings) {
          const settings = typeof userInfo.settings === 'string' 
            ? JSON.parse(userInfo.settings) 
            : userInfo.settings;
          
          STATE.priceB1 = settings.priceB1 || STATE.priceB1;
          STATE.priceB2 = settings.priceB2 || STATE.priceB2;
          STATE.pricePS4 = settings.pricePS4 || STATE.pricePS4;
          STATE.pricePS5 = settings.pricePS5 || STATE.pricePS5;
          STATE.clubOwner = settings.ownerName || '';
          STATE.clubAddress = settings.address || '';
          
          console.log('✅ User sozlamalari yuklandi:', settings);
        }
        
        // UI da ko'rsatish
        const clubInfoEl = document.getElementById('clubInfo');
        if (clubInfoEl && STATE.clubName) {
          clubInfoEl.textContent = `🏢 ${STATE.clubName}`;
          clubInfoEl.style.display = 'block';
        }
        
        // Topbar club name-ni yangilash
        const clubNameDisplay = document.getElementById('clubNameDisplay');
        if (clubNameDisplay && STATE.clubName) {
          clubNameDisplay.textContent = STATE.clubName;
        }
      } else {
        console.log('ℹ️ User ma\'lumotlari topilmadi');
      }
    }
  } catch (e) {
    console.error('❌ Club info yuklashda xato:', e);
  }
}

// ========== LOGOUT ==========
export function logout() {
  showConfirm('Tizimdan chiqishni tasdiqlaysizmi?', async () => {
    if (STATE.shiftOpen) {
      showConfirm('⚠️ Smena hali ochiq! Uni yopib chiqishni tasdiqlaysizmi?', async () => {
        await closeShiftBeforeLogout();
        performLogout();
      });
    } else {
      performLogout();
    }
  });
}

async function closeShiftBeforeLogout() {
  const shiftData = {
    shiftId: STATE.currentShiftId,
    employeeName: STATE.currentUser,
    startTime: STATE.shiftStartTime,
    endTime: new Date().toLocaleString('uz-UZ'),
    cashBalance: STATE.cashBalance,
    transferBalance: STATE.transferBalance,
    debtBalance: STATE.debtBalance,
    stats: { ...STATE.stats },
    receipts: [...STATE.receipts],
    timestamp: Date.now()
  };
  STATE.history.push(shiftData);
  
  STATE.shiftOpen = false;
  STATE.cashBalance = 0;
  STATE.transferBalance = 0;
  STATE.stats = { b1: 0, b2: 0, ps4: 0, ps5: 0, bar: 0 };
  STATE.receipts = [];
  
  Object.keys(STATE.tables).forEach(key => {
    if (STATE.tables[key].active) {
      clearSessionState(key);
    }
  });
  
  await saveData();
}

function performLogout() {
  STATE.isLoggedIn = false;
  STATE.currentUser = "";
  
  localStorage.removeItem('noor_session');
  
  addLog("Tizimdan chiqish", "");
  saveData();
  
  updateUI();
  document.getElementById('loginScreen').style.opacity = '1';
  document.getElementById('loginScreen').style.visibility = 'visible';
  
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  const notesArea = document.getElementById('notesArea');
  if (notesArea) notesArea.value = '';
  
  if (typeof updateUI === 'function') updateUI();
  showNotification('✅ Tizimdan chiqtingiz!', 2000);
}
