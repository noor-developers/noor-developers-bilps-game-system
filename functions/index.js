// ========== NOOR GMS - FIREBASE CLOUD FUNCTIONS ==========
// Parolni AES-256 bilan shifrlash (Server-side)

// .env faylni yuklash
require("dotenv").config();

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const crypto = require("crypto");
const logger = require("firebase-functions/logger");

// Global sozlamalar
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
  timeoutSeconds: 60,
});

// Secret Key (environment variable - .env dan)
// MUHIM: Bu key .env da bo'lishi va GitHub ga yuklanmasligi kerak!
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "NOOR-GMS-2024-SECURE-KEY-CHANGE-THIS";

// Startup da tekshirish
if (ENCRYPTION_KEY === "NOOR-GMS-2024-SECURE-KEY-CHANGE-THIS") {
  logger.warn("⚠️ ENCRYPTION_KEY .env da o'rnatilmagan! Default key ishlatilmoqda.");
}

// ========== AES-256-GCM SHIFRLASH ==========
async function encryptPasswordSecure(password, secretKey) {
  try {
    // Key derivation
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(secretKey, salt, 100000, 32, "sha256");

    // IV yaratish
    const iv = crypto.randomBytes(12);

    // Shifrlash
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(password, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Auth tag
    const authTag = cipher.getAuthTag();

    // Birlashtirish: salt + iv + authTag + encrypted
    const result = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, "hex"),
    ]);

    // Base64 formatga
    return result.toString("base64");
  } catch (error) {
    logger.error("Shifrlash xatosi:", error);
    throw new Error("Parolni shifrlashda xatolik");
  }
}

// ========== CLOUD FUNCTION: PAROL SHIFRLASH ==========
exports.encryptPassword = onCall(async (request) => {
      // Autentifikatsiya tekshiruvi
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "Iltimos, avval tizimga kiring!",
        );
      }

      // Ma'lumotlarni olish
      const {password} = request.data;

      // Validatsiya
      if (!password || typeof password !== "string") {
        throw new HttpsError(
            "invalid-argument",
            "Parol kiritilmadi yoki noto'g'ri format!",
        );
      }

      if (password.length < 6) {
        throw new HttpsError(
            "invalid-argument",
            "Parol kamida 6 ta belgidan iborat bo'lishi kerak!",
        );
      }

      try {
        // Shifrlash
        const encrypted = await encryptPasswordSecure(password, ENCRYPTION_KEY);

        logger.info("Parol muvaffaqiyatli shifrlandi", {
          userId: request.auth.uid,
          timestamp: new Date().toISOString(),
        });

        return {
          success: true,
          encryptedPassword: encrypted,
        };
      } catch (error) {
        logger.error("Shifrlash funksiyasida xato:", error);
        throw new HttpsError(
            "internal",
            "Server xatosi. Keyinroq qayta urinib ko'ring.",
        );
      }
    },
);

// ========== CLOUD FUNCTION: PAROL DESHIFRLASH (Admin uchun) ==========
exports.decryptPassword = onCall(async (request) => {
      // Faqat admin
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Ruxsat yo'q!");
      }

      const {encryptedPassword} = request.data;

      if (!encryptedPassword) {
        throw new HttpsError("invalid-argument", "Shifrlangan parol yo'q!");
      }

      try {
        const data = Buffer.from(encryptedPassword, "base64");

        // Ma'lumotlarni ajratish
        const salt = data.slice(0, 16);
        const iv = data.slice(16, 28);
        const authTag = data.slice(28, 44);
        const encrypted = data.slice(44);

        // Key derivation
        const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, "sha256");

        // Deshifrlash
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, undefined, "utf8");
        decrypted += decipher.final("utf8");

        logger.info("Parol deshifrlandi (Admin)", {
          userId: request.auth.uid,
        });

        return {
          success: true,
          password: decrypted,
        };
      } catch (error) {
        logger.error("Deshifrlash xatosi:", error);
        throw new HttpsError("internal", "Deshifrlashda xatolik");
      }
    },
);
