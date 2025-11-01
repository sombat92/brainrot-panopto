function GetVideo(folder, fileName) {
    try {
        const videoSource = document.getElementById('videoSource');
        const videoPlayer = document.getElementById('videoPlayer');
        
        // Set the src attribute to our server endpoint
        videoSource.src = `/read-file?folder=${folder}&fileName=${fileName}`;
        
        // Tell the video player to load the new source
        videoPlayer.load();
    } catch(err) {
        console.log("Error sending GET reqeust:", err);
    } 
}