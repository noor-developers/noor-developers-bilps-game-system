// ========== STORAGE MODULE (FIREBASE ONLY) ==========
// Data Loading, Saving - FAQAT Firebase Firestore
// localStorage BUTUNLAY OCHIRILDI - Barcha malumotlar faqat Firebase da

import { STATE } from './config.js';
import { showNotification } from './ui.js';
import { saveGameDataToFirestore } from './database.js';

// ========== DATA LOADING ==========
export async function loadData() {
  console.log(' loadData() - FIREBASE ONLY MODE');
  console.log('ℹ Barcha malumotlar Firebase Firestore dan avtomatik yuklanadi');
  console.log(' localStorage ishlatilmaydi - faqat Firebase');
  
  return true;
}

// ========== DATA SAVING ==========
export async function saveData() {
  if (!STATE.userId || !STATE.isLoggedIn) {
    console.warn(' User login qilmagan, malumot saqlanmadi!');
    return;
  }
  
  try {
    console.log(` Firebase Firestore ga saqlash: ${STATE.currentUser} (${STATE.userId})`);
    await saveGameDataToFirestore(STATE.userId);
    console.log(' Barcha malumotlar Firebase ga saqlandi');
  } catch (e) {
    console.error(' Firebase save error:', e);
    showNotification(' Malumot saqlanmadi! Internet aloqasini tekshiring.');
    throw e;
  }
}

// ========== EXPORT (Firebase Backup) ==========
export async function exportData() {
  if (!STATE.userId || !STATE.isLoggedIn) {
    showNotification(' Export qilish uchun login qiling!');
    return;
  }
  
  try {
    const { db } = await import('./firebase-config.js');
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const userDocRef = doc(db, 'users', STATE.userId);
    const gameDocRef = doc(db, 'users', STATE.userId, 'gameData', 'current');
    
    const [userSnap, gameSnap] = await Promise.all([
      getDoc(userDocRef),
      getDoc(gameDocRef)
    ]);
    
    const exportData = {
      version: 'v18',
      timestamp: new Date().toISOString(),
      uniqueId: STATE.uniqueId,
      profile: userSnap.exists() ? userSnap.data() : {},
      gameData: gameSnap.exists() ? gameSnap.data() : {}
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noor_backup_${STATE.uniqueId}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(' Malumotlar Firebase dan export qilindi!');
  } catch (error) {
    console.error(' Export error:', error);
    showNotification(' Export qilishda xatolik!');
  }
}

export function handleImportFile(event) {
  showNotification('ℹ Import ochirilgan. Firebase avtomatik sinxronizatsiya ishlatiladi.');
  event.target.value = '';
}

console.log(' Storage module yuklandi: FIREBASE ONLY MODE');