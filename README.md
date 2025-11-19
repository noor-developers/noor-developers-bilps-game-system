
# NOOR Game Management System

Billiard, PlayStation, va Bar'ning joylarini boshqarish uchun to'liq tizim.

## 🌐 Online Versiya

**Frontend**: https://noor-developers.github.io/noor-developers-bilps-game-system/  
**Backend**: https://noor-bilps-backend.onrender.com

## ✨ Xususiyatlari

✅ **Smena boshqaruvi** - O'z-o'zidan vaqtni hisoblash  
✅ **Qarzdorlar** - Qarz qo'shish va to'lash  
✅ **Bar inventari** - Mahsulotlar bilan sotuvni kuzatish  
✅ **Chek va Tarix** - Barcha operatsiyalarning caydari  
✅ **Login tizimi** - Xodim uchun login va parol  
✅ **Supabase backup** - Bulutli saqlash (opsional)  
✅ **30 daqiqa timeout** - Avtomatik logout  

## 📦 Fayl Strukturasi

```
bilps/
├── index.html .................. GitHub Pages asosiy fayl (modular)
├── docs/
│   └── index.html .............. Docs deployment versiyasi (modular)
├── real/
│   ├── index_modul.html ........ Modular versiya (ishlab chiqish)
│   └── archive/
│       └── indexps.html ........ Eski 3000+ qatorli versiya
├── src/
│   ├── css/
│   │   ├── styles.css .......... Asosiy stillar
│   │   └── responsive.css ...... Responsive dizayn
│   └── js/
│       ├── main.js ............. Entry point
│       ├── config.js ........... Konfiguratsiya
│       ├── auth.js ............. Autentifikatsiya
│       ├── ui.js ............... UI boshqaruvi
│       ├── game.js ............. O'yin boshqaruvi
│       ├── bar.js .............. Bar inventari
│       ├── payment.js .......... To'lovlar
│       ├── debtors.js .......... Qarzdorlar
│       ├── history.js .......... Tarix
│       ├── shift.js ............ Smena boshqaruvi
│       ├── notes.js ............ Eslatmalar
│       ├── utils.js ............ Yordamchi funksiyalar
│       └── storage.js .......... LocalStorage
└── backend/
    ├── server.js ............... Express server
    ├── package.json ............ Dependencies
    ├── .env.example ............ Environment template
    └── supabase_setup.sql ...... Database setup
```

## 🚀 Ishga Tushirish

### Frontend (Local):
```bash
python -m http.server 8000
# Browser: http://localhost:8000
```

### Backend (Optional - Supabase'ga saqlash uchun):
```bash
cd backend
npm install
npm start
# http://localhost:3000
```

## 🔑 Default Login

```
Username: 
Password: 
```

Yangi foydalanuvchi qo'shish uchun:
1. ⚙️ Sozlamalar ()
2. "➕ Yangi Foydalanuvchi Qo'shish" formasidan qo'shing
3. "Saqlash" bosing

## 💾 Ma'lumotlarni Saqlash

### Option 1: Local (Default) ✅
- localStorage'da saqlash
- Brauzer xotirasida
- Tez va offline ishda

### Option 2: Supabase (Online)
- Backend server lazim
- Supabase account kerak
- SETUP.md'ni o'qib sozlang

## 📝 Sozlamalar

- **Narxlar**: Billiard, PlayStation, Bar
- **Foydalanuvchilar**: Login/Parol qo'shish
- **Transfer Karta**: O'tkazma ma'lumotlari
- **Bar Mahsulotlari**: Zaxira bilan

## 🎮 Foydalanish

1. **Smena Ochish**: "Smena ochish" tugmasini bosing
2. **Sessiya Boshlash**: Stol/Joyga "Boshlash" bosing
3. **Vaqt/Pul Qo'shish**: "Vaqt/Pul" tugmasini bosing
4. **To'lov**: Sessiya tugadi, to'lov turini tanlang
5. **Qarzga Yozish**: "Qarzga" tugmasini bosing
6. **Logout**: Topbar'da "Chiqish" tugmasi

## 🔐 Xavfsizlik

- 30 daqiqa faol bo'lmasangiz avtomatik logout
- Passwordlar localStorage'da shakllanishtirilib saqlanadi
- Sozlamalar paroli bilan himoyalangan
- Qarzdor o'chiri admin parol bilan

## 📊 Statistika

- Soat bo'yicha daromad
- Qarzdor ro'yxati
- Smenalar tarixi
- Operatsiyalar jurnali

## ⚙️ Qo'shimcha Sozlamalar

`indexps.html'da 615-chi qator`:
```javascript
const USE_ONLINE_BACKUP = false; // true => Supabase'ga saqlash
```

## 📞 Masalalar

**Login bo'lmayapti?**
- Sozlamalar'dan foydalanuvchilar ro'yxatini tekshiring
- Format: `login - parol` (qalin chiziq bilan ajratilgan)

**Ma'lumotlar o'chib ketdi?**
- localStorage xotirasida qolganmi?
- Backup faylni restore qilamizmi?

**Qarz balansida xato bo'lsa?**
- Qarzdor o'chiring va qaytadan qo'shing

## 🎯 Keyingi O'zgartirishlar

- [ ] SMS notification's
- [ ] Mobile app
- [ ] Cloud storage
- [ ] Advanced reporting
- [ ] Multi-location support

---

**Version**: 1.3  
**Oldingi yangilash**: 2025-11-16  
**Dev**: Supabase + Node.js + Express
