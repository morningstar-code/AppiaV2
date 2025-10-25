import { useEffect } from 'react';

interface ShortcutHandlers {
  onBuild?: () => void;
  onClearChat?: () => void;
  onSave?: () => void;
  onNewFile?: () => void;
  onSearch?: () => void;
}

export const useKeyboardShortcuts = (handlers: ShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // ⌘/Ctrl + Enter - Build/Run
      if (modKey && e.key === 'Enter') {
        e.preventDefault();
        handlers.onBuild?.();
        return;
      }

      // ⌘/Ctrl + K - Clear chat
      if (modKey && e.key === 'k') {
        e.preventDefault();
        handlers.onClearChat?.();
        return;
      }

      // ⌘/Ctrl + S - Save file
      if (modKey && e.key === 's') {
        e.preventDefault();
        handlers.onSave?.();
        return;
      }

      // ⌘/Ctrl + N - New file
      if (modKey && e.key === 'n') {
        e.preventDefault();
        handlers.onNewFile?.();
        return;
      }

      // ⌘/Ctrl + P - Search files
      if (modKey && e.key === 'p') {
        e.preventDefault();
        handlers.onSearch?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};
