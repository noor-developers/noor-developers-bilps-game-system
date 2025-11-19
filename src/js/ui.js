// ========== UI MODULE ==========
// Modal, Notification, Confirm Dialog Management

import { STATE } from './config.js';
import { addLog, addReceipt } from './utils.js';

function formatCurrency(value) {
  const number = Number(value) || 0;
  return `${number.toLocaleString('uz-UZ')} so'm`;
}

function setAmountText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = formatCurrency(value);
  }
}

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
          time: formatDateTimeUz(new Date()),
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
  updateStats();
  updateActiveSessions();
  updateTopDebtors();
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.updateUI = updateUI;
  window.uiModule = window.uiModule || {};
  window.uiModule.updateUI = updateUI;
  window.uiModule.updateReceipts = updateReceipts;
  window.uiModule.updateClocks = updateClocks;
}

export function updateTopbar() {
  setAmountText('cashBalance', STATE.cashBalance);
  setAmountText('transferBalance', STATE.transferBalance);
  setAmountText('debtBalance', STATE.debtBalance);

  const shiftBtn = document.getElementById('shiftBtn');
  if (shiftBtn) {
    shiftBtn.textContent = STATE.shiftOpen ? 'Smenani yopish' : 'Smena ochish';
    shiftBtn.classList.toggle('active', !!STATE.shiftOpen);
  }

  // Update club name in topbar
  const clubNameDisplay = document.getElementById('clubNameDisplay');
  if (clubNameDisplay && STATE.clubName) {
    clubNameDisplay.textContent = STATE.clubName;
  }

  updateUserProfile();
  updateShiftTimerUI();
  updateClocks();
}

function updateUserProfile() {
  const userProfile = document.getElementById('userProfile');
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  
  if (!userProfile) return;
  
  if (STATE.isLoggedIn && STATE.currentUser) {
    userProfile.classList.remove('hidden');
    if (userName) userName.textContent = STATE.currentUser;
    
    // Set avatar with initials
    if (userAvatar) {
      const initials = STATE.currentUser
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
      userAvatar.textContent = initials || STATE.currentUser.charAt(0).toUpperCase();
    }
    
    // Update profile menu balances
    updateProfileMenuBalances();
    updateProfileMenuShift();
  } else {
    userProfile.classList.add('hidden');
  }
}

function updateProfileMenuBalances() {
  setAmountText('profileCashBalance', STATE.cashBalance);
  setAmountText('profileTransferBalance', STATE.transferBalance);
  setAmountText('profileDebtBalance', STATE.debtBalance);
}

function updateProfileMenuShift() {
  const profileShiftStatus = document.getElementById('profileShiftStatus');
  const profileShiftBtn = document.getElementById('profileShiftBtn');
  
  if (profileShiftStatus) {
    const indicator = profileShiftStatus.querySelector('.shift-indicator-small');
    if (indicator) {
      if (STATE.shiftOpen) {
        indicator.textContent = '🟢 Ochiq';
        indicator.classList.add('active');
      } else {
        indicator.textContent = '⚫ Yopiq';
        indicator.classList.remove('active');
      }
    }
  }
  
  if (profileShiftBtn) {
    const icon = STATE.shiftOpen ? '🔒' : '🔄';
    const text = STATE.shiftOpen ? 'Smenani yopish' : 'Smena ochish';
    profileShiftBtn.innerHTML = `<span>${icon}</span> ${text}`;
  }
}

// Profile menu toggle
export function toggleProfileMenu() {
  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');
  
  if (!profileBtn || !profileMenu) return;
  
  const isOpen = !profileMenu.classList.contains('hidden');
  
  if (isOpen) {
    profileMenu.classList.add('hidden');
    profileBtn.classList.remove('active');
  } else {
    updateProfileMenuBalances();
    updateProfileMenuShift();
    updateProfileMenuSubscription();
    profileMenu.classList.remove('hidden');
    profileBtn.classList.add('active');
  }
}

function updateProfileMenuSubscription() {
  const subscriptionBadge = document.getElementById('subscriptionBadge');
  const subscriptionEndDate = document.getElementById('subscriptionEndDate');
  
  if (subscriptionBadge) {
    if (STATE.subscriptionActive) {
      subscriptionBadge.textContent = '✅ Faol';
      subscriptionBadge.classList.add('active');
    } else {
      subscriptionBadge.textContent = '🔒 Faol emas';
      subscriptionBadge.classList.remove('active');
    }
  }
  
  if (subscriptionEndDate) {
    if (STATE.subscriptionEndDate) {
      subscriptionEndDate.textContent = new Date(STATE.subscriptionEndDate).toLocaleDateString('uz-UZ');
    } else {
      subscriptionEndDate.textContent = '--';
    }
  }
}

export function closeProfileMenu() {
  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');
  
  if (profileMenu) profileMenu.classList.add('hidden');
  if (profileBtn) profileBtn.classList.remove('active');
}

export function openSubscriptionModal() {
  openModal('subscriptionModal');
}

export function activateSubscription(days) {
  const now = new Date();
  const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  STATE.subscriptionActive = true;
  STATE.subscriptionEndDate = endDate.toISOString();
  STATE.subscriptionDays = days;
  
  // Save to storage
  if (typeof window !== 'undefined' && window.saveData) {
    window.saveData();
  }
  
  updateProfileMenuSubscription();
  
  let planName = '';
  if (days === 30) planName = 'Oylik';
  else if (days === 90) planName = '3 oylik';
  else if (days === 365) planName = 'Yillik';
  
  showNotification(`✅ ${planName} obuna faollashtirildi! Tugash sanasi: ${endDate.toLocaleDateString('uz-UZ')}`);
  closeModal('subscriptionModal');
}

// Close profile menu when clicking outside
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e) => {
    const profileDropdown = document.getElementById('userProfile');
    const profileMenu = document.getElementById('profileMenu');
    
    if (profileDropdown && profileMenu && !profileMenu.classList.contains('hidden')) {
      if (!profileDropdown.contains(e.target)) {
        closeProfileMenu();
      }
    }
  });
}

function updateClocks() {
  const now = new Date();
  const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}:${seconds}`;
  
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  const dayName = days[now.getDay()];
  const dateStr = `${dayName}, ${day}.${month}.${year}`;
  
  const loginClock = document.getElementById('loginClock');
  if (loginClock) loginClock.textContent = timeStr;
  
  const loginDate = document.getElementById('loginDate');
  if (loginDate) loginDate.textContent = dateStr;
  
  const mainClock = document.getElementById('mainClock');
  if (mainClock) mainClock.textContent = timeStr;
  
  const currentDate = document.getElementById('currentDate');
  if (currentDate) currentDate.textContent = dateStr;
}

function updateShiftTimerUI() {
  const indicator = document.getElementById('shiftStatus');
  if (!indicator) return;

  if (!STATE.shiftOpen) {
    indicator.textContent = 'Smena yopiq';
    indicator.classList.remove('active');
    return;
  }

  const elapsed = getShiftElapsedText();
  indicator.textContent = elapsed ? `Smena ochiq • ${elapsed}` : 'Smena ochiq';
  indicator.classList.add('active');
}

function getShiftElapsedText() {
  if (!STATE.shiftStartTime) return '';
  const [datePart, timePart] = STATE.shiftStartTime.split(' ');
  if (!datePart || !timePart) return STATE.shiftStartTime;
  const [day, month, year] = datePart.split('.');
  if (!day || !month || !year) return STATE.shiftStartTime;
  const parsed = new Date(`${year}-${month}-${day}T${timePart}`);
  if (isNaN(parsed)) return STATE.shiftStartTime;
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateStats() {
  const stats = STATE.stats || { b1: 0, b2: 0, ps4: 0, ps5: 0, bar: 0 };
  setAmountText('statB1', stats.b1 || 0);
  setAmountText('statB2', stats.b2 || 0);
  setAmountText('statPS4', stats.ps4 || 0);
  setAmountText('statPS5', stats.ps5 || 0);
  setAmountText('statBar', stats.bar || 0);
  const total = (stats.b1 || 0) + (stats.b2 || 0) + (stats.ps4 || 0) + (stats.ps5 || 0) + (stats.bar || 0);
  setAmountText('statTotal', total);
}

function updateTopDebtors() {
  const container = document.getElementById('topDebtorsList');
  if (!container) return;

  const topDebtors = STATE.debtors
    .filter(d => d.totalDebt > 0)
    .sort((a, b) => b.totalDebt - a.totalDebt)
    .slice(0, 10);

  if (topDebtors.length === 0) {
    container.innerHTML = '<div class="text-center color-dim">Qarzdor yo\'q</div>';
    return;
  }

  container.innerHTML = topDebtors.map((d, i) => `
    <div class="debtor-preview-item">
      <span class="debtor-rank">#${i + 1}</span>
      <span class="debtor-name">${d.name}</span>
      <span class="debtor-amount">${formatCurrency(d.totalDebt)}</span>
    </div>
  `).join('');
}

export function updateActiveSessions() {
  const container = document.getElementById('activeSessions');
  if (!container) return;
  
  const activeTables = Object.keys(STATE.tables).filter(key => STATE.tables[key].active);
  
  if (activeTables.length === 0) {
    container.innerHTML = '<div class="text-center color-dim">Faol sessiya yo\'q</div>';
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
            <span class="cost">${formatCurrency(cost)}</span>
          </div>
          ${barTotal > 0 ? `
            <div class="session-row">
              <span>Bar:</span>
              <span class="cost">${formatCurrency(barTotal)}</span>
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
  applyReceiptFilters();
}

export function applyReceiptFilters() {
  const list = document.getElementById('receiptsList');
  if (!list) return;
  
  const timeFilter = document.getElementById('receiptTimeFilter')?.value || 'today';
  const dateSearch = document.getElementById('receiptDateSearch')?.value;
  const activeType = document.querySelector('.receipt-filters .filter-btn.active[data-type]')?.dataset.type || 'all';
  
  let filteredReceipts = [...STATE.receipts];

  // Apply date filter
  if (dateSearch) {
    // Search by specific date
    const searchDate = new Date(dateSearch);
    const searchDateStr = `${searchDate.getDate().toString().padStart(2, '0')}.${(searchDate.getMonth() + 1).toString().padStart(2, '0')}.${searchDate.getFullYear()}`;
    filteredReceipts = filteredReceipts.filter(r => {
      const receiptDate = new Date(r.timestamp);
      const receiptDateStr = `${receiptDate.getDate().toString().padStart(2, '0')}.${(receiptDate.getMonth() + 1).toString().padStart(2, '0')}.${receiptDate.getFullYear()}`;
      return receiptDateStr === searchDateStr;
    });
  } else if (timeFilter === 'bar') {
    // Filter only bar receipts
    filteredReceipts = filteredReceipts.filter(r => r.table === 'bar');
  } else if (timeFilter === 'today') {
    const today = new Date();
    const todayStr = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
    filteredReceipts = filteredReceipts.filter(r => {
      const receiptDate = new Date(r.timestamp);
      const receiptDateStr = `${receiptDate.getDate().toString().padStart(2, '0')}.${(receiptDate.getMonth() + 1).toString().padStart(2, '0')}.${receiptDate.getFullYear()}`;
      return receiptDateStr === todayStr;
    });
  } else if (timeFilter === '7days') {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    filteredReceipts = filteredReceipts.filter(r => r.timestamp > sevenDaysAgo);
  }
  
  // Apply type filter (only if timeFilter is not 'bar' since that's already filtered)
  if (activeType !== 'all' && timeFilter !== 'bar') {
    filteredReceipts = filteredReceipts.filter(r => r.table === activeType);
  }
  
  renderReceiptsList(filteredReceipts, list);
}

// Legacy function for backward compatibility
export function filterReceipts(filter, activeBtn, type = 'all') {
  applyReceiptFilters();
}

function renderReceiptsList(filteredReceipts, list) {
  if (!list) return;
  
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

// ========== SETTINGS FUNCTIONS ==========
export function openSettingsFromProfile() {
  const settingsModal = document.getElementById('settingsModal');
  if (!settingsModal) return;
  
  // Unique ID ni ko'rsatish
  const uniqueIdInput = document.getElementById('settingsUniqueId');
  if (uniqueIdInput) {
    uniqueIdInput.value = STATE.uniqueId || 'Yuklanmagan';
  }
  
  // Club ma'lumotlarini ko'rsatish
  document.getElementById('settingsClubName').value = STATE.clubName || '';
  document.getElementById('settingsUsername').value = STATE.currentUser || '';
  
  // Narxlarni ko'rsatish
  document.getElementById('settingsPriceB1').value = STATE.priceB1;
  document.getElementById('settingsPriceB2').value = STATE.priceB2;
  document.getElementById('settingsPricePS4').value = STATE.pricePS4;
  document.getElementById('settingsPricePS5').value = STATE.pricePS5;
  
  openModal('settingsModal');
}

export async function saveSettings() {
  // Narxlarni saqlash
  STATE.priceB1 = parseInt(document.getElementById('settingsPriceB1').value) || 40000;
  STATE.priceB2 = parseInt(document.getElementById('settingsPriceB2').value) || 40000;
  STATE.pricePS4 = parseInt(document.getElementById('settingsPricePS4').value) || 15000;
  STATE.pricePS5 = parseInt(document.getElementById('settingsPricePS5').value) || 20000;
  
  // Backend-ga user settings-ni saqlash
  const { API_URL, USE_ONLINE_BACKUP } = await import('./config.js');
  
  if (USE_ONLINE_BACKUP && STATE.currentUser) {
    try {
      const settingsData = {
        priceB1: STATE.priceB1,
        priceB2: STATE.priceB2,
        pricePS4: STATE.pricePS4,
        pricePS5: STATE.pricePS5,
        theme: 'dark',
        language: 'uz',
        notifications: true,
        autoSave: true
      };
      
      const response = await fetch(`${API_URL}/update-user-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: STATE.currentUser,
          settings: settingsData
        })
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('✅ User settings backend-ga saqlandi');
      }
    } catch (e) {
      console.error('❌ Settings saqlashda xato:', e);
    }
  }
  
  // Local ma'lumotlarni saqlash
  if (window.storageModule && window.storageModule.saveData) {
    window.storageModule.saveData();
  }
  
  showNotification('✅ Sozlamalar saqlandi!', 2000);
  closeModal('settingsModal');
  updateUI();
}

export function exportData() {
  const data = {
    clubName: STATE.clubName,
    currentUser: STATE.currentUser,
    tables: STATE.tables,
    barItems: STATE.barItems,
    debtors: STATE.debtors,
    history: STATE.history,
    cashBalance: STATE.cashBalance,
    transferBalance: STATE.transferBalance,
    debtBalance: STATE.debtBalance,
    prices: {
      B1: STATE.priceB1,
      B2: STATE.priceB2,
      PS4: STATE.pricePS4,
      PS5: STATE.pricePS5
    },
    subscription: {
      active: STATE.subscriptionActive,
      endDate: STATE.subscriptionEndDate,
      days: STATE.subscriptionDays
    },
    exportDate: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `noor-gms-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('✅ Ma\'lumotlar yuklandi!', 2000);
}

export function clearLocalStorage() {
  showConfirm('⚠️ Haqiqatan ham keshni tozalamoqchimisiz?<br><small>Bu amalni qaytarib bo\'lmaydi!</small>', () => {
    localStorage.clear();
    showNotification('✅ Kesh tozalandi! Sahifa yangilanmoqda...', 2000);
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  });
}

// Global functions
if (typeof window !== 'undefined') {
  window.openSettingsFromProfile = openSettingsFromProfile;
  window.saveSettings = saveSettings;
  window.exportData = exportData;
  window.clearLocalStorage = clearLocalStorage;
}
