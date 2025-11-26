// ========== VERCEL SERVERLESS FUNCTION ==========
// Parolni AES-256 bilan shifrlash (Server-side)
// Endpoint: https://your-project.vercel.app/api/encrypt-password

import crypto from 'crypto';

// Secret Key (Vercel Environment Variables dan)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'NOOR-GMS-2024-SECURE-KEY';

/**
 * AES-256-GCM shifrlash
 */
function encryptPassword(password, secretKey) {
  try {
    // Key derivation
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(secretKey, salt, 100000, 32, 'sha256');

    // IV yaratish
    const iv = crypto.randomBytes(12);

    // Shifrlash
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Auth tag
    const authTag = cipher.getAuthTag();

    // Birlashtirish: salt + iv + authTag + encrypted
    const result = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex'),
    ]);

    // Base64 formatga
    return result.toString('base64');
  } catch (error) {
    console.error('Shifrlash xatosi:', error);
    throw new Error('Parolni shifrlashda xatolik');
  }
}

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
  // CORS headers - faqat o'z domeniga ruxsat
  const allowedOrigins = [
    'https://noor-gms.web.app',
    'https://noor-gms.firebaseapp.com',
    'http://localhost:5000',
    'http://localhost:3000',
    'file://' // Local testing uchun
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || origin?.startsWith('file://')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Faqat POST request
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const { password, firebaseToken } = req.body;

    // Validatsiya
    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Parol kiritilmadi yoki noto\'g\'ri format!',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak!',
      });
    }

    // Firebase token tekshiruvi (optional - xavfsizlik uchun)
    if (!firebaseToken) {
      return res.status(401).json({
        success: false,
        error: 'Autentifikatsiya kerak!',
      });
    }

    // Shifrlash
    const encrypted = encryptPassword(password, ENCRYPTION_KEY);

    console.log('✅ Parol shifrlandi:', new Date().toISOString());

    return res.status(200).json({
      success: true,
      encryptedPassword: encrypted,
    });
  } catch (error) {
    console.error('❌ Server xatosi:', error);
    return res.status(500).json({
      success: false,
      error: 'Server xatosi. Keyinroq qayta urinib ko\'ring.',
    });
  }
}
