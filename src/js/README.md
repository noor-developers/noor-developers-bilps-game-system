# 📁 MODULLAR ARXITEKTURASI

## Yaratilgan modullar (12 ta)

### 🔐 Auth moduli (`auth.js`)
- Login, Register, Logout
- Auto-login (session restore)
- Activity tracking
- User authentication

### 💾 Storage moduli (`storage.js`)
- Data save/load
- Supabase integration
- localStorage fallback
- Import/Export functionality

### 🎨 UI moduli (`ui.js`)
- Modal management
- Notifications
- Confirmations
- Topbar updates
- Active sessions display
- Receipt rendering

### 🛠️ Utils moduli (`utils.js`)
- Encryption/Decryption
- Time formatting
- Logging
- Receipt generation
- Print functionality

### 🎮 Game moduli (`game.js`)
- Game sessions management
- Timer control
- VIP mode
- Table rendering
- Input handling

### 🍹 Bar moduli (`bar.js`)
- Bar products
- Inventory management
- Sell to customer
- Add to table

### 💰 Payment moduli (`payment.js`)
- Payment processing
- Cash/Transfer handling
- Receipt generation

### 🔴 Debtors moduli (`debtors.js`)
- Debtor management
- Add/Pay/Delete debt
- Debt tracking

### 📊 History moduli (`history.js`)
- Shift history
- Log export
- Reports

### ⏰ Shift moduli (`shift.js`)
- Open/Close shift
- Shift data tracking

### ⚙️ Config moduli (`config.js`)
- STATE management
- DEFAULT_STATE
- API configuration

### 🚀 Main moduli (`main.js`)
- App initialization
- Module coordination
- Global exports

## Foydalanish

HTML faylda:
```html
<script type="module" src="src/js/main.js"></script>
```

## Modullar o'rtasidagi bog'lanish

```
main.js
  ├── config.js (STATE)
  ├── auth.js (login/register)
  ├── storage.js (data)
  ├── ui.js (interface)
  ├── utils.js (helpers)
  ├── game.js (sessions)
  ├── bar.js (products)
  ├── debtors.js (qarzdorlar)
  ├── payment.js (to'lovlar)
  ├── shift.js (smena)
  └── history.js (tarix)
```

## Afzalliklar

✅ Toza kod arxitekturasi
✅ Oson maintenance
✅ Har bir modul alohida test qilinadi
✅ Code reusability
✅ Better organization
✅ Easier debugging
✅ Team collaboration friendly
