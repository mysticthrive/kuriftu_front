import { useState, useEffect } from 'react';
import { useHotel } from '@/contexts/HotelContext';

interface UseHotelDataOptions<T> {
  fetchData: (hotelId: string) => Promise<T>;
  dependencies?: any[];
  enabled?: boolean;
}

export function useHotelData<T>({ 
  fetchData, 
  dependencies = [], 
  enabled = true 
}: UseHotelDataOptions<T>) {
  const { selectedHotel } = useHotel();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchData(selectedHotel);
        setData(result);
      } catch (err) {
        // Use the actual error message from the backend
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
        setError(errorMessage);
        console.error('Error fetching hotel data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedHotel, enabled, ...dependencies]);

  const refetch = async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchData(selectedHotel);
      setData(result);
    } catch (err) {
      // Use the actual error message from the backend
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      console.error('Error refetching hotel data:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch,
    selectedHotel
  };
}

// Example usage:
// const { data: rooms, loading, error, refetch } = useHotelData({
//   fetchData: (hotelId) => getRoomsByHotel(hotelId),
//   enabled: !!user
// });
