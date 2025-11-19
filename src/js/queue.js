// ========== QUEUE MANAGEMENT MODULE ==========
// Customer queue system

import { STATE } from './config.js';
import { saveData } from './storage.js';
import { showNotification, openModal, closeModal } from './ui.js';

// Helper function for date/time formatting
function formatDateTimeUz(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}.${month}.${year}, ${hours}:${minutes}`;
}

// Initialize queue
if (!STATE.queue) {
  STATE.queue = [];
}

// Add customer to queue
export function addToQueue(customerName, tableType, phoneNumber = '') {
  if (!STATE.isLoggedIn) {
    showNotification('⚠️ Avval tizimga kiring!');
    return false;
  }

  if (!customerName || !customerName.trim()) {
    showNotification('⚠️ Mijoz ismini kiriting!');
    return false;
  }

  const queueItem = {
    id: Date.now(),
    customerName: customerName.trim(),
    phoneNumber: phoneNumber.trim(),
    tableType: tableType,
    timestamp: Date.now(),
    date: formatDateTimeUz(new Date()),
    addedBy: STATE.currentUser,
    status: 'waiting' // waiting, called, served
  };

  STATE.queue.push(queueItem);
  saveData();
  showNotification(`✅ ${customerName} navbatga qo'shildi`);
  renderQueueList();
  return true;
}

// Remove from queue
export function removeFromQueue(queueId) {
  if (!STATE.isLoggedIn) {
    showNotification('⚠️ Avval tizimga kiring!');
    return false;
  }

  const index = STATE.queue.findIndex(item => item.id === queueId);
  if (index === -1) {
    showNotification('⚠️ Navbat topilmadi!');
    return false;
  }

  const item = STATE.queue[index];
  STATE.queue.splice(index, 1);
  saveData();
  showNotification(`✅ ${item.customerName} navbatdan o'chirildi`);
  renderQueueList();
  return true;
}

// Call next in queue
export function callNext(tableType = null) {
  if (!STATE.isLoggedIn) {
    showNotification('⚠️ Avval tizimga kiring!');
    return null;
  }

  let nextCustomer;
  if (tableType) {
    nextCustomer = STATE.queue.find(item => item.status === 'waiting' && item.tableType === tableType);
  } else {
    nextCustomer = STATE.queue.find(item => item.status === 'waiting');
  }

  if (!nextCustomer) {
    showNotification('ℹ️ Navbatda mijoz yo\'q');
    return null;
  }

  nextCustomer.status = 'called';
  saveData();
  showNotification(`📢 ${nextCustomer.customerName} chaqirildi!`);
  renderQueueList();
  return nextCustomer;
}

// Mark as served
export function markAsServed(queueId) {
  if (!STATE.isLoggedIn) {
    showNotification('⚠️ Avval tizimga kiring!');
    return false;
  }

  const item = STATE.queue.find(q => q.id === queueId);
  if (!item) {
    showNotification('⚠️ Navbat topilmadi!');
    return false;
  }

  item.status = 'served';
  saveData();
  renderQueueList();
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    const stillExists = STATE.queue.find(q => q.id === queueId);
    if (stillExists && stillExists.status === 'served') {
      removeFromQueue(queueId);
    }
  }, 5000);
  
  return true;
}

// Open queue modal
export function openQueueModal() {
  if (!STATE.isLoggedIn) {
    showNotification('⚠️ Avval tizimga kiring!');
    return;
  }
  openModal('queueModal');
  renderQueueList();
}

// Render queue list
export function renderQueueList() {
  const container = document.getElementById('queueListContainer');
  if (!container) return;

  if (!STATE.queue || STATE.queue.length === 0) {
    container.innerHTML = '<div class="empty-state">📋 Navbat bo\'sh</div>';
    return;
  }

  // Sort by status (waiting first, then called, then served) and timestamp
  const sortedQueue = [...STATE.queue].sort((a, b) => {
    const statusOrder = { waiting: 0, called: 1, served: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return a.timestamp - b.timestamp;
  });

  container.innerHTML = sortedQueue.map((item, index) => {
    const statusIcon = {
      waiting: '⏳',
      called: '📢',
      served: '✅'
    };
    
    const statusText = {
      waiting: 'Kutmoqda',
      called: 'Chaqirildi',
      served: 'Xizmat ko\'rsatildi'
    };

    const statusClass = item.status;
    const position = sortedQueue.filter(q => q.status === 'waiting').indexOf(item) + 1;

    return `
      <div class="queue-item ${statusClass}">
        <div class="queue-item-header">
          <div class="queue-number">#${position > 0 ? position : '-'}</div>
          <div class="queue-info">
            <div class="queue-customer-name">${item.customerName}</div>
            <div class="queue-details">
              ${item.phoneNumber ? `📱 ${item.phoneNumber} • ` : ''}
              ${getTableTypeLabel(item.tableType)} • ${item.date}
            </div>
          </div>
          <div class="queue-status">
            <span class="status-badge status-${statusClass}">
              ${statusIcon[item.status]} ${statusText[item.status]}
            </span>
          </div>
        </div>
        <div class="queue-actions">
          ${item.status === 'waiting' ? `
            <button class="btn-icon btn-success" onclick="callNext('${item.tableType}')" title="Chaqirish">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </button>
          ` : ''}
          ${item.status === 'called' ? `
            <button class="btn-icon btn-primary" onclick="markAsServed(${item.id})" title="Xizmat ko'rsatildi">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          ` : ''}
          <button class="btn-icon btn-danger" onclick="removeFromQueue(${item.id})" title="O'chirish">
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

// Helper function to get table type label
function getTableTypeLabel(type) {
  const labels = {
    billiard: '🎱 Billiard',
    ps4: '🎮 PS4',
    ps5: '🎮 PS5'
  };
  return labels[type] || type;
}

// Add customer from modal
export function addCustomerFromModal() {
  const nameInput = document.getElementById('queueCustomerName');
  const phoneInput = document.getElementById('queueCustomerPhone');
  const typeSelect = document.getElementById('queueTableType');

  if (!nameInput || !typeSelect) return;

  const name = nameInput.value;
  const phone = phoneInput ? phoneInput.value : '';
  const type = typeSelect.value;

  if (addToQueue(name, type, phone)) {
    nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    typeSelect.value = 'billiard';
  }
}
