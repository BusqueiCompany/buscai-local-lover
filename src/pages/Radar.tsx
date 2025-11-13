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
        return <Badge className="bg-radar-green text-white border-0 shadow-sm">Mais Barato</Badge>;
      case 2:
        return <Badge className="bg-radar-yellow text-white border-0 shadow-sm">Preço Médio</Badge>;
      case 3:
        return <Badge className="bg-radar-red text-white border-0 shadow-sm">Mais Caro</Badge>;
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-lg mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-radar-title drop-shadow-sm">Radar de Preços</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Map Placeholder */}
        <div className="relative h-80 bg-gradient-to-br from-background to-muted/30">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 px-6">
              <div className="relative">
                <Navigation className="h-12 w-12 mx-auto text-radar-orange animate-pulse drop-shadow-lg" />
                <div className="absolute -inset-2 bg-radar-orange/10 rounded-full blur-xl" />
              </div>
              <p className="text-sm text-foreground/70 font-medium">
                Mapa interativo em desenvolvimento
                <br />
                <span className="text-xs text-muted-foreground">Mostrará comércios próximos em tempo real</span>
              </p>
            </div>
          </div>

          {/* User Location Marker */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="h-3 w-3 rounded-full bg-radar-blue border-2 border-white shadow-lg animate-pulse" />
              <div className="absolute inset-0 h-3 w-3 rounded-full bg-radar-blue/30 animate-ping" />
            </div>
          </div>
        </div>

        {/* Stores List */}
        <div className="px-6 py-6 space-y-3">
          <h2 className="font-bold text-lg flex items-center gap-2 mb-4 text-foreground">
            <Store className="h-5 w-5 text-radar-orange" />
            Comércios Próximos
          </h2>

          <div className="space-y-3">
            {mockStores.map((store) => (
              <Card
                key={store.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 rounded-[14px] border border-border/50 ${
                  selectedStore?.id === store.id ? "ring-2 ring-radar-orange shadow-lg" : "shadow-sm"
                }`}
                onClick={() => setSelectedStore(store)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Store className="h-5 w-5 text-radar-orange" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-foreground">{store.name}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{store.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {getRankBadge(store.priceRank)}
                        <div className="flex items-center gap-1.5 text-sm font-medium text-radar-pink">
                          <MapPin className="h-4 w-4" />
                          <span>{store.distance}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="px-6 pb-6">
          <Card className="bg-radar-orange/5 border-radar-orange/20 rounded-[14px] shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-center text-foreground/80 leading-relaxed">
                💡 <strong className="text-foreground">Dica:</strong> Toque em um estabelecimento para ver mais detalhes e comparar preços de produtos específicos.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
