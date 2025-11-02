# 📹 Reels Upload Folder

## Instructions

1. **Add your reel videos** to this folder
   - Supported formats: `.mp4`, `.webm`, `.mov`
   - Vertical format recommended (9:16 ratio)
   - Keep file sizes reasonable (< 50MB each)

2. **Run the upload script:**
   ```bash
   cd /Users/michael/Documents/Home/brainrot-panopto
   node admin/bulk-upload-reels.js reels-to-upload
   ```

3. **Script will automatically:**
   - Upload all videos to Cloudflare R2
   - Generate brainrot-themed usernames & descriptions
   - Trigger sync to Minecraft database
   - Store metadata at Y: 64-143 (ground level)

## What Happens

```
Your videos here
    ↓
Upload to R2 (Cloudflare)
    ↓
Auto-sync to Minecraft
    ↓
Appear in reels popup on website!
```

## File Naming

- Any filename works
- Will be sanitized automatically
- Special characters removed
- Spaces replaced with underscores

## Tips

- ✅ Keep videos under 50MB
- ✅ Vertical format (portrait)
- ✅ Short duration (15-60 seconds)
- ✅ Clear audio
- ❌ Don't upload huge files
- ❌ Don't use special characters in filenames

## After Upload

Check your reels at:
- **Website:** http://localhost:3000/viewer.html (click 🎬 button)
- **R2 API:** http://localhost:3001/list-files?folder=reels
- **Minecraft:** http://localhost:3002/mcdb/reels/list

---

**Ready to upload!** Just add your `.mp4` files here and run the script! 🚀

