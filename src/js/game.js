// ========== GAME MODULE ==========
// Timer, Sessions, Tables Management

import { STATE, DEFAULT_STATE } from './config.js';
import { saveData } from './storage.js';
import { showNotification, openModal, closeModal, updateUI, updateActiveSessions } from './ui.js';
import { addLog, formatTime, addReceipt } from './utils.js';

// ========== NAVIGATION ==========
export function getCurrentPage() {
  const active = document.querySelector('.nav button.active');
  return active ? active.dataset.page : 'billiard';
}

export function renderPage(page) {
  const content = document.getElementById('contentArea');
  content.innerHTML = '';

  if (page === 'billiard') {
    content.innerHTML = `
      <h2 class="page-title">🎱 Billiard</h2>
      <div class="game-grid">
        ${renderGameCard('b1')}
        ${renderGameCard('b2')}
      </div>
    `;
  } else if (page === 'playstation') {
    content.innerHTML = `
      <h2 class="page-title">🎮 PlayStation</h2>
      <div class="game-grid">
        ${renderGameCard('ps4')}
        ${renderGameCard('ps5')}
      </div>
    `;
  } else if (page === 'bar') {
    if (window.barModule && window.barModule.renderBarPage) {
      window.barModule.renderBarPage();
    }
  } else if (page === 'debtors') {
    if (window.debtorsModule && window.debtorsModule.renderDebtorsPage) {
      window.debtorsModule.renderDebtorsPage();
    }
  } else if (page === 'history') {
    if (window.historyModule && window.historyModule.renderHistoryPage) {
      window.historyModule.renderHistoryPage();
    }
  } else if (page === 'log') {
    if (window.historyModule && window.historyModule.renderLogPage) {
      window.historyModule.renderLogPage();
    }
  }
  updateTimersUI();
}

function renderGameCard(key) {
  const table = STATE.tables[key];
  const isActive = table.active;
  const barTotal = table.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  return `
    <div class="game-card ${table.vip ? 'vip' : ''} ${table.active && table.remainingSeconds < 30 && table.remainingSeconds > 0 ? 'time-low' : ''}" id="card-${key}">
      ${table.vip ? '<span class="vip-badge">⭐ VIP (+50% Narx)</span>' : ''}
      <div class="card-header">
        <div class="card-title">${table.name}</div>
        <span class="status-badge ${isActive ? 'status-active' : 'status-free'}">
          ${isActive ? (table.running ? '🟢 Faol' : '⏸️ Pauzada') : '⚪ Bo\'sh'}
        </span>
      </div>
      
      ${isActive ? `
        <div class="timer-display" id="timer-${key}">${formatTime(table.remainingSeconds)}</div>
        <div class="cost-display" id="cost-${key}">${calculateCost(key)} so'm</div>
        <div class="game-buttons">
          <button class="btn btn-primary" onclick="window.gameModule.addTime('${key}')">➕ Vaqt/Pul</button>
          <button class="btn btn-success" onclick="window.gameModule.toggleTimer('${key}')" id="toggleBtn-${key}">${table.running ? '⏸️ Pauza' : '▶️ Davom'}</button>
          <button class="btn btn-danger" onclick="window.gameModule.stopSession('${key}', false)">⏹️ To'xtatish</button>
          ${!table.vip ? `<button class="btn btn-warning" onclick="window.gameModule.setVip('${key}')">⭐ VIP</button>` : `<button class="btn btn-warning" onclick="window.gameModule.removeVip('${key}')">✖️ VIP</button>`}
        </div>
      ` : `
        <div style="text-align:center;margin:30px 0;">
          <button class="btn btn-primary" style="padding:15px 30px;font-size:1.1rem;" onclick="window.gameModule.startSession('${key}')">▶️ Boshlash</button>
        </div>
      `}
      
      <div class="bar-items-list">
        <strong style="color:var(--primary);">🍹 Bar mahsulotlari:</strong>
        ${table.items.length > 0 ? table.items.map((item, idx) => `
          <div class="bar-item-row">
            <span>${item.name} x${item.quantity}</span>
            <span>${item.price * item.quantity} so'm</span>
            <button class="remove-item" onclick="window.barModule.removeBarItem('${key}', ${idx})">❌</button>
          </div>
        `).join('') : '<div style="text-align:center;color:var(--text-dim);margin:10px 0;">Bo\'sh</div>'}
        ${barTotal > 0 ? `<div class="bar-total">Bar jami: ${barTotal} so'm</div>` : ''}
      </div>
    </div>
  `;
}

// ========== GAME SESSIONS ==========
export function addTime(key) {
  STATE.currentTableKey = key;
  document.getElementById('startModalTable').textContent = `Stol: ${STATE.tables[key].name}`;
  openModal('startModal');
}

export function startSession(key) {
  if (!STATE.shiftOpen) {
    showNotification('⚠️ Avval smenani oching!');
    return;
  }
  addTime(key);
}

export function selectInputType(type) {
  closeModal('startModal');
  STATE.currentInputType = type;
  
  const key = STATE.currentTableKey;
  const isNewSession = !STATE.tables[key].active;
  
  const inputElement = document.getElementById('inputModalValue');
  inputElement.type = 'number'; // Number input for time/money

  if (type === 'time') {
    document.getElementById('inputModalTitle').textContent = `⏰ ${isNewSession ? 'Boshlang\'ich' : 'Qo\'shimcha'} Vaqt kiriting (daqiqa)`;
    inputElement.placeholder = 'Masalan: 60';
  } else {
    document.getElementById('inputModalTitle').textContent = `💰 ${isNewSession ? 'Boshlang\'ich' : 'Qo\'shimcha'} Pul kiriting (so\'m)`;
    inputElement.placeholder = 'Masalan: 20000';
  }
  
  inputElement.value = '';
  openModal('inputModal');
  setTimeout(() => inputElement.focus(), 300);
}

export function confirmInput() {
  const value = document.getElementById('inputModalValue').value;
  if (!value || parseFloat(value) <= 0) {
    showNotification('⚠️ To\'g\'ri qiymat kiriting!');
    return;
  }
  
  const key = STATE.currentTableKey;
  const isNewSession = !STATE.tables[key].active;
  
  let secondsToAdd = 0;
  
  if (STATE.currentInputType === 'time') {
    secondsToAdd = parseInt(value) * 60;
  } else {
    const pricePerHour = STATE.prices[key] * (STATE.tables[key].vip ? 1.5 : 1);
    const pricePerMinute = pricePerHour / 60;
    const seconds = Math.round((parseInt(value) / pricePerMinute) * 60);
    secondsToAdd = seconds;
  }
  
  if (secondsToAdd <= 0) {
      showNotification('⚠️ Kiritilgan pul yoki vaqt hisobga olinmadi (Narx juda kam).');
      return;
  }

  if (isNewSession) {
    STATE.tables[key].active = true;
    STATE.tables[key].running = true;
    STATE.tables[key].remainingSeconds = secondsToAdd;
    STATE.tables[key].initialSeconds = secondsToAdd;
    STATE.tables[key].startTime = formatDateTimeUz(new Date());
    STATE.tables[key].startTimestamp = Date.now();
    STATE.tables[key].alarmed = false;
    
    startTimer(key);
    addLog("Sessiya boshlandi", `${STATE.tables[key].name} (${formatTime(secondsToAdd)})`);
  } else {
    const currentElapsedSeconds = STATE.tables[key].initialSeconds - STATE.tables[key].remainingSeconds;
    STATE.tables[key].remainingSeconds += secondsToAdd;
    STATE.tables[key].initialSeconds = currentElapsedSeconds + STATE.tables[key].remainingSeconds;
    
    if (!STATE.tables[key].running) {
        STATE.tables[key].running = true;
    }
    addLog("Vaqt qo'shildi", `${STATE.tables[key].name} (${formatTime(secondsToAdd)})`);
  }
  
  closeModal('inputModal');
  renderPage(getCurrentPage());
  updateUI();
  saveData();
  
  showNotification(`✅ ${STATE.tables[key].name} ga ${isNewSession ? 'boshlang\'ich vaqt' : 'qo\'shimcha vaqt'} qo'shildi!`);
}

// ========== TIMER MANAGEMENT ==========
export function startTimer(key) {
  const table = STATE.tables[key];
  if (!table || table.interval) return;

  table.interval = setInterval(() => {
      if (!table.running) return;
      
      table.remainingSeconds--;
      
      if (table.remainingSeconds === 30 && !table.alarmed) {
          table.alarmed = true;
          STATE.currentTableKey = key;
          document.getElementById('alarmText').textContent = `${table.name} uchun vaqt tugashiga 30 soniya qoldi!`;
          openModal('alarmModal');
      }

      const currentPage = getCurrentPage();
      
      if (currentPage === 'billiard' || currentPage === 'playstation') {
          updateTimerUI(key);
      }
      
      updateActiveSessions();
      
      if (table.remainingSeconds <= 0) {
          clearInterval(table.interval);
          table.interval = null;
          table.running = false;
          table.remainingSeconds = 0;
          updateTimerUI(key);
          showNotification(`⏰ ${table.name} vaqti tugadi! To'lovga o'tkaziladi.`, 2000);
          stopSession(key, false);
      }
      
  }, 1000);
  
  updateActiveSessions();
}

export function calculateCost(key) {
  const table = STATE.tables[key];
  const elapsed = table.initialSeconds - table.remainingSeconds;
  const pricePerHour = STATE.prices[key] * (table.vip ? 1.5 : 1);
  const secondsForCost = Math.max(0, elapsed);
  const cost = Math.max(0, Math.round((secondsForCost / 3600) * pricePerHour));
  return cost;
}

function updateTimerUI(key) {
  const table = STATE.tables[key];
  if (!table) return;

  const timerEl = document.getElementById(`timer-${key}`);
  const costEl = document.getElementById(`cost-${key}`);
  const cardEl = document.getElementById(`card-${key}`);

  if (timerEl) timerEl.textContent = formatTime(table.remainingSeconds);
  if (cardEl) {
      if (table.active && table.remainingSeconds < 30 && table.remainingSeconds > 0) {
          cardEl.classList.add('time-low');
      } else {
          cardEl.classList.remove('time-low');
      }
  }
  
  const cost = calculateCost(key);
  if (costEl) costEl.textContent = `${cost} so'm`;
}

function updateTimersUI() {
  Object.keys(STATE.tables).forEach(key => {
      if (STATE.tables[key].active) {
          updateTimerUI(key);
      }
  });
}

export function toggleTimer(key) {
  const table = STATE.tables[key];
  if (!table || !table.active) return;
  
  table.running = !table.running;
  const btn = document.getElementById(`toggleBtn-${key}`);
  if (btn) btn.innerHTML = table.running ? '⏸️ Pauza' : '▶️ Davom';

  const statusBadge = document.querySelector(`#card-${key} .status-badge`);
  if (statusBadge) statusBadge.innerHTML = table.running ? '🟢 Faol' : '⏸️ Pauzada';
  
  addLog(table.running ? "Sessiya davom etdi" : "Sessiya pauza qilindi", table.name);
  saveData();
  showNotification(`✅ ${table.name} ${table.running ? 'davom ettirildi' : 'pauza qilindi'}!`, 1000);
}

export function stopSession(key, silent = false) {
  const table = STATE.tables[key];
  if (!table || !table.active) return;
  
  if (table.interval) clearInterval(table.interval);
  table.interval = null;
  table.running = false;

  const elapsedSeconds = table.initialSeconds - table.remainingSeconds;
  const gameCost = calculateCost(key);
  const barTotal = table.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCost = gameCost + barTotal;
  
  if (!silent) {
    STATE.currentTableKey = key;
    STATE.currentDebtData = {
      table: table.name,
      startTime: table.startTime,
      duration: formatTime(elapsedSeconds),
      gameCost: gameCost,
      barItems: [...table.items],
      barTotal: barTotal,
      total: totalCost,
      vip: table.vip
    };
    
    document.getElementById('paymentModalHeader').textContent = `💳 To'lov (${table.name})`;
    document.getElementById('paymentDetails').innerHTML = `
      <div class="payment-summary">
        <div class="payment-row">
          <span>O'yin (${formatTime(elapsedSeconds)}):</span>
          <span><strong>${gameCost} so'm</strong></span>
        </div>
        ${barTotal > 0 ? `
          <div class="payment-row">
            <span>Bar:</span>
            <span><strong>${barTotal} so'm</strong></span>
          </div>
        ` : ''}
        <div class="payment-total">
          <span class="total-label"><strong>JAMI:</strong></span>
          <span class="total-amount"><strong>${totalCost} so'm</strong></span>
        </div>
      </div>
    `;
    
    document.getElementById('paymentModalDebtBtn').style.display = 'block';
    
    if (window.paymentModule && window.paymentModule.selectPaymentType) {
      window.paymentModule.selectPaymentType('cash', document.getElementById('payBtnCash'));
    }
    openModal('paymentModal');
  } else {
    clearSessionState(key);
    updateUI();
    saveData();
  }
}

export function clearSessionState(key) {
  if (STATE.tables[key].interval) clearInterval(STATE.tables[key].interval);
  STATE.tables[key].interval = null;
  STATE.tables[key].active = false;
  STATE.tables[key].running = false;
  STATE.tables[key].vip = false;
  STATE.tables[key].items = [];
  STATE.tables[key].remainingSeconds = 0;
  STATE.tables[key].initialSeconds = 0;
  STATE.tables[key].alarmed = false;
}

// ========== VIP MANAGEMENT ==========
export function setVip(key) {
  if (!STATE.tables[key] || STATE.tables[key].vip) return;
  STATE.tables[key].vip = true;
  addLog("VIP yoqildi", STATE.tables[key].name);
  showNotification('⭐ VIP rejim yoqildi! Narx 1.5x oshdi.');
  if(STATE.tables[key].running) startTimer(key);
  renderPage(getCurrentPage());
  saveData();
}

export function removeVip(key) {
  if (!STATE.tables[key] || !STATE.tables[key].vip) return;
  STATE.tables[key].vip = false;
  addLog("VIP o'chirildi", STATE.tables[key].name);
  showNotification('⭐ VIP rejim o\'chirildi! Narx qayta tiklandi.');
  if(STATE.tables[key].running) startTimer(key);
  renderPage(getCurrentPage());
  saveData();
}
