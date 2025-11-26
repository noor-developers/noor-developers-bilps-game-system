// ========== INPUT SANITIZATION MODULE ==========
// XSS va injection hujumlaridan himoya

/**
 * HTML belgilarini encode qilish (XSS dan himoya)
 */
export function sanitizeHTML(input) {
  if (typeof input !== 'string') return '';
  
  const map = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '&': '&amp;'
  };
  
  return input.replace(/[<>"'\/&]/g, (char) => map[char]);
}

/**
 * SQL Injection dan himoya (Firestore NoSQL uchun ham foydali)
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  // Xavfli belgilarni olib tashlash
  return input
    .replace(/[<>'"]/g, '') // HTML/JS tags
    .replace(/--|;|\/\*/g, '') // SQL injection
    .replace(/\0/g, '') // Null bytes
    .trim();
}

/**
 * Username uchun maxsus sanitization
 */
export function sanitizeUsername(username) {
  if (typeof username !== 'string') return '';
  
  // Faqat lowercase, raqam, pastki chiziq
  return username
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20); // Max 20 belgi
}

/**
 * Telefon raqam sanitization
 */
export function sanitizePhone(phone) {
  if (typeof phone !== 'string') return '';
  
  // Faqat raqam va + belgisi
  return phone.replace(/[^0-9+]/g, '').slice(0, 15);
}

/**
 * Raqam sanitization
 */
export function sanitizeNumber(value, min = 0, max = Infinity) {
  const num = parseInt(value, 10);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}

/**
 * Matn uzunligini cheklash
 */
export function limitLength(input, maxLength = 100) {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLength);
}

/**
 * Safe innerHTML uchun wrapper
 */
export function safeHTML(element, content) {
  if (!element) return;
  
  // textContent ishlatish (innerHTML o'rniga)
  if (typeof content === 'string') {
    element.textContent = content;
  } else {
    element.textContent = String(content);
  }
}

/**
 * URL sanitization
 */
export function sanitizeURL(url) {
  if (typeof url !== 'string') return '';
  
  try {
    const parsed = new URL(url);
    // Faqat HTTP/HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
}

// Global expose
if (typeof window !== 'undefined') {
  window.sanitizeHTML = sanitizeHTML;
  window.sanitizeInput = sanitizeInput;
  window.sanitizeUsername = sanitizeUsername;
  window.sanitizePhone = sanitizePhone;
  window.sanitizeNumber = sanitizeNumber;
  window.safeHTML = safeHTML;
}
