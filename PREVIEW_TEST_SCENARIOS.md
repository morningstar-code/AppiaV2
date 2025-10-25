# Preview Test Scenarios

## ✅ All Scenarios Should Work Now

### Scenario 1: Simple HTML Project ✅
**Prompt:** "create a blue button"

**Expected AI Output:**
- `index.html` (with button markup)
- `styles.css` (with blue button styles)

**Frontend Flow:**
1. Detects no `package.json` → Skip WebContainer
2. Combines HTML + CSS into single document
3. Creates instant data URL preview
4. Sets `buildStatus = 'ready'`

**Result:** ✅ Instant preview in iframe (no build time)

---

### Scenario 2: Complex Web Project ✅
**Prompt:** "create a React todo app with Tailwind"

**Expected AI Output:**
- `package.json` (with react, vite, tailwind deps)
- `index.html`
- `src/App.tsx`
- `src/index.css`
- `tailwind.config.js`
- `vite.config.ts`

**Frontend Flow:**
1. Detects `package.json` → Use WebContainer
2. Writes all files to WebContainer
3. Runs `npm install` (shows "Installing..." status)
4. Runs `npm run dev` (shows "Building..." status)
5. WebContainer fires `server-ready` event
6. Sets `previewUrl` to WebContainer URL
7. Sets `buildStatus = 'ready'`

**Result:** ✅ Preview shows after ~10-30s build time

---

### Scenario 3: Mobile App with Web Preview ✅
**Prompt 1:** "create a blue button"  
**Prompt 2:** "make this a clicking iOS game"

**Expected AI Output:**
React Native files:
- `app.json`
- `package.json` (expo, react-native)
- `App.tsx` (TouchableOpacity with score)

Web preview files:
- `web-preview/index.html`
- `web-preview/package.json` (react, vite)
- `web-preview/src/App.tsx` (same game with web button)

**Frontend Flow:**
1. Detects `app.json` → React Native project
2. Extracts all `web-preview/*` files
3. Strips `web-preview/` prefix
4. Detects `package.json` in web-preview
5. Uses WebContainer for web-preview build
6. Runs npm install + dev server
7. Shows preview of web version
8. Publishes native code to Expo Snack (background)

**Result:** ✅ Web game preview in browser + Expo Snack URL for mobile testing

---

### Scenario 4: Mobile App WITHOUT Web Preview ⚠️
**Prompt:** "create a Tinder clone" (if AI forgets web-preview)

**Expected AI Output:**
- `app.json`
- `App.tsx`
- (missing web-preview folder)

**Frontend Flow:**
1. Detects React Native
2. Looks for `web-preview/` files
3. Finds **none**
4. Shows helpful error message:
   - "📱 React Native Project Detected"
   - "Cannot run in browser"
   - "Try Expo Go app"

**Result:** ⚠️ Helpful error (prevents blank screen)

---

## Key Changes Made

### Backend (prompts.ts)
✅ Added concrete file structure examples for mobile apps  
✅ Added "HTML → iOS game" transformation example  
✅ Emphasized ALWAYS generating web-preview/ for mobile  
✅ Clarified web-preview must be standalone React+Vite project

### Frontend (NewBuilder.tsx)
✅ Skip WebContainer for simple HTML (instant data URL)  
✅ Only use WebContainer for projects with package.json  
✅ Set `buildStatus='ready'` when data URL is created  
✅ Show helpful error when React Native has no web-preview  
✅ Handle web-preview extraction and prefix stripping

---

## Testing Commands

```bash
# Start frontend
cd /Users/diegocuervo/Downloads/Bolt-Clone-main/Frontend
npm run dev

# Start backend (separate terminal)
cd /Users/diegocuervo/Downloads/Bolt-Clone-main/Backend
npm run dev
```

Test prompts in order:
1. "create a blue button" → Should show instantly
2. "make this a clicking iOS game" → Should build web preview + Expo Snack
3. "add a score counter and animation" → Should update preview

---

## Architecture Summary

```
Simple HTML
  ├─ index.html + styles.css
  └─ Data URL → Instant preview ⚡

Complex Web
  ├─ package.json + src/
  └─ WebContainer → npm install → dev server → preview 🔨

Mobile with Preview
  ├─ React Native files (root)
  ├─ web-preview/ folder
  │   ├─ package.json
  │   └─ src/
  ├─ WebContainer (web-preview only) → preview 🔨
  └─ Expo Snack (native code) → mobile QR 📱

Mobile without Preview
  └─ Helpful error message ⚠️
```

All scenarios covered! 🎉
