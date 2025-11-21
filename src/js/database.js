// ========== FIRESTORE DATABASE MODULE ==========
// Real-time sinxronizatsiya va CRUD operatsiyalari

import { db } from './firebase-config.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { STATE } from './config.js';
import { showNotification } from './ui.js';
import { renderPage } from './game.js';
import { syncNotesArea } from './notes.js';

// Real-time listener unsubscribe function
let unsubscribeSnapshot = null;

/**
 * User profilini Firestore ga saqlash
 */
export async function saveUserProfileToFirestore(userId, profileData) {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, profileData, { merge: true });
    console.log('✅ User profil Firestore ga saqlandi');
  } catch (error) {
    console.error('❌ Profil saqlashda xato:', error);
    throw error;
  }
}

/**
 * User ma'lumotlarini Firestore dan yuklash
 */
export async function loadUserDataFromFirestore(userId) {
  try {
    console.log(`📥 Firestore dan ma'lumotlar yuklanmoqda... (userId: ${userId})`);
    
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Firestore dan ma\'lumotlar yuklandi:', data);
      
      // Profile ma'lumotlarini STATE ga yuklash
      if (data.uniqueId) STATE.uniqueId = data.uniqueId;
      if (data.clubName) STATE.clubName = data.clubName;
      if (data.ownerName) STATE.clubOwner = data.ownerName;
      if (data.phone) STATE.clubPhone = data.phone;
      if (data.email) STATE.userEmail = data.email;
      if (data.address) STATE.clubAddress = data.address;
      
      // Unique ID ni console da ko'rsatish
      if (data.uniqueId) {
        console.log('🆔 User Unique ID:', data.uniqueId);
      }
      
      // Game data-ni yuklash
      const gameDocRef = doc(db, 'users', userId, 'gameData', 'current');
      const gameSnap = await getDoc(gameDocRef);
      
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        console.log('✅ Game data yuklandi:', gameData);
        
        // STATE ni yangilash
        if (gameData.tables) {
          STATE.tables = gameData.tables;
          
          // Data migration: Eski stollarni yangi formatga o'zgartirish
          let needsMigration = false;
          Object.keys(STATE.tables).forEach(key => {
            const table = STATE.tables[key];
            if (table.price === undefined) {
              // Eski STATE.prices dan yoki default narxdan olish
              const oldPrice = gameData.prices ? gameData.prices[key] : null;
              if (oldPrice) {
                table.price = oldPrice;
              } else {
                // Default narxlar
                if (key.startsWith('b')) table.price = 40000;
                else if (key.startsWith('ps4')) table.price = 15000;
                else if (key.startsWith('ps5')) table.price = 20000;
                else table.price = 40000;
              }
              needsMigration = true;
            }
          });
          
          if (needsMigration) {
            console.log('🔄 Data migration: Stollar yangilandi');
            saveGameDataToFirestore(userId);
          }
        }
        
        if (gameData.prices) STATE.prices = gameData.prices;
        if (gameData.history) STATE.history = gameData.history;
        if (gameData.stats) STATE.stats = gameData.stats;
        if (gameData.receipts) STATE.receipts = gameData.receipts;
        if (gameData.notes) STATE.notes = gameData.notes;
        if (gameData.queue) STATE.queue = gameData.queue;
        if (gameData.cashBalance !== undefined) STATE.cashBalance = gameData.cashBalance;
        if (gameData.transferBalance !== undefined) STATE.transferBalance = gameData.transferBalance;
        if (gameData.debtBalance !== undefined) STATE.debtBalance = gameData.debtBalance;
        if (gameData.shiftOpen !== undefined) STATE.shiftOpen = gameData.shiftOpen;
      } else {
        console.log('ℹ️ Game data topilmadi - yangi user');
        // Yangi user uchun boshlang'ich ma'lumotlarni saqlash
        await saveGameDataToFirestore(userId);
      }
    } else {
      console.log('ℹ️ User profil topilmadi');
    }
  } catch (error) {
    console.error('❌ Firestore dan yuklashda xato:', error);
    showNotification('⚠️ Ma\'lumotlar yuklanmadi, offline rejim');
  }
}

/**
 * Game ma'lumotlarini Firestore ga saqlash
 */
export async function saveGameDataToFirestore(userId) {
  if (!userId) {
    console.warn('⚠️ UserId yo\'q, saqlab bo\'lmadi');
    return;
  }
  
  try {
    const gameDocRef = doc(db, 'users', userId, 'gameData', 'current');
    
    const gameData = {
      tables: STATE.tables || {},
      prices: STATE.prices || {},
      history: STATE.history || [],
      stats: STATE.stats || {},
      receipts: STATE.receipts || [],
      notes: STATE.notes || [],
      queue: STATE.queue || [],
      cashBalance: STATE.cashBalance || 0,
      transferBalance: STATE.transferBalance || 0,
      debtBalance: STATE.debtBalance || 0,
      shiftOpen: STATE.shiftOpen || false,
      lastUpdated: new Date().toISOString()
    };
    
    await setDoc(gameDocRef, gameData, { merge: true });
    console.log('✅ Game data Firestore ga saqlandi');
  } catch (error) {
    console.error('❌ Firestore ga saqlashda xato:', error);
    showNotification('⚠️ Ma\'lumotlar saqlanmadi!');
  }
}

/**
 * Real-time sinxronizatsiyani boshlash
 */
export function startRealtimeSync(userId) {
  if (!userId) {
    console.warn('⚠️ UserId yo\'q, real-time sync boshlanmadi');
    return;
  }
  
  // Oldingi listener-ni to'xtatish
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
  }
  
  console.log(`🔄 Real-time sinxronizatsiya boshlandi (userId: ${userId})`);
  
  const gameDocRef = doc(db, 'users', userId, 'gameData', 'current');
  
  unsubscribeSnapshot = onSnapshot(gameDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('🔄 Real-time yangilanish olindi:', data);
      
      // STATE ni yangilash (faqat o'zgargan qismlar)
      const shouldUpdateUI = updateStateFromFirestore(data);
      
      // UI ni yangilash (agar kerak bo'lsa)
      if (shouldUpdateUI) {
        renderPage(getCurrentPageFromUrl());
        syncNotesArea();
        console.log('🔄 UI yangilandi (real-time)');
      }
    }
  }, (error) => {
    // Network xatolarini ignore qilish (AdBlock/Firewall)
    if (error.code === 'unavailable' || error.message.includes('BLOCKED')) {
      console.warn('⚠️ Firestore connection bloklangan (AdBlock?), offline mode');
      return;
    }
    
    // Boshqa xatolarni log qilish
    console.error('❌ Real-time listener xatosi:', error);
  });
}

/**
 * Real-time sinxronizatsiyani to'xtatish
 */
export function stopRealtimeSync() {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
    console.log('🛑 Real-time sinxronizatsiya to\'xtatildi');
  }
}

/**
 * STATE ni Firestore data bilan yangilash
 */
function updateStateFromFirestore(data) {
  let changed = false;
  
  // Tables
  if (data.tables && JSON.stringify(data.tables) !== JSON.stringify(STATE.tables)) {
    STATE.tables = data.tables;
    changed = true;
  }
  
  // Prices
  if (data.prices && JSON.stringify(data.prices) !== JSON.stringify(STATE.prices)) {
    STATE.prices = data.prices;
    changed = true;
  }
  
  // History
  if (data.history && data.history.length !== STATE.history.length) {
    STATE.history = data.history;
    changed = true;
  }
  
  // Stats
  if (data.stats && JSON.stringify(data.stats) !== JSON.stringify(STATE.stats)) {
    STATE.stats = data.stats;
    changed = true;
  }
  
  // Receipts
  if (data.receipts && data.receipts.length !== STATE.receipts.length) {
    STATE.receipts = data.receipts;
    changed = true;
  }
  
  // Notes
  if (data.notes && JSON.stringify(data.notes) !== JSON.stringify(STATE.notes)) {
    STATE.notes = data.notes;
    changed = true;
  }
  
  // Queue
  if (data.queue && JSON.stringify(data.queue) !== JSON.stringify(STATE.queue)) {
    STATE.queue = data.queue;
    changed = true;
  }
  
  // Balances
  if (data.cashBalance !== undefined && data.cashBalance !== STATE.cashBalance) {
    STATE.cashBalance = data.cashBalance;
    changed = true;
  }
  
  if (data.transferBalance !== undefined && data.transferBalance !== STATE.transferBalance) {
    STATE.transferBalance = data.transferBalance;
    changed = true;
  }
  
  if (data.debtBalance !== undefined && data.debtBalance !== STATE.debtBalance) {
    STATE.debtBalance = data.debtBalance;
    changed = true;
  }
  
  // Shift status
  if (data.shiftOpen !== undefined && data.shiftOpen !== STATE.shiftOpen) {
    STATE.shiftOpen = data.shiftOpen;
    changed = true;
  }
  
  return changed;
}

/**
 * URL dan joriy sahifani aniqlash
 */
function getCurrentPageFromUrl() {
  const hash = window.location.hash.slice(1);
  return hash || 'billiard';
}

/**
 * User ma'lumotlarini tozalash
 */
export function clearUserData() {
  // STATE-ni default holatga qaytarish
  STATE.tables = {
    b1: { active: false, startTime: null, elapsedSeconds: 0 },
    b2: { active: false, startTime: null, elapsedSeconds: 0 },
    ps4: { active: false, startTime: null, elapsedSeconds: 0 },
    ps5: { active: false, startTime: null, elapsedSeconds: 0 }
  };
  STATE.prices = { b1: 25000, b2: 25000, ps4: 15000, ps5: 20000 };
  STATE.history = [];
  STATE.stats = { b1: 0, b2: 0, ps4: 0, ps5: 0, bar: 0 };
  STATE.receipts = [];
  STATE.notes = [];
  STATE.queue = [];
  STATE.cashBalance = 0;
  STATE.transferBalance = 0;
  STATE.debtBalance = 0;
  STATE.shiftOpen = false;
  STATE.clubName = '';
  STATE.clubOwner = '';
  STATE.clubPhone = '';
  STATE.userEmail = '';
  STATE.clubAddress = '';
  STATE.uniqueId = null;
  
  console.log('🗑️ User ma\'lumotlari tozalandi');
}

// Expose globally for storage.js
window.saveGameDataToFirestore = saveGameDataToFirestore;
