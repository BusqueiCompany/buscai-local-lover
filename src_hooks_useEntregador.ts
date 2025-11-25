// src/hooks/useEntregador.ts
import { useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useEntregadorTracking(uid: string, enabled: boolean) {
  useEffect(() => {
    let watchId: number | null = null;
    if (!enabled) {
      setDoc(doc(db, 'entregadores', uid), { status: 'offline', lastOnline: serverTimestamp() }, { merge: true });
      return;
    }
    setDoc(doc(db, 'entregadores', uid), { status: 'online', lastOnline: serverTimestamp() }, { merge: true });

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition((p) => {
        const lat = p.coords.latitude; const lng = p.coords.longitude;
        setDoc(doc(db, 'entregadores', uid), { location: { lat, lng }, lastGeo: serverTimestamp() }, { merge: true });
      }, err => console.error(err), { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }) as unknown as number;
    }
    return () => {
      if (watchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
      setDoc(doc(db, 'entregadores', uid), { status: 'offline', lastOnline: serverTimestamp() }, { merge: true });
    };
  }, [uid, enabled]);
}
