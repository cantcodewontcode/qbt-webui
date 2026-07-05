# qBittorrent Web UI — QA Test Script

Work through each section in order. For each test: perform the action, note pass/fail,
and leave a comment on fit and finish. Space is provided after each section.

Use `[ ]` → `[x]` to mark pass, `[!]` to mark fail, `[~]` to mark partial/acceptable.

---

## 1. Page Load

- [ ] Page loads without console errors (open DevTools → Console before loading)
- [ ] Fonts render correctly (Instrument Sans for UI, JetBrains Mono for data values)
- [ ] Connection status dot visible in toolbar (top-left, next to "qBittorrent")
- [ ] Torrent list populates within 3 seconds
- [ ] Sidebar filter counts appear and match list

**Fit and finish comments:**

```
(your notes here)
```

---

## 2. Toolbar

### 2a. Layout
- [ ] App name "qBittorrent" and connection dot visible top-left
- [ ] Filter torrents search bar centred
- [ ] Speed readouts, divider, Log, Settings, Add Torrent buttons on the right
- [ ] Nothing overflows or clips at default window size

### 2b. Connection Status Dot
- [ ] Dot is visible and a neutral/green colour when connected
- [ ] Hover tooltip reads "Connected"

### 2c. Download / Upload Speed Readouts
- [ ] Values update every ~3 seconds
- [ ] Active transfer shows copper (↓) or green (↑) colour
- [ ] Zero speed shows in secondary/dimmed colour
- [ ] Click ↓ button → speed popover opens below it
- [ ] Click ↑ button → same popover opens (same popover, caret over clicked button)
- [ ] Click same button again → popover closes (toggle)
- [ ] Click outside popover → popover closes
- [ ] Press Escape → popover closes

**Speed Popover:**
- [ ] Download limit row: toggle + Mbps input appears when toggled on
- [ ] Upload limit row: same behaviour
- [ ] Alternative speeds row: toggle + ↓/↑ inputs appear when toggled on
- [ ] Schedule sub-section appears when Schedule toggled on
- [ ] Schedule: day checkboxes (Su Mo Tu We Th Fr Sa) selectable
- [ ] Schedule: From/To time pickers work
- [ ] All changes save immediately (no Apply button needed) — reopen popover to confirm
- [ ] Turning off a limit (toggle off) removes it — reopen to confirm value gone

### 2d. Alt Speed Indicator (moon icon)
- [ ] Moon icon is NOT visible when alt speed is off
- [ ] Enable alt speed in official qBittorrent UI → amber moon icon appears within 3s
- [ ] Moon icon has amber background highlight (not just a plain icon)
- [ ] Hover over moon → slightly deeper amber background
- [ ] Click moon → small popover appears explaining alt speed is active
- [ ] Popover has "Disable" button
- [ ] Click Disable → icon disappears, alt speed confirmed off in official UI
- [ ] Click outside popover → dismisses without disabling

### 2e. Log Button
- [ ] Click Log button → Log panel opens on the right
- [ ] Log button click again → (no toggle, log stays open — close via X)
- [ ] Log has entries with timestamps, type labels, messages
- [ ] Info / Warning / Critical colour coding present
- [ ] Refresh button (↻) reloads log entries
- [ ] X button closes log panel

### 2f. Settings Button
- [ ] Click Settings → Settings panel opens (covered in §7)
- [ ] Click Settings again → panel closes

### 2g. Add Torrent Button
- [ ] Click "Add Torrent" → Add panel opens on the right (covered in §8)

**Fit and finish comments:**

```
(your notes here)
```

---

## 3. Filter Torrents Search Bar

- [ ] Placeholder text "Filter torrents…" visible
- [ ] No X button visible at rest
- [ ] No hover effect where X would be (empty area right of input)
- [ ] Type a term → list filters in real time (200ms debounce)
- [ ] X button appears when text is present
- [ ] Hover over X → small tight grey box appears (not oversized)
- [ ] Click X → search clears, list resets, X disappears, input refocused
- [ ] Press Escape while typing → does NOT clear search (Escape is for inspector/panels)
- [ ] Search is case-insensitive

**Fit and finish comments:**

```
(your notes here)
```

---

## 4. Sidebar

### 4a. Filter Tabs
- [ ] "All" tab always visible
- [ ] Other tabs (Downloading, Seeding, Paused, etc.) only appear when count > 0
- [ ] Active tab has left accent border and copper/accent colour
- [ ] Counts update every ~3 seconds
- [ ] Click a tab → list filters to that state
- [ ] Click "All" → full list restored

### 4b. Categories
- [ ] If any categories exist, they appear below the filter tabs with a divider
- [ ] Click a category → list filters to that category
- [ ] Click same category again → filter cleared

**Fit and finish comments:**

```
(your notes here)
```

---

## 5. Torrent List

### 5a. Column Headers
- [ ] Name, Size, ↓, ↑, Peers, Ratio, ETA, % columns present
- [ ] Click a column header → list sorts by that column
- [ ] Click same header again → sort reverses
- [ ] Sort direction indicator (arrow) visible on active sort column

### 5b. Torrent Rows
For a downloading torrent:
- [ ] Name displayed (first line)
- [ ] Progress bar visible and accurate
- [ ] Sub-line shows "Downloading from N of M peers"
- [ ] State badge present (e.g. "Downloading")
- [ ] Size, ↓ speed, ↑ speed, Peers, Ratio, ETA, % values correct

For a seeding torrent:
- [ ] Sub-line shows "Seeding to N of M peers"
- [ ] State badge shows "Seeding"
- [ ] ETA shows seeding time estimate or "—"

For a stalled torrent:
- [ ] Sub-line shows "N peers, no transfer" or appropriate
- [ ] State badge shows "Stalled"

For a paused torrent:
- [ ] State badge shows "Paused"
- [ ] No speed values shown

For a super-seeding torrent with peers:
- [ ] Sub-line shows "Super Seeding to N of M peers" with icon
- [ ] State badge shows "Seeding"

For a super-seeding torrent stalled (no peers):
- [ ] Sub-line shows "Super Seeding" (icon only, no peer counts)

For a torrent with missing files:
- [ ] State badge shows "Missing files" (not "Error")

### 5c. Row Selection
- [ ] Single click → selects row (highlighted)
- [ ] Click another row → deselects previous, selects new
- [ ] Cmd+click → adds to selection
- [ ] Shift+click → range selects
- [ ] Cmd+A → selects all torrents
- [ ] Double-click → opens inspector for that torrent

### 5d. Keyboard Navigation
- [ ] Tab/arrows navigate between rows (if implemented)
- [ ] Enter or I → opens/closes inspector for selected torrent
- [ ] Escape → closes inspector if open

**Fit and finish comments:**

```
(your notes here)
```

---

## 6. Context Menu

Right-click a torrent to open:

- [ ] Context menu appears near cursor
- [ ] Menu does not overflow screen edges (test near right/bottom edges)
- [ ] Click outside → closes menu
- [ ] Press Escape → closes menu
- [ ] Arrow keys navigate items
- [ ] Enter activates focused item

**Items to test (single torrent):**

For a paused torrent:
- [ ] "Start / Resume" appears → click → torrent starts, menu closes
- [ ] "Force Start" appears → click → torrent force-starts
- [ ] "Pause" does NOT appear (already paused)

For an active torrent:
- [ ] "Pause" appears → click → torrent pauses
- [ ] "Start / Resume" does NOT appear

All torrents:
- [ ] "Show Details" → opens inspector on that torrent (or does nothing if already showing)
- [ ] "Verify Local Data" → triggers verify, forceRefresh follows
- [ ] "Reannounce" → triggers reannounce
- [ ] "Set Seed Ratio…" → opens Set Seed Ratio modal (§9b)
- [ ] "Set Location…" → opens Set Location modal (§9c)
- [ ] "Rename…" → opens Rename modal (§9d) — disabled for multi-select
- [ ] "Remove Torrent" → opens Remove Confirmation modal (§9a)

For a seeding torrent:
- [ ] "Start Super Seeding" appears → click → super seeding enabled
- [ ] "Stop Super Seeding" replaces it when active

Queue (if queuing enabled in Settings):
- [ ] "Move to Top", "Move Up", "Move Down", "Move to Bottom" visible
- [ ] "Queue Priority" submenu → hover reveals High / Low options
- [ ] Queue Priority → High → force-starts torrent
- [ ] Queue Priority → Low → moves to bottom

**Multi-select (Cmd+click two torrents, then right-click):**
- [ ] Appropriate Start/Pause/Resume items based on mixed state
- [ ] "Rename…" is greyed out
- [ ] Remove acts on all selected

**Fit and finish comments:**

```
(your notes here)
```

---

## 7. Settings Panel

Open via toolbar Settings button (⚙):

- [ ] Panel slides open on the right
- [ ] Section dropdown present ("Speed", "Downloads", "Seeding", "Peers", "Queue", "Interface", "About")
- [ ] X button closes panel
- [ ] Escape key closes panel
- [ ] Opening Settings while inspector is open → inspector closes, settings opens

### 7a. Speed Section
- [ ] Download limit toggle + Mbps input — toggle on, set value, click away → saved
- [ ] Upload limit toggle + same behaviour
- [ ] Enable alternative speeds toggle → reveals alt ↓/↑ inputs
- [ ] Alt speed ↓ and ↑ values editable and saved on blur
- [ ] Use scheduled times toggle → reveals day/time fields
- [ ] Day checkboxes selectable individually
- [ ] From/To time pickers work and save on blur

### 7b. Downloads Section
- [ ] Download folder path editable, saves on blur
- [ ] Incomplete folder toggle + path field
- [ ] "Start torrents when added" toggle
- [ ] "Delete .torrent files after adding" toggle

### 7c. Seeding Section
- [ ] Stop seeding at ratio toggle + ratio input
- [ ] Stop if idle for N minutes toggle + input
- [ ] "When reached" dropdown (Pause / Remove)

### 7d. Peers Section
- [ ] Listening port editable
- [ ] Random port on startup toggle
- [ ] UPnP/NAT-PMP toggle
- [ ] Note about port test visible
- [ ] DHT toggle with ⓘ tooltip
- [ ] PeX toggle with ⓘ tooltip
- [ ] LSD toggle with ⓘ tooltip
- [ ] Encryption dropdown (Prefer / Require / Allow)
- [ ] Max connections global + per torrent
- [ ] Max upload slots global + per torrent

### 7e. Queue Section
- [ ] Enable queuing toggle
- [ ] Max active downloads/uploads/torrents inputs
- [ ] Do not count slow torrents toggle

### 7f. Interface Section
- [ ] Refresh rate info displayed (3s active / 30s idle)

### 7g. About Section
- [ ] qBittorrent version shown
- [ ] Web API version shown
- [ ] Qt / libtorrent / OpenSSL versions shown

**Fit and finish comments:**

```
(your notes here)
```

---

## 8. Add Torrent Panel

Open via "Add Torrent" button:

- [ ] Panel opens on the right
- [ ] Dropzone visible with file icon and label
- [ ] "or" divider below dropzone
- [ ] Magnet link / URL textarea below divider
- [ ] "Download to" path field pre-filled with default save path
- [ ] Cancel and Add buttons in footer
- [ ] Add button is greyed out (disabled) at rest

### 8a. Add via .torrent file
- [ ] Click dropzone → file picker opens, accepts .torrent only
- [ ] Drag a .torrent file onto dropzone → accepted
- [ ] Filename appears below dropzone after selection
- [ ] Add button becomes enabled
- [ ] Change the "Download to" path
- [ ] Click Add → spinner shows briefly → panel closes → toast "Torrent added"
- [ ] Torrent appears in list within 3 seconds

### 8b. Add via magnet link
- [ ] Paste a magnet link into the textarea
- [ ] Add button becomes enabled
- [ ] Click Add → panel closes → toast "Torrent added"
- [ ] Torrent appears in list (may show as "Fetching" briefly)

### 8c. Panel behaviour
- [ ] Click Cancel → panel closes, fields reset
- [ ] Click X → same as Cancel
- [ ] Open Add panel while inspector is open → inspector closes
- [ ] Re-open Add panel → magnet field is empty, dropzone reset

**Fit and finish comments:**

```
(your notes here)
```

---

## 9. Modals

### 9a. Remove Confirmation
Trigger via right-click → Remove Torrent:
- [ ] Modal appears centred over the UI
- [ ] Title reads "Remove torrent?"
- [ ] Description names the torrent(s)
- [ ] "Also delete downloaded data from disk" checkbox present and unchecked by default
- [ ] Cancel → modal closes, nothing happens
- [ ] Remove (without checkbox) → torrent removed from list, data kept
- [ ] Remove (with checkbox checked) → torrent and data removed

### 9b. Set Seed Ratio
Trigger via right-click → Set Seed Ratio…:
- [ ] Modal opens with "Ratio limit" and "Seeding time" dropdowns
- [ ] Ratio dropdown: "Use global setting", "Stop seeding at ratio", "Seed regardless"
- [ ] "Stop seeding at ratio" → ratio input appears
- [ ] Seeding time dropdown: "Use global setting", "No limit", "Stop after…"
- [ ] "Stop after…" → minutes input appears
- [ ] Cancel → closes, no change
- [ ] Apply → saves, modal closes

### 9c. Set Location
Trigger via right-click → Set Location…:
- [ ] Modal opens with current path pre-filled
- [ ] Edit path
- [ ] Cancel → no change
- [ ] Set Location → path updated, data moved (confirm in official UI)

### 9d. Rename
Trigger via right-click → Rename… (single torrent only):
- [ ] Modal opens with current name pre-filled
- [ ] Edit name
- [ ] Cancel → no change
- [ ] Rename → name updated in list

**Fit and finish comments:**

```
(your notes here)
```

---

## 10. Inspector Panel

Double-click a torrent, or right-click → Show Details:

- [ ] Panel opens on the right
- [ ] Title bar shows torrent name
- [ ] X button closes panel
- [ ] Escape closes panel
- [ ] Inspector open → double-click same torrent → nothing changes (no re-animation)
- [ ] Inspector open → double-click different torrent → switches to that torrent

### 10a. General Tab
- [ ] Name, State, Size, Progress, Remaining, Downloaded, Uploaded, Ratio
- [ ] Download speed, Upload speed, ETA
- [ ] Location (path without torrent subfolder)
- [ ] Added, Completed dates
- [ ] Hash (monospaced)
- [ ] Availability, Pieces, Wasted
- [ ] Active time, Last active, Seeding time
- [ ] Connections, Peers (swarm counts)
- [ ] Tracker, Trackers count
- [ ] Magnet "Copy link" button (if magnet available)
- [ ] Speed limits section: download/upload limit checkboxes + Mbps inputs
- [ ] Seeding section: ratio mode dropdown + ratio input
- [ ] All controls save immediately on change

### 10b. Files Tab
- [ ] File list appears with name, size, progress %
- [ ] Priority dropdown per file, right-aligned in meta row
- [ ] Priority dropdown: Maximum, High, Normal, Skip
- [ ] Change priority → saves immediately
- [ ] Search bar at top of files list
- [ ] Type in search → files filter in real time
- [ ] X appears when typing, clears on click
- [ ] Hover over X → small grey box (not oversized)
- [ ] Typing does NOT lose focus mid-type (critical)
- [ ] Cmd+A while in search field → selects all text (does NOT deselect)
- [ ] File row click → selects file (highlighted)
- [ ] Cmd+click → multi-select files
- [ ] Shift+click → range select files
- [ ] Change priority with multiple files selected → applies to all selected
- [ ] Poll cycle (every 3s) does NOT reset search or steal focus
- [ ] Switch to another inspector tab → search cleared on return (fresh render)

### 10c. Peers Tab
- [ ] Peer list shows IP:port, client, flags, connection type, country
- [ ] Stats: ↓ speed, ↑ speed, % have, % relevant
- [ ] Flags cell has tooltip on hover (flag descriptions)
- [ ] Updates every 3s automatically
- [ ] Switching to Peers tab fetches fresh data immediately (not stale)

### 10d. Trackers Tab
- [ ] Tracker URLs listed
- [ ] Status: Working (green), Error (red), other (neutral)
- [ ] Seeds↑, Leeches↓, Completed counts
- [ ] Tracker message shown if present
- [ ] Special entries (**DHT**, **PeX**, **LSD**) styled distinctly
- [ ] "Reannounce all" button → triggers reannounce
- [ ] Updates every 3s automatically

**Fit and finish comments:**

```
(your notes here)
```

---

## 11. Panel Interactions (Right Panel Exclusivity)

These test that only one right panel is ever open at a time:

- [ ] Open Inspector → open Settings → Inspector closes, Settings opens
- [ ] Open Settings → open Add Torrent → Settings closes, Add opens
- [ ] Open Add Torrent → double-click a torrent → Add closes, Inspector opens
- [ ] Open Log → open Inspector → Log closes, Inspector opens
- [ ] Close any panel → right panel width collapses fully
- [ ] Escape with Inspector open → Inspector closes
- [ ] Escape with Settings open → Settings closes
- [ ] Escape with no panel open → nothing happens / no error

**Fit and finish comments:**

```
(your notes here)
```

---

## 12. Overall Fit and Finish

Rate each on a 1–5 scale or leave comments:

**Typography:**
```
(your notes here)
```

**Colour / theming:**
```
(your notes here)
```

**Spacing and layout:**
```
(your notes here)
```

**Motion / transitions:**
```
(your notes here)
```

**Data formatting (speeds, sizes, dates, durations):**
```
(your notes here)
```

**Responsiveness to window resize:**
```
(your notes here)
```

**Anything that feels off, ugly, or inconsistent:**
```
(your notes here)
```

---

*Generated against source as of the current working state. Update after each significant change.*
