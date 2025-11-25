import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Corrige ícones do Leaflet no React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Store {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
}

interface MapRJProps {
  stores?: Store[];
  onAdminSelect?: (coords: { lat: number; lng: number }) => void;
  isAdmin?: boolean;
  onViewProducts?: (storeId: string, storeName: string) => void;
}

// Foco inicial na Zona Oeste
function SetViewOnMount({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, 12);
    // Store map instance globally for location button
    (window as any)._leaflet_map = map;
  }, [coords, map]);
  return null;
}

// Evento para ADM adicionar lojas (puxa coordenadas ao clicar no mapa)
function AdminAddStoreEvent({ onSelect }: { onSelect?: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      if (onSelect) {
        onSelect({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        });
      }
    },
  });
  return null;
}

export default function MapRJ({ stores = [], onAdminSelect, isAdmin = false, onViewProducts }: MapRJProps) {
  const zonaOesteCenter: [number, number] = [-22.9064, -43.5607];

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        const map = (window as any)._leaflet_map;
        if (map) {
          map.setView([latitude, longitude], 16);

          L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup("Você está aqui!")
            .openPopup();
        }
      },
      () => alert("Não foi possível obter a localização.")
    );
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {/* Botão flutuante "Minha Localização" */}
      <button
        onClick={handleLocateUser}
        style={{
          position: "absolute",
          zIndex: 9999,
          bottom: "20px",
          right: "20px",
          background: "#fff",
          padding: "10px 14px",
          borderRadius: "12px",
          border: "1px solid #ccc",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        📍 Minha localização
      </button>

      {isAdmin && (
        <div
          style={{
            position: "absolute",
            zIndex: 9999,
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#fff",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "2px solid #ff6b6b",
            fontWeight: "bold",
            color: "#ff6b6b",
          }}
        >
          🔴 MODO ADMIN - Clique no mapa para adicionar loja
        </div>
      )}

      <MapContainer
        center={[-22.9068, -43.1729]}
        zoom={10}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <SetViewOnMount coords={zonaOesteCenter} />

        {isAdmin && onAdminSelect && <AdminAddStoreEvent onSelect={onAdminSelect} />}

        {stores.map((store) => (
          <Marker key={store.id} position={[store.latitude, store.longitude]}>
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>{store.nome}</h3>
                {onViewProducts && (
                  <button
                    onClick={() => onViewProducts(store.id, store.nome)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    Ver Itens
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
