// DOM Elements - will be initialized after DOM loads
let video, playPauseBtn, skipBackBtn, skipForwardBtn, muteBtn
let progressBar, progressFill, progressHandle, timeDisplay
let reelsPopup, reelsPopup2, reelsPopup3

// Separate dragging state for each popup
let isDraggingReels1 = false
let reelsOffsetX1 = 0
let reelsOffsetY1 = 0

let isDraggingReels2 = false
let reelsOffsetX2 = 0
let reelsOffsetY2 = 0

let isDraggingReels3 = false
let reelsOffsetX3 = 0
let reelsOffsetY3 = 0

// State
let isDraggingProgress = false
let currentLecture = null
let cascadedPopups = [] // Track cascaded popup 3 clones
let allPopups = [] // Track all draggable popups for z-index management
let currentHighestZ = 1000 // Track the highest z-index

// lecturesData and reelsData are defined in data.js which loads before this file

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Initialize DOM element references
  video = document.getElementById("lecture-video")
  playPauseBtn = document.getElementById("playPauseBtn")
  skipBackBtn = document.getElementById("skipBackBtn")
  skipForwardBtn = document.getElementById("skipForwardBtn")
  muteBtn = document.getElementById("muteBtn")
  progressBar = document.getElementById("progressBar")
  if (progressBar) {
    progressFill = progressBar.querySelector(".progress-fill")
    progressHandle = progressBar.querySelector(".progress-handle")
  }
  timeDisplay = document.getElementById("timeDisplay")
  
  reelsPopup = document.getElementById("reels-popup")
  reelsPopup2 = document.getElementById("reels-popup-2")
  reelsPopup3 = document.getElementById("reels-popup-3")
  
  console.log("DOM Elements loaded - reelsPopup:", reelsPopup, "reelsPopup2:", reelsPopup2, "reelsPopup3:", reelsPopup3)
  
  loadLecture()
  setupVideoListeners()
  setupControlListeners()
  setupTabSwitching()
  loadNotesFromStorage()
  
  // Ensure all popups start hidden (disabled)
  if (reelsPopup) {
    reelsPopup.style.display = 'none'
    reelsPopup.classList.remove('active')
  }
  if (reelsPopup2) {
    reelsPopup2.style.display = 'none'
    reelsPopup2.classList.remove('active')
    console.log("reelsPopup2 initialized and hidden")
  }
  if (reelsPopup3) {
    reelsPopup3.style.display = 'none'
    reelsPopup3.classList.remove('active')
  }
  
  setupReels()
  setupReels2()
  setupReels3()
  setupKeyboardShortcuts()
  setupLikeButtons()
  setupReelsToggle()
  
  // Initialize popup tracking and click handlers
  if (reelsPopup) {
    allPopups.push(reelsPopup)
    setupPopupClickToFront(reelsPopup)
  }
  if (reelsPopup2) {
    allPopups.push(reelsPopup2)
    setupPopupClickToFront(reelsPopup2)
  }
  if (reelsPopup3) {
    allPopups.push(reelsPopup3)
    setupPopupClickToFront(reelsPopup3)
  }
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
    videos.push({ video, reelItem, reel })  // Store reel data with video
  })
  
  // Function to update footer with current reel's metadata
  function updateReelFooter(index) {
    const currentReel = reelsData[index]
    if (currentReel) {
      const usernameEl = document.getElementById('reels-username')
      const descriptionEl = document.getElementById('reels-description')
      const avatarEl = document.getElementById('reels-avatar')
      
      if (usernameEl) usernameEl.textContent = currentReel.username || 'anonymous'
      if (descriptionEl) descriptionEl.textContent = currentReel.description || 'No description'
      if (avatarEl) {
        // Use first two letters of username for avatar
        const initials = (currentReel.username || 'BR').substring(0, 2).toUpperCase()
        avatarEl.textContent = initials
      }
    }
  }

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

  // Autoscroll functionality
  let currentReelIndex = 0
  let autoscrollTimeout = null
  
  const getRandomInterval = () => {
    // Random interval between 3-7 seconds (mean ~5 seconds)
    return Math.floor(Math.random() * 4000) + 3000
  }
  
  const scrollToReel = (index) => {
    if (index >= videos.length) {
      index = 0 // Loop back to first reel
    }
    
    const targetReel = videos[index].reelItem
    targetReel.scrollIntoView({ behavior: 'smooth', block: 'start' })
    currentReelIndex = index
    updateReelFooter(index)  // Update footer with new reel's metadata
  }
  
  const scheduleNextScroll = () => {
    const interval = getRandomInterval()
    autoscrollTimeout = setTimeout(() => {
      currentReelIndex = (currentReelIndex + 1) % videos.length
      scrollToReel(currentReelIndex)
      scheduleNextScroll() // Schedule the next scroll with a new random interval
    }, interval)
  }
  
  const startAutoscroll = () => {
    updateReelFooter(0)  // Initialize with first reel
    scheduleNextScroll()
  }
  
  const stopAutoscroll = () => {
    clearTimeout(autoscrollTimeout)
  }
  
  // Start autoscroll after a brief delay
  setTimeout(() => {
    startAutoscroll()
  }, 1000)
  
  // Pause autoscroll when user interacts with the container
  let userInteractionTimeout = null
  reelsContainer.addEventListener('wheel', () => {
    stopAutoscroll()
    clearTimeout(userInteractionTimeout)
    
    // Resume autoscroll after 10 seconds of no interaction
    userInteractionTimeout = setTimeout(() => {
      startAutoscroll()
    }, 10000)
  })
  
  reelsContainer.addEventListener('touchstart', () => {
    stopAutoscroll()
    clearTimeout(userInteractionTimeout)
    
    // Resume autoscroll after 10 seconds of no interaction
    userInteractionTimeout = setTimeout(() => {
      startAutoscroll()
    }, 10000)
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
  
  // Bring to front when starting to drag
  bringToFront(reelsPopup)
  
  isDraggingReels1 = true
  reelsPopup.classList.add("dragging")

  // Support both mouse and touch/pointer events
  const clientX = e.clientX ?? e.touches?.[0]?.clientX
  const clientY = e.clientY ?? e.touches?.[0]?.clientY
  
  const rect = reelsPopup.getBoundingClientRect()
  reelsOffsetX1 = clientX - rect.left
  reelsOffsetY1 = clientY - rect.top

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
  if (!isDraggingReels1) {
    return
  }

  // Support both mouse and touch/pointer events
  const clientX = e.clientX ?? e.touches?.[0]?.clientX
  const clientY = e.clientY ?? e.touches?.[0]?.clientY
  
  if (clientX === undefined || clientY === undefined) return

  let newLeft = clientX - reelsOffsetX1
  let newTop = clientY - reelsOffsetY1

  // Only constrain left and top (prevent negative), allow going off right and bottom
  newLeft = Math.max(0, newLeft)
  newTop = Math.max(0, newTop)

  reelsPopup.style.left = newLeft + "px"
  reelsPopup.style.top = newTop + "px"

  e.preventDefault()
}

function stopDraggingReels(e) {
  isDraggingReels1 = false
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

/* ============================================================================
   iPhone Popup (Popup 2) Setup
============================================================================ */
function setupReels2() {
  const reelsContainer = document.getElementById("reels-container-2")
  if (!reelsPopup2 || !reelsContainer) return

  // Render reel list
  const videos = []
  reelsDataIphone.forEach((reel) => {
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
    threshold: 0.5
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector('.reel-video')
      if (!video) return

      if (entry.isIntersecting) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, observerOptions)

  videos.forEach(({ reelItem }) => {
    observer.observe(reelItem)
  })

  // Drag handle setup for iPhone
  const dragHandle = reelsPopup2.querySelector(".iphone-header")
  if (!dragHandle) return
  
    dragHandle.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return
      e.stopPropagation()
      e.preventDefault()
      startDragging2(e)
    }, true)
  
  dragHandle.style.pointerEvents = 'auto'
  dragHandle.style.cursor = 'grab'
  
  const headerChildren = dragHandle.querySelectorAll('*')
  headerChildren.forEach(child => {
    child.style.pointerEvents = 'none'
  })
}

function startDragging2(e) {
  if (!reelsPopup2) return
  
  // Bring to front when starting to drag
  bringToFront(reelsPopup2)
  
  isDraggingReels2 = true
  reelsPopup2.classList.add("dragging")

  const clientX = e.clientX ?? e.touches?.[0]?.clientX
  const clientY = e.clientY ?? e.touches?.[0]?.clientY
  
  const rect = reelsPopup2.getBoundingClientRect()
  reelsOffsetX2 = clientX - rect.left
  reelsOffsetY2 = clientY - rect.top

  reelsPopup2.style.position = "fixed"
  reelsPopup2.style.right = "auto"
  reelsPopup2.style.bottom = "auto"

  if (e.pointerId !== undefined) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch (err) {}
  }

  document.addEventListener("pointermove", dragReels2, true)
  document.addEventListener("pointerup", stopDragging2, true)
}

function dragReels2(e) {
  if (!isDraggingReels2 || !reelsPopup2) return

  const clientX = e.clientX ?? e.touches?.[0]?.clientX
  const clientY = e.clientY ?? e.touches?.[0]?.clientY

  let x = clientX - reelsOffsetX2
  let y = clientY - reelsOffsetY2

  // Only constrain left and top (prevent negative), allow going off right and bottom
  x = Math.max(0, x)
  y = Math.max(0, y)

  reelsPopup2.style.left = x + "px"
  reelsPopup2.style.top = y + "px"
}

function stopDragging2(e) {
  if (!isDraggingReels2 || !reelsPopup2) return

  isDraggingReels2 = false
  reelsPopup2.classList.remove("dragging")

  if (e.pointerId !== undefined) {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch (err) {}
  }

  document.removeEventListener("pointermove", dragReels2, true)
  document.removeEventListener("pointerup", stopDragging2, true)
}

/* ============================================================================
   Windows 95 Popup (Popup 3) Setup
============================================================================ */
function setupReels3() {
  const reelsContainer = document.getElementById("reels-container-3")
  if (!reelsPopup3 || !reelsContainer) return

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
    threshold: 0.5
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector('.reel-video')
      if (!video) return

      if (entry.isIntersecting) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, observerOptions)

  videos.forEach(({ reelItem }) => {
    observer.observe(reelItem)
  })

  // Drag handle setup for Windows 95 - titlebar and menubar
  const titlebar = reelsPopup3.querySelector(".win95-titlebar")
  const menubar = reelsPopup3.querySelector(".win95-menubar")
  
  const setupDragHandle = (dragHandle) => {
    if (!dragHandle) return
    
    dragHandle.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return
      e.stopPropagation()
      e.preventDefault()
      startDragging3(e)
    }, true)
    
    dragHandle.style.pointerEvents = 'auto'
    dragHandle.style.cursor = 'grab'
    
    const children = dragHandle.querySelectorAll('*:not(.win95-btn)')
    children.forEach(child => {
      if (!child.classList.contains('win95-btn')) {
        child.style.pointerEvents = 'none'
      }
    })
  }
  
  setupDragHandle(titlebar)
  setupDragHandle(menubar)
}

function startDragging3(e) {
  if (!reelsPopup3) return
  
  // Bring to front when starting to drag
  bringToFront(reelsPopup3)
  
  isDraggingReels3 = true
  reelsPopup3.classList.add("dragging")

  const clientX = e.clientX ?? e.touches?.[0]?.clientX
  const clientY = e.clientY ?? e.touches?.[0]?.clientY
  
  const rect = reelsPopup3.getBoundingClientRect()
  reelsOffsetX3 = clientX - rect.left
  reelsOffsetY3 = clientY - rect.top

  reelsPopup3.style.position = "fixed"
  reelsPopup3.style.right = "auto"
  reelsPopup3.style.bottom = "auto"

  if (e.pointerId !== undefined) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch (err) {}
  }

  document.addEventListener("pointermove", dragReels3, true)
  document.addEventListener("pointerup", stopDragging3, true)
}

function dragReels3(e) {
  if (!isDraggingReels3 || !reelsPopup3) return

  const clientX = e.clientX ?? e.touches?.[0]?.clientX
  const clientY = e.clientY ?? e.touches?.[0]?.clientY

  let x = clientX - reelsOffsetX3
  let y = clientY - reelsOffsetY3

  // Only constrain left and top (prevent negative), allow going off right and bottom
  x = Math.max(0, x)
  y = Math.max(0, y)

  reelsPopup3.style.left = x + "px"
  reelsPopup3.style.top = y + "px"
}

function stopDragging3(e) {
  if (!isDraggingReels3 || !reelsPopup3) return

  isDraggingReels3 = false
  reelsPopup3.classList.remove("dragging")

  if (e.pointerId !== undefined) {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch (err) {}
  }

  document.removeEventListener("pointermove", dragReels3, true)
  document.removeEventListener("pointerup", stopDragging3, true)
}

/* ============================================================================
   KEYBOARD SHORTCUTS
============================================================================ */

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Only trigger if not typing in an input field
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      return
    }

    // Check both e.key and e.code to handle different browsers
    const key = e.key || e.code
    
    // Handle number keys - check both "1" and "Digit1" formats
    if (key === "1" || key === "Digit1") {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      console.log("Key 1 pressed, toggling popup 2. reelsPopup2:", reelsPopup2)
      if (reelsPopup2) {
        togglePopup(reelsPopup2) // iPhone popup (popup 2)
      } else {
        console.error("reelsPopup2 is not defined!")
      }
      return false
    } else if (key === "2" || key === "Digit2") {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      togglePopup(reelsPopup) // Original popup (popup 1)
      return false
    } else if (key === "3" || key === "Digit3") {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      togglePopup(reelsPopup3) // Windows 95 popup (popup 3)
      return false
    } else if (key === "4" || key === "Digit4") {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      playWindowErrorSound()
      createCascadedPopup()
      return false
    } else if (key === "5" || key === "Digit5") {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      createAutoCascade()
      return false
    }
  }, true) // Use capture phase to catch events before other handlers
}

function togglePopup(popup) {
  if (!popup) {
    console.error("togglePopup: popup is null or undefined")
    return
  }
  
  // Toggle visibility using the .active class to work with toggle button
  if (popup.classList.contains('active')) {
    popup.classList.remove('active')
    popup.style.display = 'none'
    console.log("Hiding popup:", popup.id)
  } else {
    popup.classList.add('active')
    popup.style.display = 'flex'
    // Ensure popup is positioned correctly
    popup.style.position = 'fixed'
    // Ensure visibility and z-index
    popup.style.visibility = 'visible'
    popup.style.opacity = '1'
    if (!popup.style.zIndex || parseInt(popup.style.zIndex) < 1000) {
      popup.style.zIndex = '1000'
    }
    // If popup doesn't have explicit inline positioning (preserves user dragging),
    // give it default positioning based on popup type
    const hasInlinePosition = popup.style.left || popup.style.right || popup.style.top || popup.style.bottom
    
    if (!hasInlinePosition) {
      const popupId = popup.id
      if (popupId === 'reels-popup-3') {
        // Popup 3: 50px from left, 150px from top
        popup.style.left = '50px'
        popup.style.top = '150px'
        popup.style.right = 'auto'
        popup.style.bottom = 'auto'
      } else if (popupId === 'reels-popup') {
        // Popup 1: 100px from right, 40% from top
        popup.style.right = '100px'
        popup.style.top = '40%'
        popup.style.left = 'auto'
        popup.style.bottom = 'auto'
      } else if (popupId === 'reels-popup-2') {
        // Popup 2: 40% from left, slightly off page at bottom
        popup.style.left = '40%'
        popup.style.bottom = '-100px'
        popup.style.top = 'auto'
        popup.style.right = 'auto'
      }
      popup.style.transform = 'none'
    }
    console.log("Showing popup:", popup.id, "Display:", popup.style.display, "Active:", popup.classList.contains('active'), "Position:", popup.style.position, "Top:", popup.style.top)
  }
}

/* ============================================================================
   LIKE BUTTON FUNCTIONALITY
============================================================================ */

function setupLikeButtons() {
  // Find all like buttons in all three popups
  const likeButtons = document.querySelectorAll(".like-button")
  
  likeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      toggleLike(button)
    })
  })
}

function toggleLike(button) {
  if (!button) return
  
  const isLiked = button.classList.contains("liked")
  
  if (isLiked) {
    // Unlike - remove the liked class
    button.classList.remove("liked")
  } else {
    // Like - add the liked class with animation
    button.classList.add("liked")
    
    // Reset animation after it completes
    setTimeout(() => {
      const heartIcon = button.querySelector(".heart-icon")
      if (heartIcon) {
        heartIcon.style.animation = "none"
        // Trigger reflow to restart animation on next click
        void heartIcon.offsetWidth
        heartIcon.style.animation = ""
      }
    }, 400)
  }
}

/* ============================================================================
   AUDIO PLAYBACK
============================================================================ */

function playWindowErrorSound() {
  const audio = new Audio("/assets/windows-error.mp3")
  audio.volume = 1.0 // Set volume to 100% (2x from 70%)
  audio.play().catch((error) => {
    console.warn("Could not play windows-error.mp3:", error)
    // Silently fail if file doesn't exist
  })
}

/* ============================================================================
   CASCADING POPUP FUNCTIONALITY
============================================================================ */

function createCascadedPopup() {
  if (!reelsPopup3) {
    console.error("reelsPopup3 not found!")
    return false
  }

  // Get the original popup's position
  const originalRect = reelsPopup3.getBoundingClientRect()
  const popupWidth = originalRect.width || 405
  const popupHeight = originalRect.height || 504
  
  // Calculate cascade offset (30px right, 20px down each time)
  const offsetStepX = 30
  const offsetStepY = 20
  const cascadeIndex = cascadedPopups.length
  const offsetX = offsetStepX * (cascadeIndex + 1)
  const offsetY = offsetStepY * (cascadeIndex + 1)
  
  // Get original position
  const originalStyle = getComputedStyle(reelsPopup3)
  const originalLeft = parseInt(originalStyle.left) || 20
  const originalTop = parseInt(originalStyle.top) || 20
  
  // Calculate new position (cascade bottom-right)
  const newLeft = originalLeft + offsetX
  const newTop = originalTop + offsetY
  
  // Check if popup is completely off screen (not just partially)
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  
  // Stop only if completely off-screen (no part is visible)
  const isCompletelyOffRight = newLeft >= screenWidth
  const isCompletelyOffBottom = newTop >= screenHeight
  const isCompletelyOffLeft = (newLeft + popupWidth) <= 0
  const isCompletelyOffTop = (newTop + popupHeight) <= 0
  
  if (isCompletelyOffRight || isCompletelyOffBottom || isCompletelyOffLeft || isCompletelyOffTop) {
    console.log("Cascade popup would be completely off screen, stopping")
    return false
  }
  
  // Clone the popup
  const clone = reelsPopup3.cloneNode(true)
  const cloneId = `reels-popup-cascade-${cascadeIndex}`
  clone.id = cloneId
  
  // Update container IDs to avoid conflicts
  const containerId = `reels-container-cascade-${cascadeIndex}`
  const actionsId = `reels-actions-cascade-${cascadeIndex}`
  
  const container = clone.querySelector("#reels-container-3")
  const actions = clone.querySelector("#reels-actions-3")
  
  if (container) container.id = containerId
  if (actions) actions.id = actionsId
  
  // Position the clone
  clone.style.position = "fixed"
  clone.style.left = `${newLeft}px`
  clone.style.top = `${newTop}px`
  clone.style.right = "auto"
  clone.style.bottom = "auto"
  clone.style.zIndex = 1000 + cascadeIndex + 1
  
  // Make sure it's visible
  clone.style.display = "flex"
  
  // Append to body
  document.body.appendChild(clone)
  
  // Track the clone
  cascadedPopups.push(clone)
  
  console.log(`Created cascaded popup ${cascadeIndex + 1} at (${newLeft}, ${newTop})`)
  
  // Initialize reels for this clone
  setupCascadeReels(clone, containerId)
  
  // Setup like buttons for the clone
  const likeButtons = clone.querySelectorAll(".like-button")
  likeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      toggleLike(button)
    })
  })
  
  // Add to popup tracking
  allPopups.push(clone)
  
  // Setup click to bring to front
  setupPopupClickToFront(clone)
  
  // Setup dragging for this cascaded popup
  setupCascadeDragging(clone)
  
  // Verify the popup was created
  const createdPopup = document.getElementById(cloneId)
  if (createdPopup) {
    console.log("✅ Cascaded popup successfully created and visible")
    return true
  } else {
    console.error("❌ Failed to create cascaded popup")
    return false
  }
}

/* ============================================================================
   AUTO CASCADE FUNCTIONALITY - Automatically create cascaded popups until off-screen
============================================================================ */

function createAutoCascade() {
  if (!reelsPopup3) {
    console.error("reelsPopup3 not found!")
    return
  }

  // Keep creating cascaded popups until one fails (goes off-screen)
  // Use a small delay between each creation so the sound plays properly
  let cascadeCount = 0
  
  const createNext = () => {
    const popupCountBefore = cascadedPopups.length
    const success = createCascadedPopup()
    const popupCountAfter = cascadedPopups.length
    
    // Play sound if a popup was actually created
    if (popupCountAfter > popupCountBefore) {
      playWindowErrorSound()
      cascadeCount++
      
      // Continue creating more with a small delay
      // The delay ensures sounds play properly and gives a nice cascading effect
      setTimeout(() => {
        createNext()
      }, 150) // 150ms delay between each popup creation
    } else {
      // No popup was created (would be off-screen), stop cascading
      console.log(`Auto cascade complete: created ${cascadeCount} popups`)
    }
  }
  
  // Start the cascade
  createNext()
}

function setupCascadeReels(clone, containerId) {
  const reelsContainer = clone.querySelector(`#${containerId}`)
  if (!reelsContainer || !reelsData) {
    console.error("Could not find container or reelsData")
    return
  }

  // Clear any existing content
  reelsContainer.innerHTML = ""

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
    threshold: 0.5
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector('.reel-video')
      if (!video) return

      if (entry.isIntersecting) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, observerOptions)

  videos.forEach(({ reelItem }) => {
    observer.observe(reelItem)
  })
  
  console.log(`Initialized ${videos.length} reels in cascaded popup`)
}

/* ============================================================================
   Z-INDEX MANAGEMENT AND CLICK TO FRONT
============================================================================ */

function bringToFront(popup) {
  if (!popup) return
  
  // Find the highest current z-index
  let maxZ = 1000
  allPopups.forEach(p => {
    if (p && p !== popup) {
      const z = parseInt(getComputedStyle(p).zIndex) || 1000
      if (z > maxZ) maxZ = z
    }
  })
  
  // Set this popup's z-index higher than the current max
  popup.style.zIndex = (maxZ + 1).toString()
  currentHighestZ = maxZ + 1
}

function setupPopupClickToFront(popup) {
  if (!popup) return
  
  // Add click handler to bring popup to front
  popup.addEventListener("click", (e) => {
    // Only if clicking on the popup itself or non-interactive areas
    // Don't trigger on buttons or interactive elements
    if (e.target.classList.contains("like-button") || 
        e.target.closest(".like-button") ||
        e.target.classList.contains("win95-btn") ||
        e.target.closest(".win95-btn") ||
        e.target.tagName === "VIDEO" ||
        e.target.tagName === "BUTTON") {
      return
    }
    
    bringToFront(popup)
  }, true)
}

/* ============================================================================
   CASCADED POPUP DRAGGING
============================================================================ */

function setupCascadeDragging(clone) {
  if (!clone) return
  
  // Create separate dragging state for this specific popup
  let isDragging = false
  let offsetX = 0
  let offsetY = 0
  
  const startDragging = (e) => {
    if (e.button !== 0 && e.type !== 'touchstart' && e.type !== 'pointerdown') return
    
    // Bring to front when starting to drag
    bringToFront(clone)
    
    isDragging = true
    clone.classList.add("dragging")
    
    const clientX = e.clientX ?? e.touches?.[0]?.clientX
    const clientY = e.clientY ?? e.touches?.[0]?.clientY
    
    const rect = clone.getBoundingClientRect()
    offsetX = clientX - rect.left
    offsetY = clientY - rect.top
    
    clone.style.position = "fixed"
    clone.style.right = "auto"
    clone.style.bottom = "auto"
    
    if (e.pointerId !== undefined) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch (err) {}
    }
    
    e.preventDefault()
    e.stopPropagation()
    
    // Add event listeners
    document.addEventListener("pointermove", dragHandler, true)
    document.addEventListener("pointerup", stopDraggingHandler, true)
    document.addEventListener("mousemove", dragHandler, true)
    document.addEventListener("mouseup", stopDraggingHandler, true)
  }
  
  const dragHandler = (e) => {
    if (!isDragging) return
    
    const clientX = e.clientX ?? e.touches?.[0]?.clientX
    const clientY = e.clientY ?? e.touches?.[0]?.clientY
    
    if (clientX === undefined || clientY === undefined) return
    
    const x = clientX - offsetX
    const y = clientY - offsetY
    
    // Only constrain left and top (prevent negative), allow going off right and bottom
    const constrainedX = Math.max(0, x)
    const constrainedY = Math.max(0, y)
    
    clone.style.left = constrainedX + "px"
    clone.style.top = constrainedY + "px"
    
    e.preventDefault()
  }
  
  const stopDraggingHandler = (e) => {
    if (!isDragging) return
    
    isDragging = false
    clone.classList.remove("dragging")
    
    if (e.pointerId !== undefined && e.currentTarget) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch (err) {}
    }
    
    // Remove event listeners
    document.removeEventListener("pointermove", dragHandler, true)
    document.removeEventListener("pointerup", stopDraggingHandler, true)
    document.removeEventListener("mousemove", dragHandler, true)
    document.removeEventListener("mouseup", stopDraggingHandler, true)
  }
  
  // Set up drag handles (titlebar and menubar)
  const titlebar = clone.querySelector(".win95-titlebar")
  const menubar = clone.querySelector(".win95-menubar")
  
  const setupDragHandle = (dragHandle) => {
    if (!dragHandle) return
    
    dragHandle.addEventListener("pointerdown", startDragging, true)
    dragHandle.addEventListener("mousedown", startDragging, true)
    dragHandle.addEventListener("touchstart", startDragging, true)
    
    dragHandle.style.pointerEvents = 'auto'
    dragHandle.style.cursor = 'grab'
    
    const children = dragHandle.querySelectorAll('*:not(.win95-btn)')
    children.forEach(child => {
      if (!child.classList.contains('win95-btn')) {
        child.style.pointerEvents = 'none'
      }
    })
  }
  
  if (titlebar) setupDragHandle(titlebar)
  if (menubar) setupDragHandle(menubar)
  
  console.log("Drag handlers set up for cascaded popup")
}

/* ============================================================================
   REELS TOGGLE BUTTON - Show/Hide All Reels Simultaneously
   
   MERGE NOTE: This section controls the reels popup behavior
   - Shows all 3 popup styles at once (Instagram, iPhone, Windows 95)
   - Positions them left, center, and right
   - Toggle visibility with one button click
============================================================================ */

function setupReelsToggle() {
  const toggleBtn = document.getElementById('reelsToggleBtn')
  if (!toggleBtn) return

  let reelsVisible = false

  toggleBtn.addEventListener('click', () => {
    if (!reelsVisible) {
      // Show ALL reels popups at once in different positions
      hideAllReels() // Clear any existing state
      
      // Instagram style - Left
      if (reelsPopup) {
        reelsPopup.classList.add('active')
        reelsPopup.style.display = 'flex'
        positionPopup(reelsPopup, 'left')
      }
      
      // iPhone style - Center
      if (reelsPopup2) {
        reelsPopup2.classList.add('active')
        reelsPopup2.style.display = 'flex'
        positionPopup(reelsPopup2, 'center')
      }
      
      // Windows 95 style - Right
      if (reelsPopup3) {
        reelsPopup3.classList.add('active')
        reelsPopup3.style.display = 'flex'
        positionPopup(reelsPopup3, 'right')
      }
      
      // Also show all cascaded popup3s
      cascadedPopups.forEach(clone => {
        if (clone) {
          clone.classList.add('active')
          clone.style.display = 'flex'
        }
      })
      
      reelsVisible = true
      toggleBtn.style.backgroundColor = 'var(--accent-light)'
      toggleBtn.style.borderColor = 'var(--accent-primary)'
    } else {
      // Hide all reels
      hideAllReels()
      reelsVisible = false
      toggleBtn.style.backgroundColor = ''
      toggleBtn.style.borderColor = ''
    }
  })

  // Also allow clicking outside reels to hide them
  document.addEventListener('click', (e) => {
    if (reelsVisible && 
        !reelsPopup?.contains(e.target) && 
        !reelsPopup2?.contains(e.target) && 
        !reelsPopup3?.contains(e.target) &&
        !toggleBtn.contains(e.target) &&
        !cascadedPopups.some(clone => clone?.contains(e.target))) {
      hideAllReels()
      reelsVisible = false
      toggleBtn.style.backgroundColor = ''
      toggleBtn.style.borderColor = ''
    }
  })

  // Add close buttons to each popup
  addCloseButtons()
}

function hideAllReels() {
  if (reelsPopup) {
    reelsPopup.classList.remove('active')
    reelsPopup.style.display = 'none'
  }
  if (reelsPopup2) {
    reelsPopup2.classList.remove('active')
    reelsPopup2.style.display = 'none'
  }
  if (reelsPopup3) {
    reelsPopup3.classList.remove('active')
    reelsPopup3.style.display = 'none'
  }
  // Also hide all cascaded popup3s
  cascadedPopups.forEach(clone => {
    if (clone) {
      clone.classList.remove('active')
      clone.style.display = 'none'
    }
  })
}

function positionPopup(popup, position) {
  if (!popup) return
  
  popup.style.position = 'fixed'
  
  // Determine which popup this is based on position parameter or popup ID
  const popupId = popup.id
  
  if (popupId === 'reels-popup-3' || position === 'right') {
    // Popup 3: 50px from left, 150px from top
    popup.style.left = '50px'
    popup.style.top = '150px'
    popup.style.right = 'auto'
    popup.style.bottom = 'auto'
    popup.style.transform = 'none'
  } else if (popupId === 'reels-popup' || position === 'left') {
    // Popup 1: 100px from right, 40% from top
    popup.style.right = '100px'
    popup.style.top = '40%'
    popup.style.left = 'auto'
    popup.style.bottom = 'auto'
    popup.style.transform = 'none'
  } else if (popupId === 'reels-popup-2' || position === 'center') {
    // Popup 2: 40% from left, slightly off page at bottom
    popup.style.left = '40%'
    popup.style.bottom = '-100px' // Slightly off the page at the bottom
    popup.style.top = 'auto'
    popup.style.right = 'auto'
    popup.style.transform = 'none'
  }
}

function addCloseButtons() {
  // Add close button to each popup's header
  const popups = [
    { popup: reelsPopup, headerSelector: '.reels-top' },
    { popup: reelsPopup2, headerSelector: '.reels-top' },
    { popup: reelsPopup3, headerSelector: '.win95-controls' }
  ]

  popups.forEach(({ popup, headerSelector }) => {
    if (!popup) return
    
    const header = popup.querySelector(headerSelector)
    if (!header) return

    // Check if close button already exists
    if (header.querySelector('.reels-close-btn')) return

    const closeBtn = document.createElement('button')
    closeBtn.className = 'reels-close-btn'
    closeBtn.innerHTML = '×'
    closeBtn.style.pointerEvents = 'auto'
    closeBtn.title = 'Close'
    
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      popup.classList.remove('active')
      popup.style.display = 'none'
      
      const toggleBtn = document.getElementById('reelsToggleBtn')
      if (toggleBtn) {
        // Check if all popups are closed to update toggle button state
        const allClosed = !reelsPopup?.classList.contains('active') && 
                          !reelsPopup2?.classList.contains('active') && 
                          !reelsPopup3?.classList.contains('active')
        if (allClosed) {
          toggleBtn.style.backgroundColor = ''
          toggleBtn.style.borderColor = ''
        }
      }
    })

    if (popup === reelsPopup3) {
      // For Windows 95, replace the × button
      const existingClose = header.querySelector('.win95-close')
      if (existingClose) {
        existingClose.onclick = (e) => {
          e.stopPropagation()
          popup.classList.remove('active')
          popup.style.display = 'none'
          
          const toggleBtn = document.getElementById('reelsToggleBtn')
          if (toggleBtn) {
            // Check if all popups are closed to update toggle button state
            const allClosed = !reelsPopup?.classList.contains('active') && 
                              !reelsPopup2?.classList.contains('active') && 
                              !reelsPopup3?.classList.contains('active')
            if (allClosed) {
              toggleBtn.style.backgroundColor = ''
              toggleBtn.style.borderColor = ''
            }
          }
        }
      }
    } else {
      // For Instagram and iPhone styles, add to header
      header.appendChild(closeBtn)
    }
  })
}
