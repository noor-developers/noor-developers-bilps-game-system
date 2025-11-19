// ========== UI MODULE ==========
// Modal, Notification, Confirm Dialog Management

import { STATE } from './config.js';
import { addLog, addReceipt } from './utils.js';

// ========== MODAL HELPERS ==========
export function openModal(id) {
  document.getElementById(id).classList.add('show');
}

export function closeModal(id) {
  document.getElementById(id).classList.remove('show');
  if (id === 'alarmModal') {
      const key = STATE.currentTableKey;
      if (key && STATE.tables[key].alarmed) {
          STATE.tables[key].alarmed = false;
      }
  }
}

export function closePaymentModal(isCancelled = false) {
  if (isCancelled && STATE.currentDebtData) {
      const details = STATE.currentDebtData.table ? STATE.currentDebtData.table : (STATE.currentDebtData.barItem ? STATE.currentDebtData.barItem.name : "Noma'lum");
      addLog("To'lov bekor qilindi", details);
      addReceipt({
          type: 'cancelled',
          total: 0,
          details: details,
          time: new Date().toLocaleString('uz-UZ'),
      });
  }
  
  closeModal('paymentModal');
  document.getElementById('paymentModalHeader').textContent = "💳 To'lov";
  document.getElementById('paymentModalDebtBtn').style.display = 'block';
  
  // Vaqtinchalik holatni tozalash
  STATE.currentTableKey = null;
  STATE.currentDebtData = null;
  STATE.currentPaymentType = 'cash';
}

export function showNotification(text, duration = 2000) {
  document.getElementById('notificationText').innerHTML = text;
  openModal('notificationModal');
  
  setTimeout(() => {
    closeModal('notificationModal');
  }, duration);
}

export function showConfirm(text, callback) {
  document.getElementById('confirmText').innerHTML = text;
  STATE.confirmCallback = callback;
  openModal('confirmModal');
}

export function confirmAction() {
  closeModal('confirmModal');
  if (STATE.confirmCallback) {
    STATE.confirmCallback();
    STATE.confirmCallback = null;
  }
}

// ========== UI UPDATE ==========
export function updateUI() {
  updateTopbar();
  updateActiveSessions();
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.updateUI = updateUI;
  window.uiModule = window.uiModule || {};
  window.uiModule.updateUI = updateUI;
  window.uiModule.updateReceipts = updateReceipts;
}

export function updateTopbar() {
  document.getElementById('currentCash').textContent = STATE.cashBalance + " so'm";
  document.getElementById('currentTransfer').textContent = STATE.transferBalance + " so'm";
  document.getElementById('currentDebt').textContent = STATE.debtBalance + " so'm";
  document.getElementById('totalBalance').textContent = (STATE.cashBalance + STATE.transferBalance) + " so'm";
  
  if (STATE.shiftOpen) {
    document.getElementById('shiftBtn').textContent = '🔴 Smenani Yopish';
    document.getElementById('shiftBtn').classList.add('active');
  } else {
    document.getElementById('shiftBtn').textContent = '🟢 Smena Ochish';
    document.getElementById('shiftBtn').classList.remove('active');
  }
  
  updateShiftTimerUI();
}

function updateShiftTimerUI() {
  const timerEl = document.getElementById('shiftTimer');
  if (!STATE.shiftOpen || !STATE.shiftStartTime) {
    timerEl.textContent = '--:--:--';
    return;
  }
  
  const startTime = new Date(STATE.shiftStartTime.split('.').reverse().join('-') + ' ' + STATE.shiftStartTime.split(' ')[1]).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - startTime) / 1000);
  
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  
  timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function updateActiveSessions() {
  const container = document.getElementById('activeSessionsContainer');
  if (!container) return;
  
  const activeTables = Object.keys(STATE.tables).filter(key => STATE.tables[key].active);
  
  if (activeTables.length === 0) {
    container.innerHTML = '<div class="session-card empty">Hozirda faol sessiya yo\'q</div>';
    return;
  }
  
  container.innerHTML = activeTables.map(key => {
    const table = STATE.tables[key];
    const cost = calculateCostForSession(key);
    const barTotal = table.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return `
      <div class="session-card ${table.running ? '' : 'paused'}">
        <div class="session-header">
          <span class="session-name">${table.name} ${table.vip ? '⭐' : ''}</span>
          <span class="session-status">${table.running ? '🟢 Faol' : '⏸️ Pauza'}</span>
        </div>
        <div class="session-body">
          <div class="session-row">
            <span>Qolgan vaqt:</span>
            <span class="time">${formatTimeForUI(table.remainingSeconds)}</span>
          </div>
          <div class="session-row">
            <span>Hozirgi narx:</span>
            <span class="cost">${cost} so'm</span>
          </div>
          ${barTotal > 0 ? `
            <div class="session-row">
              <span>Bar:</span>
              <span class="cost">${barTotal} so'm</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function calculateCostForSession(key) {
  const table = STATE.tables[key];
  const elapsed = table.initialSeconds - table.remainingSeconds;
  const pricePerHour = STATE.prices[key] * (table.vip ? 1.5 : 1);
  const secondsForCost = Math.max(0, elapsed);
  const cost = Math.max(0, Math.round((secondsForCost / 3600) * pricePerHour));
  return cost;
}

function formatTimeForUI(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ========== RECEIPT RENDERING ==========
export function updateReceipts() {
  const list = document.getElementById('receiptsList');
  if (!list) return;
  
  const activeFilter = document.querySelector('.receipt-filters .filter-btn.active[data-filter]')?.dataset.filter || 'today';
  const activeType = document.querySelector('.receipt-filters .filter-btn.active[data-type]')?.dataset.type || 'all';
  filterReceipts(activeFilter, document.querySelector(`[data-filter="${activeFilter}"]`), activeType);
}

export function filterReceipts(filter, activeBtn, type = 'all') {
  document.querySelectorAll('.receipt-filters .filter-btn[data-filter]').forEach(btn => btn.classList.remove('active'));
  if(activeBtn) activeBtn.classList.add('active');
  
  const list = document.getElementById('receiptsList');
  if (!list) return;

  let filteredReceipts = [...STATE.receipts];

  if (filter === 'today') {
      const today = new Date().toLocaleDateString('uz-UZ');
      filteredReceipts = STATE.receipts.filter(r => new Date(r.timestamp).toLocaleDateString('uz-UZ') === today);
  } else if (filter === '7days') {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      filteredReceipts = STATE.receipts.filter(r => r.timestamp > sevenDaysAgo);
  } else {
      filteredReceipts = filteredReceipts.slice(-50);
  }
  
  // Tur bo'yicha filtr
  if (type !== 'all') {
    filteredReceipts = filteredReceipts.filter(r => {
      if (type === 'bar') {
        return r.type === 'bar-customer';
      } else {
        return r.table && r.table.toLowerCase().includes(type.toLowerCase());
      }
    });
  }
  
  list.innerHTML = filteredReceipts.reverse().map(r => {
    const paymentType = r.paymentType ? `<span style="font-size:0.8rem;background:${r.paymentType === 'cash' ? '#3b82f6' : (r.paymentType === 'transfer' ? '#f97316' : 'var(--danger)')};padding:3px 8px;border-radius:5px;color:#fff;">${r.paymentType.toUpperCase()}</span>` : '';
    const employee = r.employeeName ? `<div style="font-size:0.8rem;color:var(--text-dim);">Xodim: ${r.employeeName}</div>` : '';
    const printBtn = `<button class="btn-print" onclick="printReceipt('${r.id}')">🖨️ Chop etish</button>`;

    if (r.type === 'game') {
      return `
        <div class="receipt-item">
          <div class="receipt-header"><span>${r.table} ${r.vip ? '⭐' : ''}</span> ${paymentType}</div>
          <div class="receipt-row"><span>Boshlanish:</span><span>${r.startTime}</span></div>
          <div class="receipt-row"><span>Davomiyligi:</span><span>${r.duration}</span></div>
          <div class="receipt-row"><span>O'yin:</span><span><strong>${r.gameCost} so'm</strong></span></div>
          ${r.barItems.length > 0 ? `
            <div class="receipt-row"><span>Bar jami:</span><span><strong>${r.barTotal} so'm</strong></span></div>
          ` : ''}
          <div class="receipt-row" style="border-top:1px solid var(--border);padding-top:5px;margin-top:5px;">
            <span><strong>JAMI:</strong></span>
            <span><strong style="color:var(--success);">${r.total} so'm</strong></span>
          </div>
          ${employee}
          <div style="text-align:right; margin-top: 10px;">${printBtn}</div>
        </div>
      `;
    } else if (r.type === 'bar-customer') {
      return `
        <div class="receipt-item">
          <div class="receipt-header"><span>🍹 ${r.item}</span> ${paymentType}</div>
          <div class="receipt-row"><span>Vaqt:</span><span>${r.time}</span></div>
          <div class="receipt-row"><span>Miqdor:</span><span>${r.quantity} x ${r.price}</span></div>
          <div class="receipt-row"><span><strong>JAMI:</strong></span><span><strong>${r.total} so'm</strong></span></div>
          ${employee}
          <div style="text-align:right; margin-top: 10px;">${printBtn}</div>
        </div>
      `;
    } else if (r.type === 'debt-payment') {
        return `
        <div class="receipt-item" style="border-left-color:var(--danger);">
            <div class="receipt-header"><span>💸 Qarz to'lovi (${r.name})</span> ${paymentType}</div>
            <div class="receipt-row"><span>Vaqt:</span><span>${r.time}</span></div>
            <div class="receipt-row"><span>To'landi:</span><span><strong>${r.amount} so'm</strong></span></div>
            <div class="receipt-row"><span>Qoldi:</span><span>${r.remainingDebt} so'm</span></div>
            ${employee}
            <div style="text-align:right; margin-top: 10px;">${printBtn}</div>
        </div>
      `;
    } else if (r.type === 'debt-added') {
        return `
        <div class="receipt-item" style="border-left-color:var(--danger);">
            <div class="receipt-header"><span>🔴 Qarzga yozildi (${r.name})</span></div>
            <div class="receipt-row"><span>Vaqt:</span><span>${r.time}</span></div>
            <div class="receipt-row"><span>Stol:</span><span>${r.table}</span></div>
            <div class="receipt-row"><span><strong>JAMI:</strong></span><span><strong>${r.total} so'm</strong></span></div>
            ${employee}
        </div>
        `;
    } else if (r.type === 'cancelled') {
        return `
        <div class="receipt-item cancelled">
            <div class="receipt-header"><span>❌ Bekor qilindi</span></div>
            <div class="receipt-row"><span>Vaqt:</span><span>${r.time}</span></div>
            <div class="receipt-row"><span>Holat:</span><span>${r.details}</span></div>
            ${employee}
        </div>
        `;
    }
    return '';
  }).join('');
}

export function filterReceiptsByType(type, activeBtn) {
  document.querySelectorAll('.receipt-filters .filter-btn[data-type]').forEach(btn => btn.classList.remove('active'));
  if(activeBtn) activeBtn.classList.add('active');
  
  const activeFilter = document.querySelector('.receipt-filters .filter-btn.active[data-filter]')?.dataset.filter || 'today';
  filterReceipts(activeFilter, document.querySelector(`[data-filter="${activeFilter}"]`), type);
}
