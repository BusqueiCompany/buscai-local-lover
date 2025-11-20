import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { createAuditLog } from "@/utils/auditLog";

interface LojaPreview {
  serial?: string;
  nome: string;
  categoria: string;
  endereco: string;
  latitude?: number;
  longitude?: number;
  telefone?: string;
  horario?: string;
  foto_url?: string;
  status: string;
  valid: boolean;
  error?: string;
}

export default function ImportarLojas() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<LojaPreview[]>([]);
  const [dryRun, setDryRun] = useState(true);
  const [importing, setImporting] = useState(false);
  const [categorias, setCategorias] = useState<Record<string, string>>({});

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    await parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    const text = await file.text();
    const isCSV = file.name.endsWith(".csv");

    const { data: categoriasData } = await supabase
      .from("categorias_lojas")
      .select("id, nome");
    
    const categoriaMap: Record<string, string> = {};
    categoriasData?.forEach(cat => {
      categoriaMap[cat.nome.toLowerCase()] = cat.id;
    });
    setCategorias(categoriaMap);

    if (isCSV) {
      parseCSV(text, categoriaMap);
    } else {
      parseTXT(text, categoriaMap);
    }
  };

  const parseCSV = (text: string, categoriaMap: Record<string, string>) => {
    const lines = text.split("\n").filter(line => line.trim());
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const lojas: LojaPreview[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const loja: any = {};
      headers.forEach((header, index) => {
        loja[header] = values[index];
      });

      const preview: LojaPreview = {
        serial: loja.serial,
        nome: loja.name || loja.nome,
        categoria: loja.category || loja.categoria,
        endereco: loja.address || loja.endereco,
        latitude: parseFloat(loja.lat || loja.latitude),
        longitude: parseFloat(loja.lng || loja.longitude),
        telefone: loja.phone || loja.telefone,
        horario: loja.hours || loja.horario,
        foto_url: loja.cover_url || loja.foto_url,
        status: loja.status || "draft",
        valid: true,
      };

      if (!preview.nome) {
        preview.valid = false;
        preview.error = "Nome é obrigatório";
      } else if (!preview.endereco) {
        preview.valid = false;
        preview.error = "Endereço é obrigatório";
      } else if (!categoriaMap[preview.categoria?.toLowerCase()]) {
        preview.valid = false;
        preview.error = "Categoria inválida";
      }

      lojas.push(preview);
    }

    setPreview(lojas);
  };

  const parseTXT = (text: string, categoriaMap: Record<string, string>) => {
    const blocks = text.split("[Loja]").filter(b => b.trim());
    const lojas: LojaPreview[] = [];

    blocks.forEach(block => {
      const lines = block.split("\n").filter(l => l.trim());
      const loja: any = {};

      lines.forEach(line => {
        const [key, ...valueParts] = line.split(":");
        if (key && valueParts.length > 0) {
          const value = valueParts.join(":").trim();
          loja[key.trim().toLowerCase()] = value;
        }
      });

      const preview: LojaPreview = {
        serial: loja.serial,
        nome: loja.nome || loja.name,
        categoria: loja.categoria || loja.category,
        endereco: loja.endereco || loja.address,
        latitude: parseFloat(loja.lat || loja.latitude),
        longitude: parseFloat(loja.lng || loja.longitude),
        telefone: loja.telefone || loja.phone,
        horario: loja.horario || loja.hours,
        foto_url: loja.cover || loja.foto_url,
        status: loja.status || "draft",
        valid: true,
      };

      if (!preview.nome) {
        preview.valid = false;
        preview.error = "Nome é obrigatório";
      } else if (!preview.endereco) {
        preview.valid = false;
        preview.error = "Endereço é obrigatório";
      } else if (!categoriaMap[preview.categoria?.toLowerCase()]) {
        preview.valid = false;
        preview.error = "Categoria inválida";
      }

      lojas.push(preview);
    });

    setPreview(lojas);
  };

  const handleImport = async () => {
    if (!preview.length) return;

    const validLojas = preview.filter(l => l.valid);
    if (validLojas.length === 0) {
      toast.error("Nenhuma loja válida para importar");
      return;
    }

    if (dryRun) {
      toast.info(`Modo simulação: ${validLojas.length} lojas seriam importadas`);
      return;
    }

    setImporting(true);

    try {
      const insertData = validLojas.map(loja => ({
        serial: loja.serial || undefined,
        nome: loja.nome,
        endereco: loja.endereco,
        categoria_id: categorias[loja.categoria.toLowerCase()],
        latitude: loja.latitude,
        longitude: loja.longitude,
        telefone: loja.telefone,
        horario: loja.horario,
        foto_url: loja.foto_url,
        status: loja.status,
        is_active: loja.status === "published",
      }));

      const { data, error } = await supabase
        .from("lojas")
        .insert(insertData)
        .select();

      if (error) throw error;

      await createAuditLog({
        action: "IMPORT_STORES",
        target_type: "lojas",
        data_diff: { count: data.length, file: file?.name },
      });

      toast.success(`${data.length} lojas importadas com sucesso`);
      setPreview([]);
      setFile(null);
    } catch (error) {
      console.error("Error importing stores:", error);
      toast.error("Erro ao importar lojas");
    } finally {
      setImporting(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Importar Lojas</h2>
          <p className="text-muted-foreground">Importar lojas em lote via CSV ou TXT</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file">Arquivo CSV ou TXT</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                CSV: serial,name,category,address,lat,lng,phone,hours,cover_url,status
              </p>
              <p className="text-xs text-muted-foreground">
                TXT: formato [Loja] com campos Nome:, Categoria:, etc.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="dryRun"
                checked={dryRun}
                onCheckedChange={setDryRun}
              />
              <Label htmlFor="dryRun">Modo simulação (dry-run)</Label>
            </div>
          </CardContent>
        </Card>

        {preview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Preview da Importação ({preview.length} lojas)</span>
                <Button
                  onClick={handleImport}
                  disabled={importing || preview.filter(l => l.valid).length === 0}
                >
                  {dryRun ? "Simular" : "Confirmar"} Importação
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((loja, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {loja.valid ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>{loja.serial || "Auto"}</TableCell>
                      <TableCell>{loja.nome}</TableCell>
                      <TableCell>{loja.categoria}</TableCell>
                      <TableCell className="max-w-xs truncate">{loja.endereco}</TableCell>
                      <TableCell className="text-red-500">{loja.error}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
