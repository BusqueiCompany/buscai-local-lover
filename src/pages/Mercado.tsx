import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Store, MapPin, Phone, Clock, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BottomNav } from "@/components/ui/bottom-nav";

interface Store {
  id: string;
  nome: string;
  endereco: string;
  telefone?: string;
  horario?: string;
  foto_url?: string;
  categoria?: string;
}

export default function Mercado() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

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
          foto_url,
          categorias_lojas:categoria_id(nome)
        `)
        .eq("is_active", true);

      if (error) throw error;

      // Filtrar apenas lojas da categoria Mercado
      const mercadoStores = (data || [])
        .filter((store: any) => store.categorias_lojas?.nome === "Mercado")
        .map((store: any) => ({
          id: store.id,
          nome: store.nome,
          endereco: store.endereco,
          telefone: store.telefone,
          horario: store.horario,
          foto_url: store.foto_url,
          categoria: store.categorias_lojas?.nome || "Outros",
        }));

      setStores(mercadoStores);
    } catch (error) {
      console.error("Erro ao buscar mercados:", error);
      toast.error("Erro ao carregar mercados");
    } finally {
      setLoading(false);
    }
  };

  const handleStoreClick = (store: Store) => {
    setSelectedStore(store);
    setDetailsOpen(true);
  };

  const handleViewProducts = async (storeId: string) => {
    setLoadingProducts(true);
    setProductsOpen(true);
    setDetailsOpen(false);

    try {
      const { data, error } = await supabase
        .from("produtos_lojas")
        .select(`
          *,
          produtos (
            id,
            nome,
            imagem_url,
            unit
          )
        `)
        .eq("loja_id", storeId);

      if (error) throw error;

      setStoreProducts(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos do mercado");
    } finally {
      setLoadingProducts(false);
    }
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
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Mercados</h1>
              <p className="text-sm text-muted-foreground">
                {stores.length} {stores.length === 1 ? "mercado disponível" : "mercados disponíveis"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Carregando mercados...</p>
          </div>
        ) : stores.length === 0 ? (
          <Card className="rounded-xl border border-border/50 shadow-sm">
            <CardContent className="p-12 text-center">
              <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum mercado cadastrado</h3>
              <p className="text-muted-foreground">
                Em breve teremos mercados disponíveis na sua região
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2 text-foreground">
              <Store className="h-5 w-5 text-primary" />
              Mercados Disponíveis
            </h2>

            <div className="space-y-3">
              {stores.map((store) => (
                <Card
                  key={store.id}
                  className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 rounded-xl border border-border/50 shadow-sm"
                  onClick={() => handleStoreClick(store)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {store.foto_url ? (
                        <img
                          src={store.foto_url}
                          alt={store.nome}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Store className="h-10 w-10 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-foreground mb-2">
                          {store.nome}
                        </h3>
                        <div className="space-y-1">
                          <Badge variant="secondary" className="text-xs mb-2">
                            {store.categoria}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{store.endereco}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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
              {selectedStore.foto_url && (
                <img
                  src={selectedStore.foto_url}
                  alt={selectedStore.nome}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

              <div>
                <Badge variant="secondary" className="mb-3">
                  {selectedStore.categoria}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
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
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="w-full"
                  onClick={() => {
                    if (selectedStore) {
                      handleViewProducts(selectedStore.id);
                    }
                  }}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Ver Produtos
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Products Dialog */}
      <Dialog open={productsOpen} onOpenChange={setProductsOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] z-[9999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Package className="h-6 w-6 text-primary" />
              Produtos - {selectedStore?.nome}
            </DialogTitle>
            <DialogDescription className="text-base">
              {storeProducts.length} {storeProducts.length === 1 ? 'produto disponível' : 'produtos disponíveis'}
            </DialogDescription>
          </DialogHeader>

          {loadingProducts ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Carregando produtos...</p>
            </div>
          ) : storeProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum produto cadastrado neste mercado</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {storeProducts.map((item) => (
                  <Card 
                    key={item.id}
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardContent className="p-0">
                      {item.produtos?.imagem_url ? (
                        <div className="relative h-40 w-full bg-muted">
                          <img
                            src={item.produtos.imagem_url}
                            alt={item.produtos?.nome}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-40 w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Package className="h-16 w-16 text-primary/30" />
                        </div>
                      )}
                      
                      <div className="p-4 space-y-3">
                        <h4 className="font-semibold text-base leading-tight line-clamp-2 min-h-[2.5rem]">
                          {item.produtos?.nome}
                        </h4>
                        
                        <div className="flex items-end justify-between">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-primary">
                                R$ {Number(item.preco_atual).toFixed(2)}
                              </span>
                              {item.produtos?.unit && (
                                <span className="text-sm text-muted-foreground">
                                  /{item.produtos.unit}
                                </span>
                              )}
                            </div>
                            {item.quantity > 0 ? (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Badge variant="secondary" className="text-xs">
                                  Estoque: {item.quantity}
                                </Badge>
                              </p>
                            ) : (
                              <p className="text-xs text-destructive mt-1">
                                Sem estoque
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
