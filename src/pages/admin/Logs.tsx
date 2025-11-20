import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Download, Filter } from "lucide-react";
import { format } from "date-fns";

interface SystemLog {
  id: string;
  user_id_admin: string | null;
  action: string;
  target_id: string | null;
  target_type: string | null;
  data_diff: any;
  timestamp: string;
}

export default function Logs() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("system_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(500);

      if (filterAction !== "all") {
        query = query.eq("action", filterAction);
      }

      if (filterDate) {
        const startDate = new Date(filterDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(filterDate);
        endDate.setHours(23, 59, 59, 999);
        
        query = query
          .gte("timestamp", startDate.toISOString())
          .lte("timestamp", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Erro ao carregar logs");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Timestamp", "Ação", "Admin ID", "Alvo Tipo", "Alvo ID", "Dados"];
    const rows = logs.map(log => [
      format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss"),
      log.action,
      log.user_id_admin || "-",
      log.target_type || "-",
      log.target_id || "-",
      JSON.stringify(log.data_diff || {})
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-logs-${new Date().toISOString()}.csv`;
    a.click();
    toast.success("Logs exportados com sucesso");
  };

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Logs de Auditoria</h2>
            <p className="text-muted-foreground">Histórico de ações administrativas</p>
          </div>
          <Button onClick={exportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="filterAction">Ação</Label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="USER_ROLE_CHANGE">Mudança de Role</SelectItem>
                    <SelectItem value="STORE_CREATE">Criar Loja</SelectItem>
                    <SelectItem value="STORE_UPDATE">Atualizar Loja</SelectItem>
                    <SelectItem value="STORE_DELETE">Deletar Loja</SelectItem>
                    <SelectItem value="IMPORT_STORES">Importar Lojas</SelectItem>
                    <SelectItem value="IMPORT_PRODUCTS">Importar Produtos</SelectItem>
                    <SelectItem value="USER_DEACTIVATE">Desativar Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filterDate">Data</Label>
                <Input
                  id="filterDate"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button onClick={fetchLogs} className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Carregando logs...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Admin ID</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.user_id_admin?.substring(0, 8) || "-"}
                      </TableCell>
                      <TableCell>
                        {log.target_type && (
                          <span className="text-xs">
                            {log.target_type}: {log.target_id?.substring(0, 8)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs">
                        {JSON.stringify(log.data_diff || {})}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
