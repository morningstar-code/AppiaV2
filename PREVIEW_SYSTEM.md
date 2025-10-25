# Preview System - How It Works

## Overview
The preview system handles both **Web Apps** and **Native Mobile Apps** with different strategies.

---

## 🌐 WEB APPS

### How It Works:
1. **Claude generates** complete React + Vite project with:
   - `package.json` (react, vite, tailwind dependencies)
   - `vite.config.ts` or `vite.config.js`
   - `index.html`
   - `src/main.tsx` or `src/main.jsx`
   - `src/App.tsx` or `src/App.jsx`

2. **WebContainer** receives files and:
   - Writes files to virtual filesystem
   - Runs `npm install`
   - Runs `npm run dev` (starts Vite dev server)
   - Captures server URL and displays in iframe

3. **User sees** instant preview in browser

### Fallback for Static HTML:
- If no `package.json` detected:
  - Starts Python HTTP server (`python3 -m http.server 3000`)
  - Serves static files directly

---

## 📱 NATIVE MOBILE APPS (iOS/Android)

### How It Works:
1. **Claude generates TWO outputs**:

   **A. React Native App (root folder)**:
   - `app.json` (Expo configuration)
   - `package.json` (expo, react-native dependencies)
   - `App.tsx` (main entry point)
   - `components/` (native components)
   
   **B. Web Preview (web-preview/ folder)** - MANDATORY:
   - `web-preview/package.json` (react, vite, tailwind)
   - `web-preview/vite.config.ts`
   - `web-preview/index.html`
   - `web-preview/src/main.tsx`
   - `web-preview/src/App.tsx` (React version mimicking native UI)
   - `web-preview/tailwind.config.js`
   - `web-preview/postcss.config.js`
   - `web-preview/src/index.css`

2. **WebContainer** (for instant browser preview):
   - Detects React Native project (presence of `app.json`)
   - Extracts only `web-preview/` files
   - Strips `web-preview/` prefix from paths
   - Runs `npm install` in web-preview
   - Runs `npm run dev` to start Vite
   - Shows React web version in iframe

3. **Expo Snack** (for real device testing):
   - Runs in background (non-blocking)
   - Uploads React Native files (NOT web-preview) to Expo Snack API
   - Returns Expo Snack URL
   - Shows "📱 Test on Device" button in preview
   - User can:
     - Click button → Opens Expo Snack in new tab
     - Scan QR code with Expo Go app
     - See real native app on their phone

---

## 🔧 Technical Details

### WebContainer File Detection:
```typescript
const isReactNative = files.some(f => 
  (f.path === 'app.json' || f.name === 'app.json') ||
  (f.content && f.content.includes('react-native')) ||
  (f.content && f.content.includes('expo'))
);
```

### Web Preview Extraction:
```typescript
if (isReactNative) {
  const webPreviewFiles = files.filter(f => f.path.includes('web-preview/'));
  files = webPreviewFiles.map(f => ({
    ...f,
    path: f.path.replace('web-preview/', '')
  }));
}
```

### Expo Snack API:
```typescript
POST https://snack.expo.dev/--/api/v2/snacks
Headers:
  Content-Type: application/json
  Snack-Api-Version: 3.0.0
Body:
  {
    manifest: {
      name: "App Name",
      description: "Description",
      sdkVersion: "48.0.0"
    },
    code: { /* files */ },
    dependencies: {}
  }
```

---

## ✅ What Works

### Web Apps:
- ✅ React + Vite projects render instantly
- ✅ Tailwind CSS styling works
- ✅ Hot module replacement (HMR) works
- ✅ All npm packages install correctly
- ✅ Responsive design previews (Desktop/iPad/iPhone frames)

### Mobile Apps:
- ✅ Web preview renders instantly in browser
- ✅ Looks and feels like native app (Tailwind styling)
- ✅ Expo Snack link generated
- ✅ QR code works with Expo Go app
- ✅ Real device testing via Expo Go
- ✅ Both previews have feature parity

---

## 🔗 Links That Work

1. **Expo Snack URL**: `https://snack.expo.dev/{snackId}`
   - Opens in new tab
   - Works on desktop browser
   - Scannable with Expo Go mobile app

2. **Expo Go App**: `https://expo.dev/go`
   - Download link for iOS/Android
   - Free app by Expo

3. **QR Code API**: `https://api.qrserver.com/v1/create-qr-code/`
   - Generates QR codes on-the-fly
   - No external dependencies needed

---

## 🚨 Critical Requirements

### For Web Apps:
- MUST have `package.json` with dev script
- MUST have Vite or similar dev server
- MUST have entry point (index.html)

### For Mobile Apps:
- MUST generate complete `web-preview/` folder
- Web preview MUST be self-contained (own package.json)
- Web preview MUST have all required files
- WITHOUT web-preview, user sees NOTHING in browser

---

## 🐛 Common Issues & Solutions

### Issue: "WebContainer not ready"
**Solution**: Wait for WebContainer to initialize before writing files

### Issue: "No preview shown for mobile app"
**Solution**: Check if web-preview/ folder was generated with ALL required files

### Issue: "npm install fails"
**Solution**: Check package.json dependencies are valid and compatible with WebContainer

### Issue: "Expo Snack returns 404"
**Solution**: Verify API endpoint is `https://snack.expo.dev/--/api/v2/snacks` (note the `--` prefix)

### Issue: "Preview shows blank screen"
**Solution**: Check browser console for errors, verify Vite server started successfully

---

## 📊 System Prompt Summary

The system prompt now enforces:

1. **Immediate File Generation**
   - No explanations first - generate files immediately
   - Detect app type (web vs mobile) and generate accordingly

2. **Mandatory Files**
   - Web apps: package.json, vite.config, index.html, src/main.tsx, src/App.tsx
   - Mobile apps: ALL of above PLUS complete web-preview/ folder

3. **No Standalone HTML**
   - Never generate just HTML/CSS files
   - Always use proper build tooling

4. **Multiple Warnings**
   - "WITHOUT THESE FILES, THE PREVIEW WILL BE BLANK!"
   - "WITHOUT web-preview/ FOLDER, USER WILL SEE NOTHING!"

This ensures preview ALWAYS works for both web and mobile apps.
