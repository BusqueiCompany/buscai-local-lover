import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import MapRJ from "@/components/MapRJ";
import { logAdminAction } from "@/utils/auditLog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Store {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
}

export default function Mapa() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProductsDialogOpen, setIsProductsDialogOpen] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedStore, setSelectedStore] = useState<{ id: string; nome: string } | null>(null);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    telefone: "",
    categoria_id: "",
  });
  const [categorias, setCategorias] = useState<any[]>([]);

  useEffect(() => {
    fetchStores();
    fetchCategorias();
  }, []);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("lojas")
        .select("id, nome, latitude, longitude")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .eq("is_active", true);

      if (error) throw error;

      const storesData = (data || []).map((store) => ({
        id: store.id,
        nome: store.nome,
        latitude: store.latitude as number,
        longitude: store.longitude as number,
      }));

      setStores(storesData);
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
      toast.error("Erro ao carregar lojas");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias_lojas")
        .select("*")
        .order("nome");

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  const handleAdminSelect = (coords: { lat: number; lng: number }) => {
    if (!isAdmin) return;
    
    setSelectedCoords(coords);
    setIsDialogOpen(true);
  };

  const handleViewProducts = async (storeId: string, storeName: string) => {
    setSelectedStore({ id: storeId, nome: storeName });
    setIsProductsDialogOpen(true);
    setLoadingProducts(true);

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
        .eq("loja_id", storeId)
        .order("produtos(nome)");

      if (error) throw error;

      setStoreProducts(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos da loja");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !isAdmin || !selectedCoords) {
      toast.error("Acesso negado");
      return;
    }

    if (!formData.nome.trim() || !formData.endereco.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("lojas")
        .insert({
          nome: formData.nome,
          endereco: formData.endereco,
          telefone: formData.telefone || null,
          categoria_id: formData.categoria_id || null,
          latitude: selectedCoords.lat,
          longitude: selectedCoords.lng,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Log de auditoria
      await logAdminAction(
        user.id,
        "store_created_via_map",
        "lojas",
        data.id,
        null,
        {
          nome: formData.nome,
          latitude: selectedCoords.lat,
          longitude: selectedCoords.lng,
        }
      );

      toast.success("Loja adicionada com sucesso!");
      setFormData({ nome: "", endereco: "", telefone: "", categoria_id: "" });
      setSelectedCoords(null);
      setIsDialogOpen(false);
      fetchStores();
    } catch (error) {
      console.error("Erro ao adicionar loja:", error);
      toast.error("Erro ao adicionar loja");
    }
  };

  return (
    <div className="relative h-screen">
      {/* Header flutuante */}
      <div className="absolute top-0 left-0 right-0 z-[9998] bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Radar de Preços</h1>
              <p className="text-xs text-muted-foreground">
                {stores.length} lojas cadastradas
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Carregando mapa...</p>
        </div>
      ) : (
        <MapRJ 
          stores={stores} 
          onAdminSelect={isAdmin ? handleAdminSelect : undefined}
          isAdmin={isAdmin}
          onViewProducts={handleViewProducts}
        />
      )}

      {/* Dialog para adicionar loja */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Loja</DialogTitle>
            <DialogDescription>
              Coordenadas: {selectedCoords?.lat.toFixed(6)}, {selectedCoords?.lng.toFixed(6)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Loja *</Label>
              <Input
                id="nome"
                placeholder="Ex: Supermercado ABC"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                placeholder="Ex: Rua das Flores, 123"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                placeholder="(21) 99999-9999"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={formData.categoria_id}
                onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedCoords(null);
                  setFormData({ nome: "", endereco: "", telefone: "", categoria_id: "" });
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Adicionar Loja
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver produtos da loja */}
      <Dialog open={isProductsDialogOpen} onOpenChange={setIsProductsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos - {selectedStore?.nome}
            </DialogTitle>
            <DialogDescription>
              Produtos disponíveis nesta loja
            </DialogDescription>
          </DialogHeader>

          {loadingProducts ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Carregando produtos...</p>
            </div>
          ) : storeProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum produto cadastrado nesta loja</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid gap-3">
                {storeProducts.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {item.produtos?.imagem_url && (
                          <img
                            src={item.produtos.imagem_url}
                            alt={item.produtos?.nome}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.produtos?.nome}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-lg font-bold text-primary">
                              R$ {Number(item.preco_atual).toFixed(2)}
                            </span>
                            {item.produtos?.unit && (
                              <span className="text-sm text-muted-foreground">
                                por {item.produtos.unit}
                              </span>
                            )}
                          </div>
                          {item.quantity > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Estoque: {item.quantity}
                            </p>
                          )}
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
    </div>
  );
}
