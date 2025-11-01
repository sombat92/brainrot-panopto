function GetVideo(source, player, folder, fileName) {
    try {        
        // Set the src attribute to our server endpoint
        source.src = `/read-file?folder=${folder}&fileName=${fileName}`;
        
        // Tell the video player to load the new source
        player.load();
    } catch(err) {
        console.log("Error sending GET reqeust:", err);
    } 
}