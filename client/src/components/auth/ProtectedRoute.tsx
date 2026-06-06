import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles allowed to access this route. If empty, any authenticated user is allowed. */
  allowedRoles?: Array<"aluno" | "professor" | "admin">;
  /** Redirect path when access is denied (defaults to "/") */
  fallback?: string;
}

/**
 * Route guard that enforces authentication and optional role-based access.
 *
 * Segurança:
 * - Redireciona para /login (autenticação local) em vez de OAuth externo.
 * - Verifica papel do utilizador para rotas com restrição de acesso.
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={["admin"]}>
 *     <AdminPage />
 *   </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  allowedRoles = [],
  fallback = "/",
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#24B68E] animate-spin" />
          <p className="text-sm text-[#6B7280] font-600">A verificar acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirecionar para login local em vez de OAuth externo
    return <Redirect to="/login" />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role as "aluno" | "professor" | "admin")) {
    return <Redirect to={fallback} />;
  }

  return <>{children}</>;
}
