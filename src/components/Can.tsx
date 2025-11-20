import { ReactNode } from "react";
import { useRole } from "@/hooks/useRole";

interface CanProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { can } = useRole();

  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
