import React, { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';

interface Language {
  id: string;
  name: string;
  extension: string;
  icon: string;
  description: string;
}

const languages: Language[] = [
  { id: 'react', name: 'React', extension: 'jsx', icon: '⚛️', description: 'Modern React with hooks' },
  { id: 'vue', name: 'Vue.js', extension: 'vue', icon: '💚', description: 'Progressive Vue.js framework' },
  { id: 'angular', name: 'Angular', extension: 'ts', icon: '🅰️', description: 'Full-featured Angular framework' },
  { id: 'svelte', name: 'Svelte', extension: 'svelte', icon: '🧡', description: 'Compile-time optimized framework' },
  { id: 'nextjs', name: 'Next.js', extension: 'jsx', icon: '▲', description: 'React framework for production' },
  { id: 'nuxt', name: 'Nuxt.js', extension: 'vue', icon: '💚', description: 'Vue.js framework for production' },
  { id: 'vanilla', name: 'Vanilla JS', extension: 'js', icon: '🟨', description: 'Pure JavaScript' },
  { id: 'typescript', name: 'TypeScript', extension: 'ts', icon: '🔷', description: 'Typed JavaScript' },
  { id: 'python', name: 'Python', extension: 'py', icon: '🐍', description: 'Python web apps with Flask/Django' },
  { id: 'php', name: 'PHP', extension: 'php', icon: '🐘', description: 'PHP with Laravel/Symfony' },
  { id: 'go', name: 'Go', extension: 'go', icon: '🐹', description: 'Go web applications' },
  { id: 'rust', name: 'Rust', extension: 'rs', icon: '🦀', description: 'Rust web applications' }
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLang = languages.find(lang => lang.id === selectedLanguage) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg">{selectedLang.icon}</span>
        <div className="text-left">
          <div className="font-medium text-gray-900">{selectedLang.name}</div>
          <div className="text-sm text-gray-500">{selectedLang.description}</div>
        </div>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {languages.map((language) => (
            <button
              key={language.id}
              onClick={() => {
                onLanguageChange(language.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                selectedLanguage === language.id ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
              }`}
            >
              <span className="text-lg">{language.icon}</span>
              <div>
                <div className="font-medium">{language.name}</div>
                <div className="text-sm text-gray-500">{language.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
