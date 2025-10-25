/**
 * React Native to Web Compiler
 * Converts React Native code to web-compatible React code
 */

interface FileContent {
  path: string;
  content: string;
}

interface CompilationResult {
  success: boolean;
  files: FileContent[];
  error?: string;
}

/**
 * Compiles React Native files to web-compatible React files
 */
export async function compileReactNativeToWeb(
  nativeFiles: FileContent[]
): Promise<CompilationResult> {
  try {
    console.log('[RN Compiler] Starting compilation of', nativeFiles.length, 'files');
    
    const webFiles: FileContent[] = [];
    
    // Find essential files
    const appJsonFile = nativeFiles.find(f => f.path === 'app.json');
    const packageJsonFile = nativeFiles.find(f => f.path === 'package.json');
    const appTsxFile = nativeFiles.find(f => f.path === 'App.tsx' || f.path === 'App.js');
    
    if (!appTsxFile) {
      return {
        success: false,
        files: [],
        error: 'No App.tsx or App.js found'
      };
    }
    
    // Transform each React Native file to web-compatible version
    for (const file of nativeFiles) {
      if (file.path === 'app.json') {
        // Skip app.json for web build
        continue;
      }
      
      if (file.path === 'package.json') {
        // Transform package.json for web
        const webPackageJson = transformPackageJsonForWeb(file.content);
        webFiles.push({
          path: 'package.json',
          content: webPackageJson
        });
        continue;
      }
      
      // Transform React Native code to web
      const transformedContent = transformReactNativeCode(file.content);
      webFiles.push({
        path: file.path,
        content: transformedContent
      });
    }
    
    // Add web-specific files
    webFiles.push({
      path: 'index.html',
      content: generateIndexHtml()
    });
    
    webFiles.push({
      path: 'vite.config.ts',
      content: generateViteConfig()
    });
    
    webFiles.push({
      path: 'src/index.tsx',
      content: generateWebEntry()
    });
    
    console.log('[RN Compiler] Successfully compiled to', webFiles.length, 'web files');
    
    return {
      success: true,
      files: webFiles
    };
  } catch (error: any) {
    console.error('[RN Compiler] Compilation failed:', error);
    return {
      success: false,
      files: [],
      error: error.message
    };
  }
}

/**
 * Transform React Native code to web-compatible React code
 */
function transformReactNativeCode(code: string): string {
  let transformed = code;
  
  // Replace React Native imports with react-native-web
  transformed = transformed.replace(
    /from ['"]react-native['"]/g,
    "from 'react-native-web'"
  );
  
  // Replace Expo specific imports with web alternatives
  transformed = transformed.replace(
    /import.*from ['"]expo-.*['"]/g,
    '// Expo imports removed for web'
  );
  
  // Replace StatusBar (not available in web)
  transformed = transformed.replace(
    /<StatusBar[^>]*\/>/g,
    '{/* StatusBar not available on web */}'
  );
  
  // Replace haptic feedback (not available in web)
  transformed = transformed.replace(
    /Haptics\.(.*)\(\)/g,
    '// Haptics.$1() not available on web'
  );
  
  return transformed;
}

/**
 * Transform package.json from React Native to web
 */
function transformPackageJsonForWeb(content: string): string {
  try {
    const pkg = JSON.parse(content);
    
    // Create web-compatible package.json
    const webPkg = {
      name: pkg.name || 'rn-web-app',
      version: pkg.version || '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-native-web': '^0.19.10'
      },
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.2.0',
        'vite': '^5.0.0',
        'typescript': '^5.3.0'
      }
    };
    
    return JSON.stringify(webPkg, null, 2);
  } catch (error) {
    console.error('[RN Compiler] Failed to parse package.json:', error);
    return content;
  }
}

/**
 * Generate index.html for web build
 */
function generateIndexHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Native Web App</title>
    <style>
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
          sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      #root {
        display: flex;
        height: 100vh;
        width: 100vw;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>`;
}

/**
 * Generate vite.config.ts
 */
function generateViteConfig(): string {
  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web'
    },
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js']
  },
  optimizeDeps: {
    include: ['react-native-web']
  }
});`;
}

/**
 * Generate web entry point
 */
function generateWebEntry(): string {
  return `import { createRoot } from 'react-dom/client';
import { AppRegistry } from 'react-native-web';
import App from '../App';

// Register the app
AppRegistry.registerComponent('App', () => App);

// Mount the app
const rootTag = document.getElementById('root');
if (rootTag) {
  const { element, getStyleElement } = AppRegistry.getApplication('App');
  
  // Insert styles
  const style = getStyleElement();
  if (style) {
    document.head.appendChild(style);
  }
  
  // Render app
  const root = createRoot(rootTag);
  root.render(element);
}`;
}
