// Demo lecture data with R2 integration
const lecturesData = [
  {
    id: 1,
    title: "Data Engineering Introduction",
    module: "Data Engineering",
    instructor: "Chris Rogers",
    duration: "45:32",
    thumbnail: "/lecture-1.jpg",
    description: "Introduction to data engineering concepts and methodologies.",
    date: "Nov 15, 2024",
    section: "subscriptions",
    folder: "lectures",
    fileName: "DE Intro.mp4"
  },
  {
    id: 2,
    title: "Neural Networks Deep Dive",
    module: "AI Fundamentals",
    instructor: "Prof. James Wilson",
    duration: "58:15",
    thumbnail: "/neural-networks-visualization.jpg",
    description: "Comprehensive exploration of neural networks, architectures, and training methods.",
    date: "Nov 12, 2024",
    section: "subscriptions",
  },
  {
    id: 3,
    title: "Data Science Best Practices",
    module: "Data Science",
    instructor: "Dr. Maya Patel",
    duration: "52:44",
    thumbnail: "/data-science-dashboard.jpg",
    description: "Industry best practices for data science projects and workflows.",
    date: "Nov 20, 2024",
    section: "subscriptions",
  },
  {
    id: 4,
    title: "Python for Data Analysis",
    module: "Programming",
    instructor: "Alex Rodriguez",
    duration: "63:20",
    thumbnail: "/python-code.png",
    description: "Master Python for data analysis with pandas, numpy, and matplotlib.",
    date: "Nov 18, 2024",
    section: "shared",
  },
  {
    id: 5,
    title: "Web Development Essentials",
    module: "Web Development",
    instructor: "Emma Thompson",
    duration: "47:55",
    thumbnail: "/web-development-interface.jpg",
    description: "Essential concepts and tools for modern web development.",
    date: "Nov 22, 2024",
    section: "shared",
  },
  {
    id: 6,
    title: "Database Design Fundamentals",
    module: "Backend",
    instructor: "Dr. Michael Lee",
    duration: "55:30",
    thumbnail: "/database-schema.png",
    description: "Learn to design efficient and scalable database systems.",
    date: "Nov 24, 2024",
    section: "shared",
  },
  {
    id: 7,
    title: "Cloud Computing with AWS",
    module: "DevOps",
    instructor: "Chris Anderson",
    duration: "61:12",
    thumbnail: "/cloud-computing-infrastructure.jpg",
    description: "Get started with Amazon Web Services and cloud architecture.",
    date: "Nov 25, 2024",
    section: "whats-new",
  },
  {
    id: 8,
    title: "API Design Patterns",
    module: "Backend",
    instructor: "Dr. Lisa Kumar",
    duration: "49:44",
    thumbnail: "/api-rest-architecture.jpg",
    description: "Best practices for designing scalable and maintainable APIs.",
    date: "Nov 26, 2024",
    section: "whats-new",
  },
  {
    id: 9,
    title: "Frontend Performance Optimization",
    module: "Frontend",
    instructor: "Tom Bradley",
    duration: "44:18",
    thumbnail: "/web-performance-metrics.jpg",
    description: "Techniques for optimizing frontend performance and user experience.",
    date: "Nov 27, 2024",
    section: "whats-new",
  },
]

// Sample reel data with R2 integration
const reelsData = [
  { id: 1, video: "/read-file?folder=reels&fileName=AQMLV-yAiIf9wDEIPXQh-5e63gfBAAS5B4S5ggsl0zYoiw2fuhPT2TRYysCPhD9PB3bCAseD2KbD0eu8LmlJl_xLheTXG6ohuo_nWNk.mp4" },
  { id: 2, video: "/read-file?folder=reels&fileName=AQOlVR7tzd9uy_zTqMHNTASjyZ1aH6xRpzUaP2SpTm6V7QcVaKRIWQcfxNCKZJh7SWwkfRTKRpwxnUryw03rT4A7eZLi6FDEydzDWpM.mp4" },
  { id: 3, video: "/read-file?folder=reels&fileName=AQPAklItaWZZA9BfewkclZEZYiQW-FZ8KaRl7EhS8g68gnTykamEsA5P1SyomsubbB6a59coxc5TnfIyjw9a3kJyzIFIfq56r5UH9Fg.mp4" },
]

// Function to load lectures dynamically from R2
async function loadLecturesFromR2() {
  try {
    const response = await fetch('/list-files?folder=lectures');
    const data = await response.json();
    
    if (data.success && data.files) {
      // Filter only video files
      const videoFiles = data.files.filter(file => 
        file.key.endsWith('.mp4') || file.key.endsWith('.webm')
      );
      
      // Add to lecturesData if not already present
      videoFiles.forEach((file, index) => {
        const fileName = file.key.split('/').pop();
        const existingLecture = lecturesData.find(l => l.fileName === fileName);
        
        if (!existingLecture) {
          lecturesData.push({
            id: lecturesData.length + 1,
            title: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
            module: "Uploaded Content",
            instructor: "Unknown",
            duration: "—",
            thumbnail: "/lecture-1.jpg",
            description: "Lecture from R2 storage",
            date: new Date(file.lastModified).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }),
            section: "whats-new",
            folder: "lectures",
            fileName: fileName
          });
        }
      });
    }
  } catch (error) {
    console.error('Error loading lectures from R2:', error);
  }
}

// Load R2 lectures on page load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', loadLecturesFromR2);
}
