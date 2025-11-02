# �� Notes Panel Layout Update

## Change Made

Moved the **Notes panel** from full-height left side to **bottom left quadrant**.

### Before:
```
┌─────────────┬──────────────────────┐
│   NOTES     │   Video Player       │
│   (Full     │                      │
│   Height)   │   Controls           │
│             │                      │
│             │                      │
└─────────────┴──────────────────────┘
```

### After:
```
┌─────────────┬──────────────────────┐
│  Sidebar    │   Video Player       │
│  Details    │                      │
│  Contents   │   Controls           │
│  Captions   │                      │
├─────────────┤                      │
│   NOTES     │                      │
│  (Bottom)   │                      │
└─────────────┴──────────────────────┘
```

## Layout Structure

### HTML:
```html
<div class="viewer-main">
  <!-- Left Column -->
  <div class="viewer-left-column">
    <!-- Sidebar (Top) -->
    <aside class="viewer-sidebar">
      <!-- Details/Contents/Captions tabs -->
    </aside>
    
    <!-- Notes (Bottom) -->
    <aside class="notes-panel">
      <!-- Notes textarea -->
    </aside>
  </div>
  
  <!-- Main Content (Right) -->
  <main class="viewer-main-content">
    <!-- Video player -->
  </main>
</div>
```

### CSS:
```css
.viewer-left-column {
  width: 280px;
  display: flex;
  flex-direction: column;  /* Vertical stack */
}

.viewer-sidebar {
  flex: 1;  /* Takes available space */
  overflow: auto;
}

.notes-panel {
  min-height: 250px;
  max-height: 400px;
  border-top: 1px solid var(--border-color);
}
```

## Benefits

1. **Better Screen Usage** - Sidebar content (Details/Contents) more visible
2. **Notes Still Accessible** - Always visible in bottom left
3. **More Video Space** - Video player gets more horizontal space
4. **Logical Grouping** - Left column contains all metadata/notes
5. **Responsive** - Adjusts on smaller screens

## Auto-Save Still Works

Notes still auto-save to Minecraft (Y: 201-250) every 2 seconds as before!

---

**Result:** Notes are now in the bottom left quadrant, below the sidebar! ✅
