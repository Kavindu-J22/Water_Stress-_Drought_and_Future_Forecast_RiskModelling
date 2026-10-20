import { useState, useEffect } from 'react';
import c3Api from '../services/c3Api';

export function useC3Forecast(locationId = 'C3_001', horizonMonths = 1, issueMonth = null) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    c3Api.getForecast(locationId, horizonMonths, issueMonth)
      .then(res => {
        if (mounted) {
          setForecast(res);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.response?.data?.message || err.message || 'Failed to fetch forecast');
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [locationId, horizonMonths, issueMonth]);

  return { forecast, loading, error };
}
