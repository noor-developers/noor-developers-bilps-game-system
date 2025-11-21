// ========== TABLES MANAGEMENT MODULE ==========
// Manage game tables dynamically

import { STATE } from './config.js';
import { saveData } from './storage.js';
import { showNotification, openModal, closeModal, showConfirm } from './ui.js';
import { renderPage, getCurrentPage } from './game.js';

// Helper function for date/time formatting
function formatDateTimeUz(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
}

// Get available table types
export function getTableTypes() {
  return [
    { id: 'billiard', name: 'Billiard', icon: '🎱', defaultPrice: 40000 },
    { id: 'ps4', name: 'PlayStation 4', icon: '🎮', defaultPrice: 15000 },
    { id: 'ps5', name: 'PlayStation 5', icon: '🎮', defaultPrice: 20000 }
  ];
}

// Add new table
export function addTable(type, customName = '') {
  if (!STATE.isLoggedIn) {
    showNotification('⚠️ Avval tizimga kiring!');
    return false;
  }

  // Find next available ID for this type
  const existingTables = Object.keys(STATE.tables).filter(key => key.startsWith(type === 'billiard' ? 'b' : type));
  let nextNumber = 1;
  
  if (type === 'billiard') {
    const billiardNumbers = existingTables.map(key => parseInt(key.replace('b', ''))).filter(n => !isNaN(n));
    nextNumber = billiardNumbers.length > 0 ? Math.max(...billiardNumbers) + 1 : 1;
  } else {
    const typeNumbers = existingTables.map(key => {
      const match = key.match(new RegExp(`${type}(\\d+)`));
      return match ? parseInt(match[1]) : 0;
    }).filter(n => n > 0);
    nextNumber = typeNumbers.length > 0 ? Math.max(...typeNumbers) + 1 : 1;
  }

  const tableId = type === 'billiard' ? `b${nextNumber}` : `${type}${nextNumber}`;
  
  // Check if table already exists
  if (STATE.tables[tableId]) {
    showNotification('⚠️ Bu stol allaqachon mavjud!');
    return false;
  }

  // Get default name
  let tableName;
  if (customName) {
    tableName = customName;
  } else if (type === 'billiard') {
    tableName = `Billiard-${nextNumber}`;
  } else if (type === 'ps4') {
    tableName = `PlayStation 4 #${nextNumber}`;
  } else if (type === 'ps5') {
    tableName = `PlayStation 5 #${nextNumber}`;
  }

  // Get default price
  const tableTypes = getTableTypes();
  const tableType = tableTypes.find(t => t.id === type);
  const defaultPrice = tableType ? tableType.defaultPrice : 40000;

  // Add price if not exists
  if (!STATE.prices[tableId]) {
    STATE.prices[tableId] = defaultPrice;
  }

  // Create new table
  STATE.tables[tableId] = {
    id: tableId,
    name: tableName,
    type: type,
    active: false,
    running: false,
    vip: false,
    items: [],
    initialSeconds: 0,
    remainingSeconds: 0,
    startTime: null,
    interval: null,
    alarmed: false,
    startTimestamp: null,
    createdAt: formatDateTimeUz(new Date())
  };

  // Initialize stats if not exists
  if (!STATE.stats[tableId]) {
    STATE.stats[tableId] = 0;
  }

  saveData();
  showNotification(`✅ ${tableName} qo'shildi!`);
  
  // Log action
  if (!STATE.logs) STATE.logs = [];
  STATE.logs.push({
    timestamp: Date.now(),
    user: STATE.currentUser,
    action: 'ADD_TABLE',
    details: `Yangi stol qo'shildi: ${tableName} (${tableId})`,
    time: formatDateTimeUz(new Date())
  });

  // Refresh tables list in modal
  renderTablesList();

  // Refresh game page if currently viewing
  const currentPage = getCurrentPage();
  if (currentPage === 'billiard' || currentPage === 'playstation') {
    renderPage(currentPage);
  }

  return true;
}

// Remove table
export function removeTable(tableId) {
  if (!STATE.isLoggedIn) {
    showNotification('⚠️ Avval tizimga kiring!');
    return false;
  }

  if (!STATE.tables[tableId]) {
    showNotification('⚠️ Stol topilmadi!');
    return false;
  }

  const table = STATE.tables[tableId];

  // Check if table is active or running
  if (table.active || table.running) {
    showNotification('⚠️ Faol yoki ishlab turgan stolni o\'chirib bo\'lmaydi!');
    return false;
  }

  const tableName = table.name;

  // Remove table
  delete STATE.tables[tableId];
  
  // Remove price
  if (STATE.prices[tableId]) {
    delete STATE.prices[tableId];
  }

  // Remove stats
  if (STATE.stats[tableId]) {
    delete STATE.stats[tableId];
  }

  saveData();
  showNotification(`✅ ${tableName} o'chirildi!`);

  // Log action
  if (!STATE.logs) STATE.logs = [];
  STATE.logs.push({
    timestamp: Date.now(),
    user: STATE.currentUser,
    action: 'REMOVE_TABLE',
    details: `Stol o'chirildi: ${tableName} (${tableId})`,
    time: formatDateTimeUz(new Date())
  });

  // Refresh tables list in modal
  renderTablesList();

  // Refresh game page if currently viewing
  const currentPage = getCurrentPage();
  if (currentPage === 'billiard' || currentPage === 'playstation') {
    renderPage(currentPage);
  }

  return true;
}

// Rename table
export function renameTable(tableId, newName) {
  if (!STATE.isLoggedIn) {
    showNotification('⚠️ Avval tizimga kiring!');
    return false;
  }

  if (!STATE.tables[tableId]) {
    showNotification('⚠️ Stol topilmadi!');
    return false;
  }

  if (!newName || newName.trim() === '') {
    showNotification('⚠️ Nom kiritilmadi!');
    return false;
  }

  const oldName = STATE.tables[tableId].name;
  STATE.tables[tableId].name = newName.trim();

  saveData();
  showNotification(`✅ Stol nomi o'zgartirildi!`);

  // Log action
  if (!STATE.logs) STATE.logs = [];
  STATE.logs.push({
    timestamp: Date.now(),
    user: STATE.currentUser,
    action: 'RENAME_TABLE',
    details: `Stol nomi o'zgartirildi: ${oldName} → ${newName} (${tableId})`,
    time: formatDateTimeUz(new Date())
  });

  // Refresh game page if currently viewing
  if (document.getElementById('contentArea').querySelector('.game-grid')) {
    renderGamePage();
  }

  return true;
}

// Get tables list for settings UI
export function getTablesList() {
  return Object.keys(STATE.tables).map(key => ({
    id: key,
    ...STATE.tables[key],
    price: STATE.prices[key] || 0
  })).sort((a, b) => {
    // Sort by type then by number
    const aType = a.type || (a.id.startsWith('b') ? 'billiard' : a.id.replace(/\d+/, ''));
    const bType = b.type || (b.id.startsWith('b') ? 'billiard' : b.id.replace(/\d+/, ''));
    if (aType !== bType) return aType.localeCompare(bType);
    
    const aNum = parseInt(a.id.replace(/\D/g, ''));
    const bNum = parseInt(b.id.replace(/\D/g, ''));
    return aNum - bNum;
  });
}

// Open table management modal
export function openTableManagementModal() {
  if (!STATE.isLoggedIn) {
    showNotification('⚠️ Avval tizimga kiring!');
    return;
  }
  openModal('tableManagementModal');
  renderTablesList();
}

// Render tables list in settings
export function renderTablesList() {
  const container = document.getElementById('tablesListContainer');
  if (!container) return;

  const tables = getTablesList();

  if (tables.length === 0) {
    container.innerHTML = '<div class="text-center color-dim">Stollar yo\'q</div>';
    return;
  }

  container.innerHTML = tables.map(table => {
    const price = STATE.prices[table.id] || 0;
    const formattedPrice = price.toLocaleString('uz-UZ');
    return `
    <div class="table-management-item ${table.active ? 'active' : ''} ${table.running ? 'running' : ''}">
      <div class="table-info">
        <div class="table-name">${table.name}</div>
        <div class="table-details">
          <span class="table-id">${table.id}</span>
          <span class="table-price">💰 ${formattedPrice} so'm</span>
          ${table.active ? '<span class="badge badge-success">Faol</span>' : ''}
          ${table.running ? '<span class="badge badge-warning">Ishlamoqda</span>' : ''}
        </div>
      </div>
      <div class="table-actions">
        <button class="btn-icon" onclick="editTableName('${table.id}')" title="Nomini o'zgartirish">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="btn-icon btn-danger" onclick="confirmRemoveTable('${table.id}')" title="O'chirish" ${table.active || table.running ? 'disabled' : ''}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
  }).join('');
}

// Edit table name
export function editTableName(tableId) {
  const table = STATE.tables[tableId];
  if (!table) return;

  const newName = prompt(`Yangi nom kiriting (${table.name}):`, table.name);
  if (newName !== null) {
    renameTable(tableId, newName);
    renderTablesList();
  }
}

// Confirm remove table
export function confirmRemoveTable(tableId) {
  const table = STATE.tables[tableId];
  if (!table) return;

  showConfirm(
    `<strong>Stolni o'chirish</strong><br><br>Haqiqatan ham "${table.name}" stolini o'chirmoqchimisiz?`,
    () => {
      removeTable(tableId);
      renderTablesList();
    }
  );
}

// Add new table from modal
export function addTableFromModal() {
  const typeSelect = document.getElementById('newTableType');
  const nameInput = document.getElementById('newTableName');
  
  if (!typeSelect || !nameInput) return;

  const type = typeSelect.value;
  const customName = nameInput.value.trim();

  if (addTable(type, customName)) {
    nameInput.value = '';
    renderTablesList();
  }
}
