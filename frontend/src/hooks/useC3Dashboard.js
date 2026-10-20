import { useState, useEffect } from 'react';
import c3Api from '../services/c3Api';

export function useC3Dashboard(locationId = 'C3_001', horizonMonths = 1) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    c3Api.getDashboard(locationId, horizonMonths)
      .then(res => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [locationId, horizonMonths]);

  const refetch = () => {
    setLoading(true);
    c3Api.getDashboard(locationId, horizonMonths)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
        setLoading(false);
      });
  };

  return { data, loading, error, refetch };
}
