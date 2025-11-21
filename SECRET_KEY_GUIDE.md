# 🔐 Secret Key O'zgartirish Qo'llanmasi

## Secret Key qayerda saqlanadi?

Secret key **Vercel** serverida, environment variable (muhit o'zgaruvchisi) sifatida saqlanadi. Bu kod ichida emas, balki Vercel dashboard da maxfiy saqlangan qiymat.

**Hozirgi qiymat:**
```
ENCRYPTION_KEY = "NOOR-GMS-2024-VERY-LONG-SECRET-KEY-12345"
```

---

## Secret Key ni o'zgartirish (3 usul)

### 📌 **Usul 1: Vercel Dashboard orqali** (Eng oson)

1. **Vercel Dashboard ochish:**
   - https://vercel.com/dashboard
   - Login qiling (xeopstjk14-3859's projects)

2. **Loyihani tanlash:**
   - `noor-gms-api` loyihasini bosing

3. **Settings → Environment Variables:**
   - Yuqori menuda **Settings** tugmasini bosing
   - Chap tarafdan **Environment Variables** bo'limini tanlang

4. **ENCRYPTION_KEY ni o'zgartirish:**
   - `ENCRYPTION_KEY` ni toping
   - **Edit** (✏️) tugmasini bosing
   - **Yangi qiymat kiriting** (masalan: `MY-NEW-SECRET-KEY-2025-XYZ789`)
   - **Save** tugmasini bosing

5. **Loyihani qayta deploy qilish:**
   - Yuqori o'ng burchakda **Deployments** ga o'ting
   - Eng so'nggi deployment ni toping
   - **⋮** (3 nuqta) → **Redeploy** bosing
   - **Environment Variables Updated** deb yozadi
   - **Redeploy** tugmasini tasdiqlang

✅ **Tayyor!** Yangi secret key faol bo'ldi.

---

### 📌 **Usul 2: Vercel CLI orqali** (Terminal)

1. **Terminal ochish:**
   ```powershell
   cd c:\Users\NOOR\Desktop\bilps
   ```

2. **Eski secret key ni o'chirish:**
   ```powershell
   vercel env rm ENCRYPTION_KEY production
   ```

3. **Yangi secret key qo'shish:**
   ```powershell
   vercel env add ENCRYPTION_KEY production
   ```
   - Keyin sizdan yangi qiymat so'raydi
   - Yangi secret key ni kiriting (masalan: `MY-NEW-SECRET-KEY-2025-XYZ789`)
   - Enter bosing

4. **Loyihani qayta deploy qilish:**
   ```powershell
   vercel --prod
   ```

✅ **Tayyor!** Yangi secret key ishga tushdi.

---

### 📌 **Usul 3: GitHub Actions orqali** (Avtomatik)

Agar GitHub bilan integratsiya qilgan bo'lsangiz:

1. **GitHub repo → Settings → Secrets and variables → Actions**
2. **New repository secret** bosing
3. **Name:** `VERCEL_ENCRYPTION_KEY`
4. **Secret:** Yangi qiymat kiriting
5. **Add secret** bosing

Keyin `.github/workflows/deploy.yml` faylida:
```yaml
env:
  ENCRYPTION_KEY: ${{ secrets.VERCEL_ENCRYPTION_KEY }}
```

---

## ⚠️ Secret Key o'zgarganda nima bo'ladi?

### ❌ **Muammo:**
- Eski parollar **eski secret key** bilan shifrlangan
- Yangi secret key bilan eski parollarni **deshifrlash imkonsiz**

### ✅ **Yechim:**
1. **Barcha userlarni reset qilish:**
   - Firestore → `users` collection ga o'ting
   - Har bir user document dan `encryptedPassword` maydonini o'chiring
   - Userlarga **yangi parol o'rnatishni** ayting

2. **Yoki migratsiya skript yozish:**
   ```javascript
   // Eski key bilan deshifrlash
   const oldDecrypted = decrypt(encryptedPassword, OLD_SECRET_KEY);
   
   // Yangi key bilan shifrlash
   const newEncrypted = encrypt(oldDecrypted, NEW_SECRET_KEY);
   
   // Firestore ga yangilash
   await updateDoc(userRef, { encryptedPassword: newEncrypted });
   ```

---

## 🔒 Xavfsizlik Tavsiyalari

1. **Kuchli secret key qo'ying:**
   ❌ Yomon: `12345`
   ✅ Yaxshi: `NOOR-GMS-2025-SUPER-SECRET-KEY-a1b2c3d4e5f6g7h8`

2. **Secret key ni hech qachon kod ichiga yozmang:**
   ❌ Xato: `const secret = "my-secret-key";`
   ✅ To'g'ri: `const secret = process.env.ENCRYPTION_KEY;`

3. **Secret key ni Git ga commit qilmang:**
   - `.gitignore` faylida `.env` qo'shilgan ✅
   - Faqat Vercel dashboard da saqlanadi ✅

4. **Har 6 oyda secret key ni o'zgartiring:**
   - Yangi key qo'ying
   - Barcha parollarni migratsiya qiling

---

## 📞 Yordam kerakmi?

**Vercel Dashboard:**
https://vercel.com/xeopstjk14-3859s-projects/noor-gms-api

**Vercel Documentation:**
https://vercel.com/docs/projects/environment-variables

**Loyiha URL:**
https://noor-gms-gcaeafqfk-xeopstjk14-3859s-projects.vercel.app
