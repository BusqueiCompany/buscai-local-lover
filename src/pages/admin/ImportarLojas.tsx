import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Upload, AlertCircle } from "lucide-react";

interface ParsedLoja {
  categoria: string;
  nome: string;
  endereco: string;
  latitude: number | null;
  longitude: number | null;
  produtos: Array<{
    nome: string;
    preco: number;
  }>;
}

export default function ImportarLojas() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedLoja | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
      toast.error("Acesso negado");
    }
  }, [isAdmin, loading, navigate]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      toast.error("Por favor, selecione um arquivo .txt");
      return;
    }

    setSelectedFile(file);
    const content = await file.text();
    parseFile(content);
  };

  const parseFile = (content: string) => {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const parsed: ParsedLoja = {
      categoria: '',
      nome: '',
      endereco: '',
      latitude: null,
      longitude: null,
      produtos: []
    };
    const validationErrors: string[] = [];

    let currentProduto: { nome: string; preco: number } | null = null;

    for (const line of lines) {
      if (line.startsWith('[Categoria]')) {
        parsed.categoria = line.replace('[Categoria]', '').trim();
      } else if (line.startsWith('[Nome]')) {
        parsed.nome = line.replace('[Nome]', '').trim();
      } else if (line.startsWith('[Endereço]')) {
        parsed.endereco = line.replace('[Endereço]', '').trim();
      } else if (line.startsWith('[Lat]')) {
        const lat = parseFloat(line.replace('[Lat]', '').trim());
        parsed.latitude = isNaN(lat) ? null : lat;
      } else if (line.startsWith('[Lng]')) {
        const lng = parseFloat(line.replace('[Lng]', '').trim());
        parsed.longitude = isNaN(lng) ? null : lng;
      } else if (line.startsWith('[Produto]')) {
        if (currentProduto && currentProduto.nome) {
          parsed.produtos.push(currentProduto);
        }
        currentProduto = {
          nome: line.replace('[Produto]', '').trim(),
          preco: 0
        };
      } else if (line.startsWith('[Preço]') && currentProduto) {
        const preco = parseFloat(line.replace('[Preço]', '').trim().replace(',', '.'));
        currentProduto.preco = isNaN(preco) ? 0 : preco;
      }
    }

    if (currentProduto && currentProduto.nome) {
      parsed.produtos.push(currentProduto);
    }

    // Validations
    if (!parsed.nome) validationErrors.push("Nome da loja é obrigatório");
    if (!parsed.endereco) validationErrors.push("Endereço é obrigatório");
    if (!parsed.categoria) validationErrors.push("Categoria é obrigatória");
    if (parsed.latitude === null) validationErrors.push("Latitude é obrigatória");
    if (parsed.longitude === null) validationErrors.push("Longitude é obrigatória");
    if (parsed.produtos.length === 0) validationErrors.push("Pelo menos um produto é obrigatório");

    setErrors(validationErrors);
    setParsedData(parsed);
  };

  const handleImport = async () => {
    if (!parsedData || errors.length > 0) {
      toast.error("Corrija os erros antes de importar");
      return;
    }

    setIsImporting(true);

    try {
      // 1. Verificar/Criar Categoria
      let categoriaId: string;
      const { data: existingCategoria } = await supabase
        .from("categorias_lojas")
        .select("id")
        .eq("nome", parsedData.categoria)
        .single();

      if (existingCategoria) {
        categoriaId = existingCategoria.id;
      } else {
        const { data: newCategoria, error: categoriaError } = await supabase
          .from("categorias_lojas")
          .insert({ nome: parsedData.categoria })
          .select("id")
          .single();

        if (categoriaError) throw categoriaError;
        categoriaId = newCategoria.id;
      }

      // 2. Criar Loja
      const { data: newLoja, error: lojaError } = await supabase
        .from("lojas")
        .insert({
          nome: parsedData.nome,
          endereco: parsedData.endereco,
          categoria_id: categoriaId,
          latitude: parsedData.latitude,
          longitude: parsedData.longitude,
          is_active: true
        })
        .select("id")
        .single();

      if (lojaError) throw lojaError;

      // 3. Criar Produtos e Preços
      for (const produto of parsedData.produtos) {
        // Verificar se produto existe
        let produtoId: string;
        const { data: existingProduto } = await supabase
          .from("produtos")
          .select("id")
          .eq("nome", produto.nome)
          .single();

        if (existingProduto) {
          produtoId = existingProduto.id;
        } else {
          const { data: newProduto, error: produtoError } = await supabase
            .from("produtos")
            .insert({ nome: produto.nome })
            .select("id")
            .single();

          if (produtoError) throw produtoError;
          produtoId = newProduto.id;
        }

        // Criar relação produto-loja
        const { data: produtoLoja, error: produtoLojaError } = await supabase
          .from("produtos_lojas")
          .insert({
            loja_id: newLoja.id,
            produto_id: produtoId,
            preco_atual: produto.preco,
            promocao_percentual: 0,
            economia_valor: 0
          })
          .select("id")
          .single();

        if (produtoLojaError) throw produtoLojaError;

        // Criar histórico de preço
        await supabase
          .from("historico_precos")
          .insert({
            produto_loja_id: produtoLoja.id,
            preco: produto.preco
          });
      }

      toast.success(`✅ Loja importada com sucesso! ${parsedData.produtos.length} produtos cadastrados.`);
      
      // Limpar formulário
      setSelectedFile(null);
      setParsedData(null);
      setErrors([]);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error("Error importing loja:", error);
      toast.error("Erro ao importar loja");
    } finally {
      setIsImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/dashboard")}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Markets Importer</h1>
            <p className="text-muted-foreground">Importar lojas via arquivo .txt</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Área de Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Arquivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <Input
                    id="file-input"
                    type="file"
                    accept=".txt"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Selecione um arquivo .txt com os dados da loja
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold mb-2">Formato do arquivo:</p>
                  <pre className="text-xs overflow-x-auto">
{`[Categoria] NomeDaCategoria
[Nome] NomeDoComercio
[Endereço] EnderecoCompleto
[Lat] -00.000000
[Lng] -00.000000

[Produto] Produto 1
[Preço] 0.00

[Produto] Produto 2
[Preço] 0.00`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Área de Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview dos Dados</CardTitle>
            </CardHeader>
            <CardContent>
              {!parsedData ? (
                <div className="text-center text-muted-foreground py-12">
                  <p>Selecione um arquivo para visualizar os dados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>⚠️ Existem campos obrigatórios vazios:</strong>
                        <ul className="list-disc list-inside mt-2">
                          {errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <div>
                      <strong>Categoria:</strong>{" "}
                      {parsedData.categoria || <Badge variant="destructive">Vazio</Badge>}
                    </div>
                    <div>
                      <strong>Nome:</strong>{" "}
                      {parsedData.nome || <Badge variant="destructive">Vazio</Badge>}
                    </div>
                    <div>
                      <strong>Endereço:</strong>{" "}
                      {parsedData.endereco || <Badge variant="destructive">Vazio</Badge>}
                    </div>
                    <div>
                      <strong>Coordenadas:</strong>{" "}
                      {parsedData.latitude !== null && parsedData.longitude !== null
                        ? `${parsedData.latitude}, ${parsedData.longitude}`
                        : <Badge variant="destructive">Inválidas</Badge>}
                    </div>
                  </div>

                  <div>
                    <strong className="block mb-2">Produtos ({parsedData.produtos.length}):</strong>
                    <div className="space-y-2">
                      {parsedData.produtos.map((produto, i) => (
                        <div key={i} className="flex justify-between items-center bg-muted p-2 rounded">
                          <span>{produto.nome}</span>
                          <Badge>R$ {produto.preco.toFixed(2)}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleImport}
                    disabled={errors.length > 0 || isImporting}
                    className="w-full"
                  >
                    {isImporting ? "Importando..." : "Importar Loja"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
