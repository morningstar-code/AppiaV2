import { useCallback } from 'react';
import { db, Session } from '../db/database';

const DEFAULT_PROJECT_ID = 'default-project';

interface SessionData {
  messages: any[];
  files: any[];
  openTabs?: string[];
  selectedFile?: string | null;
  tokens?: {
    used: number;
    remaining: number;
  };
}

export const usePersistence = () => {
  const saveSession = useCallback(async (data: SessionData) => {
    try {
      const session: Session = {
        projectId: DEFAULT_PROJECT_ID,
        lastUpdated: new Date(),
        messages: data.messages || [],
        files: data.files || [],
        openTabs: data.openTabs || [],
        selectedFile: data.selectedFile || null,
        tokens: data.tokens || { used: 0, remaining: 100000 }
      };

      // Update or insert session
      const existing = await db.sessions
        .where('projectId')
        .equals(DEFAULT_PROJECT_ID)
        .first();

      if (existing && existing.id) {
        // Update only the fields that changed
        await db.sessions.where('id').equals(existing.id).modify({
          lastUpdated: session.lastUpdated,
          messages: session.messages,
          files: session.files,
          openTabs: session.openTabs,
          selectedFile: session.selectedFile,
          tokens: session.tokens
        });
      } else {
        await db.sessions.add(session);
      }

      // Cache files separately for faster access
      for (const file of data.files) {
        await db.fileCache.put({
          path: file.path,
          content: file.content || '',
          lastModified: new Date(),
          projectId: DEFAULT_PROJECT_ID
        });
      }
    } catch (error) {
      console.error('Failed to save session to IndexedDB:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem('appia_builder_session', JSON.stringify(data));
      } catch (e) {
        console.error('Fallback to localStorage also failed:', e);
      }
    }
  }, []);

  const loadSession = useCallback(async (): Promise<SessionData | null> => {
    try {
      const session = await db.sessions
        .where('projectId')
        .equals(DEFAULT_PROJECT_ID)
        .first();

      if (session) {
        return {
          messages: session.messages || [],
          files: session.files || [],
          openTabs: session.openTabs || [],
          selectedFile: session.selectedFile || null,
          tokens: session.tokens || { used: 0, remaining: 100000 }
        };
      }

      // Fallback to localStorage if IndexedDB fails
      const fallback = localStorage.getItem('appia_builder_session');
      if (fallback) {
        return JSON.parse(fallback);
      }

      return null;
    } catch (error) {
      console.error('Failed to load session from IndexedDB:', error);
      // Try localStorage fallback
      try {
        const fallback = localStorage.getItem('appia_builder_session');
        return fallback ? JSON.parse(fallback) : null;
      } catch (e) {
        return null;
      }
    }
  }, []);

  const clearSession = useCallback(async () => {
    try {
      await db.sessions
        .where('projectId')
        .equals(DEFAULT_PROJECT_ID)
        .delete();
      
      await db.fileCache
        .where('projectId')
        .equals(DEFAULT_PROJECT_ID)
        .delete();

      localStorage.removeItem('appia_builder_session');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }, []);

  return { saveSession, loadSession, clearSession };
};
