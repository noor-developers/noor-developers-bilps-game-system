// ========== RATE LIMITING MODULE ==========
// Brute-force hujumlaridan himoya

const loginAttempts = new Map(); // IP/User -> {count, lastAttempt}
const MAX_ATTEMPTS = 5; // 5 marta urinish
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 daqiqa

/**
 * Login urinishlarini tekshirish
 */
export function checkLoginAttempts(identifier) {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);
  
  if (!attempt) {
    // Birinchi urinish
    loginAttempts.set(identifier, {
      count: 1,
      lastAttempt: now,
      lockedUntil: null
    });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }
  
  // Agar lock qilingan bo'lsa
  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    const remainingMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
    return {
      allowed: false,
      remaining: 0,
      lockedMinutes: remainingMinutes,
      message: `Juda ko'p urinish! ${remainingMinutes} daqiqadan keyin qayta urinib ko'ring.`
    };
  }
  
  // Agar lock vaqti o'tgan bo'lsa - reset
  if (attempt.lockedUntil && now >= attempt.lockedUntil) {
    loginAttempts.set(identifier, {
      count: 1,
      lastAttempt: now,
      lockedUntil: null
    });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }
  
  // Urinishlarni sanash
  attempt.count++;
  attempt.lastAttempt = now;
  
  if (attempt.count >= MAX_ATTEMPTS) {
    // Lock qilish
    attempt.lockedUntil = now + LOCKOUT_TIME;
    loginAttempts.set(identifier, attempt);
    
    return {
      allowed: false,
      remaining: 0,
      lockedMinutes: 15,
      message: `Juda ko'p urinish! 15 daqiqadan keyin qayta urinib ko'ring.`
    };
  }
  
  loginAttempts.set(identifier, attempt);
  
  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - attempt.count
  };
}

/**
 * Muvaffaqiyatli login dan keyin reset
 */
export function resetLoginAttempts(identifier) {
  loginAttempts.delete(identifier);
}

/**
 * Barcha eski ma'lumotlarni tozalash (xotira uchun)
 */
export function cleanupOldAttempts() {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  
  for (const [key, attempt] of loginAttempts.entries()) {
    if (now - attempt.lastAttempt > ONE_HOUR) {
      loginAttempts.delete(key);
    }
  }
}

// Har 1 soatda tozalash
setInterval(cleanupOldAttempts, 60 * 60 * 1000);
