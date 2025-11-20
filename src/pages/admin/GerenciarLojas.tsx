import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, MapPin } from "lucide-react";
import { LoadScript, GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];
const mapContainerStyle = {
  width: "100%",
  height: "400px",
};
const defaultCenter = {
  lat: -23.550520,
  lng: -46.633308,
};

interface Loja {
  id: string;
  nome: string;
  endereco: string;
  categoria_id: string | null;
  telefone: string | null;
  horario: string | null;
  foto_url: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

interface Categoria {
  id: string;
  nome: string;
}

export default function GerenciarLojas() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoja, setEditingLoja] = useState<Loja | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [formData, setFormData] = useState({
    latitude: "",
    longitude: "",
    endereco: "",
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
      toast.error("Acesso negado");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const [lojasData, categoriasData] = await Promise.all([
        supabase.from("lojas").select("*").order("nome"),
        supabase.from("categorias_lojas").select("*").order("nome"),
      ]);

      if (lojasData.error) throw lojasData.error;
      if (categoriasData.error) throw categoriasData.error;

      setLojas(lojasData.data || []);
      setCategorias(categoriasData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const lojaData = {
      nome: formData.get("nome") as string,
      endereco: formData.get("endereco") as string,
      categoria_id: formData.get("categoria_id") as string || null,
      telefone: formData.get("telefone") as string || null,
      horario: formData.get("horario") as string || null,
      foto_url: formData.get("foto_url") as string || null,
      latitude: formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null,
      longitude: formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null,
    };

    try {
      if (editingLoja) {
        const { error } = await supabase
          .from("lojas")
          .update(lojaData)
          .eq("id", editingLoja.id);
        if (error) throw error;
        toast.success("Loja atualizada com sucesso");
      } else {
        const { error } = await supabase.from("lojas").insert([lojaData]);
        if (error) throw error;
        toast.success("Loja cadastrada com sucesso");
      }

      setDialogOpen(false);
      setEditingLoja(null);
      fetchData();
    } catch (error) {
      console.error("Error saving store:", error);
      toast.error("Erro ao salvar loja");
    }
  };

  const toggleStatus = async (loja: Loja) => {
    try {
      const { error } = await supabase
        .from("lojas")
        .update({ is_active: !loja.is_active })
        .eq("id", loja.id);

      if (error) throw error;
      toast.success(loja.is_active ? "Loja desativada" : "Loja ativada");
      fetchData();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Erro ao alterar status");
    }
  };

  const openEditDialog = (loja: Loja) => {
    setEditingLoja(loja);
    const lat = loja.latitude ?? defaultCenter.lat;
    const lng = loja.longitude ?? defaultCenter.lng;
    setMapCenter({ lat, lng });
    setMarkerPosition({ lat, lng });
    setFormData({
      latitude: loja.latitude?.toString() || "",
      longitude: loja.longitude?.toString() || "",
      endereco: loja.endereco || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingLoja(null);
    setMapCenter(defaultCenter);
    setMarkerPosition(defaultCenter);
    setFormData({
      latitude: "",
      longitude: "",
      endereco: "",
    });
  };

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMapCenter({ lat, lng });
        setMarkerPosition({ lat, lng });
        setFormData(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
          endereco: place.formatted_address || prev.endereco,
        }));
      }
    }
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      setFormData(prev => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gerenciar Lojas</h1>
              <p className="text-muted-foreground">Cadastre e gerencie as lojas do sistema</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-[#1976D2] hover:bg-[#1565C0]" 
                onClick={() => {
                  setEditingLoja(null);
                  setMapCenter(defaultCenter);
                  setMarkerPosition(defaultCenter);
                  setFormData({
                    latitude: "",
                    longitude: "",
                    endereco: "",
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Loja
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingLoja ? "Editar Loja" : "Cadastrar Nova Loja"}</DialogTitle>
              </DialogHeader>
              <LoadScript
                googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                libraries={libraries}
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome da Loja *</Label>
                    <Input
                      id="nome"
                      name="nome"
                      defaultValue={editingLoja?.nome}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="endereco">Endereço *</Label>
                    <Autocomplete
                      onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                      onPlaceChanged={handlePlaceSelect}
                    >
                      <Input
                        id="endereco"
                        name="endereco"
                        value={formData.endereco}
                        onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                        placeholder="Digite o endereço e selecione uma opção"
                        required
                      />
                    </Autocomplete>
                  </div>

                <div>
                  <Label htmlFor="categoria_id">Categoria</Label>
                  <Select name="categoria_id" defaultValue={editingLoja?.categoria_id || ""}>
                    <SelectTrigger>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      defaultValue={editingLoja?.telefone || ""}
                      placeholder="(21) 99999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="horario">Horário</Label>
                    <Input
                      id="horario"
                      name="horario"
                      defaultValue={editingLoja?.horario || ""}
                      placeholder="Seg-Sex: 8h-18h"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="foto_url">URL da Foto</Label>
                  <Input
                    id="foto_url"
                    name="foto_url"
                    defaultValue={editingLoja?.foto_url || ""}
                    placeholder="https://exemplo.com/foto.jpg"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Localização no Mapa
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Arraste o pin para a localização exata ou busque pelo endereço acima
                  </p>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={15}
                  >
                    <Marker
                      position={markerPosition}
                      draggable={true}
                      onDragEnd={handleMarkerDragEnd}
                    />
                  </GoogleMap>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      type="number"
                      step="0.00000001"
                      value={formData.latitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                      placeholder="-22.9035"
                    />
                  </div>

                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      type="number"
                      step="0.00000001"
                      value={formData.longitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                      placeholder="-43.2096"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-[#1976D2] hover:bg-[#1565C0]">
                    {editingLoja ? "Atualizar" : "Cadastrar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeDialog} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </form>
              </LoadScript>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lojas.map((loja) => (
            <Card key={loja.id} className={!loja.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{loja.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {loja.endereco}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(loja)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {loja.telefone && (
                    <p><strong>Telefone:</strong> {loja.telefone}</p>
                  )}
                  {loja.horario && (
                    <p><strong>Horário:</strong> {loja.horario}</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">
                      {loja.is_active ? "Ativa" : "Desativada"}
                    </span>
                    <Switch
                      checked={loja.is_active}
                      onCheckedChange={() => toggleStatus(loja)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {lojas.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Nenhuma loja cadastrada ainda.</p>
            <p className="text-sm text-muted-foreground mt-2">Clique em "Nova Loja" para começar.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
