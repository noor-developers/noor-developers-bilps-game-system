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
      <div style="margin-bottom: 20px;">
        <button class="btn" onclick="window.barModule.openAddProductModal()">➕ Mahsulot Qo'shish</button>
        <button class="btn" onclick="window.barModule.openManageProductsModal()">📝 Mahsulotlarni Boshqarish</button>
      </div>
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

// ========== BAR PRODUCT MANAGEMENT ==========
export function openAddProductModal() {
  document.getElementById('inputModalTitle').textContent = '➕ Mahsulot nomi';
  document.getElementById('inputModalValue').placeholder = 'Masalan: Cola';
  document.getElementById('inputModalValue').value = '';
  
  STATE.currentInputType = 'add-product-name';
  openModal('inputModal');
}

// Setup global confirmInput handler for bar products
if (typeof window !== 'undefined') {
  const originalConfirmInput = window.confirmInput;
  
  window.confirmInput = function() {
    if (STATE.currentInputType === 'add-product-name') {
      const name = document.getElementById('inputModalValue').value.trim();
      if (!name) {
        showNotification('⚠️ Mahsulot nomini kiriting!');
        return;
      }
      
      if (STATE.barItems.find(item => item.name.toLowerCase() === name.toLowerCase())) {
        showNotification('⚠️ Bu mahsulot allaqachon mavjud!');
        return;
      }
      
      STATE.tempProductName = name;
      document.getElementById('inputModalTitle').textContent = '💰 Narxi (so\'m)';
      document.getElementById('inputModalValue').placeholder = 'Masalan: 5000';
      document.getElementById('inputModalValue').value = '';
      STATE.currentInputType = 'add-product-price';
  } else if (STATE.currentInputType === 'add-product-price') {
    const price = parseInt(document.getElementById('inputModalValue').value);
    if (isNaN(price) || price <= 0) {
      showNotification('⚠️ To\'g\'ri narx kiriting!');
      return;
    }
    
    STATE.tempProductPrice = price;
    document.getElementById('inputModalTitle').textContent = '📦 Zaxira soni';
    document.getElementById('inputModalValue').placeholder = 'Masalan: 50';
    document.getElementById('inputModalValue').value = '';
    STATE.currentInputType = 'add-product-stock';
  } else if (STATE.currentInputType === 'add-product-stock') {
    const stock = parseInt(document.getElementById('inputModalValue').value);
    if (isNaN(stock) || stock < 0) {
      showNotification('⚠️ To\'g\'ri miqdor kiriting!');
      return;
    }
    
    STATE.barItems.push({
      name: STATE.tempProductName,
      price: STATE.tempProductPrice,
      stock: stock
    });
    
    addLog('Bar (Qo\'shish)', `${STATE.tempProductName} - ${STATE.tempProductPrice} so'm, ${stock} dona`);
    saveData();
    
    delete STATE.tempProductName;
    delete STATE.tempProductPrice;
    
    closeModal('inputModal');
    
    if (getCurrentPage() === 'bar') {
      renderBarPage();
    }
    
    showNotification(`✅ Mahsulot qo'shildi!`);
  } else if (originalConfirmInput) {
    originalConfirmInput();
  }
  };
}

export function openManageProductsModal() {
  const content = document.getElementById('contentArea');
  const modalHTML = `
    <div class="modal show" id="manageProductsModal" style="align-items: flex-start; padding-top: 20px;">
      <div class="modal-content" style="max-width: 900px; width: 90%; max-height: 85vh; overflow-y: auto;">
        <h2 style="margin-bottom: 20px;">📝 Mahsulotlarni Boshqarish</h2>
        <div style="max-height: 65vh; overflow-y: auto;">
          <table class="table" style="width: 100%; border-collapse: collapse;">
            <thead style="position: sticky; top: 0; background: var(--panel); z-index: 1;">
              <tr>
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border);">#</th>
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border);">Nomi</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid var(--border);">Narxi</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid var(--border);">Zaxira</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid var(--border);">Amallar</th>
              </tr>
            </thead>
            <tbody>
              ${STATE.barItems.map((item, idx) => `
                <tr style="border-bottom: 1px solid var(--border);">
                  <td style="padding: 12px;">${idx + 1}</td>
                  <td style="padding: 12px; font-weight: 600;">${item.name}</td>
                  <td style="padding: 12px; text-align: right;">${item.price.toLocaleString()} so'm</td>
                  <td style="padding: 12px; text-align: center;">
                    <span style="padding: 4px 12px; border-radius: 12px; background: ${item.stock > 10 ? 'var(--success)' : item.stock > 0 ? 'var(--warning)' : 'var(--danger)'}; color: white; font-weight: 600;">
                      ${item.stock}
                    </span>
                  </td>
                  <td style="padding: 12px; text-align: center;">
                    <button class="btn" style="margin: 0 5px; padding: 8px 12px; font-size: 0.85rem;" onclick="window.barModule.editProduct(${idx})">✏️ Tahrirlash</button>
                    <button class="btn modal-danger" style="margin: 0 5px; padding: 8px 12px; font-size: 0.85rem;" onclick="window.barModule.deleteProduct(${idx})">🗑️ O'chirish</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid var(--border); text-align: right;">
          <button class="btn" style="padding: 12px 30px;" onclick="window.barModule.closeManageModal()">Yopish</button>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if present
  const existing = document.getElementById('manageProductsModal');
  if (existing) existing.remove();
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

export function closeManageModal() {
  const modal = document.getElementById('manageProductsModal');
  if (modal) modal.remove();
  if (getCurrentPage() === 'bar') {
    renderBarPage();
  }
}

export function editProduct(idx) {
  const product = STATE.barItems[idx];
  
  document.getElementById('inputModalTitle').textContent = `✏️ ${product.name} - Yangi zaxira`;
  document.getElementById('inputModalValue').placeholder = `Hozirgi: ${product.stock}`;
  document.getElementById('inputModalValue').value = product.stock;
  
  STATE.currentInputType = 'edit-product-stock';
  STATE.editProductIndex = idx;
  
  openModal('inputModal');
  
  const oldConfirm = window.confirmInput;
  window.confirmInput = function() {
    if (STATE.currentInputType !== 'edit-product-stock') {
      oldConfirm();
      return;
    }
    
    const newStock = parseInt(document.getElementById('inputModalValue').value);
    if (isNaN(newStock) || newStock < 0) {
      showNotification('⚠️ To\'g\'ri miqdor kiriting!');
      return;
    }
    
    const oldStock = STATE.barItems[STATE.editProductIndex].stock;
    STATE.barItems[STATE.editProductIndex].stock = newStock;
    
    addLog('Bar (Tahrirlash)', `${product.name} - Zaxira: ${oldStock} → ${newStock}`);
    saveData();
    
    closeModal('inputModal');
    window.confirmInput = oldConfirm;
    delete STATE.editProductIndex;
    
    closeManageModal();
    showNotification(`✅ ${product.name} yangilandi!`);
  };
}

export function deleteProduct(idx) {
  const product = STATE.barItems[idx];
  
  showConfirm(`${product.name} mahsulotini o'chirish tasdiqlaysizmi?`, () => {
    STATE.barItems.splice(idx, 1);
    addLog('Bar (O\'chirish)', `${product.name} mahsuloti o'chirildi`);
    saveData();
    closeManageModal();
    showNotification(`✅ ${product.name} o'chirildi!`);
  });
}
