// ========== HISTORY MODULE ==========
// Shift History and Log Management

import { STATE } from './config.js';
import { addLog } from './utils.js';
import { showNotification, openModal, closeModal } from './ui.js';

// ========== HISTORY PAGE ==========
export function renderHistoryPage() {
  const content = document.getElementById('contentArea');
  
  content.innerHTML = `
    <h2 style="color:var(--primary);margin-bottom:20px;">📊 Smenalar Tarixi (Oxirgi 7 kun)</h2>
    <div style="max-height:80vh;overflow-y:auto;">
        <table class="data-table">
        <thead>
            <tr>
            <th>Smena</th>
            <th>Xodim</th>
            <th>Boshlanish</th>
            <th>Naqd</th>
            <th>O'tkazma</th>
            <th>Qarz (Jami)</th>
            <th>JAMI TUSHUM</th>
            </tr>
        </thead>
        <tbody>
            ${STATE.history.slice().reverse().map((shift, idx) => `
            <tr>
                <td>#${STATE.history.length - idx}</td>
                <td>${shift.employeeName || 'Noma\'lum'}</td>
                <td>${shift.startTime}</td>
                <td>${shift.cashBalance} so'm</td>
                <td>${shift.transferBalance} so'm</td>
                <td style="color:var(--danger);">${shift.debtBalance} so'm</td>
                <td><strong style="color:var(--success);">${shift.cashBalance + shift.transferBalance} so'm</strong></td>
            </tr>
            `).join('')}
        </tbody>
        </table>
    </div>
  `;
}

// ========== LOG PAGE ==========
export function renderLogPage() {
  const content = document.getElementById('contentArea');
  content.innerHTML = `
      <div style="display:flex; justify-content: space-between; align-items: center;">
          <h2 style="color:var(--primary);margin-bottom:20px;">📜 Harakatlar Jurnali (Log)</h2>
          <button class="btn btn-warning" onclick="window.historyModule.openLogExportModal()">Eksport qilish</button>
      </div>
      <div style="max-height:80vh;overflow-y:auto;">
          <table class="data-table">
          <thead>
              <tr>
              <th>Vaqt</th>
              <th>Xodim</th>
              <th>Harakat</th>
              <th>Tafsilotlar</th>
              </tr>
          </thead>
          <tbody>
              ${STATE.logs.slice().reverse().map(log => `
              <tr>
                  <td>${log.timestamp}</td>
                  <td>${log.user}</td>
                  <td>${log.action}</td>
                  <td>${log.details}</td>
              </tr>
              `).join('')}
          </tbody>
          </table>
      </div>
  `;
}

export function openLogExportModal() {
  document.getElementById('exportLogPassword').value = '';
  openModal('exportLogPasswordModal');
}

export function confirmLogExport() {
  const pass = document.getElementById('exportLogPassword').value;
  if (pass !== STATE.settingsPassword) {
      showNotification('❌ Noto\'g\'ri parol!', 2000);
      return;
  }
  
  closeModal('exportLogPasswordModal');
  
  let csvContent = "data:text/csv;charset=utf-8,Vaqt,Xodim,Harakat,Tafsilotlar\n";
  STATE.logs.forEach(log => {
      csvContent += `"${log.timestamp}","${log.user}","${log.action}","${log.details}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `noor_log_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  addLog("Log eksport qilindi", "");
  showNotification('✅ Log fayli muvaffaqiyatli eksport qilindi!', 2000);
}
