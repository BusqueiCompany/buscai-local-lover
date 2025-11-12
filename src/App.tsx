import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Economizar from "./pages/Economizar";
import Radar from "./pages/Radar";
import Perfil from "./pages/Perfil";
import Configuracoes from "./pages/Configuracoes";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Home />} />
          <Route path="/economizar" element={<Economizar />} />
          <Route path="/radar" element={<Radar />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          
          {/* Placeholder routes */}
          <Route path="/buscar" element={<Placeholder />} />
          <Route path="/pedido" element={<Placeholder />} />
          <Route path="/lanches" element={<Placeholder />} />
          <Route path="/restaurantes" element={<Placeholder />} />
          <Route path="/mercados" element={<Placeholder />} />
          <Route path="/petshops" element={<Placeholder />} />
          <Route path="/bebidas" element={<Placeholder />} />
          <Route path="/farmacia" element={<Placeholder />} />
          <Route path="/vip" element={<Placeholder />} />
          <Route path="/parceiros" element={<Placeholder />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
