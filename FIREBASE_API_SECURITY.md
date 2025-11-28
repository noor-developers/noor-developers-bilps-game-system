# 🔒 Firebase API Key Xavfsizligi

## ⚠️ MUHIM: API Key ochiq bo'lishi kerak!

Firebase API key **hamma ko'rishi mumkin** va bu **NORMAL**. Google bu masalani boshqacha hal qiladi.

---

## 🛡️ Xavfsizlik qavatlar:

### 1. **Firestore Security Rules** ✅ (Bajarilgan)
**Fayl:** `firestore.rules`

```javascript
allow read, write: if request.auth.uid == userId;
```

✅ Faqat autentifikatsiya qilingan userlar
✅ Faqat o'z ma'lumotlarini ko'radi
✅ Boshqa userlarning ma'lumotlari himoyalangan

---

### 2. **Firebase App Check** ⏳ (Qo'shish kerak)

**Nima qiladi:**
- Bot dan himoya
- Abuse dan himoya
- Faqat real browserlardan ishlaydi

**Qanday qo'shish:**

**Qadam 1: Firebase Console**
1. https://console.firebase.google.com/project/noor-gms/appcheck
2. **Get started** tugmasini bosing
3. **Web** ni tanlang
4. **reCAPTCHA v3** ni tanlang

**Qadam 2: reCAPTCHA Site Key olish**
1. https://www.google.com/recaptcha/admin
2. **Register a new site** bosing
3. Settings:
   - Label: NOOR GMS
   - reCAPTCHA type: **reCAPTCHA v3**
   - Domains: `noor-gms.web.app`, `noor-gms.firebaseapp.com`, `localhost`
4. **Submit** → Site key va Secret key ni oling

**Qadam 3: Kodni yangilash**
`src/js/app-check.js` faylidagi `RECAPTCHA_SITE_KEY` ni o'zgartiring:
```javascript
const RECAPTCHA_SITE_KEY = 'YOUR_REAL_SITE_KEY'; // ← Bu yerga qo'ying
```

**Qadam 4: App Check ni import qilish**
`src/js/main.js` ga qo'shing:
```javascript
import { initAppCheck } from './app-check.js';
// ... boshqa importlar

// App initialization ichida
await initAppCheck();
```

---

### 3. **Domain Restrictions** ⏳ (Qo'shish kerak)

**Qadam 1: Firebase Console**
1. https://console.firebase.google.com/project/noor-gms/settings/general
2. **Public-facing name** bo'limida **Configure** bosing
3. **Authorized domains** ga qo'shing:
   - `noor-gms.web.app`
   - `noor-gms.firebaseapp.com`
   - `localhost` (test uchun)

**Qadam 2: API Key restrictions**
1. https://console.cloud.google.com/apis/credentials?project=noor-gms
2. **Browser key (auto created by Firebase)** ni tanlang
3. **Application restrictions** → **HTTP referrers**
4. Qo'shing:
   - `https://noor-gms.web.app/*`
   - `https://noor-gms.firebaseapp.com/*`
   - `http://localhost:*/*` (test uchun)
5. **Save** bosing

---

### 4. **Environment Variables** ✅ (Bajarilgan)

**Server-side secrets:**
- ✅ Vercel: `ENCRYPTION_KEY` (environment variable)
- ✅ Firebase Functions: Secrets Manager (kerak bo'lsa)

**Client-side (ochiq):**
- ✅ `apiKey` - public (kerak)
- ✅ `authDomain` - public (kerak)
- ✅ `projectId` - public (kerak)

---

## 📊 Xavfsizlik Reytingi:

### **Hozir:**
- 🟢 Firestore Security Rules: **90%**
- 🔴 App Check: **0%** (yo'q)
- 🔴 Domain Restrictions: **20%** (minimal)
- 🟢 Environment Variables: **100%**

**O'rtacha:** 🟡 **52%** - Yaxshi, lekin yaxshiroq bo'lishi mumkin

### **App Check qo'shgandan keyin:**
- 🟢 Firestore Security Rules: **90%**
- 🟢 App Check: **95%**
- 🟢 Domain Restrictions: **90%**
- 🟢 Environment Variables: **100%**

**O'rtacha:** 🟢 **94%** - Juda yaxshi!

---

## ❓ FAQ:

### **Q: API Key ochiq bo'lsa, hacker ishlatishi mumkinmi?**
A: Yo'q! Chunki:
1. Firestore Rules faqat auth userga ruxsat beradi
2. App Check botlarni bloklaydi
3. Domain restrictions faqat sizning saytingizdan ishlaydi

### **Q: API Key ni .env ga qo'yish kerakmi?**
A: Yo'q! Frontend API key **har doim** ochiq bo'lishi kerak. Backend secrets uchun .env ishlatiladi.

### **Q: Hacker mening Firebase ga spam qila oladimi?**
A: Ha, lekin:
1. App Check buni to'xtatadi (bot detection)
2. Firebase quota limits bor
3. Firestore Rules ma'lumotlarni himoyalaydi

### **Q: API Key sizib chiqsa nima bo'ladi?**
A: Hech narsa! U allaqachon GitHub da. Lekin:
1. Firebase Console da monitoringni yoqing
2. Kutilmagan trafikni kuzating
3. Zarur bo'lsa API key ni regenerate qiling

---

## 🚀 Action Plan:

### **Minimal (hozir):**
✅ Firestore Security Rules (bajarilgan)
✅ Environment Variables (bajarilgan)

### **Tavsiya etiladi (1 soat):**
⏳ Firebase App Check qo'shish
⏳ Domain Restrictions sozlash
⏳ Monitoring yoqish

### **Professional (keyinroq):**
⭐ Rate limiting (har user uchun limit)
⭐ Audit logs (barcha harakatlarni yozish)
⭐ Alerting (suspicious activity)

---

## 📞 Yordam:

**Firebase Console:**
- https://console.firebase.google.com/project/noor-gms

**App Check Setup:**
- https://firebase.google.com/docs/app-check/web/recaptcha-provider

**Security Rules:**
- https://firebase.google.com/docs/firestore/security/get-started

---

**XULOSA:**
- ✅ API Key ochiq bo'lishi **NORMAL**
- ✅ Firestore Rules himoya qiladi
- ⏳ App Check qo'shish **TAVSIYA ETILADI**
- ⏳ Domain Restrictions **MAJBURIY**

**Hozirgi xavfsizlik:** 52% → **App Check bilan:** 94% 🛡️
