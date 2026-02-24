import { useState, useEffect, useCallback } from 'react';
import type { Settings } from '@/src/shared/types';
import { DEFAULT_SETTINGS } from '@/src/shared/types';
import { settingsStorage } from '@/src/shared/storage';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    settingsStorage.getValue().then((stored) => {
      if (stored) setSettings(stored);
    });
  }, []);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      settingsStorage.setValue(next);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
