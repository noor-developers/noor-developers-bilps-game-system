// ========== UTILS MODULE ==========
// Helper Functions, Formatting, Logging, Encryption

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

// ========== UNIQUE ID GENERATION ==========
/**
 * Generate unique 14-character ID (uppercase, lowercase, numbers)
 * Format: XXxxXXxxXXxxXX (random mix)
 * Example: Ab3Cd5Ef7Gh9Ij
 */
export function generateUniqueId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  
  for (let i = 0; i < 14; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    id += chars[randomIndex];
  }
  
  // Add timestamp-based uniqueness (last 2 chars from timestamp)
  const timestamp = Date.now().toString(36).slice(-2);
  id = id.slice(0, 12) + timestamp;
  
  return id;
}

/**
 * Validate unique ID format
 */
export function isValidUniqueId(id) {
  if (!id || id.length !== 14) return false;
  return /^[A-Za-z0-9]{14}$/.test(id);
}

// ========== ENCRYPTION ==========
export function encrypt(text) {
  return CryptoJS.AES.encrypt(text, "noor-secret-key-2024").toString();
}

export function decrypt(ciphertext) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, "noor-secret-key-2024");
  return bytes.toString(CryptoJS.enc.Utf8);
}

// ========== TIME FORMATTING ==========
export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ========== LOGGING ==========
export function addLog(action, details = "") {
  STATE.logs.push({
      timestamp: formatDateTimeUz(new Date()),
      user: STATE.currentUser,
      action: action,
      details: details
  });
  cleanOldLogs();
}

function cleanOldLogs() {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  STATE.logs = STATE.logs.filter(l => (now - new Date(l.timestamp).getTime()) < thirtyDays);
}

// ========== RECEIPT MANAGEMENT ==========
export function addReceipt(data) {
  STATE.receipts.push({
    ...data,
    timestamp: Date.now(),
    shiftId: STATE.currentShiftId,
    employeeName: STATE.currentUser,
    id: "receipt-" + Date.now() + Math.random()
  });
  
  if (window.uiModule && window.uiModule.updateReceipts) {
    window.uiModule.updateReceipts();
  }
  saveData();
}

// ========== PRINT RECEIPT ==========
export function printReceipt(receiptId) {
  const receipt = STATE.receipts.find(r => r.id === receiptId);
  if (!receipt) {
    console.error('Chek topilmadi:', receiptId);
    return;
  }
  
  let content = '';
  
  if (receipt.type === 'game') {
    content = `
      <div style="width:300px;margin:0 auto;font-family:monospace;font-size:12px;">
        <div style="text-align:center;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:10px;">
          <h2 style="margin:5px 0;">${STATE.clubName || 'NOOR BILLIARD & PS'}</h2>
          <p style="margin:2px 0;">${STATE.clubAddress || ''}</p>
          <p style="margin:2px 0;">Tel: ${STATE.clubPhone || ''}</p>
        </div>
        
        <div style="margin:10px 0;">
          <p><strong>Chek #:</strong> ${receipt.id.slice(-8)}</p>
          <p><strong>Stol:</strong> ${receipt.table} ${receipt.vip ? '⭐ VIP' : ''}</p>
          <p><strong>Boshlanish:</strong> ${receipt.startTime}</p>
          <p><strong>Tugash:</strong> ${receipt.endTime}</p>
          <p><strong>Davomiyligi:</strong> ${receipt.duration}</p>
          ${receipt.employeeName ? `<p><strong>Xodim:</strong> ${receipt.employeeName}</p>` : ''}
        </div>
        
        <div style="border-top:1px dashed #000;border-bottom:1px dashed #000;padding:10px 0;margin:10px 0;">
          <div style="display:flex;justify-content:space-between;">
            <span>O'yin:</span>
            <span>${receipt.gameCost} so'm</span>
          </div>
          ${receipt.barItems && receipt.barItems.length > 0 ? receipt.barItems.map(item => `
            <div style="display:flex;justify-content:space-between;">
              <span>${item.name} x${item.quantity}:</span>
              <span>${item.price * item.quantity} so'm</span>
            </div>
          `).join('') : ''}
          ${receipt.barTotal > 0 ? `
            <div style="display:flex;justify-content:space-between;">
              <span>Bar jami:</span>
              <span>${receipt.barTotal} so'm</span>
            </div>
          ` : ''}
        </div>
        
        <div style="margin:10px 0;">
          <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:bold;">
            <span>JAMI:</span>
            <span>${receipt.total} so'm</span>
          </div>
          <p style="margin:5px 0;"><strong>To'lov turi:</strong> ${receipt.paymentType === 'cash' ? 'Naqd' : receipt.paymentType === 'transfer' ? 'O\'tkazma' : 'Noma\'lum'}</p>
        </div>
        
        <div style="text-align:center;margin-top:20px;border-top:2px dashed #000;padding-top:10px;">
          <p style="margin:5px 0;">Rahmat! Yana kuting!</p>
          <p style="margin:5px 0;font-size:10px;">${new Date().toLocaleString('uz-UZ')}</p>
        </div>
      </div>
    `;
  } else if (receipt.type === 'bar-customer') {
    content = `
      <div style="width:300px;margin:0 auto;font-family:monospace;font-size:12px;">
        <div style="text-align:center;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:10px;">
          <h2 style="margin:5px 0;">${STATE.clubName || 'NOOR BILLIARD & PS'}</h2>
          <p style="margin:2px 0;">${STATE.clubAddress || ''}</p>
          <p style="margin:2px 0;">Tel: ${STATE.clubPhone || ''}</p>
        </div>
        
        <div style="margin:10px 0;">
          <p><strong>Chek #:</strong> ${receipt.id.slice(-8)}</p>
          <p><strong>Mahsulot:</strong> ${receipt.item}</p>
          <p><strong>Vaqt:</strong> ${receipt.time}</p>
          ${receipt.employeeName ? `<p><strong>Xodim:</strong> ${receipt.employeeName}</p>` : ''}
        </div>
        
        <div style="border-top:1px dashed #000;border-bottom:1px dashed #000;padding:10px 0;margin:10px 0;">
          <div style="display:flex;justify-content:space-between;">
            <span>${receipt.item}:</span>
            <span>${receipt.quantity} x ${receipt.price}</span>
          </div>
        </div>
        
        <div style="margin:10px 0;">
          <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:bold;">
            <span>JAMI:</span>
            <span>${receipt.total} so'm</span>
          </div>
          <p style="margin:5px 0;"><strong>To'lov turi:</strong> ${receipt.paymentType === 'cash' ? 'Naqd' : receipt.paymentType === 'transfer' ? 'O\'tkazma' : 'Noma\'lum'}</p>
        </div>
        
        <div style="text-align:center;margin-top:20px;border-top:2px dashed #000;padding-top:10px;">
          <p style="margin:5px 0;">Rahmat! Yana kuting!</p>
          <p style="margin:5px 0;font-size:10px;">${new Date().toLocaleString('uz-UZ')}</p>
        </div>
      </div>
    `;
  } else if (receipt.type === 'debt-payment') {
    content = `
      <div style="width:300px;margin:0 auto;font-family:monospace;font-size:12px;">
        <div style="text-align:center;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:10px;">
          <h2 style="margin:5px 0;">${STATE.clubName || 'NOOR BILLIARD & PS'}</h2>
          <p style="margin:2px 0;">${STATE.clubAddress || ''}</p>
          <p style="margin:2px 0;">Tel: ${STATE.clubPhone || ''}</p>
        </div>
        
        <div style="margin:10px 0;">
          <p><strong>Chek #:</strong> ${receipt.id.slice(-8)}</p>
          <p><strong>Turi:</strong> Qarz to'lovi</p>
          <p><strong>Qarzdor:</strong> ${receipt.name}</p>
          <p><strong>Vaqt:</strong> ${receipt.time}</p>
          ${receipt.employeeName ? `<p><strong>Xodim:</strong> ${receipt.employeeName}</p>` : ''}
        </div>
        
        <div style="border-top:1px dashed #000;border-bottom:1px dashed #000;padding:10px 0;margin:10px 0;">
          <div style="display:flex;justify-content:space-between;">
            <span>To'langan summa:</span>
            <span>${receipt.amount} so'm</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span>Qolgan qarz:</span>
            <span>${receipt.remainingDebt} so'm</span>
          </div>
        </div>
        
        <div style="margin:10px 0;">
          <p style="margin:5px 0;"><strong>To'lov turi:</strong> ${receipt.paymentType === 'cash' ? 'Naqd' : receipt.paymentType === 'transfer' ? 'O\'tkazma' : 'Noma\'lum'}</p>
        </div>
        
        <div style="text-align:center;margin-top:20px;border-top:2px dashed #000;padding-top:10px;">
          <p style="margin:5px 0;">Rahmat!</p>
          <p style="margin:5px 0;font-size:10px;">${new Date().toLocaleString('uz-UZ')}</p>
        </div>
      </div>
    `;
  }
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Chek #${receipt.id.slice(-8)}</title>
      <style>
        body { margin: 0; padding: 20px; }
        @media print {
          body { margin: 0; padding: 0; }
        }
      </style>
    </head>
    <body>
      ${content}
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
