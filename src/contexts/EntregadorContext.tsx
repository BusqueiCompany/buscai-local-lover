// src/contexts/EntregadorContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface Location {
  lat: number;
  lng: number;
}

interface EntregadorState {
  online: boolean;
  location: Location | null;
  loading: boolean;
}

interface EntregadorContextData extends EntregadorState {
  toggleOnline: () => Promise<void>;
  startTracking: () => void;
  stopTracking: () => void;
}

const EntregadorContext = createContext<EntregadorContextData | null>(null);

export const EntregadorProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [online, setOnline] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const updateFirestore = async (data: any) => {
    if (!user) return;
    const ref = doc(db, "entregadores", user.id);

    await setDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  };

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      pos => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(coords);
        if (online) updateFirestore({ location: coords });
      },
      err => console.error("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    setWatchId(id);
  }, [online]);

  const stopTracking = useCallback(() => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  }, [watchId]);

  const toggleOnline = async () => {
    if (!user) return;
    setLoading(true);

    const newState = !online;
    setOnline(newState);

    await updateFirestore({ status: newState ? "ONLINE" : "OFFLINE" });

    if (newState) startTracking();
    else stopTracking();

    setLoading(false);
  };

  useEffect(() => {
    return () => stopTracking();
  }, []);

  return (
    <EntregadorContext.Provider
      value={{
        online,
        location,
        loading,
        toggleOnline,
        startTracking,
        stopTracking,
      }}
    >
      {children}
    </EntregadorContext.Provider>
  );
};

export const useEntregadorContext = () => {
  const ctx = useContext(EntregadorContext);
  if (!ctx) throw new Error("useEntregadorContext precisa estar dentro do EntregadorProvider");
  return ctx;
};
