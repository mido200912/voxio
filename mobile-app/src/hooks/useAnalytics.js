import { useState, useEffect, useCallback } from 'react';
import analyticsService from '../services/analyticsService';

const useAnalytics = (initialPeriod = 30) => {
  const [period, setPeriod] = useState(initialPeriod);
  const [dashboard, setDashboard] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [leads, setLeads] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, tsRes, plRes, ldRes] = await Promise.allSettled([
        analyticsService.getDashboard(period),
        analyticsService.getTimeseries(period),
        analyticsService.getPlatforms(period),
        analyticsService.getLeads(period),
      ]);
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data);
      if (tsRes.status === 'fulfilled') setTimeseries(Array.isArray(tsRes.value.data) ? tsRes.value.data : []);
      if (plRes.status === 'fulfilled') setPlatforms(Array.isArray(plRes.value.data) ? plRes.value.data : []);
      if (ldRes.status === 'fulfilled') setLeads(ldRes.value.data);
    } catch (err) { console.warn('Analytics error:', err); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  return {
    period, setPeriod,
    dashboard, timeseries, platforms, leads,
    loading, refreshing, refresh,
  };
};

export default useAnalytics;
