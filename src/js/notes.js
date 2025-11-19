// ========== NOTES MODULE ==========
// Manage operator notes stored in STATE

import { STATE } from './config.js';
import { saveData } from './storage.js';
import { showNotification } from './ui.js';

// Sync textarea with current state value
export function syncNotesArea() {
  const notesArea = document.getElementById('notesArea');
  if (!notesArea) return;
  if (notesArea.value !== (STATE.notes || '')) {
    notesArea.value = STATE.notes || '';
  }
}

// Persist notes entered by the user
export async function saveNotes() {
  if (!STATE.isLoggedIn) {
    showNotification('⚠️ Avval tizimga kiring!');
    return;
  }
  const notesArea = document.getElementById('notesArea');
  if (!notesArea) return;
  STATE.notes = notesArea.value;
  await saveData();
  showNotification('✅ Zametka saqlandi!');
}
