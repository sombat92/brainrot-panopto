function GetVideo(source, player, folder, fileName) {
    try {
        // Backend API URL (must match the one in data.js)
        const API_BASE_URL = 'http://localhost:3001';
        
        // Set the src attribute to our backend API endpoint
        source.src = `${API_BASE_URL}/read-file?folder=${folder}&fileName=${fileName}`;
        
        // Tell the video player to load the new source
        player.load();
    } catch(err) {
        console.log("Error sending GET request:", err);
    } 
}