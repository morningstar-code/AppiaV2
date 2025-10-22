export interface LanguageConfig {
  name: string;
  extension: string;
  framework: string;
  dependencies: string[];
  buildCommand: string;
  devCommand: string;
  basePrompt: string;
  systemPrompt: string;
}

export const languageConfigs: Record<string, LanguageConfig> = {
  react: {
    name: 'React',
    extension: 'jsx',
    framework: 'React',
    dependencies: ['react', 'react-dom', 'vite', '@vitejs/plugin-react'],
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    basePrompt: 'Create a modern React application with functional components and hooks. Use Tailwind CSS for styling and Lucide React for icons.',
    systemPrompt: 'You are an expert React developer. Create beautiful, production-ready React components with modern patterns.'
  },
  
  vue: {
    name: 'Vue.js',
    extension: 'vue',
    framework: 'Vue',
    dependencies: ['vue', 'vite', '@vitejs/plugin-vue'],
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    basePrompt: 'Create a modern Vue.js application with Composition API. Use Tailwind CSS for styling and Heroicons for icons.',
    systemPrompt: 'You are an expert Vue.js developer. Create beautiful, production-ready Vue components with modern Composition API patterns.'
  },
  
  angular: {
    name: 'Angular',
    extension: 'ts',
    framework: 'Angular',
    dependencies: ['@angular/core', '@angular/common', '@angular/platform-browser'],
    buildCommand: 'ng build',
    devCommand: 'ng serve',
    basePrompt: 'Create a modern Angular application with TypeScript. Use Angular Material for UI components and Tailwind CSS for styling.',
    systemPrompt: 'You are an expert Angular developer. Create beautiful, production-ready Angular components with modern patterns and best practices.'
  },
  
  svelte: {
    name: 'Svelte',
    extension: 'svelte',
    framework: 'Svelte',
    dependencies: ['svelte', 'vite', '@sveltejs/vite-plugin-svelte'],
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    basePrompt: 'Create a modern Svelte application. Use Tailwind CSS for styling and Lucide Svelte for icons.',
    systemPrompt: 'You are an expert Svelte developer. Create beautiful, production-ready Svelte components with modern patterns.'
  },
  
  nextjs: {
    name: 'Next.js',
    extension: 'jsx',
    framework: 'Next.js',
    dependencies: ['next', 'react', 'react-dom'],
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    basePrompt: 'Create a modern Next.js application with App Router. Use Tailwind CSS for styling and Lucide React for icons.',
    systemPrompt: 'You are an expert Next.js developer. Create beautiful, production-ready Next.js applications with modern patterns and best practices.'
  },
  
  nuxt: {
    name: 'Nuxt.js',
    extension: 'vue',
    framework: 'Nuxt',
    dependencies: ['nuxt', 'vue'],
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    basePrompt: 'Create a modern Nuxt.js application. Use Tailwind CSS for styling and Heroicons for icons.',
    systemPrompt: 'You are an expert Nuxt.js developer. Create beautiful, production-ready Nuxt.js applications with modern patterns.'
  },
  
  vanilla: {
    name: 'Vanilla JS',
    extension: 'js',
    framework: 'Vanilla',
    dependencies: ['vite'],
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    basePrompt: 'Create a modern vanilla JavaScript application. Use Tailwind CSS for styling and Lucide for icons.',
    systemPrompt: 'You are an expert vanilla JavaScript developer. Create beautiful, production-ready JavaScript applications with modern ES6+ patterns.'
  },
  
  typescript: {
    name: 'TypeScript',
    extension: 'ts',
    framework: 'TypeScript',
    dependencies: ['typescript', 'vite', '@types/node'],
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    basePrompt: 'Create a modern TypeScript application. Use Tailwind CSS for styling and Lucide for icons.',
    systemPrompt: 'You are an expert TypeScript developer. Create beautiful, production-ready TypeScript applications with strict typing and modern patterns.'
  },
  
  python: {
    name: 'Python',
    extension: 'py',
    framework: 'Flask',
    dependencies: ['flask', 'flask-cors'],
    buildCommand: 'python app.py',
    devCommand: 'python app.py',
    basePrompt: 'Create a modern Python web application with Flask. Use Bootstrap for styling and create a responsive design.',
    systemPrompt: 'You are an expert Python developer. Create beautiful, production-ready Python web applications with Flask.'
  },
  
  php: {
    name: 'PHP',
    extension: 'php',
    framework: 'Laravel',
    dependencies: ['laravel/framework'],
    buildCommand: 'php artisan build',
    devCommand: 'php artisan serve',
    basePrompt: 'Create a modern PHP web application. Use Tailwind CSS for styling and create a responsive design.',
    systemPrompt: 'You are an expert PHP developer. Create beautiful, production-ready PHP web applications with modern patterns.'
  },
  
  go: {
    name: 'Go',
    extension: 'go',
    framework: 'Gin',
    dependencies: ['github.com/gin-gonic/gin'],
    buildCommand: 'go build',
    devCommand: 'go run main.go',
    basePrompt: 'Create a modern Go web application with Gin framework. Use Tailwind CSS for styling and create a responsive design.',
    systemPrompt: 'You are an expert Go developer. Create beautiful, production-ready Go web applications with modern patterns.'
  },
  
  rust: {
    name: 'Rust',
    extension: 'rs',
    framework: 'Actix',
    dependencies: ['actix-web', 'serde'],
    buildCommand: 'cargo build',
    devCommand: 'cargo run',
    basePrompt: 'Create a modern Rust web application with Actix-web. Use Tailwind CSS for styling and create a responsive design.',
    systemPrompt: 'You are an expert Rust developer. Create beautiful, production-ready Rust web applications with modern patterns.'
  }
};

export const getLanguagePrompt = (language: string, userPrompt: string): string => {
  const config = languageConfigs[language] || languageConfigs.react;
  
  return `${config.basePrompt}

User Request: ${userPrompt}

Create a complete, production-ready ${config.name} application with the following requirements:
- Use ${config.framework} framework
- Implement modern, responsive design
- Include proper error handling
- Add loading states where appropriate
- Use semantic HTML
- Ensure accessibility compliance
- Optimize for performance
- Include proper TypeScript types (if applicable)
- Use modern CSS with Tailwind
- Implement proper component structure
- Add proper SEO meta tags
- Include proper form validation
- Add proper state management
- Implement proper routing (if applicable)
- Add proper testing setup (if applicable)

Make sure the application is fully functional and ready for production deployment.`;
};

export const getSystemPromptForLanguage = (language: string): string => {
  const config = languageConfigs[language] || languageConfigs.react;
  return config.systemPrompt;
};
