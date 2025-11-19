// ========== DEBTORS MODULE ==========
// Debtor Management

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
import { showNotification, openModal, closeModal, showConfirm, updateUI } from './ui.js';
import { addLog, addReceipt } from './utils.js';
import { clearSessionState, getCurrentPage, renderPage } from './game.js';

// ========== DEBTORS PAGE ==========
export function renderDebtorsPage() {
  const content = document.getElementById('contentArea');
  const debtors = STATE.debtors.filter(d => d.totalDebt > 0);

  content.innerHTML = `
      <h2 class="page-title text-danger">🔴 Qarzdorlar ro'yxati</h2>
      <div class="debtors-list" id="debtorsList">
          ${debtors.length === 0 ? '<div class="text-center color-dim p-20">Hozircha qarzdor yo\'q.</div>' : debtors.map(debtor => `
              <div class="debtor-card">
                  <div class="debtor-header">
                      <div class="debtor-name">${debtor.name}</div>
                      <div class="debtor-total">${debtor.totalDebt} so'm</div>
                  </div>
                  <div class="debtor-details">
                      ${debtor.debts.map(debt => `
                          <div class="debt-item">
                              <span>${debt.table} (${debt.duration}) - ${new Date(debt.timestamp).toLocaleDateString()}</span>
                              <span>${debt.total} so'm</span>
                          </div>
                      `).join('')}
                  </div>
                  <div class="debtor-actions">
                      <button class="btn btn-success" onclick="window.debtorsModule.payDebt('${debtor.name.replace(/'/g, "\\'")}')">💰 To'lash</button>
                      <button class="btn btn-danger" onclick="window.debtorsModule.openDeleteDebtorModal('${debtor.name.replace(/'/g, "\\'")}')">❌ O'chirish</button>
                  </div>
              </div>
          `).join('')}
      </div>
  `;
}

// ========== ADD TO DEBT ==========
export function addToDebt() {
  closeModal('paymentModal');
  
  const list = document.getElementById('existingDebtorsList');
  list.innerHTML = '';
  const debtors = STATE.debtors.filter(d => d.totalDebt > 0);
  
  if (debtors.length > 0) {
      debtors.forEach(debtor => {
          const safeName = debtor.name.replace(/'/g, "\\'");
          list.innerHTML += `<button class="modal-btn" onclick="window.debtorsModule.confirmDebtName('${safeName}')">${debtor.name} (${debtor.totalDebt} so'm)</button>`;
      });
  } else {
      list.innerHTML = `<div style="color:var(--text-dim); text-align:center;">Mavjud qarzdorlar yo'q.</div>`;
  }
  
  openModal('selectDebtorModal');
}

export function openNewDebtorModal() {
  closeModal('selectDebtorModal');
  document.getElementById('newDebtorName').value = '';
  openModal('newDebtorModal');
  setTimeout(() => document.getElementById('newDebtorName').focus(), 300);
}

export function confirmDebtName(name) {
  let debtorName = name;
  
  if (!debtorName) {
      debtorName = document.getElementById('newDebtorName').value.trim();
      if (!debtorName) {
          showNotification('⚠️ Ism kiriting!');
          return;
      }
  }
  
  const key = STATE.currentTableKey;
  const data = STATE.currentDebtData;

  if (!data) {
      showNotification('❌ Sessiya ma\'lumotlarida xato!', 3000);
      closeModal('newDebtorModal');
      closeModal('selectDebtorModal');
      return;
  }

  STATE.debtBalance += data.total;

  let debtor = STATE.debtors.find(d => d.name.toLowerCase() === debtorName.toLowerCase());
  
  if (!debtor) {
      debtor = { name: debtorName, totalDebt: 0, debts: [] };
      STATE.debtors.push(debtor);
  }
  
  debtor.debts.push({
      ...data,
      endTime: formatDateTimeUz(new Date()),
      timestamp: Date.now()
  });
  
  debtor.totalDebt += data.total;
  
  addReceipt({
      type: 'debt-added',
      name: debtorName,
      table: data.table,
      total: data.total,
      time: formatDateTimeUz(new Date()),
  });
  
  addLog("Qarzga yozildi", `${data.table}: ${data.total} so'm -> ${debtorName}`);
  
  clearSessionState(key);
  
  closeModal('newDebtorModal');
  closeModal('selectDebtorModal');
  
  STATE.currentTableKey = null;
  STATE.currentDebtData = null;

  renderPage(getCurrentPage());
  updateUI();
  saveData();
  
  showNotification(`✅ Qarz saqlandi: ${debtorName} - ${data.total} so'm`);
}

// ========== PAY DEBT ==========
export function payDebt(name) {
  const debtor = STATE.debtors.find(d => d.name === name);
  if (!debtor) return;
  
  STATE.currentDebtorToPay = name;
  
  document.getElementById('payDebtDetails').innerHTML = `
    <div class="payment-summary">
      <div class="debtor-name-display"><strong>${name}</strong></div>
      <div class="debt-total-display">
        <span class="total-label">Jami qarz:</span>
        <span class="debt-amount"><strong>${debtor.totalDebt} so'm</strong></span>
      </div>
    </div>
  `;
  
  document.getElementById('payDebtAmount').value = debtor.totalDebt;
  openModal('payDebtModal');
  setTimeout(() => document.getElementById('payDebtAmount').focus(), 300);
}

export async function confirmPayDebt(type) {
  const amount = parseInt(document.getElementById('payDebtAmount').value);
  const name = STATE.currentDebtorToPay;
  const debtor = STATE.debtors.find(d => d.name === name);
  
  if (isNaN(amount) || amount <= 0 || amount > debtor.totalDebt) {
    showNotification('⚠️ To\'g\'ri summa kiriting!');
    return;
  }
  
  if (type === 'transfer') {
      STATE.transferBalance += amount;
      document.getElementById('transferCardNumber').textContent = STATE.transferCardNumber;
      document.getElementById('transferAmountDisplay').textContent = amount;
      openModal('transferModal');
  } else {
      STATE.cashBalance += amount;
  }

  const remainingDebt = debtor.totalDebt - amount;
  debtor.totalDebt = remainingDebt;
  
  if (debtor.totalDebt <= 0) {
    STATE.debtors = STATE.debtors.filter(d => d.name !== name);
  }
  
  STATE.debtBalance = STATE.debtors.reduce((sum, d) => sum + d.totalDebt, 0);
  
  addReceipt({
    type: 'debt-payment',
    name: name,
    amount: amount,
    paymentType: type,
    remainingDebt: remainingDebt,
    time: new Date().toLocaleString('uz-UZ'),
    total: amount
  });
  
  addLog("Qarz to'lovi", `${name}: ${amount} so'm (${type})`);
  closeModal('payDebtModal');
  renderDebtorsPage();
  updateUI();
  await saveData();
  
  showNotification(`✅ Qarz to'landi: ${amount} so'm (${type.toUpperCase()})`);
}

// ========== DELETE DEBTOR ==========
export function openDeleteDebtorModal(name) {
  STATE.currentDebtorToDelete = name;
  document.getElementById('deleteDebtorPassword').value = '';
  openModal('deleteDebtorModal');
}

export async function confirmDeleteDebtor() {
  const password = document.getElementById('deleteDebtorPassword').value;
  if (password === STATE.settingsPassword) {
      const debtorName = STATE.currentDebtorToDelete;
      STATE.debtors = STATE.debtors.filter(d => d.name !== debtorName);
      STATE.debtBalance = STATE.debtors.reduce((sum, d) => sum + d.totalDebt, 0);
      
      addLog("Qarzdor o'chirildi", debtorName);
      closeModal('deleteDebtorModal');
      renderDebtorsPage();
      updateUI();
      await saveData();
      showNotification(`✅ Qarzdor (${debtorName}) muvaffaqiyatli o'chirildi!`);
  } else {
      showNotification('❌ Noto\'g\'ri parol!');
  }
}
