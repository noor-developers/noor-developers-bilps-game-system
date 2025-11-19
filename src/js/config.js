// NOOR Game Management System - Core State & Configuration
// Bu fayl dasturning asosiy holati va sozlamalarini boshqaradi

// ========== CONSTANTS ==========
export const DB_NAME = 'noor_gms_database';
export const DB_VERSION = '1.4';
export const API_URL = 'https://noor-bilps-backend.onrender.com/api';
export const USE_ONLINE_BACKUP = true;
export const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
export const ENCRYPTION_KEY = 'NOOR_' + Math.random().toString(36).substring(2, 15) + '_SECURE_KEY_' + Date.now();

// ========== DEFAULT STATE ==========
export const DEFAULT_STATE = {
  // Multi-tenant: Har bir user o'z ma'lumotlariga ega
  users: [], // Barcha userlar ro'yxati (Supabase-dan yuklangan)
  
  // Current user settings
  settingsPassword: "1234",
  transferCardNumber: "1234 1234 1234 1234",
  
  // User session
  isLoggedIn: false,
  currentUser: "",
  
  // Subscription management
  subscriptionActive: false,
  subscriptionEndDate: null,
  subscriptionDays: 0,
  
  // Club info (user-specific)
  clubName: "",
  clubOwner: "",
  clubPhone: "",
  clubAddress: "",
  
  // Shift management
  shiftOpen: false,
  shiftStartTime: null,
  currentShiftId: null,
  
  // Balances
  cashBalance: 0,
  transferBalance: 0,
  debtBalance: 0,
  
  // Pricing (user-specific)
  prices: { b1: 40000, b2: 40000, ps4: 15000, ps5: 20000 },
  
  // Bar products (user-specific)
  barItems: [
    { name: "Pepsi", price: 8000, stock: 50 },
    { name: "Fanta", price: 8000, stock: 30 },
    { name: "Choy", price: 5000, stock: 100 }
  ],
  
  // Game tables
  tables: {
    b1: { 
      id: 'b1', 
      name: 'Billiard-1', 
      active: false, 
      running: false, 
      vip: false, 
      items: [], 
      initialSeconds: 0, 
      remainingSeconds: 0, 
      startTime: null, 
      interval: null, 
      alarmed: false, 
      startTimestamp: null 
    },
    b2: { 
      id: 'b2', 
      name: 'Billiard-2', 
      active: false, 
      running: false, 
      vip: false, 
      items: [], 
      initialSeconds: 0, 
      remainingSeconds: 0, 
      startTime: null, 
      interval: null, 
      alarmed: false, 
      startTimestamp: null 
    },
    ps4: { 
      id: 'ps4', 
      name: 'PlayStation 4 Pro', 
      active: false, 
      running: false, 
      vip: false, 
      items: [], 
      initialSeconds: 0, 
      remainingSeconds: 0, 
      startTime: null, 
      interval: null, 
      alarmed: false, 
      startTimestamp: null 
    },
    ps5: { 
      id: 'ps5', 
      name: 'PlayStation 5 Slim', 
      active: false, 
      running: false, 
      vip: false, 
      items: [], 
      initialSeconds: 0, 
      remainingSeconds: 0, 
      startTime: null, 
      interval: null, 
      alarmed: false, 
      startTimestamp: null 
    }
  },
  
  // Data arrays (user-specific)
  receipts: [],
  history: [],
  debtors: [],
  logs: [],
  notes: "",
  stats: { b1: 0, b2: 0, ps4: 0, ps5: 0, bar: 0 },
  
  // UI volatile state (not saved)
  selectedProduct: null,
  currentTableKey: null,
  currentInputType: null,
  currentDebtData: null,
  currentDebtorToDelete: null,
  currentDebtorToPay: null,
  confirmCallback: null,
  currentPaymentType: 'cash',
  
  // Session management
  lastActivity: Date.now(),
  sessionTimeout: 30 * 60 * 1000
};

// ========== APPLICATION STATE ==========
// Global STATE object - bu runtime uchun
export let STATE = JSON.parse(JSON.stringify(DEFAULT_STATE));

// Reset state helper
export function resetState() {
  STATE = JSON.parse(JSON.stringify(DEFAULT_STATE));
}

// Update state helper
export function updateState(updates) {
  Object.assign(STATE, updates);
}

// Get user-specific data keys (faqat shu user uchun saqlanadi)
export function getUserDataKeys() {
  return Object.keys(DEFAULT_STATE).filter(k => ![
    'users', // Bu barcha userlar ro'yxati
    'settingsPassword', 
    'transferCardNumber',
    'isLoggedIn', 
    'currentUser',
    'selectedProduct',
    'currentTableKey',
    'currentInputType',
    'currentDebtData',
    'currentDebtorToDelete',
    'currentDebtorToPay',
    'confirmCallback',
    'currentPaymentType',
    'lastActivity',
    'sessionTimeout'
  ].includes(k));
}

// ========== PERSISTENCE KEYS ==========
// Bu kalitlar localStorage-da alohida saqlanadi (barcha userlar uchun umumiy)
export const PERSISTENCE_KEYS = {
  SETTINGS_PASSWORD: 'noorSettingsPassword',
  TRANSFER_CARD: 'noorTransferCard',
  AUTO_LOGIN: 'noorAutoLogin'
};
