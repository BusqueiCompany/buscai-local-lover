import { Home, Search, ShoppingCart, User, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        <NavLink
          to="/"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <Home className="h-5 w-5 mb-1" />
          <span className="text-xs">Início</span>
        </NavLink>

        <NavLink
          to="/buscar"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <Search className="h-5 w-5 mb-1" />
          <span className="text-xs">Buscar</span>
        </NavLink>

        <NavLink
          to="/pedido"
          className="flex flex-col items-center justify-center flex-1 h-full relative"
        >
          <div className="absolute -top-2 flex items-center justify-center">
            <div className="bg-primary rounded-full p-3 shadow-lg">
              <ShoppingCart className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <span className="text-xs mt-6 text-muted-foreground">Pedido</span>
        </NavLink>

        <NavLink
          to="/perfil"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <User className="h-5 w-5 mb-1" />
          <span className="text-xs">Perfil</span>
        </NavLink>

        <NavLink
          to="/configuracoes"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <Settings className="h-5 w-5 mb-1" />
          <span className="text-xs">Config</span>
        </NavLink>
      </div>
    </nav>
  );
}
