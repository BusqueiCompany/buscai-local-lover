import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useRole } from "@/hooks/useRole";

interface Loja {
  id: string;
  nome: string;
  serial: string;
}

interface ParsedProduct {
  sku: string;
  price: number;
  unit: string;
  quantity: number;
}

export default function ImportarProdutosCSV() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useRole();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [selectedLojaId, setSelectedLojaId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (loading) return;
    
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchLojas();
  }, [isAdmin, loading, navigate]);

  const fetchLojas = async () => {
    const { data, error } = await supabase
      .from("lojas")
      .select("id, nome, serial")
      .eq("is_active", true)
      .order("nome");

    if (error) {
      toast.error("Erro ao carregar lojas");
      console.error(error);
      return;
    }

    setLojas(data || []);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    await parseCSV(selectedFile);
  };

  const parseCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split("\n").filter(line => line.trim());
    
    if (lines.length < 2) {
      toast.error("CSV vazio ou inválido");
      return;
    }

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const skuIndex = headers.indexOf("sku");
    const priceIndex = headers.indexOf("price");
    const unitIndex = headers.indexOf("unit");
    const quantityIndex = headers.indexOf("quantity");

    if (skuIndex === -1 || priceIndex === -1) {
      toast.error("CSV deve conter colunas 'sku' e 'price'");
      return;
    }

    const products: ParsedProduct[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      
      if (values.length < 2) continue;

      const product: ParsedProduct = {
        sku: values[skuIndex],
        price: parseFloat(values[priceIndex]) || 0,
        unit: unitIndex !== -1 ? values[unitIndex] : "un",
        quantity: quantityIndex !== -1 ? parseInt(values[quantityIndex]) || 0 : 0,
      };

      if (product.sku && product.price > 0) {
        products.push(product);
      }
    }

    setParsedProducts(products);
    toast.success(`${products.length} produtos encontrados no CSV`);
  };

  const handleImport = async () => {
    if (!selectedLojaId) {
      toast.error("Selecione uma loja");
      return;
    }

    if (parsedProducts.length === 0) {
      toast.error("Nenhum produto para importar");
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('import-products-csv', {
        body: {
          csvData: parsedProducts,
          lojaId: selectedLojaId,
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        console.error('Function error:', error);
        const errorMessage = error.message || JSON.stringify(error);
        toast.error(`Erro ao importar produtos: ${errorMessage}`, { duration: 8000 });
        return;
      }

      if (!data) {
        toast.error("Nenhum dado retornado da importação");
        return;
      }

      const results = data as { created: number; updated: number; errors: string[] };

      console.log('Import results:', results);

      if (results.errors.length > 0) {
        console.error('Import errors:', results.errors);
        toast.error(
          `Importação concluída com ${results.errors.length} erros. ${results.created} criados, ${results.updated} atualizados.`,
          { duration: 5000 }
        );
        // Show first 3 errors
        results.errors.slice(0, 3).forEach(err => {
          toast.error(err, { duration: 8000 });
        });
      } else {
        toast.success(
          `Importação concluída com sucesso! ${results.created} produtos criados, ${results.updated} produtos atualizados.`
        );
      }

      // Reset form
      setFile(null);
      setParsedProducts([]);
      setSelectedLojaId("");
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (error) {
      console.error('Error importing products:', error);
      toast.error("Erro ao importar produtos");
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container max-w-4xl mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/gerenciar-produtos")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Importar Produtos via CSV</CardTitle>
            <CardDescription>
              Faça upload de um CSV com colunas: sku, price, unit, quantity. 
              Os produtos serão enriquecidos automaticamente com dados da Open Food Facts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione a Loja</label>
              <Select value={selectedLojaId} onValueChange={setSelectedLojaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {lojas.map((loja) => (
                    <SelectItem key={loja.id} value={loja.id}>
                      {loja.nome} ({loja.serial})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Arquivo CSV</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="flex-1"
                  disabled={importing}
                />
              </div>
              {file && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {file.name}
                </p>
              )}
            </div>

            {parsedProducts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {parsedProducts.length} produtos encontrados
                </p>
                <div className="max-h-40 overflow-y-auto border rounded p-2 text-sm">
                  {parsedProducts.slice(0, 10).map((p, i) => (
                    <div key={i} className="py-1">
                      SKU: {p.sku} | Preço: R$ {p.price.toFixed(2)} | Unidade: {p.unit} | Qtd: {p.quantity}
                    </div>
                  ))}
                  {parsedProducts.length > 10 && (
                    <p className="text-muted-foreground pt-2">
                      ... e mais {parsedProducts.length - 10} produtos
                    </p>
                  )}
                </div>
              </div>
            )}

            {importing && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Importando produtos...</p>
                <Progress value={progress} />
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!selectedLojaId || parsedProducts.length === 0 || importing}
              className="w-full"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Produtos
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Exemplo de CSV para Teste</CardTitle>
            <CardDescription>
              Use códigos de barras reais (EAN/GTIN com 13 dígitos) para que o sistema busque automaticamente 
              os nomes e imagens dos produtos da Open Food Facts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`sku,price,unit,quantity
7894900011517,5.99,un,100
7891991000833,8.50,un,50
7896005800026,12.90,kg,30
7891000100103,3.49,un,200`}
            </pre>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Exemplos de códigos testados:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>7894900011517 - Coca-Cola 2L</li>
                <li>7891991000833 - Budweiser Lata</li>
                <li>7896005800026 - Arroz Tio João</li>
                <li>7891000100103 - Nescau Achocolatado</li>
              </ul>
              <p className="mt-3">
                <strong>Importante:</strong> Os produtos serão enriquecidos automaticamente com nome e imagem 
                da base mundial de alimentos. Se um produto não for encontrado, será cadastrado como "Produto Desconhecido".
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
