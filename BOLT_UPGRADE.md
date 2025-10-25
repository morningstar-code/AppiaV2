# Appia Builder - Bolt-Level Environment Upgrade

## 🎯 Overview

The Appia Builder has been upgraded to match Bolt's internal builder capabilities, featuring a full-stack AI IDE that runs actual projects inside the browser using WebContainer, Vite, Monaco Editor, and a persistent virtual file system.

## ✅ Completed Features

### 1️⃣ **Runtime - WebContainer Integration**
- ✅ Integrated `@webcontainer/api` v1.6.0
- ✅ Boot WebContainer on builder load via `useWebContainer` hook
- ✅ Mount virtual file system into WebContainer
- ✅ Execute npm commands (install, dev, build)
- ✅ Pipe stdout/stderr to UI console

**Files:**
- `Frontend/src/hooks/useWebContainer.tsx`
- `Frontend/src/hooks/useWebContainerPreview.ts`

### 2️⃣ **File System - Virtual File Manager**
- ✅ Persistent file tree with IndexedDB (Dexie)
- ✅ Collapsible file tree with folder navigation
- ✅ File type detection with emoji icons
- ✅ Diff tracking for AI changes
- ✅ Real-time sync with WebContainer FS

**Files:**
- `Frontend/src/hooks/useFileSystem.ts`
- `Frontend/src/db/database.ts`
- `Frontend/src/components/bolt/EditorPanel.tsx`

### 3️⃣ **Code Editing - Monaco Editor**
- ✅ Full Monaco Editor integration via `@monaco-editor/react`
- ✅ Syntax highlighting (TSX, JS, HTML, CSS, JSON)
- ✅ Dark theme (`vs-dark`)
- ✅ Line numbering and minimap
- ✅ Multi-file tab management
- ✅ Auto-save on edit

**Files:**
- `Frontend/src/components/CodeEditor.tsx`
- `Frontend/src/components/bolt/EditorPanel.tsx`

### 4️⃣ **Build & Preview - Live Vite Sandbox**
- ✅ Vite dev server in WebContainer
- ✅ Real-time preview iframe with MessageChannel
- ✅ Static HTML fallback for simple projects
- ✅ Hot reload support
- ✅ Console output streaming

**Files:**
- `Frontend/src/hooks/useWebContainerPreview.ts`
- `Frontend/src/components/bolt/PreviewPanel.tsx`

### 5️⃣ **Logs & Feedback - Action Pipeline Console**
- ✅ Build log panel with action count ("3 actions taken")
- ✅ Animated log entries (fade-in, slide-in)
- ✅ Collapsible/expandable UI
- ✅ Terminal output section
- ✅ Build complete indicator with checkmark

**Files:**
- `Frontend/src/components/bolt/BuildLog.tsx`

### 6️⃣ **UI Layout - Three-Pane Resizable Interface**
- ✅ Resizable panels with drag handles
- ✅ Left: Chat + BuildLog (280-600px, default 360px)
- ✅ Center: Monaco Editor + File Tree
- ✅ Right: Live Preview
- ✅ Min/max width constraints
- ✅ Smooth drag experience

**Files:**
- `Frontend/src/components/ResizablePanel.tsx`
- `Frontend/src/pages/BoltBuilder.tsx`

### 7️⃣ **Persistence - IndexedDB Storage**
- ✅ Dexie-powered IndexedDB
- ✅ Persist sessions (messages, files, tokens)
- ✅ Persist file cache separately
- ✅ Auto-restore last session on reload
- ✅ LocalStorage fallback

**Database Schema:**
```typescript
{
  sessions: {
    projectId: string
    lastUpdated: Date
    messages: any[]
    files: any[]
    openTabs: string[]
    selectedFile: string | null
    tokens: { used: number; remaining: number }
  },
  fileCache: {
    path: string (unique)
    content: string
    lastModified: Date
    projectId: string
  }
}
```

**Files:**
- `Frontend/src/db/database.ts`
- `Frontend/src/hooks/usePersistence.ts`

### 8️⃣ **Shortcuts & Commands**
- ✅ ⌘/Ctrl + Enter → Rebuild project
- ✅ ⌘/Ctrl + K → Clear chat
- ✅ ⌘/Ctrl + S → Save file (logged)
- ✅ Visual hints in UI (Rebuild button tooltip)

**Files:**
- `Frontend/src/hooks/useKeyboardShortcuts.ts`

### 9️⃣ **UI Polish**
- ✅ Smooth scrolling globally (`scroll-behavior: smooth`)
- ✅ Custom dark scrollbars
- ✅ Slide-in/fade-in animations
- ✅ Consistent dark theme (#18181B, #1E1E1E, #27272A)
- ✅ Focus states for accessibility
- ✅ Transition animations on interactive elements

**Files:**
- `Frontend/src/index.css`

---

## 🗂️ Project Structure

```
Bolt-Clone-main/
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── bolt/
│   │   │   │   ├── BoltBuilder.tsx      # Main builder component
│   │   │   │   ├── ChatPanel.tsx        # Chat interface
│   │   │   │   ├── EditorPanel.tsx      # Monaco + File Tree
│   │   │   │   ├── PreviewPanel.tsx     # Iframe preview
│   │   │   │   └── BuildLog.tsx         # Action log console
│   │   │   ├── CodeEditor.tsx           # Monaco wrapper
│   │   │   └── ResizablePanel.tsx       # Drag-to-resize panels
│   │   ├── hooks/
│   │   │   ├── useWebContainer.tsx      # WebContainer boot
│   │   │   ├── useWebContainerPreview.ts # Build & preview
│   │   │   ├── useFileSystem.ts         # File state management
│   │   │   ├── usePersistence.ts        # IndexedDB operations
│   │   │   └── useKeyboardShortcuts.ts  # Global shortcuts
│   │   ├── db/
│   │   │   └── database.ts              # Dexie schema
│   │   ├── pages/
│   │   │   └── BoltBuilder.tsx          # Main page
│   │   └── index.css                    # Global styles
│   └── package.json
└── BOLT_UPGRADE.md                      # This file
```

---

## 🚀 Usage

### Running the Builder

```bash
cd Frontend
npm install
npm run dev
```

Visit `http://localhost:5173/builder` to access the upgraded builder.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘/Ctrl + Enter | Rebuild project |
| ⌘/Ctrl + K | Clear chat history |
| ⌘/Ctrl + S | Save current file |

### Resizing Panels

- Hover over panel borders to reveal resize handles
- Drag to adjust width (respects min/max constraints)
- Chat panel: 280-600px
- Editor panel: 400px - 60% of screen

---

## 🧪 Testing

### Test WebContainer
1. Chat: "Create a React app with Vite"
2. Wait for files to appear in the file tree
3. Check build logs for "3 actions taken"
4. Verify preview shows the app
5. Edit a file in Monaco
6. Press ⌘+Enter to rebuild
7. Confirm changes appear in preview

### Test Persistence
1. Create files and chat
2. Refresh the page
3. Verify chat history and files are restored
4. Check IndexedDB in DevTools → Application → Storage

### Test Resizing
1. Drag the chat panel border left/right
2. Drag the editor panel border left/right
3. Verify smooth resize with min/max constraints

---

## 📦 Dependencies Added

```json
{
  "@webcontainer/api": "^1.6.0",
  "@monaco-editor/react": "^4.7.0",
  "dexie": "^4.0.0",
  "lucide-react": "^0.503.0"
}
```

---

## 🎨 Design Tokens

```css
/* Background Colors */
--bg-primary: #18181B
--bg-secondary: #1E1E1E
--bg-tertiary: #09090B

/* Border Colors */
--border: #27272A
--border-hover: #3F3F46

/* Accent Colors */
--accent-blue: #3B82F6
--accent-purple: #A855F7
--accent-green: #10B981

/* Text Colors */
--text-primary: #F9FAFB
--text-secondary: #D1D5DB
--text-tertiary: #9CA3AF
```

---

## 🔧 Advanced Features (Optional - Not Yet Implemented)

These are additional features mentioned in the original spec but not critical for the MVP:

- [ ] **Diff Viewer**: Visual diffs for AI changes with accept/reject
- [ ] **Mini Terminal**: Interactive REPL for npm commands
- [ ] **Deploy Button**: Export WebContainer tarball + upload to CDN
- [ ] **Framework Detection**: Auto-detect React/Vue/Svelte from package.json
- [ ] **Hot Reload Indicator**: Show when dev server reloads
- [ ] **Search Files**: ⌘+P to fuzzy search files

---

## 📝 Notes

### WebContainer Limitations
- Requires HTTPS or localhost
- Uses Cross-Origin-Embedder-Policy: credentialless
- Works in Chrome/Edge (modern versions)
- May not work in Safari/Firefox without flags

### Performance
- IndexedDB operations are async (use `await`)
- Large file trees may slow down rendering
- WebContainer boot takes ~2-3 seconds

### Fallbacks
- If WebContainer fails, falls back to static HTML preview
- If IndexedDB fails, falls back to localStorage
- If Monaco fails to load, shows plain textarea

---

## 🙌 Credits

Inspired by [Bolt.new](https://bolt.new) and [StackBlitz WebContainer](https://webcontainer.io/).

Built with:
- React 19
- TypeScript 5.7
- Tailwind CSS 4.1
- Vite 6.3
- Monaco Editor 4.7
- WebContainer API 1.6
- Dexie 4.0

---

## 📄 License

See main repository LICENSE file.
