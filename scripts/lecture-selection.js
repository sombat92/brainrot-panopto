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

  // Render what's new
  const newLectures = lecturesData.filter((l) => l.section === "whats-new")
  renderSection("whats-new-grid", newLectures)
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
