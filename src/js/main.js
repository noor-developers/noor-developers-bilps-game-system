// ========== MAIN MODULE (FIREBASE INTEGRATED) ==========
// Application Initialization and Global Functions with Firebase

import { STATE } from './config.js';
import { initAppCheck } from './app-check.js';
import { loadData, saveData, handleImportFile } from './storage.js';
import {
  initAuth,
  autoLoginIfActive,
  login,
  register,
  logout,
  showLoginForm,
  showRegisterForm,
  updateActivity,
  checkInactivity,
  changePassword
} from './auth.js';
import {
  updateUI,
  showNotification,
  showConfirm,
  confirmAction,
  showPrompt,
  confirmPrompt,
  openModal,
  closeModal,
  closePaymentModal,
  filterReceipts,
  filterReceiptsByType,
  applyReceiptFilters,
  toggleProfileMenu,
  closeProfileMenu,
  openSettingsFromProfile,
  saveSettings,
  exportData,
  clearLocalStorage,
  openSubscriptionModal,
  activateSubscription
} from './ui.js';
import * as gameModule from './game.js';
import * as barModule from './bar.js';
import * as paymentModule from './payment.js';
import * as debtorsModule from './debtors.js';
import * as historyModule from './history.js';
import { toggleShift } from './shift.js';
import { decrypt, printReceipt } from './utils.js';
import { saveNotes, syncNotesArea, openNotesModal, saveNote, clearNoteEditor, loadNote } from './notes.js';
import { openTableManagementModal, addTableFromModal, renderTablesList, editTableName, editTablePrice, confirmRemoveTable } from './tables.js';
import { openQueueModal, addCustomerFromModal, callNext, markAsServed, removeFromQueue, clearQueue } from './queue.js';

// ========== IMMEDIATE GLOBAL EXPOSURE (for onclick handlers) ==========
// These must be available immediately when HTML loads
window.login = login;
window.register = register;
window.logout = logout;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.changePassword = changePassword;
window.openNotesModal = openNotesModal;
window.saveNote = saveNote;
window.clearNoteEditor = clearNoteEditor;
window.loadNote = loadNote;
window.applyReceiptFilters = applyReceiptFilters;
window.filterReceipts = filterReceipts;
window.filterReceiptsByType = filterReceiptsByType;
window.openTableManagementModal = openTableManagementModal;
window.addTableFromModal = addTableFromModal;
window.editTableName = editTableName;
window.editTablePrice = editTablePrice;
window.confirmRemoveTable = confirmRemoveTable;
window.openQueueModal = openQueueModal;
window.addCustomerFromModal = addCustomerFromModal;
window.callNext = callNext;
window.markAsServed = markAsServed;
window.removeFromQueue = removeFromQueue;
window.clearQueue = clearQueue;
window.confirmPrompt = confirmPrompt;

// ========== INITIALIZATION ==========
export function initializePasswords() {
  // localStorage YO'Q - Firebase user profile dan yuklanadi
  console.log('ℹ️ Parollar Firebase dan avtomatik yuklanadi');
}

export async function initializeApp() {
  console.log('🚀 Firebase integratsiyasi bilan dastur ishga tushmoqda...');
  
  // Initialize passwords
  initializePasswords();
  
  // PRIORITY 1: Firebase App Check (bot protection) - VAQTINCHA O'CHIRILGAN
  // console.log('🛡️ Firebase App Check ishga tushirilmoqda...');
  // initAppCheck();
  
  // PRIORITY 2: Firebase Authentication-ni initialize qilish
  console.log('🔐 Firebase auth ishga tushirilmoqda...');
  await initAuth(); // Bu avtomatik login yoki login screen-ni ko'rsatadi
  
  // Setup event listeners
  setupEventListeners();
  
  // Start activity checker
  setInterval(checkInactivity, 60000); // har 1 daqiqada
  
  // Start clock updates (always running, even on login screen)
  setInterval(() => {
    const updateClocks = window.uiModule?.updateClocks;
    if (typeof updateClocks === 'function') {
      updateClocks();
    }
  }, 1000);
  
  // Start UI updates (only when logged in)
  setInterval(() => {
    if (STATE.isLoggedIn) {
      updateUI();
    }
  }, 1000);
  
  console.log('✅ Firebase + Dastur tayyor!');
}

function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (btn.dataset.page === 'settings') {
        openSettingsModal();
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
  document.getElementById('barItemsInput').value = STATE.barItems.map(i => `${i.name} - ${i.price} - ${i.stock}`).join('\n');
  
  openModal('settingsModal');
}

// saveSettings funksiyasi ui.js dan import qilingan

function exposeGlobals() {
  window.login = login;
  window.register = register;
  window.logout = logout;
  window.showLoginForm = showLoginForm;
  window.showRegisterForm = showRegisterForm;
  window.toggleShift = toggleShift;
  window.saveNotes = saveNotes;
  window.openNotesModal = openNotesModal;
  window.saveNote = saveNote;
  window.clearNoteEditor = clearNoteEditor;
  window.loadNote = loadNote;
  window.notesModule = { loadNote };
  window.filterReceipts = filterReceipts;
  window.filterReceiptsByType = filterReceiptsByType;
  window.applyReceiptFilters = applyReceiptFilters;
  window.openTableManagementModal = openTableManagementModal;
  window.addTableFromModal = addTableFromModal;
  window.editTableName = editTableName;
  window.editTablePrice = editTablePrice;
  window.confirmRemoveTable = confirmRemoveTable;
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
  
  // Profile menu functions
  window.toggleProfileMenu = toggleProfileMenu;
  window.closeProfileMenu = closeProfileMenu;
  window.openSettingsFromProfile = openSettingsFromProfile;
  
  // Settings functions
  window.saveSettings = saveSettings;
  window.exportData = exportData;
  window.clearLocalStorage = clearLocalStorage;
  
  // Subscription functions
  window.openSubscriptionModal = openSubscriptionModal;
  window.activateSubscription = activateSubscription;
  
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
