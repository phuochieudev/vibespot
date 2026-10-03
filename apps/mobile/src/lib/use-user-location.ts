import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type Coords = { lat: number; lng: number };
export type LocationStatus = 'loading' | 'granted' | 'denied';

export function useUserLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<LocationStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (perm !== 'granted') return setStatus('denied');
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('granted');
      } catch {
        if (!cancelled) setStatus('denied');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { coords, status };
}
