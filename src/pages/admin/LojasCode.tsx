import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Pencil, Upload, Eye, Copy } from "lucide-react";

interface Loja {
  id: string;
  serial: string;
  nome: string;
  categoria_id: string | null;
  status: string;
}

interface Categoria {
  id: string;
  nome: string;
}

export default function LojasCode() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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
        supabase.from("lojas").select("id, serial, nome, categoria_id, status").order("serial"),
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

  const getCategoriaName = (categoriaId: string | null) => {
    if (!categoriaId) return "Sem categoria";
    const categoria = categorias.find((c) => c.id === categoriaId);
    return categoria?.nome || "Sem categoria";
  };

  const filteredLojas = lojas.filter((loja) => {
    const matchesSearch =
      loja.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loja.serial.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || loja.categoria_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência`);
  };

  if (loading || authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Lojas Code</h2>
          <p className="text-muted-foreground">Visualizar IDs e Serials de todas as lojas</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome ou serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredLojas.map((loja) => (
            <Card key={loja.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{loja.nome}</CardTitle>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">ID:</span>
                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                          {loja.id.substring(0, 8)}...
                        </code>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(loja.id, "ID")}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Serial:</span>
                        <Badge variant="outline" className="font-mono">
                          {loja.serial}
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(loja.serial, "Serial")}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Categoria:</span>
                        <Badge variant="secondary">
                          {getCategoriaName(loja.categoria_id)}
                        </Badge>
                      </div>
                      <Badge variant={loja.status === "published" ? "default" : "secondary"}>
                        {loja.status === "published" ? "Publicado" : "Rascunho"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/lojas?edit=${loja.id}`)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/importar-produtos?loja=${loja.serial}`)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Importar Produtos
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/produtos?loja=${loja.serial}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Produtos
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}

          {filteredLojas.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma loja encontrada</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}