import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

interface MapLeafletComponentProps {
  lat?: number;
  lng?: number;
  onChange?: (coords: { lat: number; lng: number }) => void;
}

// Componente do mapa
export default function MapLeafletComponent({
  lat,
  lng,
  onChange = () => {},
}: MapLeafletComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Inicializar mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    console.log("MapLeafletComponent carregado");

    // Cria o mapa
    mapRef.current = L.map(containerRef.current, {
      maxBounds: RJ_BOUNDS,
      maxBoundsViscosity: 1.0,
      zoomControl: true,
    }).setView(
      [lat || ZONA_OESTE_CENTER[0], lng || ZONA_OESTE_CENTER[1]],
      14
    );

    // Camada base OSM
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Marcador arrastável
    markerRef.current = L.marker(
      [lat || ZONA_OESTE_CENTER[0], lng || ZONA_OESTE_CENTER[1]],
      { draggable: true }
    ).addTo(mapRef.current);

    markerRef.current.on("dragend", () => {
      const { lat, lng } = markerRef.current!.getLatLng();
      onChange({ lat, lng });
    });

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, []);

  // Atualizar marcador se lat/lng mudarem externamente
  useEffect(() => {
    if (markerRef.current && lat && lng) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current?.setView([lat, lng], 15);
    }
  }, [lat, lng]);

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

    markerRef.current?.setLatLng([lat, lng]);
    mapRef.current?.setView([lat, lng], 16);
    onChange({ lat, lng });
  }

  // Botão "minha localização"
  function goToMyLocation() {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada");
      return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;

      markerRef.current?.setLatLng([latitude, longitude]);
      mapRef.current?.setView([latitude, longitude], 17);
      onChange({ lat: latitude, lng: longitude });
    });
  }

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Campo de busca */}
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Buscar endereço…"
        style={{
          padding: 8,
          borderRadius: 6,
          border: "1px solid #ccc",
        }}
      />

      {/* Sugestões */}
      {suggestions.length > 0 && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: 8,
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={i}
              style={{ padding: 6, cursor: "pointer" }}
              onClick={() => selectSuggestion(s)}
            >
              {s.properties.name}, {s.properties.city} –{" "}
              {s.properties.country}
            </div>
          ))}
        </div>
      )}

      {/* Botão localização */}
      <button
        onClick={goToMyLocation}
        style={{
          padding: 8,
          background: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        📍 Minha Localização
      </button>

      {/* Mapa */}
      <div
        ref={containerRef}
        style={{ height: 350, width: "100%", borderRadius: 8 }}
      />
    </div>
  );
}
