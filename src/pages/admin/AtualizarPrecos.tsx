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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Plus, DollarSign, TrendingDown, History } from "lucide-react";
import { format } from "date-fns";

interface Loja {
  id: string;
  nome: string;
}

interface Produto {
  id: string;
  nome: string;
}

interface ProdutoLoja {
  id: string;
  produto_id: string;
  loja_id: string;
  preco_atual: number;
  promocao_percentual: number;
  economia_valor: number;
  produtos: { nome: string };
  lojas: { nome: string };
}

interface HistoricoPreco {
  id: string;
  preco: number;
  created_at: string;
}

export default function AtualizarPrecos() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosLojas, setProdutosLojas] = useState<ProdutoLoja[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedProdutoLoja, setSelectedProdutoLoja] = useState<ProdutoLoja | null>(null);
  const [historico, setHistorico] = useState<HistoricoPreco[]>([]);
  const [filterLoja, setFilterLoja] = useState<string>("all");

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
      const [lojasData, produtosData, produtosLojasData] = await Promise.all([
        supabase.from("lojas").select("id, nome").eq("is_active", true).order("nome"),
        supabase.from("produtos").select("id, nome").order("nome"),
        supabase
          .from("produtos_lojas")
          .select("*, produtos(nome), lojas(nome)")
          .order("created_at", { ascending: false }),
      ]);

      if (lojasData.error) throw lojasData.error;
      if (produtosData.error) throw produtosData.error;
      if (produtosLojasData.error) throw produtosLojasData.error;

      setLojas(lojasData.data || []);
      setProdutos(produtosData.data || []);
      setProdutosLojas(produtosLojasData.data || []);
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

    const produtoId = formData.get("produto_id") as string;
    const lojaId = formData.get("loja_id") as string;
    const precoAtual = parseFloat(formData.get("preco_atual") as string);
    const promocaoPercentual = parseFloat(formData.get("promocao_percentual") as string) || 0;
    
    const economiaValor = (precoAtual * promocaoPercentual) / 100;

    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from("produtos_lojas")
        .select("id")
        .eq("produto_id", produtoId)
        .eq("loja_id", lojaId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("produtos_lojas")
          .update({
            preco_atual: precoAtual,
            promocao_percentual: promocaoPercentual,
            economia_valor: economiaValor,
          })
          .eq("id", existing.id);

        if (error) throw error;

        // Add to history
        await supabase.from("historico_precos").insert({
          produto_loja_id: existing.id,
          preco: precoAtual,
        });
      } else {
        // Insert new
        const { data: newProdutoLoja, error } = await supabase
          .from("produtos_lojas")
          .insert({
            produto_id: produtoId,
            loja_id: lojaId,
            preco_atual: precoAtual,
            promocao_percentual: promocaoPercentual,
            economia_valor: economiaValor,
          })
          .select()
          .single();

        if (error) throw error;

        // Add to history
        await supabase.from("historico_precos").insert({
          produto_loja_id: newProdutoLoja.id,
          preco: precoAtual,
        });
      }

      toast.success("Preço atualizado com sucesso");
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving price:", error);
      toast.error("Erro ao atualizar preço");
    }
  };

  const viewHistory = async (produtoLoja: ProdutoLoja) => {
    setSelectedProdutoLoja(produtoLoja);
    try {
      const { data, error } = await supabase
        .from("historico_precos")
        .select("*")
        .eq("produto_loja_id", produtoLoja.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistorico(data || []);
      setHistoryDialogOpen(true);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Erro ao carregar histórico");
    }
  };

  const filteredProdutosLojas = filterLoja === "all"
    ? produtosLojas
    : produtosLojas.filter(pl => pl.loja_id === filterLoja);

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
              <h1 className="text-3xl font-bold">Atualizar Preços</h1>
              <p className="text-muted-foreground">Gerencie os preços e promoções</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1976D2] hover:bg-[#1565C0]">
                <Plus className="h-4 w-4 mr-2" />
                Novo Preço
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar/Atualizar Preço</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="loja_id">Loja *</Label>
                  <Select name="loja_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma loja" />
                    </SelectTrigger>
                    <SelectContent>
                      {lojas.map((loja) => (
                        <SelectItem key={loja.id} value={loja.id}>
                          {loja.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="produto_id">Produto *</Label>
                  <Select name="produto_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id}>
                          {produto.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="preco_atual">Preço Atual (R$) *</Label>
                  <Input
                    id="preco_atual"
                    name="preco_atual"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="promocao_percentual">Promoção (%) </Label>
                  <Input
                    id="promocao_percentual"
                    name="promocao_percentual"
                    type="number"
                    step="0.01"
                    placeholder="0"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-[#1976D2] hover:bg-[#1565C0]">
                    Salvar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <Label>Filtrar por Loja</Label>
          <Select value={filterLoja} onValueChange={setFilterLoja}>
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as lojas</SelectItem>
              {lojas.map((loja) => (
                <SelectItem key={loja.id} value={loja.id}>
                  {loja.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Preços Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Promoção</TableHead>
                  <TableHead>Economia</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProdutosLojas.map((pl) => (
                  <TableRow key={pl.id}>
                    <TableCell className="font-medium">{pl.produtos.nome}</TableCell>
                    <TableCell>{pl.lojas.nome}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-[#1976D2]" />
                        R$ {pl.preco_atual.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {pl.promocao_percentual > 0 && (
                        <div className="flex items-center gap-1 text-[#FF7A00]">
                          <TrendingDown className="h-4 w-4" />
                          {pl.promocao_percentual}%
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-green-600">
                      {pl.economia_valor > 0 && `R$ ${pl.economia_valor.toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewHistory(pl)}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredProdutosLojas.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {filterLoja === "all"
                    ? "Nenhum preço cadastrado ainda."
                    : "Nenhum preço cadastrado para esta loja."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Histórico de Preços</DialogTitle>
              {selectedProdutoLoja && (
                <p className="text-sm text-muted-foreground">
                  {selectedProdutoLoja.produtos.nome} - {selectedProdutoLoja.lojas.nome}
                </p>
              )}
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {historico.map((h) => (
                <div key={h.id} className="flex justify-between items-center p-3 border rounded">
                  <span className="font-medium">R$ {h.preco.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(h.created_at), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
              ))}
              {historico.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum histórico disponível
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
