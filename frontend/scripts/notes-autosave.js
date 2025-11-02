/**
 * Notes Auto-Save to Minecraft Database
 * 
 * Automatically saves user notes to Minecraft (Y: 201-250)
 * - Debounced save (2 seconds after typing stops)
 * - Visual status indicator
 * - Loads notes on page load
 */

const MINECRAFT_BRIDGE_URL = 'http://localhost:3002';
const SAVE_DEBOUNCE_MS = 2000; // 2 seconds
const USER_ID = 'default'; // Single user for now

let saveTimeout = null;
let currentLectureId = null;

/**
 * Initialize notes system
 */
function initializeNotes() {
  const notesTextarea = document.getElementById('notes-textarea');
  const statusIndicator = document.querySelector('.status-indicator');
  const statusText = document.querySelector('.status-text');
  
  if (!notesTextarea) {
    console.log('Notes textarea not found');
    return;
  }
  
  // Get lecture ID from current lecture
  currentLectureId = getCurrentLectureId();
  
  if (!currentLectureId) {
    console.log('No lecture ID found');
    return;
  }
  
  console.log(`📝 Notes system initialized for: ${currentLectureId}`);
  
  // Load existing notes
  loadNotesFromMinecraft(currentLectureId);
  
  // Set up auto-save on input
  notesTextarea.addEventListener('input', () => {
    handleNoteInput();
  });
  
  // Save before page unload
  window.addEventListener('beforeunload', () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveNoteToMinecraft(notesTextarea.value, false); // Don't wait
    }
  });
}

/**
 * Get current lecture ID from session storage or URL
 */
function getCurrentLectureId() {
  // Try to get from currentLecture variable (set by viewer.js)
  if (typeof currentLecture !== 'undefined' && currentLecture && currentLecture.fileName) {
    return `lecture:${currentLecture.fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }
  
  // Try from session storage
  const lectureData = sessionStorage.getItem('currentLecture');
  if (lectureData) {
    try {
      const lecture = JSON.parse(lectureData);
      if (lecture.fileName) {
        return `lecture:${lecture.fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
    } catch (e) {
      console.error('Error parsing lecture data:', e);
    }
  }
  
  // Fallback to default
  return 'lecture:default';
}

/**
 * Handle note input with debounced save
 */
function handleNoteInput() {
  const notesTextarea = document.getElementById('notes-textarea');
  const content = notesTextarea.value;
  
  // Update status to "Saving..."
  updateStatus('saving');
  
  // Clear existing timeout
  clearTimeout(saveTimeout);
  
  // Set new timeout
  saveTimeout = setTimeout(() => {
    saveNoteToMinecraft(content);
  }, SAVE_DEBOUNCE_MS);
}

/**
 * Save note to Minecraft database
 */
async function saveNoteToMinecraft(content, showSuccess = true) {
  try {
    console.log(`💾 Saving note to Minecraft (Y: 201-250)...`);
    
    const response = await fetch(`${MINECRAFT_BRIDGE_URL}/mcdb/notes/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lectureId: currentLectureId,
        userId: USER_ID,
        content: content
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (showSuccess) {
        console.log(`✅ Note saved! (${data.wordCount} words, ${data.charCount} chars)`);
        updateStatus('saved');
      }
    } else {
      console.error('❌ Failed to save note:', data.error);
      updateStatus('error');
    }
    
  } catch (error) {
    console.error('❌ Error saving note:', error);
    updateStatus('error');
    
    // Retry after 5 seconds
    setTimeout(() => {
      saveNoteToMinecraft(content, false);
    }, 5000);
  }
}

/**
 * Load notes from Minecraft database
 */
async function loadNotesFromMinecraft(lectureId) {
  try {
    console.log(`📖 Loading notes from Minecraft for: ${lectureId}`);
    
    const response = await fetch(
      `${MINECRAFT_BRIDGE_URL}/mcdb/notes/get/${lectureId}?userId=${USER_ID}`
    );
    const data = await response.json();
    
    if (data.success && data.note && data.note.content) {
      const notesTextarea = document.getElementById('notes-textarea');
      notesTextarea.value = data.note.content;
      
      console.log(`✅ Loaded note (${data.note.wordCount} words)`);
      console.log(`   Last modified: ${new Date(data.note.lastModified).toLocaleString()}`);
      
      updateStatus('saved');
    } else {
      console.log('📝 No existing notes found (creating new)');
      updateStatus('saved');
    }
    
  } catch (error) {
    console.error('❌ Error loading notes:', error);
    console.log('ℹ️  Will create new note when you start typing');
  }
}

/**
 * Update status indicator
 */
function updateStatus(status) {
  const statusIndicator = document.querySelector('.status-indicator');
  const statusText = document.querySelector('.status-text');
  
  if (!statusIndicator || !statusText) return;
  
  // Remove all status classes
  statusIndicator.classList.remove('saving', 'error');
  
  switch (status) {
    case 'saving':
      statusIndicator.classList.add('saving');
      statusText.textContent = 'Saving...';
      break;
    case 'saved':
      statusText.textContent = 'Saved';
      break;
    case 'error':
      statusIndicator.classList.add('error');
      statusText.textContent = 'Error';
      break;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNotes);
} else {
  initializeNotes();
}

// Also initialize after a brief delay (in case viewer.js hasn't loaded yet)
setTimeout(initializeNotes, 1000);

