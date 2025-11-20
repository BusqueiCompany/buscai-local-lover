import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNav } from "@/components/ui/bottom-nav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import MapRJ from "@/components/MapRJ";
import { logAdminAction } from "@/utils/auditLog";

interface Store {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  endereco: string;
  categoria_id: string | null;
  categoria?: {
    nome: string;
  };
}

interface Category {
  id: string;
  nome: string;
}

export default function Radar() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    telefone: "",
    categoria_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterStores();
  }, [stores, searchTerm, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchStores(), fetchCategories()]);
    setLoading(false);
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("lojas")
        .select(`
          id,
          nome,
          latitude,
          longitude,
          endereco,
          categoria_id,
          categorias_lojas:categoria_id(nome)
        `)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .eq("is_active", true);

      if (error) throw error;

      const storesData = (data || []).map((store: any) => ({
        id: store.id,
        nome: store.nome,
        latitude: store.latitude as number,
        longitude: store.longitude as number,
        endereco: store.endereco,
        categoria_id: store.categoria_id,
        categoria: store.categorias_lojas ? { nome: store.categorias_lojas.nome } : undefined,
      }));

      setStores(storesData);
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
      toast.error("Erro ao carregar lojas");
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias_lojas")
        .select("*")
        .order("nome");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  const filterStores = () => {
    let filtered = stores;

    if (searchTerm) {
      filtered = filtered.filter(
        (store) =>
          store.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          store.endereco.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((store) => store.categoria_id === selectedCategory);
    }

    setFilteredStores(filtered);
  };

  const handleAdminSelect = (coords: { lat: number; lng: number }) => {
    if (!isAdmin) return;

    setSelectedCoords(coords);
    setIsDialogOpen(true);
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

  const mapStores = filteredStores.map((store) => ({
    id: store.id,
    nome: store.nome,
    latitude: store.latitude,
    longitude: store.longitude,
  }));

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Radar de Preços</h1>
                <p className="text-xs text-muted-foreground">
                  {filteredStores.length} lojas encontradas
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-primary">
              <MapPin className="h-3 w-3 mr-1" />
              Rio de Janeiro
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="map">
              <MapPin className="h-4 w-4 mr-2" />
              Mapa
            </TabsTrigger>
            <TabsTrigger value="list">
              <Filter className="h-4 w-4 mr-2" />
              Lista
            </TabsTrigger>
          </TabsList>

          {/* Filtros */}
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou endereço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Aba do Mapa */}
          <TabsContent value="map" className="mt-0">
            <Card className="overflow-hidden">
              <div className="h-[600px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Carregando mapa...</p>
                  </div>
                ) : (
                  <MapRJ
                    stores={mapStores}
                    onAdminSelect={isAdmin ? handleAdminSelect : undefined}
                    isAdmin={isAdmin}
                  />
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Aba da Lista */}
          <TabsContent value="list" className="mt-0">
            <div className="space-y-4">
              {loading ? (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">Carregando...</p>
                  </CardContent>
                </Card>
              ) : filteredStores.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">
                      Nenhuma loja encontrada
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredStores.map((store) => (
                  <Card key={store.id} className="hover:bg-muted/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{store.nome}</CardTitle>
                          <p className="text-sm text-muted-foreground">{store.endereco}</p>
                          {store.categoria && (
                            <Badge variant="outline" className="mt-2">
                              {store.categoria.nome}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const lat = store.latitude;
                            const lng = store.longitude;
                            const map = (window as any)._leaflet_map;
                            if (map) {
                              map.setView([lat, lng], 16);
                            }
                          }}
                        >
                          Ver no Mapa
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog para adicionar loja (Admin) */}
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
                  {categories.map((cat) => (
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

      <BottomNav />
    </div>
  );
}
