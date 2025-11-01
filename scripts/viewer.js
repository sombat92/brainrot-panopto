// DOM Elements
const video = document.getElementById("lecture-video")
const playPauseBtn = document.getElementById("playPauseBtn")
const skipBackBtn = document.getElementById("skipBackBtn")
const skipForwardBtn = document.getElementById("skipForwardBtn")
const muteBtn = document.getElementById("muteBtn")
const progressBar = document.getElementById("progressBar")
const progressFill = progressBar.querySelector(".progress-fill")
const progressHandle = progressBar.querySelector(".progress-handle")
const timeDisplay = document.getElementById("timeDisplay")

const reelsPopup = document.getElementById("reels-popup")
let isDraggingReels = false
let reelsOffsetX = 0
let reelsOffsetY = 0

// State
let isDraggingProgress = false
let currentLecture = null

// lecturesData and reelsData are defined in data.js which loads before this file

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadLecture()
  setupVideoListeners()
  setupControlListeners()
  setupTabSwitching()
  loadNotesFromStorage()
  setupReels()
})

/* ============================================================================
   ✅ FIXED DRAGGABLE POPUP — pointer events only
============================================================================ */

function setupReels() {
  const reelsContainer = document.getElementById("reels-container")
  if (!reelsPopup || !reelsContainer) return

  // Render reel list
  const videos = []
  reelsData.forEach((reel) => {
    const reelItem = document.createElement("div")
    reelItem.className = "reel-item"
    reelItem.innerHTML = `
      <video class="reel-video" loop playsinline>
        <source src="${reel.video}" type="video/mp4">
      </video>
    `
    reelsContainer.appendChild(reelItem)
    
    const video = reelItem.querySelector(".reel-video")
    videos.push({ video, reelItem })
  })

  // Use Intersection Observer to auto-play only visible reels
  const observerOptions = {
    root: reelsContainer,
    rootMargin: '0px',
    threshold: 0.5 // Play when at least 50% visible
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector('.reel-video')
      if (!video) return

      if (entry.isIntersecting) {
        // Reel is in view - play it
        video.play().catch(() => {})
      } else {
        // Reel is out of view - pause it
        video.pause()
      }
    })
  }, observerOptions)

  // Observe all reel items
  videos.forEach(({ reelItem }) => {
    observer.observe(reelItem)
  })

  // Drag handle setup
  const dragHandle = reelsPopup.querySelector(".reels-header")
  if (!dragHandle) return
  
  // Helper function to check if click is in header
  const isClickInHeader = (e) => {
    const headerRect = dragHandle.getBoundingClientRect()
    const x = e.clientX || e.touches?.[0]?.clientX
    const y = e.clientY || e.touches?.[0]?.clientY
    return x >= headerRect.left && x <= headerRect.right &&
           y >= headerRect.top && y <= headerRect.bottom
  }
  
  // Primary drag handler
  const handleDragStart = (e) => {
    if (e.type === 'mousedown' && e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    startDraggingReels(e)
    return false
  }
  
  // Attach listeners
  dragHandle.addEventListener("pointerdown", handleDragStart, true)
  dragHandle.addEventListener("mousedown", handleDragStart, true)
  dragHandle.addEventListener("touchstart", handleDragStart, true)
  
  // Backup: coordinate-based listener on popup
  const handlePopupClick = (e) => {
    if (isClickInHeader(e)) {
      e.stopPropagation()
      startDraggingReels(e)
    }
  }
  reelsPopup.addEventListener("pointerdown", handlePopupClick)
  reelsPopup.addEventListener("mousedown", handlePopupClick)
  
  // Disable pointer events on header children
  const headerChildren = dragHandle.querySelectorAll('*')
  headerChildren.forEach(child => {
    child.style.pointerEvents = 'none'
  })
  
  // Ensure header can receive events
  dragHandle.style.pointerEvents = 'auto'
  dragHandle.style.cursor = 'grab'
  
  // Use document instead of window for better event capture
  document.addEventListener("pointermove", dragReels, true)
  document.addEventListener("mousemove", dragReels, true) // Fallback
  document.addEventListener("pointerup", stopDraggingReels, true)
  document.addEventListener("mouseup", stopDraggingReels, true) // Fallback
}

function startDraggingReels(e) {
  if (!reelsPopup) return
  
  isDraggingReels = true
  reelsPopup.classList.add("dragging")

  // Support both mouse and touch/pointer events
  const clientX = e.clientX ?? e.touches?.[0]?.clientX
  const clientY = e.clientY ?? e.touches?.[0]?.clientY
  
  const rect = reelsPopup.getBoundingClientRect()
  reelsOffsetX = clientX - rect.left
  reelsOffsetY = clientY - rect.top

  reelsPopup.style.position = "fixed"
  reelsPopup.style.right = "auto"
  reelsPopup.style.bottom = "auto"

  // Use currentTarget (the header) instead of target (which might be a child with pointer-events: none)
  // Only set pointer capture for pointer events, not mouse events
  if (e.type.startsWith("pointer") && e.currentTarget && e.currentTarget.setPointerCapture && e.pointerId !== undefined) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch (err) {
      // Silently fail
    }
  }
  e.preventDefault()
  e.stopPropagation()
}

function dragReels(e) {
  if (!isDraggingReels) {
    return
  }

  // Support both mouse and touch/pointer events
  const clientX = e.clientX ?? e.touches?.[0]?.clientX
  const clientY = e.clientY ?? e.touches?.[0]?.clientY
  
  if (clientX === undefined || clientY === undefined) return

  let newLeft = clientX - reelsOffsetX
  let newTop = clientY - reelsOffsetY

  const rect = reelsPopup.getBoundingClientRect()
  newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - rect.width))
  newTop = Math.max(0, Math.min(newTop, window.innerHeight - rect.height))

  reelsPopup.style.left = newLeft + "px"
  reelsPopup.style.top = newTop + "px"

  e.preventDefault()
}

function stopDraggingReels(e) {
  isDraggingReels = false
  reelsPopup.classList.remove("dragging")
  
  const dragHandle = reelsPopup.querySelector(".reels-header")
  if (dragHandle && dragHandle.hasPointerCapture && dragHandle.hasPointerCapture(e.pointerId)) {
    try { dragHandle.releasePointerCapture(e.pointerId) } catch {}
  }
}

/* ============================================================================
   VIDEO PLAYER CONTROLS
============================================================================ */

function loadLecture() {
  const lectureData = sessionStorage.getItem("currentLecture")

  if (lectureData) {
    currentLecture = JSON.parse(lectureData)
  } else {
    currentLecture = lecturesData[0]
  }

  document.getElementById("lecture-title-header").textContent = currentLecture.title
  document.getElementById("lecture-module").textContent = currentLecture.module || "Module"
  document.getElementById("lecture-instructor").textContent = currentLecture.instructor
  document.getElementById("lecture-date").textContent = currentLecture.date
  document.getElementById("lecture-duration").textContent = formatTime(80 * 60 + 20)
}

function setupVideoListeners() {
  video.addEventListener("timeupdate", updateProgress)
  video.addEventListener("loadedmetadata", updateTimeDisplay)
  video.addEventListener("ended", updatePlayPauseButton)
}

function setupControlListeners() {
  playPauseBtn.addEventListener("click", togglePlayPause)
  skipBackBtn.addEventListener("click", () => skipTime(-10))
  skipForwardBtn.addEventListener("click", () => skipTime(10))
  muteBtn.addEventListener("click", toggleMute)

  progressBar.addEventListener("mousedown", startDragging)
  document.addEventListener("mousemove", drag)
  document.addEventListener("mouseup", stopDragging)
  progressBar.addEventListener("click", seek)
}

function togglePlayPause() {
  if (video.paused) video.play()
  else video.pause()
  updatePlayPauseButton()
}

function updatePlayPauseButton() {
  const svg = playPauseBtn.querySelector("svg")
  if (video.paused) {
    svg.innerHTML = '<path d="M8 5v14l11-7z"/>'
  } else {
    svg.innerHTML = '<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>'
  }
}

function skipTime(seconds) {
  video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
}

function toggleMute() {
  video.muted = !video.muted
  updateMuteButton()
}

function updateMuteButton() {
  const svg = muteBtn.querySelector("svg")
  if (video.muted) {
    svg.innerHTML =
      '<path d="M16.6 14.4L15.2 13l-2.3 2.3-2.3-2.3-1.4 1.4L11.5 16l-2.3 2.3 1.4 1.4 2.3-2.3 2.3 2.3 1.4-1.4L13 16l2.6-1.6z"/>'
  } else {
    svg.innerHTML =
      '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>'
  }
}

function updateProgress() {
  if (!video.duration) return
  const percent = (video.currentTime / video.duration) * 100
  progressFill.style.width = percent + "%"
  progressHandle.style.left = percent + "%"
  updateTimeDisplay()
}

function updateTimeDisplay() {
  const currentTime = formatTime(video.currentTime)
  const duration = formatTime(video.duration)
  timeDisplay.textContent = `${currentTime} / ${duration}`
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function startDragging() {
  isDraggingProgress = true
}

function drag(e) {
  if (!isDraggingProgress) return
  seek(e)
}

function stopDragging() {
  isDraggingProgress = false
}

function seek(e) {
  const rect = progressBar.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  video.currentTime = percent * video.duration
}

/* ============================================================================
   TABS
============================================================================ */

function setupTabSwitching() {
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab")

      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      button.classList.add("active")
      document.getElementById(tabName + "-tab").classList.add("active")
    })
  })
}

/* ============================================================================
   NOTES
============================================================================ */

function loadNotesFromStorage() {
  const lectureId = currentLecture.id || "default"
  const savedNotes = localStorage.getItem("notes-" + lectureId)
  if (savedNotes) {
    document.getElementById("notes-textarea").value = savedNotes
  }

  const notesTextarea = document.getElementById("notes-textarea")
  notesTextarea.addEventListener("input", () => {
    const notesText = notesTextarea.value
    localStorage.setItem("notes-" + lectureId, notesText)
  })
}
