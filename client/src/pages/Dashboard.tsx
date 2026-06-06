import { Logo } from "@/components/Logo";
import { Link } from "wouter";
import {
   Users, Zap, TrendingUp, ArrowRight, BarChart2,
  CheckCircle, PauseCircle, PlayCircle, Plus, Bell, FileEdit, GraduationCap
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#24B68E", "#38C69F", "#1E9A78", "#6EE7C5", "#0F8A6A", "#A7F3D0"];

function StatCard({
  icon: Icon, label, value, sub, color = "#24B68E", bgColor = "#F3F9F6"
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
  bgColor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4 card-hover">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bgColor }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-800 text-[#1F2937]">{value}</p>
        <p className="text-sm font-600 text-[#4B5563]">{label}</p>
        {sub && <p className="text-xs text-[#9CA3AF] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: myProjects } = trpc.projects.myProjects.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Role-specific data
  const { data: myProposals } = trpc.studentProjects.listMine.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "aluno",
  });
  const { data: pendingProposals } = trpc.studentProjects.listPending.useQuery(undefined, {
    enabled: isAuthenticated && (user?.role === "professor" || user?.role === "admin"),
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

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-[#F3F9F6] flex items-center justify-center mx-auto mb-4">
              <BarChart2 className="w-10 h-10 text-[#24B68E]/40" />
            </div>
            <h2 className="text-xl font-700 text-[#1F2937] mb-2">Acesso Restrito</h2>
            <p className="text-[#6B7280] text-sm mb-6">Faça login para aceder ao dashboard analítico.</p>
            <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-6 py-3 bg-[#24B68E] text-white rounded-full font-700 text-sm hover:bg-[#1E9A78] transition-colors">
              Entrar na Plataforma <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isAluno = user?.role === "aluno";
  const isProfessorOrAdmin = user?.role === "professor" || user?.role === "admin";
  const canCreate = isProfessorOrAdmin;

  const pendingCount = pendingProposals?.length ?? 0;
  const myDraftCount = myProposals?.filter((p) => p.project.status === "rascunho").length ?? 0;
  const myPendingCount = myProposals?.filter((p) => p.project.status === "pendente_aprovacao").length ?? 0;

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F9FAFB]">
        {/* Header */}
        <div style={{ backgroundColor: "#24B68E" }} className="pt-8 pb-20 relative overflow-hidden">
          <div className="container relative z-10">
                    <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">Bem-vindo de volta,</p>
                <h1 className="text-2xl font-800 text-white">{user?.name ?? "Usuário"}</h1>
                <span className="inline-flex items-center mt-1 px-2.5 py-1 rounded-full bg-white/20 text-white/90 text-xs font-700">
                  {user?.role === "admin" ? "Administrador" : user?.role === "professor" ? "Professor" : "Aluno"}
                </span>
              </div>
              <div className="flex gap-2">
                {canCreate && (
                  <Link href="/projetos/novo">
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#24B68E] rounded-full font-700 text-sm shadow-md hover:bg-[#F9FAFB] transition-all active:scale-[0.97]">
                      <Plus className="w-4 h-4" /> Novo Projeto
                    </button>
                  </Link>
                )}
                {isAluno && (
                  <Link href="/minhas-propostas">
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#24B68E] rounded-full font-700 text-sm shadow-md hover:bg-[#F9FAFB] transition-all active:scale-[0.97]">
                      <FileEdit className="w-4 h-4" /> Minhas Propostas
                      {(myDraftCount + myPendingCount) > 0 && (
                        <span className="ml-1 bg-[#24B68E] text-white text-xs rounded-full px-1.5 py-0.5">
                          {myDraftCount + myPendingCount}
                        </span>
                      )}
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-10">
              <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#F9FAFB" />
            </svg>
          </div>
        </div>

        <div className="container -mt-6 pb-16 space-y-8">
          {/* Role-specific quick actions */}
          {isAluno && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/minhas-propostas">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4 card-hover cursor-pointer hover:border-[#24B68E]/40 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-[#F3F9F6] flex items-center justify-center shrink-0">
                    <FileEdit className="w-6 h-6 text-[#24B68E]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-700 text-[#1F2937]">Minhas Propostas</p>
                    <p className="text-sm text-[#6B7280]">
                      {myDraftCount > 0 ? `${myDraftCount} rascunho(s) para enviar` :
                       myPendingCount > 0 ? `${myPendingCount} aguardando revisão` :
                       "Proponha um novo projeto"}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#9CA3AF]" />
                </div>
              </Link>
              <Link href="/projetos">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4 card-hover cursor-pointer hover:border-[#24B68E]/40 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
                    <GraduationCap className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-700 text-[#1F2937]">Explorar Projetos</p>
                    <p className="text-sm text-[#6B7280]">Encontre projetos para participar</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#9CA3AF]" />
                </div>
              </Link>
            </div>
          )}

          {isProfessorOrAdmin && pendingCount > 0 && (
            <Link href="/aprovacoes">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:bg-amber-100 transition-all">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Bell className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-700 text-amber-900">
                    {pendingCount} proposta{pendingCount !== 1 ? "s" : ""} de aluno{pendingCount !== 1 ? "s" : ""} aguardando revisão
                  </p>
                  <p className="text-sm text-amber-700">Clique para revisar e aprovar</p>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-500" />
              </div>
            </Link>
          )}

          {isProfessorOrAdmin && pendingCount === 0 && (
            <Link href="/aprovacoes">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-[#24B68E]/40 transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#F3F9F6] flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-[#24B68E]" />
                </div>
                <div className="flex-1">
                  <p className="font-700 text-[#1F2937]">Revisão de Propostas</p>
                  <p className="text-sm text-[#6B7280]">Nenhuma proposta pendente no momento</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#9CA3AF]" />
              </div>
            </Link>
          )}
          {/* Stats */}
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 h-24 skeleton" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Logo} label="Total de Projetos" value={stats.totalProjects} sub="na plataforma" />
              <StatCard icon={PlayCircle} label="Projetos Ativos" value={stats.activeProjects} sub="em andamento" color="#10B981" bgColor="#ECFDF5" />
              <StatCard icon={Users} label="Membros" value={stats.totalMembers} sub="usuários registrados" color="#6366F1" bgColor="#EEF2FF" />
              <StatCard icon={Zap} label="Competências" value={stats.totalSkills} sub="habilidades cadastradas" color="#F59E0B" bgColor="#FFFBEB" />
            </div>
          ) : null}

          {/* Charts */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Area */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <h3 className="font-700 text-[#1F2937] text-base mb-5">Projetos por Área Temática</h3>
                {stats.byArea.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.byArea} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="area" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "12px" }}
                        formatter={(v) => [v, "Projetos"]}
                      />
                      <Bar dataKey="count" fill="#24B68E" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-[#6B7280]">
                    Nenhum dado disponível
                  </div>
                )}
              </div>

              {/* By Status */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <h3 className="font-700 text-[#1F2937] text-base mb-5">Distribuição por Status</h3>
                {stats.byStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={stats.byStatus.map((s) => ({
                          name: s.status === "ativo" ? "Ativo" : s.status === "concluido" ? "Concluído" : "Em Pausa",
                          value: s.count,
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.byStatus.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "12px" }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-[#6B7280]">
                    Nenhum dado disponível
                  </div>
                )}
              </div>
            </div>
          )}

          {/* My Projects */}
          {myProjects && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-700 text-[#1F2937] text-base">Meus Projetos</h3>
                <Link href="/projetos" className="text-sm font-700 text-[#24B68E] hover:text-[#1E9A78] flex items-center gap-1">
                  Ver todos <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {'owned' in myProjects && myProjects.owned.length === 0 && 'memberOf' in myProjects && myProjects.memberOf.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-[#6B7280] mb-4">Você ainda não participa de nenhum projeto.</p>
                  <Link href="/projetos">
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F3F9F6] text-[#24B68E] rounded-full font-700 text-sm hover:bg-[#E6F5EF] transition-colors">
                      Explorar Projetos <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {'owned' in myProjects && 'memberOf' in myProjects && [...myProjects.owned.slice(0, 3), ...myProjects.memberOf.slice(0, 2)].map((project) => (
                    <Link key={project.id} href={`/projetos/${project.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#F3F9F6] flex items-center justify-center shrink-0">
                            <Logo className="w-4.5 h-4.5 text-[#24B68E]" />
                          </div>
                          <div>
                            <p className="text-sm font-700 text-[#1F2937] group-hover:text-[#24B68E] transition-colors line-clamp-1">
                              {project.title}
                            </p>
                            <p className="text-xs text-[#6B7280]">{project.thematicArea}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={project.status} />
                          <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#24B68E] transition-colors" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Projects */}
          {stats?.recentProjects && stats.recentProjects.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-700 text-[#1F2937] text-base">Projetos Recentes</h3>
                <Link href="/projetos" className="text-sm font-700 text-[#24B68E] hover:text-[#1E9A78] flex items-center gap-1">
                  Ver todos <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-3">
                {stats.recentProjects.map(({ project, owner }) => (
                  <Link key={project.id} href={`/projetos/${project.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#F3F9F6] flex items-center justify-center shrink-0">
                          <TrendingUp className="w-4.5 h-4.5 text-[#24B68E]" />
                        </div>
                        <div>
                          <p className="text-sm font-700 text-[#1F2937] group-hover:text-[#24B68E] transition-colors line-clamp-1">
                            {project.title}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            {owner?.name} · {new Date(project.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
