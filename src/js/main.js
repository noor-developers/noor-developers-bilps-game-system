// ========== MAIN MODULE ==========
// Application Initialization and Global Functions

import { STATE } from './config.js';
import { loadData, saveData, exportData, handleImportFile } from './storage.js';
import {
  autoLoginIfActive,
  login,
  register,
  logout,
  showLoginForm,
  showRegisterForm,
  updateActivity,
  checkInactivity
} from './auth.js';
import {
  updateUI,
  showNotification,
  confirmAction,
  openModal,
  closeModal,
  closePaymentModal,
  filterReceipts,
  filterReceiptsByType
} from './ui.js';
import * as gameModule from './game.js';
import * as barModule from './bar.js';
import * as paymentModule from './payment.js';
import * as debtorsModule from './debtors.js';
import * as historyModule from './history.js';
import { toggleShift } from './shift.js';
import { decrypt, printReceipt } from './utils.js';
import { saveNotes, syncNotesArea } from './notes.js';

// ========== INITIALIZATION ==========
export function initializePasswords() {
  const savedSettingsPassword = localStorage.getItem('noorSettingsPassword');
  const savedTransferCard = localStorage.getItem('noorTransferCard');
  
  if (savedSettingsPassword) {
    try {
      STATE.settingsPassword = decrypt(savedSettingsPassword);
    } catch (e) {
      console.warn('Sozlamalar parolini o\'qib bo\'lmadi');
    }
  }
  
  if (savedTransferCard) {
    try {
      STATE.transferCardNumber = decrypt(savedTransferCard);
    } catch (e) {
      console.warn('O\'tkazma karta raqamini o\'qib bo\'lmadi');
    }
  }
}

export async function initializeApp() {
  console.log('🚀 Dastur ishga tushirilmoqda...');
  
  // Initialize passwords
  initializePasswords();
  
  // Load data
  await loadData();
  syncNotesArea();
  
  // Auto-login if session exists
  autoLoginIfActive();
  
  // Setup event listeners
  setupEventListeners();
  
  // Start activity checker
  setInterval(checkInactivity, 60000); // har 1 daqiqada
  
  // Start UI updates
  setInterval(() => {
    if (STATE.isLoggedIn) {
      updateUI();
    }
  }, 1000);
  
  console.log('✅ Dastur tayyor!');
}

function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (btn.dataset.page === 'settings') {
        openSettingsPasswordModal();
      } else {
        gameModule.renderPage(btn.dataset.page);
      }
    });
  });
  
  // Activity tracking
  document.addEventListener('click', updateActivity);
  document.addEventListener('keypress', updateActivity);
  document.addEventListener('mousemove', updateActivity);
}

// ========== SETTINGS ==========
function openSettingsPasswordModal() {
  document.getElementById('settingsPasswordInput').value = '';
  openModal('settingsPasswordModal');
}

function checkSettingsPassword() {
  const password = document.getElementById('settingsPasswordInput').value;
  if (password === STATE.settingsPassword) {
      closeModal('settingsPasswordModal');
      openSettingsModal();
  } else {
      showNotification('❌ Noto\'g\'ri parol!');
  }
}

function openSettingsModal() {
  document.getElementById('settingsPassword').value = '';
  document.getElementById('settingsTransferCard').value = STATE.transferCardNumber;
  document.getElementById('usersInput').value = STATE.users.map(u => `${u.username} - ${u.pass}`).join('\n');
  document.getElementById('priceB1').value = STATE.prices.b1;
  document.getElementById('priceB2').value = STATE.prices.b2;
  document.getElementById('pricePS4').value = STATE.prices.ps4;
  document.getElementById('pricePS5').value = STATE.prices.ps5;
  document.getElementById('barItemsInput').value = STATE.barItems.map(i => `${i.name} - ${i.price} - ${i.stock}`).join('\n');
  
  openModal('settingsModal');
}

async function saveSettings() {
  const { encrypt, addLog } = await import('./utils.js');
  
  const newPassword = document.getElementById('settingsPassword').value.trim();
  if (newPassword) {
    STATE.settingsPassword = newPassword;
    localStorage.setItem('noorSettingsPassword', encrypt(newPassword));
  }
  
  const newTransferCard = document.getElementById('settingsTransferCard').value.trim();
  if (newTransferCard) {
    STATE.transferCardNumber = newTransferCard;
    localStorage.setItem('noorTransferCard', encrypt(newTransferCard));
  }
  
  // Update prices
  STATE.prices.b1 = parseFloat(document.getElementById('priceB1').value) || 35000;
  STATE.prices.b2 = parseFloat(document.getElementById('priceB2').value) || 30000;
  STATE.prices.ps4 = parseFloat(document.getElementById('pricePS4').value) || 25000;
  STATE.prices.ps5 = parseFloat(document.getElementById('pricePS5').value) || 30000;
  
  // Update bar items
  const barText = document.getElementById('barItemsInput').value;
  const barLines = barText.split('\n').filter(line => line.trim());
  STATE.barItems = barLines.map(line => {
    const parts = line.split('-').map(p => p.trim());
    return {
      name: parts[0] || 'Noma\'lum',
      price: parseInt(parts[1]) || 0,
      stock: parseInt(parts[2]) || 0
    };
  });
  
  addLog("Sozlamalar o'zgartirildi", "");
  await saveData();
  closeModal('settingsModal');
  showNotification('✅ Sozlamalar saqlandi!');
}

function exposeGlobals() {
  window.login = login;
  window.register = register;
  window.logout = logout;
  window.showLoginForm = showLoginForm;
  window.showRegisterForm = showRegisterForm;
  window.toggleShift = toggleShift;
  window.saveNotes = saveNotes;
  window.filterReceipts = filterReceipts;
  window.filterReceiptsByType = filterReceiptsByType;
  window.selectInputType = gameModule.selectInputType;
  window.confirmInput = gameModule.confirmInput;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.confirmAction = confirmAction;
  window.closePaymentModal = closePaymentModal;
  window.selectPaymentType = paymentModule.selectPaymentType;
  window.confirmPayment = paymentModule.confirmPayment;
  window.finalizePayment = paymentModule.finalizePayment;
  window.addToDebt = debtorsModule.addToDebt;
  window.openNewDebtorModal = debtorsModule.openNewDebtorModal;
  window.confirmDebtName = debtorsModule.confirmDebtName;
  window.confirmPayDebt = debtorsModule.confirmPayDebt;
  window.confirmDeleteDebtor = debtorsModule.confirmDeleteDebtor;
  window.confirmLogExport = historyModule.confirmLogExport;
  window.sellToCustomer = barModule.sellToCustomer;
  window.exportData = exportData;
  window.handleImportFile = handleImportFile;
  window.saveSettings = saveSettings;
  window.checkSettingsPassword = checkSettingsPassword;
  window.printReceipt = printReceipt;
  
  // Bar management functions
  window.openAddProductModal = barModule.openAddProductModal;
  window.openManageProductsModal = barModule.openManageProductsModal;
  window.closeManageModal = barModule.closeManageModal;
  window.editProduct = barModule.editProduct;
  window.deleteProduct = barModule.deleteProduct;
  
  window.gameModule = gameModule;
  window.barModule = barModule;
  window.paymentModule = paymentModule;
  window.debtorsModule = debtorsModule;
  window.historyModule = historyModule;
}

exposeGlobals();

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
