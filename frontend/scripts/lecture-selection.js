// DOM Elements
const searchInput = document.getElementById("searchInput")
const navItems = document.querySelectorAll(".nav-item")
const template = document.getElementById("lecture-card-template")

// State
let currentSection = "home"
let filteredLectures = []

// Data
const lecturesData = [
  // Example lecture data
  {
    title: "Introduction to JavaScript",
    duration: "1h 30m",
    module: "Web Development",
    instructor: "John Doe",
    thumbnail: "js-thumbnail.jpg",
    section: "subscriptions",
  },
  {
    title: "Advanced CSS Techniques",
    duration: "2h",
    module: "Web Design",
    instructor: "Jane Smith",
    thumbnail: "css-thumbnail.jpg",
    section: "shared",
  },
  {
    title: "Machine Learning Basics",
    duration: "1h 45m",
    module: "Data Science",
    instructor: "Alice Johnson",
    thumbnail: "ml-thumbnail.jpg",
    section: "whats-new",
  },
  // More lecture data can be added here
]

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  filteredLectures = lecturesData
  renderLectures()
  setupEventListeners()
  setupThumbnailClickHandlers()
})

// Setup event listeners
function setupEventListeners() {
  searchInput.addEventListener("input", handleSearch)

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault()
      const section = item.dataset.section
      setActiveNav(item)
      currentSection = section
      renderLectures()
    })
  })
}

// Handle search
function handleSearch(e) {
  const query = e.target.value.toLowerCase()
  filteredLectures = lecturesData.filter((lecture) => lecture.title.toLowerCase().includes(query))
  renderLectures()
}

// Set active navigation item
function setActiveNav(item) {
  navItems.forEach((nav) => nav.classList.remove("active"))
  item.classList.add("active")
}

// Render lectures
function renderLectures() {
  // Render subscriptions
  const subscriptionsLectures = lecturesData.filter((l) => l.section === "subscriptions")
  renderSection("subscriptions-grid", subscriptionsLectures)

  // Render shared
  const sharedLectures = lecturesData.filter((l) => l.section === "shared")
  renderSection("shared-grid", sharedLectures)

  // What's new section is populated directly in HTML, skip rendering
}

// Render a specific section
function renderSection(gridId, lectures) {
  const grid = document.getElementById(gridId)
  grid.innerHTML = ""

  lectures.forEach((lecture) => {
    const card = template.content.cloneNode(true)

    card.querySelector(".thumbnail-img").src = lecture.thumbnail
    card.querySelector(".thumbnail-img").alt = lecture.title
    card.querySelector(".duration-badge").textContent = lecture.duration
    card.querySelector(".lecture-title").textContent = lecture.title
    card.querySelector(".lecture-module").textContent = lecture.module

    const lectureCard = card.querySelector(".lecture-card")
    lectureCard.addEventListener("click", () => goToViewer(lecture))

    grid.appendChild(card)
  })
}

// Navigate to viewer
function goToViewer(lecture) {
  sessionStorage.setItem("currentLecture", JSON.stringify(lecture))
  window.location.href = "/viewer.html"
}

// Setup thumbnail click handlers
function setupThumbnailClickHandlers() {
  // Use a small delay to ensure DOM is fully ready
  setTimeout(() => {
    const thumbnailItems = document.querySelectorAll("#whats-new-grid .thumbnail-item")
    
    console.log("Found thumbnail items:", thumbnailItems.length)
    
    thumbnailItems.forEach((item, index) => {
      // tn5 is the 5th thumbnail (index 4, since arrays are 0-indexed)
      if (index === 4) {
        // Add click handler to both the container and the image
        const clickHandler = (e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log("tn5 clicked, navigating to viewer")
          window.location.href = "/viewer.html"
          return false
        }
        
        item.addEventListener("click", clickHandler)
        
        // Also add to the image inside
        const img = item.querySelector("img")
        if (img) {
          img.style.cursor = "pointer"
          img.addEventListener("click", clickHandler)
        }
        
        console.log("Click handler added to thumbnail", index + 1)
      }
    })
  }, 100)
}
