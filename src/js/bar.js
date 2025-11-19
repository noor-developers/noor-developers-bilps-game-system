// ========== BAR MODULE ==========
// Bar Products and Inventory Management

import { STATE } from './config.js';
import { saveData } from './storage.js';
import { showNotification, openModal, closeModal, updateActiveSessions, showConfirm } from './ui.js';
import { addLog } from './utils.js';
import { getCurrentPage, renderPage } from './game.js';

// ========== BAR PAGE ==========
export function renderBarPage() {
  const content = document.getElementById('contentArea');
  content.innerHTML = `
      <h2 class="page-title">🍹 Bar Mahsulotlari</h2>
      <div class="bar-products-grid" id="barGrid"></div>
  `;
  updateBarGrid();
}

export function updateBarGrid() {
  const grid = document.getElementById('barGrid');
  if (!grid) return;
  
  grid.innerHTML = STATE.barItems.map((item, idx) => `
    <div class="bar-product-card ${item.stock <= 0 ? 'out-of-stock' : ''}" onclick="window.barModule.selectBarProduct(${idx})">
      <div class="product-name">${item.name}</div>
      <div class="product-price">${item.price} so'm</div>
      <div class="product-stock ${item.stock <= 5 ? 'low-stock' : ''}">Zaxira: ${item.stock}</div>
    </div>
  `).join('');
}

export function selectBarProduct(idx) {
  if (!STATE.shiftOpen) {
    showNotification('⚠️ Avval smenani oching!');
    return;
  }
  
  STATE.selectedProduct = STATE.barItems[idx];

  if (STATE.selectedProduct.stock <= 0) {
    showNotification(`❌ ${STATE.selectedProduct.name} zaxirada qolmadi!`, 3000);
    return;
  }
  
  const buttonsDiv = document.getElementById('barTargetButtons');
  const activeTables = Object.keys(STATE.tables).filter(key => STATE.tables[key].active);

  buttonsDiv.innerHTML = activeTables.map(key => {
    const table = STATE.tables[key];
    return `
      <button class="modal-btn" onclick="window.barModule.addBarItemToTable('${key}')">
        ${table.name}
      </button>
    `;
  }).join('');
  
  openModal('barProductModal');
}

export function addBarItemToTable(tableKey) {
  const product = STATE.selectedProduct;
  if (!product) return;
  
  closeModal('barProductModal');
  
  document.getElementById('inputModalTitle').textContent = `📦 ${product.name} miqdori (Max: ${product.stock})`;
  document.getElementById('inputModalValue').placeholder = 'Masalan: 2';
  document.getElementById('inputModalValue').value = '1';
  
  STATE.currentTableKey = tableKey;
  STATE.currentInputType = 'bar-quantity-table';
  
  openModal('inputModal');
  
  const oldConfirm = window.confirmInput;
  window.confirmInput = function() {
    if (STATE.currentInputType !== 'bar-quantity-table') {
        oldConfirm();
        return;
    }

    const qty = parseInt(document.getElementById('inputModalValue').value);
    if (isNaN(qty) || qty <= 0 || qty > product.stock) {
      showNotification(`⚠️ To'g'ri miqdor kiriting! (Max: ${product.stock})`);
      return;
    }
    
    const existing = STATE.tables[tableKey].items.find(i => i.name === product.name);
    
    if (existing) {
      existing.quantity += qty;
    } else {
      STATE.tables[tableKey].items.push({
        name: product.name,
        price: product.price,
        quantity: qty
      });
    }
    
    product.stock -= qty;
    
    addLog("Bar (Stolga)", `${STATE.tables[tableKey].name} - ${product.name} x${qty}`);
    closeModal('inputModal');
    window.confirmInput = oldConfirm;
    
    renderPage(getCurrentPage());
    saveData();
    showNotification(`✅ Qo'shildi: ${product.name} x${qty}`);
    updateActiveSessions();
    updateBarGrid();
  };
}

export function sellToCustomer() {
  const product = STATE.selectedProduct;
  if (!product) return;
  
  closeModal('barProductModal');
  
  document.getElementById('inputModalTitle').textContent = `📦 ${product.name} miqdori (Max: ${product.stock})`;
  document.getElementById('inputModalValue').placeholder = 'Masalan: 2';
  document.getElementById('inputModalValue').value = '1';
  
  STATE.currentInputType = 'bar-customer';
  
  openModal('inputModal');
  
  const oldConfirm = window.confirmInput;
  window.confirmInput = function() {
    if (STATE.currentInputType !== 'bar-customer') {
        oldConfirm();
        return;
    }

    const qty = parseInt(document.getElementById('inputModalValue').value);
    if (isNaN(qty) || qty <= 0 || qty > product.stock) {
      showNotification(`⚠️ To'g'ri miqdor kiriting! (Max: ${product.stock})`);
      return;
    }
    
    const total = product.price * qty;
    
    closeModal('inputModal');
    window.confirmInput = oldConfirm;
    
    STATE.currentDebtData = {
        total: total,
        barItem: product,
        qty: qty
    };
    STATE.currentTableKey = null;
    
    document.getElementById('paymentModalHeader').textContent = `Mijozga Sotish`;
    document.getElementById('paymentDetails').innerHTML = `
        <div class="payment-product"><strong>Mahsulot:</strong> ${product.name} x${qty}</div>
        <div class="payment-total-simple"><strong>Jami:</strong> ${total} so'm</div>
    `;
    
    document.getElementById('paymentModalDebtBtn').style.display = 'none';
    
    if (window.paymentModule && window.paymentModule.selectPaymentType) {
      window.paymentModule.selectPaymentType('cash', document.getElementById('payBtnCash'));
    }
    openModal('paymentModal');
  };
}

export function removeBarItem(tableKey, itemIdx) {
  showConfirm('O\'chirishni tasdiqlaysizmi?', () => {
    const item = STATE.tables[tableKey].items[itemIdx];
    const product = STATE.barItems.find(i => i.name === item.name);
    if (product) {
        product.stock += item.quantity;
    }

    STATE.tables[tableKey].items.splice(itemIdx, 1);
    addLog("Bar (O'chirish)", `${STATE.tables[tableKey].name} - ${item.name} x${item.quantity}`);
    renderPage(getCurrentPage());
    saveData();
    updateActiveSessions();
    updateBarGrid();
    showNotification(`✅ ${item.name} mahsuloti inventarga qaytarildi.`, 1000);
  });
}
