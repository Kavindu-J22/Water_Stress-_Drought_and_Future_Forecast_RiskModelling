import { useState, useEffect } from 'react';
import c3Api from '../services/c3Api';

export function useC3Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    c3Api.getLocations()
      .then(data => {
        if (mounted) {
          setLocations(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.message || 'Failed to fetch study site locations');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  return { locations, loading, error };
}
