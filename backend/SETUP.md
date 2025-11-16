# NOOR - Supabase Integratsiyasi

## 📋 Setup Bosqichlari

### 1. Supabase Loyihasini Yaratish
```
1. https://supabase.com/dashboard'ga kiring
2. "New Project" bosing
3. Loyihangizga nom bering (masalan: "noor-game-management")
4. Parol o'rnating
5. Region tanlang (masalan: Singapore yoki Europe)
6. "Create new project" bosing
```

### 2. Database Jadvallarini Yaratish
```
1. Supabase Dashboard'dan "SQL Editor" oching
2. supabase_setup.sql faylining kodi copy-paste qiling
3. "Run" bosing
```

### 3. API Keys'ni Olish
```
1. Settings → API sekciyasiga o'tki
2. "Project URL" ko'chiring
3. "anon public" key ko'chiring
```

### 4. Backend Setup
```bash
cd backend
npm install
```

### 5. .env Faylini Yaratish
```
# .env faylini backend folderida yaratish
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=YOUR_ANON_KEY
PORT=3000
```

Bu yerga o'z Supabase URL va Key'lar qo'ying!

### 6. Backend Ishga Tushirish
```bash
npm start
# yoki development uchun:
npm run dev
```

Server ishga tushadi: http://localhost:3000

### 7. Frontend'da Online Saqlashni Yoqish
HTML faylida (indexps.html):
```javascript
// 615-chi qatorni o'zgartirang:
const USE_ONLINE_BACKUP = true; // false ➜ true
```

## 🔄 Saqlash Tizimi

### Local (Default):
- localStorage'da saqlash
- Brauzer xotirasida
- Tez va offline ishda ishlaydi
- **Masala**: Brauzer cache o'chsa data o'chadi

### Online (Supabase):
- Supabase serverida doimiy saqlash
- Istalgan joydan kirishni ta'minlaydi
- Xotira cheksiz
- **Kerak**: Internet connection va backend server

## ⚙️ API Endpoints

```
POST /api/save-data
  - Body: { userId, data, timestamp }
  - Javob: { success: true, message }

GET /api/load-data/:userId
  - Javob: { success: true, data }

GET /api/get-users
  - Javob: { success: true, users: [...] }

POST /api/add-user
  - Body: { username, password }
  - Javob: { success: true, user }

POST /api/login
  - Body: { username, password }
  - Javob: { success: true, user }

POST /api/save-debtors
  - Body: { userId, debtors }
  - Javob: { success: true, message }

POST /api/save-history
  - Body: { userId, history }
  - Javob: { success: true, message }
```

## 🚀 Production Deployment

### Frontend (Netlify/Vercel):
```bash
# Netlify'ga drag-and-drop qiling:
- real/indexps.html va barcha fayllar
```

### Backend (Railway/Heroku):
```bash
1. railway.app'ga kiring
2. GitHub repozitoriyasini ulang
3. Backend folderini deploy qiling
4. Environment variables o'rnating
```

## 🔐 Xavfsizlik Maslahatlar

1. **Production'da**:
   - Password'larni SHA256 bilan encrypt qiling
   - JWT token'laridan foydalaning
   - HTTPS faqat
   - Supabase RLS policy'larini o'rnating

2. **.env faylini gitignore'ga qo'ying**:
```
echo ".env" >> .gitignore
```

3. **CORS sozlang**:
   - Backend server.js'da origins qo'shimcha URL'larni qo'shing

## ❓ Muammolar

### Error: "Cannot connect to Supabase"
- Supabase URL va Key'larni to'g'ri kiritganligini tekshiring
- Internet connection'ni tekshiring

### Error: "CORS Policy"
- Backend server.js'da origin URL'ini qo'shing

### Error: "Table does not exist"
- SQL setup'ni qaytadan ishga tushiring
- Jadval yaratilganligini tekshiring

## 📚 Faylli Tuzilish

```
bilps/
├── real/
│   └── indexps.html (Frontend)
└── backend/
    ├── server.js (Express server)
    ├── package.json
    ├── .env (Supabase credentials)
    ├── .env.example
    └── supabase_setup.sql (SQL jadvallar)
```

## ✅ Testing

1. Backend'ni ishga tushiring: `npm start`
2. Browser'da: http://localhost:8000/indexps.html
3. USE_ONLINE_BACKUP = true qilib test qiling
4. Yangi ma'lumot qo'shing va refresh qiling

Hammasi tuzildi! 🎉
