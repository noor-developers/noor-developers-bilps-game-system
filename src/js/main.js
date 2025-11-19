// ========== MAIN MODULE ==========
// Application Initialization and Global Functions

import { STATE, DEFAULT_STATE } from './config.js';
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
  showConfirm, 
  confirmAction, 
  openModal, 
  closeModal,
  closePaymentModal 
} from './ui.js';
import { renderPage, getCurrentPage, selectInputType, confirmInput } from './game.js';
import { toggleShift } from './shift.js';
import { decrypt } from './utils.js';

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
        renderPage(btn.dataset.page);
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

// ========== GLOBAL EXPORTS ==========
// Make functions available globally for onclick handlers
window.authModule = {
  login,
  register,
  logout,
  showLoginForm,
  showRegisterForm
};

window.gameModule = await import('./game.js');
window.barModule = await import('./bar.js');
window.debtorsModule = await import('./debtors.js');
window.paymentModule = await import('./payment.js');
window.shiftModule = { toggleShift };
window.historyModule = await import('./history.js');
window.settingsModule = {
  openSettingsPasswordModal,
  checkSettingsPassword,
  saveSettings
};
window.uiModule = {
  confirmAction,
  closeModal,
  closePaymentModal
};
window.mainModule = {
  selectInputType,
  confirmInput
};
window.storageModule = {
  exportData,
  handleImportFile
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
