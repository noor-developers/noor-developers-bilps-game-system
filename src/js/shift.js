// ========== SHIFT MODULE ==========
// Shift Management (Open/Close)

import { STATE } from './config.js';
import { saveData } from './storage.js';

// Helper function for consistent Uzbek date/time formatting
function formatDateTimeUz(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
}
import { showNotification, showConfirm, updateUI } from './ui.js';
import { addLog } from './utils.js';
import { clearSessionState, getCurrentPage, renderPage } from './game.js';

// ========== SHIFT TOGGLE ==========
export async function toggleShift() {
  if (!STATE.shiftOpen) {
    if (!STATE.currentUser) {
        showNotification('⚠️ Iltimos, avval tizimga kiring!');
        return;
    }
    STATE.shiftOpen = true;
    STATE.shiftStartTime = formatDateTimeUz(new Date());
    STATE.currentShiftId = Date.now();
    STATE.cashBalance = 0;
    STATE.transferBalance = 0;
    STATE.stats = { b1: 0, b2: 0, ps4: 0, ps5: 0, bar: 0 };
    STATE.receipts = [];
    
    addLog("Smena ochildi", `Xodim: ${STATE.currentUser}`);
    showNotification(`✅ Smena muvaffaqiyatli ochildi! (Xodim: ${STATE.currentUser})`);
    updateUI();
    await saveData();
  } else {
    showConfirm('Smenani yopishni tasdiqlaysizmi? Faol sessiyalar avtomatik to\'xtatiladi.', async () => {
      const shiftData = {
        shiftId: STATE.currentShiftId,
        employeeName: STATE.currentUser,
        startTime: STATE.shiftStartTime,
        endTime: formatDateTimeUz(new Date()),
        cashBalance: STATE.cashBalance,
        transferBalance: STATE.transferBalance,
        debtBalance: STATE.debtBalance,
        stats: { ...STATE.stats },
        receipts: [...STATE.receipts],
        timestamp: Date.now()
      };
      STATE.history.push(shiftData);
      
      STATE.shiftOpen = false;
      STATE.shiftStartTime = null;
      STATE.currentShiftId = null;
      STATE.cashBalance = 0;
      STATE.transferBalance = 0;
      STATE.stats = { b1: 0, b2: 0, ps4: 0, ps5: 0, bar: 0 };
      STATE.receipts = [];
      
      Object.keys(STATE.tables).forEach(key => {
        if (STATE.tables[key].active) {
          clearSessionState(key);
        }
      });
      
      addLog("Smena yopildi", `Jami tushum: ${shiftData.cashBalance + shiftData.transferBalance} so'm`);
      showNotification('✅ Smena yopildi!');
      updateUI();
      renderPage(getCurrentPage());
      await saveData();
      saveData();
    });
  }
  updateUI();
  saveData();
}
