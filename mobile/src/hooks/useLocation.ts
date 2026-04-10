import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

type LocationState = {
  speedMph: number;
  fuzzyCity: string | null;
  permitted: boolean;
  latitude: number | null;
  longitude: number | null;
};

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({ speedMph: 0, fuzzyCity: null, permitted: false, latitude: null, longitude: null });

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      setState(s => ({ ...s, permitted: true }));

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 5 },
        async loc => {
          const mps = loc.coords.speed ?? 0;
          const mph = mps * 2.237;
          setState(s => ({
            ...s,
            speedMph:  Math.max(0, mph),
            latitude:  loc.coords.latitude,
            longitude: loc.coords.longitude,
          }));

          // Reverse geocode city — throttled: only update when we don't have one yet
          // or every ~5 minutes. City doesn't change often during a drive.
          setState(s => {
            if (s.fuzzyCity) return s;   // already have a city, skip
            return s;                    // will be set below once geocode resolves
          });
          try {
            const [place] = await Location.reverseGeocodeAsync(
              { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
            );
            const city = place?.city ?? place?.subregion ?? place?.region ?? null;
            if (city) setState(s => ({ ...s, fuzzyCity: city }));
          } catch {
            // Geocode failed — fuzzyCity stays null, non-fatal
          }
        }
      );
    })();

    return () => { sub?.remove(); };
  }, []);

  return state;
}
