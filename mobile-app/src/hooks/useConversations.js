import { useState, useEffect, useCallback } from 'react';
import chatService from '../services/chatService';
import CONSTANTS from '../utils/constants';

const useConversations = () => {
  const [data, setData] = useState({ all: [], handoff: [], active: [], manual: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatService.getConversations();
      if (res.data) setData(res.data);
    } catch (err) { console.warn('Conversations error:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchConversations();
    const iv = setInterval(fetchConversations, CONSTANTS.REFRESH_INTERVALS.CONVERSATIONS);
    return () => clearInterval(iv);
  }, [fetchConversations]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const reply = useCallback(async (userId, platform, message) => {
    await chatService.reply(userId, platform, message);
    await fetchConversations();
  }, [fetchConversations]);

  const toggleAi = useCallback(async (userId, platform, enabled) => {
    await chatService.toggleAi(userId, platform, enabled);
    await fetchConversations();
  }, [fetchConversations]);

  return { data, loading, refreshing, refresh, reply, toggleAi };
};

export default useConversations;
