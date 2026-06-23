import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';

const useNotifications = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const local = await notificationService.getLocalSettings();
      if (local) setSettings(local);
    } catch (err) { console.warn(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const updateSettings = useCallback(async (newSettings) => {
    setSettings(newSettings);
    await notificationService.saveLocalSettings(newSettings);
  }, []);

  const isMuted = useCallback(async () => {
    return await notificationService.isMuted();
  }, []);

  return { settings, loading, updateSettings, isMuted, reload: loadSettings };
};

export default useNotifications;
