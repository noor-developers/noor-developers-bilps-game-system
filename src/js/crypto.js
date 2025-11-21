// ========== CRYPTO UTILITIES ==========
// AES-256 shifrlash va username validatsiya

// Username validatsiya: faqat kichik harflar, raqamlar va _ (underscore)
export function validateUsername(username) {
  // Validatsiya qoidalari
  const rules = {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-z0-9_]+$/  // Faqat: a-z, 0-9, _
  };

  // Bo'sh username
  if (!username || username.trim() === '') {
    return {
      valid: false,
      message: '⚠️ Username kiritilmadi!'
    };
  }

  // Minimal uzunlik
  if (username.length < rules.minLength) {
    return {
      valid: false,
      message: `⚠️ Username kamida ${rules.minLength} ta belgidan iborat bo'lishi kerak!`
    };
  }

  // Maksimal uzunlik
  if (username.length > rules.maxLength) {
    return {
      valid: false,
      message: `⚠️ Username ${rules.maxLength} ta belgidan oshmasligi kerak!`
    };
  }

  // Katta harf tekshiruvi
  if (username !== username.toLowerCase()) {
    return {
      valid: false,
      message: '⚠️ Username faqat kichik harflardan iborat bo\'lishi kerak!\n(A-Z ishlatmang, faqat a-z)'
    };
  }

  // Ruxsat etilmagan belgilar
  if (!rules.pattern.test(username)) {
    return {
      valid: false,
      message: '⚠️ Username faqat:\n• Kichik harflar (a-z)\n• Raqamlar (0-9)\n• Pastki chiziq (_)\ndan iborat bo\'lishi mumkin!'
    };
  }

  // Bo'shliq tekshiruvi
  if (username.includes(' ')) {
    return {
      valid: false,
      message: '⚠️ Username bo\'shliq belgisini o\'z ichiga olmaydi!'
    };
  }

  // Maxsus belgilar tekshiruvi
  const specialChars = username.match(/[^a-z0-9_]/g);
  if (specialChars) {
    return {
      valid: false,
      message: `⚠️ Ruxsat etilmagan belgilar: ${specialChars.join(', ')}\nFaqat a-z, 0-9 va _ ishlatish mumkin!`
    };
  }

  // To'g'ri username
  return {
    valid: true,
    message: '✅ Username to\'g\'ri!'
  };
}

// AES-256-GCM shifrlash (Web Crypto API)
export async function encryptPassword(password, secretKey = 'NOOR-GMS-2024-SECRET-KEY') {
  try {
    // Secret key dan CryptoKey yaratish
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    // Salt yaratish
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // AES-256-GCM key yaratish
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // IV (Initialization Vector) yaratish
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Parolni shifrlash
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encoder.encode(password)
    );

    // Salt + IV + Encrypted data ni birlashtirish
    const encryptedArray = new Uint8Array(encrypted);
    const result = new Uint8Array(salt.length + iv.length + encryptedArray.length);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(encryptedArray, salt.length + iv.length);

    // Base64 formatiga o'tkazish
    return btoa(String.fromCharCode.apply(null, result));
  } catch (error) {
    console.error('Shifrlash xatosi:', error);
    return null;
  }
}

// AES-256-GCM deshifrlash
export async function decryptPassword(encryptedData, secretKey = 'NOOR-GMS-2024-SECRET-KEY') {
  try {
    // Base64 dan Uint8Array ga
    const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Salt, IV va encrypted data ni ajratish
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);

    // Secret key dan CryptoKey yaratish
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    // AES-256-GCM key yaratish
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Deshifrlash
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encrypted
    );

    // Natijani text ga o'tkazish
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Deshifrlash xatosi:', error);
    return null;
  }
}

// Parol kuchini tekshirish
export function checkPasswordStrength(password) {
  const strength = {
    score: 0,
    message: '',
    color: ''
  };

  if (!password) {
    return { ...strength, message: 'Parol kiritilmagan', color: '#ef4444' };
  }

  // Uzunlik
  if (password.length >= 8) strength.score += 1;
  if (password.length >= 12) strength.score += 1;

  // Katta harf
  if (/[A-Z]/.test(password)) strength.score += 1;

  // Kichik harf
  if (/[a-z]/.test(password)) strength.score += 1;

  // Raqamlar
  if (/[0-9]/.test(password)) strength.score += 1;

  // Maxsus belgilar
  if (/[^A-Za-z0-9]/.test(password)) strength.score += 1;

  // Natija
  if (strength.score <= 2) {
    strength.message = 'Zaif parol';
    strength.color = '#ef4444';
  } else if (strength.score <= 4) {
    strength.message = 'O\'rtacha parol';
    strength.color = '#f59e0b';
  } else {
    strength.message = 'Kuchli parol';
    strength.color = '#10b981';
  }

  return strength;
}
