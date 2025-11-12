import { useState } from "react";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Navigation, Store, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Store {
  id: number;
  name: string;
  type: string;
  distance: string;
  priceRank: 1 | 2 | 3;
  lat: number;
  lng: number;
}

const mockStores: Store[] = [
  { id: 1, name: "Mercado Bom Preço", type: "Mercado", distance: "0.5 km", priceRank: 1, lat: -22.8784, lng: -43.5963 },
  { id: 2, name: "Super Economia", type: "Mercado", distance: "0.8 km", priceRank: 2, lat: -22.8794, lng: -43.5973 },
  { id: 3, name: "Farmácia Saúde", type: "Farmácia", distance: "1.2 km", priceRank: 1, lat: -22.8774, lng: -43.5953 },
  { id: 4, name: "Petshop Amigo", type: "Petshop", distance: "1.5 km", priceRank: 3, lat: -22.8804, lng: -43.5983 },
];

export default function Radar() {
  const navigate = useNavigate();
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const getRankBadge = (rank: 1 | 2 | 3) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-green-500 text-white">Mais Barato</Badge>;
      case 2:
        return <Badge className="bg-yellow-500 text-white">Preço Médio</Badge>;
      case 3:
        return <Badge className="bg-orange-500 text-white">Mais Caro</Badge>;
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-white sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Radar de Preços</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Map Placeholder */}
        <div className="relative h-80 bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Navigation className="h-16 w-16 mx-auto text-primary animate-pulse" />
              <p className="text-sm text-muted-foreground px-4">
                Mapa interativo em desenvolvimento
                <br />
                Mostrará comércios próximos em tempo real
              </p>
            </div>
          </div>

          {/* User Location Marker */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-lg animate-pulse" />
          </div>
        </div>

        {/* Stores List */}
        <div className="px-4 py-6 space-y-3">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Comércios Próximos
          </h2>

          {mockStores.map((store) => (
            <Card
              key={store.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedStore?.id === store.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedStore(store)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{store.name}</h3>
                        <p className="text-sm text-muted-foreground">{store.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getRankBadge(store.priceRank)}
                      <span className="text-sm text-muted-foreground">
                        📍 {store.distance}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <div className="px-4 pb-6">
          <Card className="bg-accent/10">
            <CardContent className="p-4">
              <p className="text-sm text-center">
                💡 <strong>Dica:</strong> Toque em um estabelecimento para ver mais detalhes e comparar preços de produtos específicos.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
