import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Package } from "lucide-react";

interface Produto {
  id: string;
  nome: string;
  categoria_id: string | null;
  imagem_url: string | null;
}

interface Categoria {
  id: string;
  nome: string;
  parent_id: string | null;
}

export default function GerenciarProdutos() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<string>("all");

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
      const [produtosData, categoriasData] = await Promise.all([
        supabase.from("produtos").select("*").order("nome"),
        supabase.from("categorias_produtos").select("*").order("nome"),
      ]);

      if (produtosData.error) throw produtosData.error;
      if (categoriasData.error) throw categoriasData.error;

      setProdutos(produtosData.data || []);
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

    const produtoData = {
      nome: formData.get("nome") as string,
      categoria_id: formData.get("categoria_id") as string || null,
      imagem_url: formData.get("imagem_url") as string || null,
    };

    try {
      if (editingProduto) {
        const { error } = await supabase
          .from("produtos")
          .update(produtoData)
          .eq("id", editingProduto.id);
        if (error) throw error;
        toast.success("Produto atualizado com sucesso");
      } else {
        const { error } = await supabase.from("produtos").insert([produtoData]);
        if (error) throw error;
        toast.success("Produto cadastrado com sucesso");
      }

      setDialogOpen(false);
      setEditingProduto(null);
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Erro ao salvar produto");
    }
  };

  const openEditDialog = (produto: Produto) => {
    setEditingProduto(produto);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProduto(null);
  };

  const getCategoriaName = (categoriaId: string | null) => {
    if (!categoriaId) return "Sem categoria";
    const categoria = categorias.find((c) => c.id === categoriaId);
    return categoria?.nome || "Sem categoria";
  };

  const filteredProdutos = filterCategoria === "all" 
    ? produtos 
    : produtos.filter(p => p.categoria_id === filterCategoria);

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
              <h1 className="text-3xl font-bold">Gerenciar Produtos</h1>
              <p className="text-muted-foreground">Cadastre e gerencie os produtos do sistema</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#FF7A00] hover:bg-[#E66A00]" onClick={() => setEditingProduto(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingProduto ? "Editar Produto" : "Cadastrar Novo Produto"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Produto *</Label>
                  <Input
                    id="nome"
                    name="nome"
                    defaultValue={editingProduto?.nome}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="categoria_id">Categoria</Label>
                  <Select name="categoria_id" defaultValue={editingProduto?.categoria_id || ""}>
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

                <div>
                  <Label htmlFor="imagem_url">URL da Imagem</Label>
                  <Input
                    id="imagem_url"
                    name="imagem_url"
                    defaultValue={editingProduto?.imagem_url || ""}
                    placeholder="https://exemplo.com/produto.jpg"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-[#FF7A00] hover:bg-[#E66A00]">
                    {editingProduto ? "Atualizar" : "Cadastrar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <Label>Filtrar por Categoria</Label>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="max-w-xs">
              <SelectValue />
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProdutos.map((produto) => (
            <Card key={produto.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {produto.imagem_url ? (
                      <img
                        src={produto.imagem_url}
                        alt={produto.nome}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{produto.nome}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {getCategoriaName(produto.categoria_id)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(produto)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {filteredProdutos.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              {filterCategoria === "all" 
                ? "Nenhum produto cadastrado ainda." 
                : "Nenhum produto nesta categoria."}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Clique em "Novo Produto" para começar.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
