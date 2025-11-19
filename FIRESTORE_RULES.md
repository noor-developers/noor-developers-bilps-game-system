# 🔒 Firestore Security Rules - O'rnatish

## Firebase Console ga kiring:
🔗 https://console.firebase.google.com/project/noor-gms/firestore

## Security Rules ni o'rnating:

1. **Firestore Database** → **Rules** tabini oching
2. Quyidagi kodni **to'liq** nusxalang va **Publish** bosing:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ===== USER PROFILES =====
    // Har bir user faqat o'z profilini o'qiy/yoza oladi
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User ning game data-si
      match /gameData/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Boshqa hech narsa ruxsat berilmaydi
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## ✅ Nima qiladi?

1. **Faqat login qilgan userlar** ma'lumotlarga kirishi mumkin
2. Har bir user **faqat o'z ma'lumotlarini** ko'radi va o'zgartiradi
3. Boshqa userlaring ma'lumotlari **ko'rinmaydi**
4. **Real-time sinxronizatsiya** ishlaydi

## 🔐 Xavfsizlik:

- ❌ User A → User B ning ma'lumotlarini ko'ra olmaydi
- ❌ Login qilmagan user hech narsa ko'ra olmaydi
- ✅ Har bir user faqat o'zining `users/{userId}` papkasiga kiradi
- ✅ Barcha o'zgarishlar avtomatik barcha qurilmalarda ko'rinadi

## ⚠️ MUHIM:
Bu rules-ni o'rnatmaguningizcha, Firestore ishlamaydi!

**Status:** Keyingi qadam - Rules ni Firebase Console da publish qilish
