import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileText, AlertCircle } from "lucide-react";

interface ParsedProduct {
  sku: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  image_url: string;
}

interface Loja {
  id: string;
  serial: string;
  nome: string;
}

export default function ImportarProdutos() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [selectedLojaSerial, setSelectedLojaSerial] = useState(searchParams.get("loja") || "");
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [importing, setImporting] = useState(false);
  const [encoding, setEncoding] = useState<"UTF-8" | "ISO-8859-1">("UTF-8");
  const [hasEncodingIssues, setHasEncodingIssues] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
      toast.error("Acesso negado");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchLojas();
    }
  }, [isAdmin]);

  const fetchLojas = async () => {
    try {
      const { data, error } = await supabase
        .from("lojas")
        .select("id, serial, nome")
        .order("nome");

      if (error) throw error;
      setLojas(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("Erro ao carregar lojas");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File, selectedEncoding: "UTF-8" | "ISO-8859-1" = encoding) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      const products: ParsedProduct[] = [];

      // Detectar problemas de encoding
      const hasCorruptedChars = text.includes("�") || /[â€™â€œâ€�ãƒÂ£ãƒÂ§ãƒÂ³]/i.test(text);
      setHasEncodingIssues(hasCorruptedChars);

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [sku, name, price, unit, quantity, image_url] = line.split(",").map((s) => s.trim());

        products.push({
          sku: sku || "",
          name: name || "",
          price: parseFloat(price) || 0,
          unit: unit || "un",
          quantity: parseInt(quantity) || 0,
          image_url: image_url || "",
        });
      }

      setParsedProducts(products);
      
      if (hasCorruptedChars && selectedEncoding === "UTF-8") {
        toast.warning(`${products.length} produtos encontrados, mas há problemas de acentuação. Tente mudar o encoding para ISO-8859-1.`);
      } else {
        toast.success(`${products.length} produtos encontrados no arquivo`);
      }
    };

    reader.readAsText(file, selectedEncoding);
  };
  
  const handleEncodingChange = (newEncoding: "UTF-8" | "ISO-8859-1") => {
    setEncoding(newEncoding);
    if (file) {
      parseCSV(file, newEncoding);
    }
  };

  const handleImport = async () => {
    if (!selectedLojaSerial) {
      toast.error("Selecione uma loja");
      return;
    }

    if (parsedProducts.length === 0) {
      toast.error("Nenhum produto para importar");
      return;
    }

    setImporting(true);

    try {
      // Buscar loja pelo serial
      const { data: lojaData, error: lojaError } = await supabase
        .from("lojas")
        .select("id")
        .eq("serial", selectedLojaSerial)
        .single();

      if (lojaError) throw lojaError;

      let successCount = 0;

      for (const product of parsedProducts) {
        try {
          // Verificar se produto existe
          let { data: produtoData, error: produtoError } = await supabase
            .from("produtos")
            .select("id")
            .eq("nome", product.name)
            .maybeSingle();

          let produtoId: string;

          if (!produtoData) {
            // Criar produto
            const { data: newProduto, error: createError } = await supabase
              .from("produtos")
              .insert([
                {
                  nome: product.name,
                  sku: product.sku || null,
                  unit: product.unit,
                  imagem_url: product.image_url || null,
                },
              ])
              .select()
              .single();

            if (createError) throw createError;
            produtoId = newProduto.id;
          } else {
            produtoId = produtoData.id;
          }

          // Criar/atualizar relacionamento produto-loja
          const { error: relError } = await supabase
            .from("produtos_lojas")
            .upsert(
              {
                produto_id: produtoId,
                loja_id: lojaData.id,
                preco_atual: product.price,
                quantity: product.quantity,
              },
              { onConflict: "produto_id,loja_id" }
            );

          if (relError) throw relError;

          // Criar histórico de preço
          const { error: histError } = await supabase.from("historico_precos").insert([
            {
              produto_loja_id: `${produtoId}_${lojaData.id}`,
              preco: product.price,
            },
          ]);

          if (histError) console.warn("Erro ao criar histórico:", histError);

          successCount++;
        } catch (error) {
          console.error(`Erro ao importar produto ${product.name}:`, error);
        }
      }

      toast.success(`${successCount} produtos importados com sucesso!`);
      setParsedProducts([]);
      setFile(null);
    } catch (error) {
      console.error("Erro na importação:", error);
      toast.error("Erro ao importar produtos");
    } finally {
      setImporting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/importacoes")}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Importar Produtos</h1>
            <p className="text-muted-foreground">Importar produtos via CSV para uma loja</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Selecione a Loja</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="loja">Serial da Loja</Label>
              <Select value={selectedLojaSerial} onValueChange={setSelectedLojaSerial}>
                <SelectTrigger id="loja">
                  <SelectValue placeholder="Selecione uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {lojas.map((loja) => (
                    <SelectItem key={loja.id} value={loja.serial}>
                      {loja.serial} - {loja.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Upload do Arquivo CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file">Arquivo CSV</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
              </div>

              {file && (
                <div>
                  <Label htmlFor="encoding">Encoding do Arquivo</Label>
                  <Select value={encoding} onValueChange={handleEncodingChange}>
                    <SelectTrigger id="encoding">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTF-8">UTF-8 (padrão)</SelectItem>
                      <SelectItem value="ISO-8859-1">ISO-8859-1 / Latin-1 (para arquivos com problemas de acentuação)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Se os acentos estiverem errados no preview, troque para ISO-8859-1
                  </p>
                </div>
              )}

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Formato esperado do CSV:</p>
                <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
                  {`sku,name,price,unit,quantity,image_url
12345,Arroz Tipo 1,25.90,kg,100,https://...
67890,Feijão Preto,8.50,kg,50,https://...`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {parsedProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>3. Preview dos Produtos ({parsedProducts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {hasEncodingIssues && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Detectamos problemas de acentuação nos nomes dos produtos. Se os acentos estiverem incorretos, 
                      selecione <strong>ISO-8859-1</strong> no campo de encoding acima.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {parsedProducts.map((product, index) => {
                    const hasIssue = product.name.includes("�") || /[â€™â€œâ€�ãƒÂ£ãƒÂ§ãƒÂ³]/i.test(product.name);
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center gap-4 p-3 rounded-lg ${
                          hasIssue ? "bg-destructive/10 border border-destructive/20" : "bg-muted"
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            SKU: {product.sku} | R$ {product.price.toFixed(2)} | {product.unit} | Estoque: {product.quantity}
                          </p>
                        </div>
                        {hasIssue && (
                          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <Button
                  className="w-full mt-4"
                  size="lg"
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? "Importando..." : "Confirmar Importação"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}