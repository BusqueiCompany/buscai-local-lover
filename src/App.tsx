import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Economizar from "./pages/Economizar";
import Radar from "./pages/Radar";
import Perfil from "./pages/Perfil";
import Configuracoes from "./pages/Configuracoes";
import Placeholder from "./pages/Placeholder";
import Vip from "./pages/Vip";
import Suporte from "./pages/Suporte";
import SuporteChat from "./pages/SuporteChat";
import DashboardNew from "./pages/admin/DashboardNew";
import ProdutosGlobais from "./pages/admin/ProdutosGlobais";
import ImportacoesNew from "./pages/admin/ImportacoesNew";
import GerenciarLojas from "./pages/admin/GerenciarLojas";
import GerenciarPedidos from "./pages/admin/GerenciarPedidos";
import Entregadores from "./pages/admin/Entregadores";
import SuporteAdmin from "./pages/admin/SuporteAdmin";
import Logs from "./pages/admin/Logs";
import Users from "./pages/admin/Users";
import Mapa from "./pages/Mapa";
import PainelEntregador from "./pages/PainelEntregador";
import Mercado from "./pages/Mercado";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Home />} />
            <Route path="/economizar" element={<Economizar />} />
            <Route path="/radar" element={<Radar />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            
            {/* Admin Routes - New Structure */}
            <Route path="/admin" element={<DashboardNew />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/produtos-globais" element={<ProdutosGlobais />} />
            <Route path="/admin/importacoes" element={<ImportacoesNew />} />
            <Route path="/admin/lojas" element={<GerenciarLojas />} />
            <Route path="/admin/pedidos" element={<GerenciarPedidos />} />
            <Route path="/admin/entregadores" element={<Entregadores />} />
            <Route path="/admin/suporte" element={<SuporteAdmin />} />
            <Route path="/admin/logs" element={<Logs />} />
            
            <Route path="/entregador" element={<PainelEntregador />} />
            
            {/* Placeholder routes */}
            <Route path="/buscar" element={<Placeholder />} />
            <Route path="/pedido" element={<Placeholder />} />
            
            {/* Category routes */}
            <Route path="/mercado" element={<Mercado />} />
            <Route path="/bebidas" element={<Placeholder />} />
            <Route path="/conveniencia" element={<Placeholder />} />
            <Route path="/farmacia" element={<Placeholder />} />
            <Route path="/gas-agua" element={<Placeholder />} />
            <Route path="/lanches" element={<Placeholder />} />
            <Route path="/padaria" element={<Placeholder />} />
            <Route path="/restaurante" element={<Placeholder />} />
            <Route path="/petshop" element={<Placeholder />} />
            <Route path="/parceiro" element={<Placeholder />} />
            <Route path="/bazar" element={<Placeholder />} />
            
            {/* Other routes */}
            <Route path="/vip" element={<Vip />} />
            <Route path="/suporte" element={<Suporte />} />
            <Route path="/suporte/chat" element={<SuporteChat />} />
            <Route path="/mapa" element={<Mapa />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
