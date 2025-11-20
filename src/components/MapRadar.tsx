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

export default function MapRadar({ stores, onStoreClick }: MapRadarProps) {
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const storeMarkersRef = useRef<L.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

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
          <small>${store.categoria || 'Loja'}</small>
        </div>
      `);

      marker.on('click', () => {
        onStoreClick(store);
      });

      storeMarkersRef.current.push(marker);
    });

    // Ajustar mapa para mostrar todas as lojas
    if (stores.length > 0) {
      const bounds = L.latLngBounds(
        stores.map(s => [s.latitude, s.longitude] as [number, number])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [stores, onStoreClick]);

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
    });
  }

  return (
    <div className="w-full flex flex-col gap-3 bg-background p-4 rounded-lg">
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
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
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

      {/* Botão minha localização */}
      <Button
        onClick={goToMyLocation}
        variant="outline"
        className="w-full"
      >
        <MapPin className="mr-2 h-4 w-4" />
        Minha Localização
      </Button>

      {/* Mapa */}
      <div
        ref={containerRef}
        className="w-full h-[400px] rounded-md border border-border shadow-sm"
      />
    </div>
  );
}
