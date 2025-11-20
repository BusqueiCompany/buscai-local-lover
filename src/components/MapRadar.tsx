import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

// Photon API endpoint (autocomplete gratuito)
const PHOTON_URL =
  "https://photon.komoot.io/api/?limit=5&bbox=-44.0,-23.4,-40.8,-21.0&q=";

// Limites aproximados Estado do RJ
const RJ_BOUNDS = L.latLngBounds(
  L.latLng(-23.400, -43.800),
  L.latLng(-22.700, -43.200)
);

// Foco padrão (Zona Oeste — Campo Grande)
const ZONA_OESTE_CENTER = [-22.91, -43.56];

interface Store {
  id: string;
  nome: string;
  endereco: string;
  telefone?: string;
  horario?: string;
  categoria?: string;
  latitude: number;
  longitude: number;
}

interface MapRadarProps {
  stores: Store[];
  onStoreClick: (store: Store) => void;
  onLocationChange?: (coords: { lat: number; lng: number }) => void;
}

// Ícones customizados
const userIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const storeIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapRadar({ stores, onStoreClick, onLocationChange }: MapRadarProps) {
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const storeMarkersRef = useRef<L.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const selectedStoreRef = useRef<Store | null>(null);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Inicializar mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Cria o mapa
    mapRef.current = L.map(containerRef.current, {
      maxBounds: RJ_BOUNDS,
      maxBoundsViscosity: 1.0,
      zoomControl: true,
    }).setView(ZONA_OESTE_CENTER as [number, number], 13);

    // Camada base OSM
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, []);

  // Função para buscar rota real do OSRM
  const fetchRoute = async (
    userLat: number, 
    userLng: number, 
    storeLat: number, 
    storeLng: number
  ): Promise<[number, number][]> => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${storeLng},${storeLat}?geometries=geojson&overview=full`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
        // OSRM retorna [lng, lat], mas Leaflet usa [lat, lng]
        return data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );
      }
      
      // Fallback: linha reta se a API falhar
      return [[userLat, userLng], [storeLat, storeLng]];
    } catch (error) {
      console.error('Erro ao buscar rota:', error);
      return [[userLat, userLng], [storeLat, storeLng]];
    }
  };

  // Função para desenhar rota
  const drawRoute = async (userLat: number, userLng: number, storeLat: number, storeLng: number) => {
    if (!mapRef.current) return;

    setIsLoadingRoute(true);

    // Busca rota real do OSRM
    const routeCoordinates = await fetchRoute(userLat, userLng, storeLat, storeLng);

    // Remove linha anterior
    if (routeLineRef.current) {
      routeLineRef.current.remove();
    }

    // Desenha rota seguindo as ruas
    routeLineRef.current = L.polyline(routeCoordinates, {
      color: 'red',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(mapRef.current);

    // Ajusta o zoom para mostrar toda a rota
    mapRef.current.fitBounds(routeLineRef.current.getBounds(), { padding: [50, 50] });
    
    setIsLoadingRoute(false);
  };

  // Função para iniciar rastreamento em tempo real
  const startTracking = (store: Store) => {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada");
      return;
    }

    // Limpar rastreamento anterior se existir
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    selectedStoreRef.current = store;
    setIsTracking(true);

    // Primeiro, obter posição atual e desenhar rota imediatamente
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Criar/atualizar marcador do usuário
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          userMarkerRef.current = L.marker([latitude, longitude], { 
            icon: userIcon 
          }).addTo(mapRef.current!);
        }

        userMarkerRef.current.bindPopup("Você está aqui").openPopup();

        // Desenhar rota inicial
        if (selectedStoreRef.current) {
          await drawRoute(latitude, longitude, selectedStoreRef.current.latitude, selectedStoreRef.current.longitude);
        }

        // Notificar mudança de localização
        onLocationChange?.({ lat: latitude, lng: longitude });

        // Depois de desenhar a rota inicial, iniciar rastreamento em tempo real
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;

            // Atualizar marcador do usuário
            if (userMarkerRef.current) {
              userMarkerRef.current.setLatLng([lat, lng]);
            }

            // Desenhar/atualizar rota seguindo as ruas
            if (selectedStoreRef.current) {
              await drawRoute(lat, lng, selectedStoreRef.current.latitude, selectedStoreRef.current.longitude);
            }

            // Notificar mudança de localização
            onLocationChange?.({ lat, lng });
          },
          (error) => {
            console.error("Erro ao rastrear localização:", error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 2000
          }
        );
      },
      (error) => {
        console.error("Erro ao obter localização inicial:", error);
        setIsTracking(false);
        selectedStoreRef.current = null;
        
        let errorMsg = "Não foi possível obter sua localização. ";
        if (error.code === 1) {
          errorMsg += "Permissão negada. Verifique as configurações do navegador.";
        } else if (error.code === 2) {
          errorMsg += "Posição indisponível.";
        } else if (error.code === 3) {
          errorMsg += "Tempo esgotado. Tente novamente.";
        }
        alert(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Função para parar rastreamento
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }
    
    selectedStoreRef.current = null;
    setIsTracking(false);
  };

  // Limpar rastreamento ao desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Adicionar marcadores das lojas
  useEffect(() => {
    if (!mapRef.current) return;

    // Limpar marcadores anteriores
    storeMarkersRef.current.forEach(marker => marker.remove());
    storeMarkersRef.current = [];

    // Adicionar novo marcador para cada loja
    stores.forEach(store => {
      const marker = L.marker([store.latitude, store.longitude], { 
        icon: storeIcon 
      }).addTo(mapRef.current!);

      marker.bindPopup(`
        <div style="text-align: center;">
          <strong>${store.nome}</strong><br/>
          <small>${store.categoria || 'Loja'}</small><br/>
          <button 
            onclick="window.dispatchEvent(new CustomEvent('start-route', { detail: ${JSON.stringify(store)} }))"
            style="margin-top: 8px; padding: 4px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Iniciar Rota
          </button>
        </div>
      `);

      marker.on('click', () => {
        onStoreClick(store);
      });

      storeMarkersRef.current.push(marker);
    });

    // Ajustar mapa para mostrar todas as lojas
    if (stores.length > 0 && !isTracking) {
      const bounds = L.latLngBounds(
        stores.map(s => [s.latitude, s.longitude] as [number, number])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [stores, onStoreClick, isTracking]);

  // Listener para evento customizado do botão no popup
  useEffect(() => {
    const handleStartRoute = (e: any) => {
      const store = e.detail;
      startTracking(store);
    };

    window.addEventListener('start-route', handleStartRoute);
    return () => window.removeEventListener('start-route', handleStartRoute);
  }, []);

  // Autocomplete (Photon API)
  async function search(text: string) {
    setQuery(text);

    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const url = PHOTON_URL + encodeURIComponent(text);
      const res = await fetch(url);
      const json = await res.json();
      setSuggestions(json.features || []);
    } catch (err) {
      console.error("Erro no autocomplete:", err);
    }
  }

  function selectSuggestion(item: any) {
    const [lng, lat] = item.geometry.coordinates;

    setQuery(item.properties.name || "");
    setSuggestions([]);

    // Remove marcador anterior do usuário
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Adiciona novo marcador do usuário
    userMarkerRef.current = L.marker([lat, lng], { 
      icon: userIcon 
    }).addTo(mapRef.current!);
    
    userMarkerRef.current.bindPopup("Você está aqui").openPopup();

    mapRef.current?.setView([lat, lng], 15);

    // Notifica a página pai sobre a nova localização
    onLocationChange?.({ lat, lng });
  }

  // Botão "minha localização"
  function goToMyLocation() {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada");
      return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;

      // Remove marcador anterior do usuário
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      // Adiciona novo marcador do usuário
      userMarkerRef.current = L.marker([latitude, longitude], { 
        icon: userIcon 
      }).addTo(mapRef.current!);
      
      userMarkerRef.current.bindPopup("Você está aqui").openPopup();

      mapRef.current?.setView([latitude, longitude], 15);

      // Notifica a página pai sobre a nova localização
      onLocationChange?.({ lat: latitude, lng: longitude });
    });
  }

  return (
    <div className="w-full flex flex-col gap-3 bg-background rounded-lg relative z-10">
      {/* Campo de busca */}
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="Buscar endereço…"
          className="w-full"
        />
        
        {/* Sugestões */}
        {suggestions.length > 0 && (
          <div className="absolute z-40 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => selectSuggestion(item)}
                className="w-full text-left px-4 py-2 hover:bg-accent transition-colors border-b border-border last:border-b-0"
              >
                <div className="font-medium text-sm text-foreground">
                  {item.properties.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.properties.street}, {item.properties.city}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Botões de controle */}
      <div className="flex gap-2">
        <Button
          onClick={goToMyLocation}
          variant="default"
          className="flex-1 bg-primary hover:bg-primary/90 shadow-md"
          disabled={isTracking}
        >
          <MapPin className="mr-2 h-5 w-5" />
          Minha Localização
        </Button>

        {isTracking && (
          <Button
            onClick={stopTracking}
            variant="destructive"
            className="flex-1"
          >
            Parar Rota
          </Button>
        )}
      </div>

      {/* Mapa */}
      <div
        ref={containerRef}
        className="w-full h-[400px] rounded-md border border-border shadow-sm relative z-0"
      />
    </div>
  );
}
