// ========== PAYMENT MODULE ==========
// Payment Processing for Games and Bar

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
import { showNotification, closeModal, openModal, closePaymentModal, updateUI } from './ui.js';
import { addLog, addReceipt } from './utils.js';
import { clearSessionState, getCurrentPage, renderPage } from './game.js';

// ========== PAYMENT TYPE SELECTION ==========
export function selectPaymentType(type, btn) {
  STATE.currentPaymentType = type;
  document.querySelectorAll('#paymentModal .modal-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

export async function confirmPayment() {
  const type = STATE.currentPaymentType;
  
  if (type === 'transfer') {
      document.getElementById('transferCardNumber').textContent = STATE.transferCardNumber;
      document.getElementById('transferAmountDisplay').textContent = STATE.currentDebtData.total;
      openModal('transferModal');
  } else {
      await finalizePayment('cash');
  }
}

export async function finalizePayment(type) {
  const key = STATE.currentTableKey;
  const data = STATE.currentDebtData;
  
  if (!data) {
      showNotification('❌ To\'lov ma\'lumotlarida xatolik!', 3000);
      return;
  }

  const totalAmount = data.total;
  
  if (type === 'transfer') {
      STATE.transferBalance += totalAmount;
      closeModal('transferModal');
  } else {
      STATE.cashBalance += totalAmount;
  }

  // Statistika va Chek yaratish
  if (key) {
      if (data.gameCost > 0) {
          STATE.stats[key] += data.gameCost;
      }
      if (data.barTotal > 0) {
          STATE.stats.bar += data.barTotal;
      }
      
      addReceipt({
          type: 'game',
          table: data.table,
          startTime: data.startTime,
          endTime: formatDateTimeUz(new Date()),
          duration: data.duration,
          gameCost: data.gameCost,
          barItems: data.barItems,
          barTotal: data.barTotal,
          total: data.total,
          paid: totalAmount,
          paymentType: type,
          vip: data.vip
      });
      
      addLog("To'lov (Sessiya)", `${data.table}: ${totalAmount} so'm (${type})`);
      clearSessionState(key);
      
  } else if (data.barItem) {
      STATE.stats.bar += totalAmount;
      const product = STATE.barItems.find(i => i.name === data.barItem.name);
      if (product) {
          product.stock -= data.qty;
      }
      
      addReceipt({
          type: 'bar-customer',
          item: data.barItem.name,
          quantity: data.qty,
          price: data.barItem.price,
          total: totalAmount,
          time: formatDateTimeUz(new Date()),
          paymentType: type
      });
      
      addLog("To'lov (Bar)", `${data.barItem.name} x${data.qty}: ${totalAmount} so'm (${type})`);
      
      if (window.barModule && window.barModule.updateBarGrid) {
        window.barModule.updateBarGrid();
      }
  }
  
  closePaymentModal();
  renderPage(getCurrentPage());
  updateUI();
  await saveData();
  
  showNotification(`✅ To'lov qabul qilindi! (${type.toUpperCase()})`);
}
