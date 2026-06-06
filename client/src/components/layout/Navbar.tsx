import { Logo } from "@/components/Logo";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X,  ChevronDown, LogOut, User, LayoutDashboard, Settings, Bell } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV_LINKS = [
  { href: "/projetos", label: "Projetos" },
  { href: "/competencias", label: "Competências" },
  // "Sobre" aparece apenas para não-autenticados (conteúdo está no Home)
];

// Link exclusivo para visitantes não logados
const GUEST_ONLY_LINKS = [
  { href: "/sobre", label: "Sobre" },
];

interface NavbarProps {
  transparent?: boolean;
}

export function Navbar({ transparent = false }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation({ onSuccess: () => logout() });

  const { data: notificationsData } = trpc.notifications.listMine.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const markReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => utils.notifications.listMine.invalidate(),
  });

  const unreadCount = notificationsData?.filter((n) => !n.read).length || 0;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const isHome = location === "/";
  const isTransparent = transparent && isHome && !scrolled;

  const navBg = isTransparent
    ? "bg-transparent"
    : "bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E5E7EB]";

  const textColor = isTransparent ? "text-white" : "text-[#1F2937]";
  const logoColor = isTransparent ? "text-white" : "text-[#24B68E]";

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
        <div className="container">
          <div className="flex items-center justify-between h-[72px] lg:h-[88px]">
            {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
                isTransparent ? "bg-white/20" : "bg-[#24B68E]"
              }`}
            >
              <Logo className={`w-5 h-5 ${isTransparent ? "text-white" : "text-white"}`} />
            </div>
            <span className={`font-black text-xl tracking-tight ${logoColor}`}>
              Nexus<span className={isTransparent ? "text-white/80" : "text-[#6B7280]"}>_</span>
              <span className={isTransparent ? "text-white" : "text-[#24B68E]"}>Academic</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-600 transition-colors duration-200 relative nav-link-underline ${
                  location === link.href
                    ? isTransparent ? "text-white font-700" : "text-[#24B68E] font-700"
                    : isTransparent ? "text-white/85 hover:text-white" : `${textColor} hover:text-[#24B68E]`
                }`}
              >
                {link.label}
              </Link>
            ))}
            {/* Sobre: visível apenas para visitantes não autenticados */}
            {!isAuthenticated && GUEST_ONLY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-600 transition-colors duration-200 relative nav-link-underline ${
                  location === link.href
                    ? isTransparent ? "text-white font-700" : "text-[#24B68E] font-700"
                    : isTransparent ? "text-white/85 hover:text-white" : `${textColor} hover:text-[#24B68E]`
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                href="/dashboard"
                className={`text-sm font-600 transition-colors duration-200 relative nav-link-underline ${
                  location === "/dashboard"
                    ? isTransparent ? "text-white font-700" : "text-[#24B68E] font-700"
                    : isTransparent ? "text-white/85 hover:text-white" : `${textColor} hover:text-[#24B68E]`
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <DropdownMenu onOpenChange={(open) => { if (open && unreadCount > 0) markReadMutation.mutate(); }}>
                  <DropdownMenuTrigger asChild>
                    <button className={`relative p-2 rounded-full transition-colors ${isTransparent ? "text-white hover:bg-white/10" : "text-[#1F2937] hover:bg-[#F3F9F6]"}`}>
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 mt-1 max-h-[400px] overflow-y-auto">
                    <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 bg-white z-10">
                      <p className="font-700 text-[#1F2937]">Notificações</p>
                    </div>
                    {notificationsData && notificationsData.length > 0 ? (
                      <div className="py-2">
                        {notificationsData.map((notif) => (
                          <div key={notif.id} className={`px-4 py-3 border-b border-[#E5E7EB] last:border-0 ${notif.read ? "opacity-70" : "bg-[#F9FAFB]"}`}>
                            <p className="text-sm font-700 text-[#1F2937] mb-1">{notif.title}</p>
                            <p className="text-xs text-[#4B5563] leading-relaxed">{notif.message}</p>
                            <p className="text-[10px] text-[#9CA3AF] mt-2">{new Date(notif.createdAt).toLocaleDateString("pt-BR")} {new Date(notif.createdAt).toLocaleTimeString("pt-BR")}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2 opacity-20" />
                        <p className="text-sm text-[#6B7280]">Nenhuma notificação</p>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                      isTransparent ? "hover:bg-white/10 text-white" : "hover:bg-[#F3F9F6] text-[#1F2937]"
                    }`}>
                    <Avatar className="w-8 h-8 border-2 border-[#24B68E]/30">
                      <AvatarFallback className="bg-[#24B68E] text-white text-xs font-700">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-600 max-w-[120px] truncate">{user.name ?? "Usuário"}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 mt-1">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs text-muted-foreground">Sessão iniciada como</p>
                    <p className="text-sm font-600 truncate">{user.email ?? user.name}</p>
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-600 bg-[#F3F9F6] text-[#24B68E] border border-[#24B68E]/20">
                      {user.role === "admin" ? "Administrador" : user.role === "professor" ? "Professor" : "Aluno"}
                    </span>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/perfil" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" /> Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="w-4 h-4" /> Painel Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Terminar Sessão
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`text-sm font-600 transition-colors duration-200 ${
                    isTransparent ? "text-white/85 hover:text-white" : "text-[#1F2937] hover:text-[#24B68E]"
                  }`}
                >
                  Entrar
                </Link>
                <Link
                  href="/registro"
                  className={`text-sm font-700 px-5 py-2.5 rounded-full transition-all duration-200 active:scale-[0.97] ${
                    isTransparent
                      ? "bg-white text-[#24B68E] hover:bg-[#F3F9F6] shadow-md"
                      : "bg-[#24B68E] text-white hover:bg-[#1E9A78] shadow-sm"
                  }`}
                >
                  Começar Agora
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isTransparent ? "text-white hover:bg-white/10" : "text-[#1F2937] hover:bg-[#F3F9F6]"
            }`}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 top-[72px] bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed left-0 right-0 top-[72px] z-50 overflow-y-auto transition-all duration-300 ${
          mobileOpen ? "max-h-[calc(100vh-72px)] opacity-100 shadow-xl" : "max-h-0 opacity-0 pointer-events-none"
        } bg-white border-b border-[#E5E7EB]`}
      >
        <div className="container py-6 flex flex-col gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-3 rounded-lg text-sm font-600 transition-colors ${
                location === link.href
                  ? "bg-[#F3F9F6] text-[#24B68E]"
                  : "text-[#1F2937] hover:bg-[#F9FAFB]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {/* Sobre: apenas para visitantes */}
          {!isAuthenticated && GUEST_ONLY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-3 rounded-lg text-sm font-600 transition-colors ${
                location === link.href
                  ? "bg-[#F3F9F6] text-[#24B68E]"
                  : "text-[#1F2937] hover:bg-[#F9FAFB]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              href="/dashboard"
              className={`px-4 py-3 rounded-lg text-sm font-600 transition-colors ${
                location === "/dashboard" ? "bg-[#F3F9F6] text-[#24B68E]" : "text-[#1F2937] hover:bg-[#F9FAFB]"
              }`}
            >
              Dashboard
            </Link>
          )}
          <div className="border-t border-[#E5E7EB] mt-2 pt-3 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/perfil" className="px-4 py-3 rounded-lg text-sm font-600 text-[#1F2937] hover:bg-[#F9FAFB] flex items-center gap-2">
                  <User className="w-4 h-4" /> Meu Perfil
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin" className="px-4 py-3 rounded-lg text-sm font-600 text-[#1F2937] hover:bg-[#F9FAFB] flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Painel Admin
                  </Link>
                )}
                <button
                  onClick={() => logoutMutation.mutate()}
                  className="px-4 py-3 rounded-lg text-sm font-600 text-red-600 hover:bg-red-50 flex items-center gap-2 text-left"
                >
                  <LogOut className="w-4 h-4" /> Terminar Sessão
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="mx-4 py-3 rounded-full text-sm font-700 text-center bg-[#24B68E] text-white hover:bg-[#1E9A78] transition-colors"
              >
                Entrar / Registar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  );
}
