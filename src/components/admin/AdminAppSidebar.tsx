import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  Upload,
  Store,
  ShoppingCart,
  Truck,
  MessageSquare,
  FileText,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Produtos Globais", url: "/admin/produtos-globais", icon: Package },
  { title: "Importações", url: "/admin/importacoes", icon: Upload },
  { title: "Lojas", url: "/admin/lojas", icon: Store },
  { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingCart },
  { title: "Entregadores", url: "/admin/entregadores", icon: Truck },
  { title: "Suporte", url: "/admin/suporte", icon: MessageSquare },
  { title: "Logs", url: "/admin/logs", icon: FileText },
];

export function AdminAppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar className={open ? "w-60" : "w-14"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-border">
          {open && (
            <>
              <h2 className="text-lg font-bold text-foreground">BUSQUEI</h2>
              <p className="text-xs text-muted-foreground">Painel Admin</p>
            </>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary text-primary-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
