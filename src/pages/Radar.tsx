import { useState, useEffect, useMemo } from "react";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Store, MapPin, Phone, Clock, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import MapRadar from "@/components/MapRadar";

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

export default function Radar() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  // Calcular distância usando fórmula de Haversine
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Obter categorias únicas
  const categories = useMemo(() => {
    const cats = Array.from(new Set(stores.map(s => s.categoria).filter(Boolean)));
    return ["all", ...cats];
  }, [stores]);

  // Filtrar e ordenar lojas
  const filteredAndSortedStores = useMemo(() => {
    let filtered = stores;
    
    // Filtrar por categoria
    if (selectedCategory !== "all") {
      filtered = stores.filter(s => s.categoria === selectedCategory);
    }

    // Ordenar por proximidade se tiver localização do usuário
    if (userLocation) {
      filtered = [...filtered].sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return distA - distB;
      });
    }

    return filtered;
  }, [stores, selectedCategory, userLocation]);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("lojas")
        .select(`
          id,
          nome,
          endereco,
          telefone,
          horario,
          latitude,
          longitude,
          categorias_lojas:categoria_id(nome)
        `)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .eq("is_active", true);

      if (error) throw error;

      const storesData = (data || []).map((store: any) => ({
        id: store.id,
        nome: store.nome,
        endereco: store.endereco,
        telefone: store.telefone,
        horario: store.horario,
        categoria: store.categorias_lojas?.nome || "Outros",
        latitude: Number(store.latitude),
        longitude: Number(store.longitude),
      }));

      setStores(storesData);
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
      toast.error("Erro ao carregar comércios");
    } finally {
      setLoading(false);
    }
  };

  const getStoreDistance = (store: Store) => {
    if (!userLocation) return null;
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      store.latitude,
      store.longitude
    );
    return distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`;
  };

  const handleStartRoute = (store: Store) => {
    window.dispatchEvent(new CustomEvent('start-route', { detail: store }));
    setDetailsOpen(false); // Fecha o dialog
  };

  const handleStoreClick = (store: Store) => {
    setSelectedStore(store);
    setDetailsOpen(true);
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Radar de Preços</h1>
              <p className="text-sm text-muted-foreground">{filteredAndSortedStores.length} de {stores.length} comércios</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Carregando comércios...</p>
          </div>
        ) : (
          <>
            {/* Mapa com busca e lojas */}
            <div className="mt-6">
              <MapRadar
                stores={filteredAndSortedStores}
                onStoreClick={handleStoreClick}
                onLocationChange={(coords) => setUserLocation(coords)}
              />
            </div>

            {/* Filtros de categoria */}
            <div className="pt-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="cursor-pointer whitespace-nowrap transition-all"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === "all" ? "Todos" : cat}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stores List */}
            <div className="py-4 space-y-3">
              <h2 className="font-bold text-lg flex items-center gap-2 mb-4 text-foreground">
                <Store className="h-5 w-5 text-primary" />
                Comércios {userLocation && "por Proximidade"}
              </h2>

              {filteredAndSortedStores.length === 0 ? (
                <Card className="rounded-xl border border-border/50 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      Nenhum comércio cadastrado ainda
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedStores.map((store) => (
                    <Card
                      key={store.id}
                      className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 rounded-xl border border-border/50 shadow-sm"
                      onClick={() => handleStoreClick(store)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-2 rounded-lg bg-primary/10">
                            <Store className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-foreground mb-1">
                              {store.nome}
                            </h3>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {store.categoria}
                                </Badge>
                                {userLocation && (
                                  <Badge variant="outline" className="text-xs">
                                    📍 {getStoreDistance(store)}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="truncate">{store.endereco}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="mt-4">
              <Card className="bg-primary/5 border-primary/20 rounded-xl shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-center text-foreground/80 leading-relaxed">
                    💡 <strong className="text-foreground">Dica:</strong> Toque em um estabelecimento para ver mais detalhes sobre o comércio.
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>

      {/* Store Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[425px] z-[9999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              {selectedStore?.nome}
            </DialogTitle>
          </DialogHeader>
          
          {selectedStore && (
            <div className="space-y-4 py-4">
              <div>
                <Badge variant="secondary" className="mb-3">
                  {selectedStore.categoria}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">Endereço</p>
                    <p className="text-sm text-muted-foreground">{selectedStore.endereco}</p>
                  </div>
                </div>

                {selectedStore.telefone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">Telefone</p>
                      <p className="text-sm text-muted-foreground">{selectedStore.telefone}</p>
                    </div>
                  </div>
                )}

                {selectedStore.horario && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">Horário</p>
                      <p className="text-sm text-muted-foreground">{selectedStore.horario}</p>
                    </div>
                  </div>
                )}

                {userLocation && selectedStore && (
                  <div className="flex items-start gap-3 pt-2 border-t border-border">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">Distância</p>
                      <p className="text-sm text-muted-foreground">{getStoreDistance(selectedStore)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="w-full"
                  onClick={() => {
                    if (selectedStore) {
                      handleStartRoute(selectedStore);
                    }
                  }}
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  Iniciar Rota
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
