import { Logo } from "@/components/Logo";
import { useState } from "react";
import { Link } from "wouter";
import {
  Users,  CheckCircle, XCircle, Clock,
  Shield, ArrowRight, RefreshCw, ChevronRight, Settings
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ROLE_LABELS: Record<string, string> = {
  aluno: "Aluno",
  professor: "Professor",
  admin: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  aluno: "bg-blue-50 text-blue-700 border-blue-200",
  professor: "bg-purple-50 text-purple-700 border-purple-200",
  admin: "bg-[#F3F9F6] text-[#24B68E] border-[#24B68E]/20",
};

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const [usersPage, setUsersPage] = useState(1);
  const [projectsPage, setProjectsPage] = useState(1);

  const { data: usersData, isLoading: usersLoading } = trpc.admin.users.useQuery(
    { page: usersPage, limit: 15 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: projectsData, isLoading: projectsLoading } = trpc.admin.allProjects.useQuery(
    { page: projectsPage, limit: 15 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: pendingRequests, isLoading: requestsLoading } = trpc.requests.allPending.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("Papel atualizado com sucesso!");
      utils.admin.users.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const reviewMutation = trpc.requests.review.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.status === "aprovado" ? "Solicitação aprovada!" : "Solicitação rejeitada.");
      utils.requests.allPending.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#24B68E] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#F3F9F6] flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-[#24B68E]/40" />
            </div>
            <h2 className="text-xl font-700 text-[#1F2937] mb-2">Acesso Restrito</h2>
            <p className="text-[#6B7280] text-sm mb-4">Apenas administradores podem aceder a este painel.</p>
            {!isAuthenticated ? (
              <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-6 py-3 bg-[#24B68E] text-white rounded-full font-700 text-sm">
                Entrar <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <Link href="/"><Button variant="outline" className="rounded-full">Voltar ao Início</Button></Link>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F9FAFB]">
        {/* Header */}
        <div style={{ backgroundColor: "#0F1624" }} className="pt-8 pb-20 relative overflow-hidden">
          <div className="container relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#24B68E] flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-800 text-white">Painel Administrativo</h1>
                <p className="text-white/50 text-sm">Gestão de usuários, projetos e solicitações</p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-10">
              <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#F9FAFB" />
            </svg>
          </div>
        </div>

        <div className="container -mt-6 pb-16">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F3F9F6] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#24B68E]" />
              </div>
              <div>
                <p className="text-xl font-800 text-[#1F2937]">{usersData?.total ?? "—"}</p>
                <p className="text-xs text-[#6B7280] font-600">Usuários</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Logo className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-800 text-[#1F2937]">{projectsData?.total ?? "—"}</p>
                <p className="text-xs text-[#6B7280] font-600">Projetos</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-800 text-[#1F2937]">{pendingRequests?.length ?? "—"}</p>
                <p className="text-xs text-[#6B7280] font-600">Pendentes</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="requests" className="space-y-4">
            <TabsList className="bg-white border border-[#E5E7EB] rounded-xl p-1">
              <TabsTrigger value="requests" className="rounded-lg text-sm font-600 data-[state=active]:bg-[#24B68E] data-[state=active]:text-white">
                Solicitações {pendingRequests && pendingRequests.length > 0 && (
                  <span className="ml-1.5 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-700">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-lg text-sm font-600 data-[state=active]:bg-[#24B68E] data-[state=active]:text-white">
                Usuários
              </TabsTrigger>
              <TabsTrigger value="projects" className="rounded-lg text-sm font-600 data-[state=active]:bg-[#24B68E] data-[state=active]:text-white">
                Projetos
              </TabsTrigger>
            </TabsList>

            {/* Requests Tab */}
            <TabsContent value="requests">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <h3 className="font-700 text-[#1F2937] text-base mb-4">Solicitações Pendentes</h3>
                {requestsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="skeleton h-16 rounded-xl" />
                    ))}
                  </div>
                ) : pendingRequests && pendingRequests.length > 0 ? (
                  <div className="space-y-3">
                    {pendingRequests.map(({ request, user: reqUser, project }) => (
                      <div key={request.id} className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6]">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-9 h-9 border border-[#E5E7EB]">
                            <AvatarFallback className="bg-[#24B68E] text-white text-xs font-700">
                              {reqUser.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-700 text-[#1F2937]">{reqUser.name}</p>
                            <p className="text-xs text-[#6B7280]">
                              Quer participar de: <span className="font-600 text-[#24B68E]">{project.title}</span>
                            </p>
                            {request.message && (
                              <p className="text-xs text-[#4B5563] mt-1 italic">"{request.message}"</p>
                            )}
                            <p className="text-xs text-[#9CA3AF] mt-1">
                              {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => reviewMutation.mutate({ id: request.id, status: "aprovado", projectId: request.projectId })}
                            disabled={reviewMutation.isPending}
                            className="bg-[#24B68E] hover:bg-[#1E9A78] text-white rounded-xl text-xs font-700"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reviewMutation.mutate({ id: request.id, status: "rejeitado", projectId: request.projectId })}
                            disabled={reviewMutation.isPending}
                            className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-700"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Rejeitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-10 h-10 text-[#24B68E]/30 mx-auto mb-2" />
                    <p className="text-sm text-[#6B7280]">Nenhuma solicitação pendente.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-700 text-[#1F2937] text-base">Usuários ({usersData?.total ?? 0})</h3>
                </div>
                {usersLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="skeleton h-14 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {usersData?.data.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 border border-[#E5E7EB]">
                            <AvatarFallback className="bg-[#F3F4F6] text-[#6B7280] text-xs font-700">
                              {u.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-700 text-[#1F2937]">{u.name ?? "—"}</p>
                            <p className="text-xs text-[#6B7280]">{u.email ?? u.openId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-700 border ${ROLE_COLORS[u.role]}`}>
                            {ROLE_LABELS[u.role]}
                          </span>
                          {u.id !== user.id && (
                            <Select
                              value={u.role}
                              onValueChange={(v) => updateRoleMutation.mutate({ userId: u.id, role: v as "aluno" | "professor" | "admin" })}
                            >
                              <SelectTrigger className="w-32 h-7 text-xs rounded-lg border-[#E5E7EB]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="aluno">Aluno</SelectItem>
                                <SelectItem value="professor">Professor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {usersData && usersData.total > 15 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setUsersPage((p) => Math.max(1, p - 1))} disabled={usersPage === 1} className="rounded-xl">Anterior</Button>
                    <Button variant="outline" size="sm" onClick={() => setUsersPage((p) => p + 1)} disabled={usersPage >= Math.ceil(usersData.total / 15)} className="rounded-xl">Próxima</Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-700 text-[#1F2937] text-base">Todos os Projetos ({projectsData?.total ?? 0})</h3>
                </div>
                {projectsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="skeleton h-14 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projectsData?.data.map(({ project, owner }) => (
                      <Link key={project.id} href={`/projetos/${project.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors group cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#F3F9F6] flex items-center justify-center">
                              <Logo className="w-4.5 h-4.5 text-[#24B68E]" />
                            </div>
                            <div>
                              <p className="text-sm font-700 text-[#1F2937] group-hover:text-[#24B68E] line-clamp-1">{project.title}</p>
                              <p className="text-xs text-[#6B7280]">{project.thematicArea} · {owner?.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={project.status} />
                            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {projectsData && projectsData.total > 15 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setProjectsPage((p) => Math.max(1, p - 1))} disabled={projectsPage === 1} className="rounded-xl">Anterior</Button>
                    <Button variant="outline" size="sm" onClick={() => setProjectsPage((p) => p + 1)} disabled={projectsPage >= Math.ceil(projectsData.total / 15)} className="rounded-xl">Próxima</Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
