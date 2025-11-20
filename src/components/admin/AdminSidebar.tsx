import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  Upload,
  Truck,
  MessageSquare,
  Settings,
  Code,
  ShoppingCart,
  DollarSign,
} from "lucide-react";

interface MenuItem {
  title: string;
  href: string;
  icon: any;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Visão Geral",
    items: [
      { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Usuários",
    items: [
      { title: "Seeds / Users", href: "/admin/seeds", icon: Users },
    ],
  },
  {
    title: "Lojas & Produtos",
    items: [
      { title: "Lojas", href: "/admin/lojas", icon: Store },
      { title: "Lojas Code", href: "/admin/lojas-code", icon: Code },
      { title: "Produtos", href: "/admin/produtos", icon: Package },
      { title: "Importações", href: "/admin/importacoes", icon: Upload },
      { title: "Atualizar Preços", href: "/admin/precos", icon: DollarSign },
    ],
  },
  {
    title: "Operações",
    items: [
      { title: "Pedidos", href: "/admin/pedidos", icon: ShoppingCart },
      { title: "Entregadores", href: "/admin/entregadores", icon: Truck },
    ],
  },
  {
    title: "Suporte",
    items: [
      { title: "Tickets & Chat", href: "/admin/suporte", icon: MessageSquare },
    ],
  },
  {
    title: "Sistema",
    items: [
      { title: "Configurações", href: "/admin/configuracoes", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-card border-r border-border h-screen overflow-y-auto">
      <div className="p-6">
        <h2 className="text-xl font-bold text-foreground">PWA BUSQUEI</h2>
        <p className="text-sm text-muted-foreground">Painel Admin</p>
      </div>

      <nav className="px-3 space-y-6">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
