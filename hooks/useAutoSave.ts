import { useEffect, useRef } from 'react';

const AUTOSAVE_KEY = 'pabrik_konten_autosave';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

const sanitizeStateForPersistence = (state: any) => {
  const { apiKey, ...safeState } = state || {};
  return safeState;
};

export const useAutoSave = (state: any, enabled: boolean = true) => {
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!enabled) return;

    timerRef.current = setInterval(() => {
      try {
        const snapshot = {
          ...sanitizeStateForPersistence(state),
          _autoSavedAt: new Date().toISOString(),
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot));
      } catch (e) {
        console.warn('Auto-save failed:', e);
      }
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, enabled]);
};

export const getAutoSavedState = (): any | null => {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data._autoSavedAt) return null;
    return data;
  } catch {
    return null;
  }
};

export const clearAutoSavedState = () => {
  localStorage.removeItem(AUTOSAVE_KEY);
};

export const getAutoSaveInfo = (): { exists: boolean; savedAt: string | null } => {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return { exists: false, savedAt: null };
    const data = JSON.parse(raw);
    return { exists: true, savedAt: data._autoSavedAt || null };
  } catch {
    return { exists: false, savedAt: null };
  }
};
