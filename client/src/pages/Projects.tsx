import { Logo } from "@/components/Logo";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, Filter, Plus,  SlidersHorizontal, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const THEMATIC_AREAS = [
  "Inteligência Artificial",
  "Ciência de Dados",
  "Desenvolvimento Web",
  "IoT",
  "Segurança",
  "Robótica",
  "Sustentabilidade",
  "Educação",
  "Saúde",
  "Agronegócio",
];

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos os Status" },
  { value: "ativo", label: "Ativo" },
  { value: "concluido", label: "Concluído" },
  { value: "em_pausa", label: "Em Pausa" },
];

export default function Projects() {
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [area, setArea] = useState("todas");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = trpc.projects.list.useQuery({
    search: search || undefined,
    status: status !== "todos" ? status : undefined,
    thematicArea: area !== "todas" ? area : undefined,
    page,
    limit: 12,
  });

  const activeFilters = [
    status !== "todos" && STATUS_OPTIONS.find((s) => s.value === status)?.label,
    area !== "todas" && area,
  ].filter(Boolean) as string[];

  const clearFilters = () => {
    setStatus("todos");
    setArea("todas");
    setSearch("");
    setPage(1);
  };

  const canCreate = isAuthenticated && (user?.role === "professor" || user?.role === "admin");
  const totalProjects = data?.total ?? 0;
  const projectsCountText = totalProjects === 1
    ? "1 projeto encontrado na plataforma"
    : `${totalProjects} projetos encontrados na plataforma`;

  return (
    <AppLayout>
      <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
        {/* Page Header */}
        <div style={{ backgroundColor: "#24B68E" }} className="pt-8 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white -translate-y-1/2 translate-x-1/2 relative z-10" />
          </div>
          <div className="container relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-800 text-white mb-2">Projetos de PD&I</h1>
                <p className="text-white/80 text-sm">
                  {projectsCountText}
                </p>
              </div>
              {canCreate && (
                <Link href="/projetos/novo">
                  <Button className="bg-white text-[#24B68E] hover:bg-[#F9FAFB] font-700 rounded-full shadow-md">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Projeto
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-10">
              <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#F9FAFB" />
            </svg>
          </div>
        </div>

        <div className="container -mt-6 pb-16 relative z-10">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  placeholder="Buscar projetos por título ou descrição..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 border-[#E5E7EB] focus:border-[#24B68E] focus:ring-[#24B68E]/20 rounded-xl"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 rounded-xl border-[#E5E7EB] font-600 ${showFilters ? "bg-[#F3F9F6] border-[#24B68E] text-[#24B68E]" : ""}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
                {activeFilters.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#24B68E] text-white text-xs flex items-center justify-center font-700">
                    {activeFilters.length}
                  </span>
                )}
              </Button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-[#F3F4F6] flex flex-col sm:flex-row gap-3">
                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                  <SelectTrigger className="flex-1 rounded-xl border-[#E5E7EB]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={area} onValueChange={(v) => { setArea(v); setPage(1); }}>
                  <SelectTrigger className="flex-1 rounded-xl border-[#E5E7EB]">
                    <SelectValue placeholder="Área Temática" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Áreas</SelectItem>
                    {THEMATIC_AREAS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeFilters.length > 0 && (
                  <Button variant="ghost" onClick={clearFilters} className="text-[#6B7280] hover:text-red-500 rounded-xl">
                    <X className="w-4 h-4 mr-1" /> Limpar
                  </Button>
                )}
              </div>
            )}

            {/* Active Filter Tags */}
            {activeFilters.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFilters.map((f) => (
                  <Badge key={f} variant="secondary" className="bg-[#F3F9F6] text-[#24B68E] border border-[#24B68E]/20 font-600">
                    {f}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 h-56">
                  <div className="skeleton h-4 w-24 mb-3 rounded" />
                  <div className="skeleton h-5 w-3/4 mb-2 rounded" />
                  <div className="skeleton h-4 w-full mb-1 rounded" />
                  <div className="skeleton h-4 w-2/3 rounded" />
                </div>
              ))}
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.data.map(({ project, owner }) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    owner={owner}
                  />
                ))}
              </div>

              {/* Pagination */}
              {data.total > 12 && (
                <div className="flex justify-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-xl"
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-4 text-sm text-[#6B7280] font-600">
                    Página {page} de {Math.ceil(data.total / 12)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= Math.ceil(data.total / 12)}
                    className="rounded-xl"
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-[#F3F9F6] flex items-center justify-center mx-auto mb-4">
                <Logo className="w-10 h-10 text-[#24B68E]/40" />
              </div>
              <h3 className="font-700 text-[#1F2937] text-lg mb-2">Nenhum projeto encontrado</h3>
              <p className="text-[#6B7280] text-sm mb-6">
                {activeFilters.length > 0 || search
                  ? "Tente ajustar os filtros ou a busca."
                  : "Ainda não há projetos cadastrados na plataforma."}
              </p>
              {(activeFilters.length > 0 || search) && (
                <Button onClick={clearFilters} variant="outline" className="rounded-full border-[#24B68E] text-[#24B68E]">
                  Limpar filtros
                </Button>
              )}
              {canCreate && !activeFilters.length && !search && (
                <Link href="/projetos/novo">
                  <Button className="bg-[#24B68E] hover:bg-[#1E9A78] text-white rounded-full ml-3">
                    <Plus className="w-4 h-4 mr-2" /> Criar Primeiro Projeto
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
