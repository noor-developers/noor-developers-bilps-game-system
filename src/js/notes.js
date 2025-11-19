// ========== NOTES MODULE ==========
// Manage multiple notes stored in STATE

import { STATE } from './config.js';
import { saveData } from './storage.js';
import { showNotification } from './ui.js';

// Helper function for date/time formatting
function formatDateTimeUz(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}.${month}.${year}, ${hours}:${minutes}`;
}

let currentNoteId = null;

// Open notes modal
export function openNotesModal() {
  if (!STATE.isLoggedIn) {
    showNotification('⚠️ Avval tizimga kiring!');
    return;
  }
  document.getElementById('notesModal').classList.add('active');
  loadNotesList();
}

// Load notes list
function loadNotesList() {
  if (!STATE.notesList) STATE.notesList = [];
  
  const notesList = document.getElementById('notesList');
  if (!notesList) return;
  
  if (STATE.notesList.length === 0) {
    notesList.innerHTML = '<div class="notes-empty">Zametka yo\'q</div>';
    return;
  }
  
  notesList.innerHTML = STATE.notesList.map((note, index) => `
    <div class="note-item ${currentNoteId === note.id ? 'active' : ''}" onclick="loadNote(${index})">
      <div class="note-item-title">${note.title || 'Sarlavasiz'}</div>
      <div class="note-item-preview">${note.content.substring(0, 50)}...</div>
      <div class="note-item-date">${note.date}</div>
    </div>
  `).join('');
}

// Load specific note into editor
export function loadNote(index) {
  const note = STATE.notesList[index];
  if (!note) return;
  
  currentNoteId = note.id;
  document.getElementById('noteTitle').value = note.title || '';
  document.getElementById('noteContent').value = note.content || '';
  loadNotesList();
}

// Save current note
export async function saveNote() {
  if (!STATE.isLoggedIn) {
    showNotification('⚠️ Avval tizimga kiring!');
    return;
  }
  
  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value.trim();
  
  if (!content) {
    showNotification('⚠️ Zametka bo\'sh bo\'lishi mumkin emas!');
    return;
  }
  
  if (!STATE.notesList) STATE.notesList = [];
  
  if (currentNoteId) {
    // Update existing note
    const index = STATE.notesList.findIndex(n => n.id === currentNoteId);
    if (index !== -1) {
      STATE.notesList[index] = {
        ...STATE.notesList[index],
        title,
        content,
        updatedAt: formatDateTimeUz(new Date())
      };
    }
  } else {
    // Create new note
    const newNote = {
      id: Date.now(),
      title,
      content,
      date: formatDateTimeUz(new Date()),
      updatedAt: formatDateTimeUz(new Date())
    };
    STATE.notesList.unshift(newNote);
  }
  
  await saveData();
  loadNotesList();
  clearNoteEditor();
  showNotification('✅ Zametka saqlandi!');
}

// Clear note editor
export function clearNoteEditor() {
  currentNoteId = null;
  document.getElementById('noteTitle').value = '';
  document.getElementById('noteContent').value = '';
  loadNotesList();
}

// Legacy function for backward compatibility
export function syncNotesArea() {
  // Deprecated - kept for compatibility
}

export async function saveNotes() {
  // Deprecated - kept for compatibility
  await saveNote();
}
