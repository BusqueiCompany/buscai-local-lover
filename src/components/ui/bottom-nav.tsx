import { User, Search, Flame, CreditCard, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        <NavLink
          to="/perfil"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <User className="h-5 w-5 mb-1" />
          <span className="text-xs">Perfil</span>
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
          to="/vip"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <Flame className="h-5 w-5 mb-1 text-orange-500" />
          <span className="text-xs">Área Vip</span>
        </NavLink>

        <NavLink
          to="/vips"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <CreditCard className="h-5 w-5 mb-1" />
          <span className="text-xs">VIPs</span>
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
