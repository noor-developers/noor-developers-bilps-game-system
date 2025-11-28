// Firebase App Check - Bot va abuse dan himoya
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js';
import { app } from './firebase-config.js';

// MUHIM: Firebase Console da App Check yoqing
// https://console.firebase.google.com/project/noor-gms/appcheck
// reCAPTCHA v3 site key kerak

const RECAPTCHA_SITE_KEY = '6Lf-MxssAAAAAHNvxXMplGKPfOomH_k_O5Iq1_ra'; // ← TEST KEY (almashtiring!)

// App Check initialization
let appCheck = null;

export function initAppCheck() {
  // Localhost da App Check ni skip qilish
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('ℹ️ App Check skipped (localhost)');
    return;
  }
  
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
    console.log('✅ Firebase App Check initialized');
  } catch (error) {
    console.warn('⚠️ App Check initialization failed:', error);
    // Production da zarur, development da optional
  }
}

// App Check main.js dan ishga tushiriladi
// Auto-initialization olib tashlandi
