import { useCallback } from 'react';

const SESSION_KEY = 'appia_builder_session';

export const usePersistence = () => {
  const saveSession = useCallback((data: any) => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, []);

  const loadSession = useCallback(() => {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }, []);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }, []);

  return { saveSession, loadSession, clearSession };
};
