// ========== AUTHENTICATION MODULE (FIREBASE) ==========
// Firebase Authentication bilan Login, Registration, Logout

import { auth } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { STATE } from './config.js';
import { loadData, saveData } from './storage.js';
import { showNotification, openModal, closeModal, showConfirm, updateUI } from './ui.js';
import { addLog, generateUniqueId } from './utils.js';
import { renderPage, clearSessionState } from './game.js';
import { syncNotesArea } from './notes.js';
import { loadUserDataFromFirestore, startRealtimeSync, stopRealtimeSync } from './database.js';

// ========== FIREBASE AUTH STATE LISTENER ==========
// Firebase avtomatik session restore qiladi
let currentUser = null;

export function initAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        console.log('✅ Firebase auto-login:', user.email);
        
        // STATE-ni yangilash
        STATE.isLoggedIn = true;
        STATE.currentUser = user.displayName || user.email;
        STATE.userId = user.uid; // Firebase user ID
        STATE.lastActivity = Date.now();
        
        // Login screen yashirish
        document.getElementById('loginScreen').style.opacity = '0';
        document.getElementById('loginScreen').style.visibility = 'hidden';
        
        // Firestore dan ma'lumotlarni yuklash
        await loadUserDataFromFirestore(user.uid);
        
        // Real-time sinxronizatsiyani boshlash
        startRealtimeSync(user.uid);
        
        // UI ni yangilash
        renderPage('billiard');
        syncNotesArea();
        updateUI();
        
        // Club info ko'rsatish
        displayUserInfo(user);
        
        resolve(user);
      } else {
        currentUser = null;
        console.log('❌ Foydalanuvchi tizimdan chiqdi');
        
        // STATE-ni tozalash
        STATE.isLoggedIn = false;
        STATE.currentUser = "";
        STATE.userId = null;
        
        // Real-time sinxronizatsiyani to'xtatish
        stopRealtimeSync();
        
        // Login screen ko'rsatish
        document.getElementById('loginScreen').style.opacity = '1';
        document.getElementById('loginScreen').style.visibility = 'visible';
        
        resolve(null);
      }
    });
  });
}

// User ma'lumotlarini UI da ko'rsatish
function displayUserInfo(user) {
  const clubInfoEl = document.getElementById('clubInfo');
  if (clubInfoEl && STATE.clubName) {
    clubInfoEl.textContent = `🏢 ${STATE.clubName}`;
    clubInfoEl.style.display = 'block';
  }
  
  const clubNameDisplay = document.getElementById('clubNameDisplay');
  if (clubNameDisplay && STATE.clubName) {
    clubNameDisplay.textContent = STATE.clubName;
  }
}

// Deprecated - Firebase o'zi session restore qiladi
export function autoLoginIfActive() {
  // Firebase onAuthStateChanged ichida amalga oshiriladi
  console.log('ℹ️ Firebase auth state checking...');
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
  // localStorage YO'Q - Firebase faqat
  document.getElementById('loginScreen').style.opacity = '1';
  document.getElementById('loginScreen').style.visibility = 'visible';
  const notesArea = document.getElementById('notesArea');
  if (notesArea) notesArea.value = '';
  showNotification('⚠️ 30 daqiqa faollik yo\'qligi sababli tizimdan chiqildi', 5000);
}

// ========== REGISTRATION (FIREBASE) ==========
export function showRegisterForm() {
  document.getElementById('loginFormDiv').style.display = 'none';
  document.getElementById('registerFormDiv').style.display = 'block';
}

export function showLoginForm() {
  document.getElementById('loginFormDiv').style.display = 'block';
  document.getElementById('registerFormDiv').style.display = 'none';
}

export async function register() {
  console.log('📝 Firebase registration boshlandi');
  
  const username = document.getElementById('registerUsername').value.trim();
  const clubName = document.getElementById('registerClubName').value.trim();
  const ownerName = document.getElementById('registerOwnerName').value.trim();
  const phone = document.getElementById('registerPhone').value.trim();
  const email = `${username}@noor-gms.uz`;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const address = document.getElementById('registerAddress').value.trim();

  // Validate
  if (!username || !clubName || !ownerName || !phone) {
    showNotification('⚠️ Barcha maydonlarni to\'ldiring!');
    return;
  }

  if (!password || !confirmPassword) {
    showNotification('⚠️ Parol maydonlarini to\'ldiring!');
    return;
  }

  if (password !== confirmPassword) {
    showNotification('❌ Parollar mos kelmadi!');
    return;
  }

  if (password.length < 6) {
    showNotification('❌ Parol kamida 6 ta belgidan iborat bo\'lishi kerak!');
    return;
  }

  try {
    // Noyob 14-belgilik ID yaratish
    const uniqueId = generateUniqueId();
    console.log('🆔 Noyob ID yaratildi:', uniqueId);
    
    // Firebase da yangi user yaratish
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Display name o'rnatish
    await updateProfile(user, {
      displayName: clubName
    });
    
    console.log('✅ Firebase user yaratildi:', user.uid);
    
    // Firestore da user ma'lumotlarini saqlash (uniqueId bilan)
    const { saveUserProfileToFirestore } = await import('./database.js');
    await saveUserProfileToFirestore(user.uid, {
      uniqueId,        // Noyob 14-belgilik ID
      username,        // Username
      clubName,        // Klub nomi
      ownerName,       // Egasi
      phone,           // Telefon
      email,           // Email
      address,         // Manzil
      createdAt: new Date().toISOString()
    });
    
    // STATE ga ham saqlash
    STATE.uniqueId = uniqueId;
    
    showNotification(`✅ Ro'yxatdan o'tdingiz! ID: ${uniqueId} 🎉`);
    addLog('Yangi user yaratildi', `${clubName} (ID: ${uniqueId})`);
    
    // Form tozalash
    clearRegisterForm();
    
    // Firebase avtomatik login qiladi
    
  } catch (error) {
    console.error('❌ Registration xatosi:', error);
    
    let errorMessage = 'Royxatdan otishda xatolik!';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = `Bu username (${username}) allaqachon band! Boshqa username tanlang.`;
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Notogri email formati!';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Parol juda zaif!';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showNotification(errorMessage);
  }
}

function clearRegisterForm() {
  document.getElementById('registerUsername').value = '';
  document.getElementById('registerClubName').value = '';
  document.getElementById('registerPassword').value = '';
  document.getElementById('registerConfirmPassword').value = '';
  document.getElementById('registerOwnerName').value = '';
  document.getElementById('registerPhone').value = '';
  document.getElementById('registerAddress').value = '';
}

// ========== LOGIN (FIREBASE) ==========
export async function login() {
  console.log('🔑 Firebase login boshlandi');
  
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  // Email formatini yaratish (username dan)
  const email = username.includes('@') ? username : `${username}@noor-gms.uz`;

  if (!username || !password) {
    showNotification('⚠️ Username va parolni kiriting!');
    return;
  }

  try {
    // Firebase login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Firebase login muvaffaqiyatli:', user.uid);
    showNotification(`✅ Xush kelibsiz, ${user.displayName || 'Foydalanuvchi'}! 👋`);
    addLog("Tizimga kirish", `User: ${user.displayName || user.email}`);
    
    // Firebase onAuthStateChanged avtomatik ishga tushadi
    
  } catch (error) {
    console.error('❌ Login xatosi:', error);
    
    let errorMessage = 'Tizimga kirishda xatolik!';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Foydalanuvchi topilmadi!';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Noto\'g\'ri parol!';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Noto\'g\'ri username formati!';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Username yoki parol noto\'g\'ri!';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showNotification(errorMessage);
    addLog("Kirishda xatolik", `Username: ${username}`);
  }
}

// ========== LOGOUT (FIREBASE) ==========
export function logout() {
  showConfirm('Tizimdan chiqishni tasdiqlaysizmi?', async () => {
    if (STATE.shiftOpen) {
      showConfirm('⚠️ Smena hali ochiq! Uni yopib chiqishni tasdiqlaysizmi?', async () => {
        await closeShiftBeforeLogout();
        await performLogout();
      });
    } else {
      await performLogout();
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

async function performLogout() {
  try {
    // Firebase logout
    await signOut(auth);
    
    console.log('✅ Firebase logout muvaffaqiyatli');
    
    // STATE tozalash
    STATE.isLoggedIn = false;
    STATE.currentUser = "";
    STATE.userId = null;
    
    addLog("Tizimdan chiqish", "");
    
    // UI tozalash
    document.getElementById('loginScreen').style.opacity = '1';
    document.getElementById('loginScreen').style.visibility = 'visible';
    
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    
    const notesArea = document.getElementById('notesArea');
    if (notesArea) notesArea.value = '';
    
    updateUI();
    showNotification('✅ Tizimdan chiqtingiz!', 2000);
    
  } catch (error) {
    console.error('❌ Logout xatosi:', error);
    showNotification('❌ Tizimdan chiqishda xatolik!');
  }
}

// ========== PASSWORD CHANGE (FIREBASE) ==========
export async function changePassword() {
  const currentPassword = document.getElementById('settingsCurrentPassword').value;
  const newPassword = document.getElementById('settingsNewPassword').value;
  const confirmPassword = document.getElementById('settingsConfirmPassword').value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    showNotification('⚠️ Barcha maydonlarni to\'ldiring!');
    return;
  }

  // Yangi parolni tekshirish
  if (newPassword.length < 6) {
    showNotification('❌ Parol kamida 6 ta belgidan iborat bo\'lishi kerak!');
    return;
  }

  if (newPassword !== confirmPassword) {
    showNotification('❌ Yangi parollar mos kelmadi!');
    return;
  }

  try {
    const user = auth.currentUser;
    if (!user) {
      showNotification('❌ Tizimga kirilmagan!');
      return;
    }
    
    // Re-authenticate user with current password
    const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await updatePassword(user, newPassword);
    
    showNotification('✅ Parol muvaffaqiyatli o\'zgartirildi!');
    addLog('Parol o\'zgartirildi', STATE.currentUser);
    
    // Clear password fields
    document.getElementById('settingsCurrentPassword').value = '';
    document.getElementById('settingsNewPassword').value = '';
    document.getElementById('settingsConfirmPassword').value = '';
    
  } catch (error) {
    console.error('❌ Password update xatosi:', error);
    
    let errorMessage = 'Parol o\'zgartirishda xatolik!';
    
    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Joriy parol noto\'g\'ri!';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Yangi parol juda zaif!';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showNotification(errorMessage);
  }
}

// ========== HELPER FUNCTIONS ==========
export function getCurrentUser() {
  return currentUser;
}

export function isLoggedIn() {
  return STATE.isLoggedIn && currentUser !== null;
}
