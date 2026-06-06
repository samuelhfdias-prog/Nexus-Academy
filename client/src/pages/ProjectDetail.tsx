import { Logo } from "@/components/Logo";
import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  ArrowLeft, Calendar, Users, Tag, Clock, CheckCircle,
  PauseCircle, PlayCircle, UserPlus, Edit, Trash2,
  Flag, Package, MessageSquare, CheckSquare, Plus
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";

const EVENT_ICONS: Record<string, React.ElementType> = {
  marco: Flag,
  entrega: Package,
  reuniao: MessageSquare,
  publicacao: Logo,
  outro: Clock,
};

const EVENT_COLORS: Record<string, string> = {
  marco: "bg-purple-100 text-purple-700 border-purple-200",
  entrega: "bg-blue-100 text-blue-700 border-blue-200",
  reuniao: "bg-amber-100 text-amber-700 border-amber-200",
  publicacao: "bg-green-100 text-green-700 border-green-200",
  outro: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id ?? "0");
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [requestMessage, setRequestMessage] = useState("");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [requestToReject, setRequestToReject] = useState<number | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<number | null>(null);

  // Task states
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssignee, setTaskAssignee] = useState<number | "">("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const { data, isLoading, refetch } = trpc.projects.byId.useQuery({ id: projectId });
  const utils = trpc.useUtils();

  const requestMutation = trpc.requests.create.useMutation({
    onSuccess: () => {
      toast.success("Solicitação enviada com sucesso!");
      setShowRequestDialog(false);
      setRequestMessage("");
    },
    onError: (err) => toast.error(err.message),
  });

  const becomeAdvisorMutation = trpc.projects.becomeAdvisor.useMutation({
    onSuccess: () => {
      toast.success("Você agora é o orientador deste projeto!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: requestsData, refetch: refetchRequests } = trpc.requests.listByProject.useQuery(
    { projectId },
    { enabled: !!data && (user?.id === data.project.ownerId || user?.role === "admin") }
  );

  const reviewRequestMutation = trpc.requests.review.useMutation({
    onSuccess: () => {
      toast.success("Solicitação respondida com sucesso!");
      setRequestToReject(null);
      setRejectReason("");
      refetchRequests();
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMemberMutation = trpc.projects.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Membro removido com sucesso!");
      setMemberToRemove(null);
      setRemoveReason("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteRequestMutation = trpc.requests.delete.useMutation({
    onSuccess: () => {
      toast.success("Solicitação excluída com sucesso!");
      refetchRequests();
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Projeto removido com sucesso!");
      navigate("/projetos");
    },
    onError: (err) => toast.error(err.message),
  });

  const isOwner = user?.id === data?.project.ownerId;
  const isAdmin = user?.role === "admin";
  const canManage = isOwner || isAdmin;
  const isMember = data?.members.some((m) => m.user.id === user?.id) || false;

  const { data: tasksData, refetch: refetchTasks } = trpc.projectTasks.list.useQuery(
    { projectId },
    { enabled: !!data && (isMember || canManage) }
  );

  const createTaskMutation = trpc.projectTasks.create.useMutation({
    onSuccess: () => {
      toast.success("Tarefa criada com sucesso!");
      setShowTaskDialog(false);
      setTaskTitle("");
      setTaskDescription("");
      setTaskAssignee("");
      setTaskDueDate("");
      refetchTasks();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateTaskStatusMutation = trpc.projectTasks.updateStatus.useMutation({
    onSuccess: () => refetchTasks(),
  });

  const deleteTaskMutation = trpc.projectTasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Tarefa removida!");
      refetchTasks();
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#F9FAFB] pt-8">
          <div className="container max-w-5xl">
            <div className="skeleton h-8 w-48 mb-6 rounded" />
            <div className="skeleton h-64 w-full rounded-2xl mb-6" />
            <div className="grid grid-cols-3 gap-6">
              <div className="skeleton h-48 rounded-2xl" />
              <div className="skeleton h-48 rounded-2xl" />
              <div className="skeleton h-48 rounded-2xl" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-700 text-[#1F2937] mb-2">Projeto não encontrado</h2>
            <Link href="/projetos">
              <Button variant="outline" className="rounded-full mt-4">Voltar aos Projetos</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { project, owner, members, skills, timeline } = data;
  const tags = project.tags ? JSON.parse(project.tags) as string[] : [];

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F9FAFB]">
        {/* Header */}
        <div style={{ backgroundColor: "#24B68E" }} className="pt-8 pb-20 relative overflow-hidden">
          <div className="container relative z-10">
            <Link href="/projetos" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-600 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar aos Projetos
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold shadow-sm">
                    <Tag className="w-3 h-3" />
                    {project.thematicArea}
                  </span>
                  <StatusBadge status={project.status} className="bg-white/20 text-white border-white/30 shadow-sm" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight break-words">{project.title}</h1>
                <p className="text-white/80 text-sm">
                  Responsável: <span className="text-white font-semibold">{owner?.name ?? "—"}</span>
                </p>
              </div>
              {canManage && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                  <Link href={`/projetos/${project.id}/editar`} className="w-full sm:w-auto">
                    <Button size="sm" className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-300">
                      <Edit className="w-4 h-4" /> Editar
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full sm:w-auto bg-red-500/20 hover:bg-red-500/40 text-white border-red-300/30 rounded-xl flex items-center justify-center transition-all duration-300"
                    title="Remover Projeto"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sm:hidden ml-2">Remover</span>
                  </Button>
                </div>
              )}
              {!canManage && user?.role === "professor" && owner?.role !== "professor" && project.status !== "concluido" && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                  <Button
                    size="sm"
                    onClick={() => becomeAdvisorMutation.mutate({ projectId: project.id })}
                    disabled={becomeAdvisorMutation.isPending}
                    className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-xl shadow-sm transition-all duration-300"
                  >
                    {becomeAdvisorMutation.isPending ? "Processando..." : "Tornar-se Orientador"}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-10">
              <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#F9FAFB" />
            </svg>
          </div>
        </div>

        <div className="container max-w-5xl -mt-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <h2 className="font-700 text-[#1F2937] text-base mb-3">Descrição do Projeto</h2>
                <p className="text-[#4B5563] text-sm leading-relaxed whitespace-pre-wrap">{project.description}</p>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#F3F4F6]">
                    {tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 bg-[#F3F4F6] text-[#6B7280] text-xs rounded-lg font-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills Required */}
              {skills.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                  <h2 className="font-700 text-[#1F2937] text-base mb-4">Competências Requeridas</h2>
                  <div className="flex flex-wrap gap-2">
                    {skills.map(({ skill, projectSkill }) => (
                      <span
                        key={skill.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-700 border ${
                          projectSkill.required
                            ? "bg-[#F3F9F6] text-[#24B68E] border-[#24B68E]/20"
                            : "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]"
                        }`}
                      >
                        {projectSkill.required && <span className="w-1.5 h-1.5 rounded-full bg-[#24B68E]" />}
                        {skill.name}
                        {!projectSkill.required && <span className="text-[10px] opacity-60">(opcional)</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {timeline.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                  <h2 className="font-700 text-[#1F2937] text-base mb-5">Linha do Tempo</h2>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-[#E5E7EB]" />
                    <div className="space-y-5">
                      {timeline.map(({ event, createdBy }) => {
                        const Icon = EVENT_ICONS[event.eventType] ?? Clock;
                        const colorClass = EVENT_COLORS[event.eventType] ?? EVENT_COLORS.outro;
                        return (
                          <div key={event.id} className="relative pl-10">
                            <div className={`absolute left-0 w-8 h-8 rounded-full border flex items-center justify-center ${colorClass}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-700 text-[#1F2937] text-sm">{event.title}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-700 border ${colorClass}`}>
                                  {event.eventType}
                                </span>
                              </div>
                              {event.description && (
                                <p className="text-xs text-[#6B7280] mb-1">{event.description}</p>
                              )}
                              <p className="text-xs text-[#9CA3AF]">
                                {new Date(event.eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                                {" · "}por {createdBy.name}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tasks */}
              {(isMember || canManage) && (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-700 text-[#1F2937] text-base flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-[#24B68E]" />
                      Tarefas do Projeto
                    </h2>
                    {canManage && (
                      <Button
                        size="sm"
                        onClick={() => setShowTaskDialog(true)}
                        className="bg-[#24B68E] hover:bg-[#1E9A78] text-white rounded-lg shadow-sm text-xs h-8"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Nova Tarefa
                      </Button>
                    )}
                  </div>
                  
                  {!tasksData || tasksData.length === 0 ? (
                    <p className="text-sm text-[#6B7280]">Nenhuma tarefa encontrada.</p>
                  ) : (
                    <div className="space-y-3">
                      {tasksData.map(({ task, assignee, creator }) => (
                        <div key={task.id} className="flex flex-col sm:flex-row gap-3 border border-[#E5E7EB] rounded-xl p-4 hover:border-[#24B68E]/30 transition-colors bg-[#F9FAFB]/50">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className={`font-600 text-sm truncate ${task.status === "concluido" ? "text-[#9CA3AF] line-through" : "text-[#1F2937]"}`}>
                                {task.title}
                              </h3>
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] shrink-0 ${
                                  task.status === "concluido" ? "bg-green-100 text-green-700 border-green-200" :
                                  task.status === "em_andamento" ? "bg-blue-100 text-blue-700 border-blue-200" :
                                  "bg-gray-100 text-gray-700 border-gray-200"
                                }`}
                              >
                                {task.status.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-xs text-[#6B7280] line-clamp-2 mb-2">{task.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#9CA3AF] font-500">
                              {assignee && (
                                <span className="flex items-center gap-1.5">
                                  <Avatar className="w-4 h-4">
                                    <AvatarFallback className="bg-[#E5E7EB] text-[#6B7280] text-[8px]">
                                      {assignee.name?.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase() ?? "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  Responsável: <span className="text-[#4B5563]">{assignee.name}</span>
                                </span>
                              )}
                              {task.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Entrega: {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center sm:flex-col justify-end gap-2 shrink-0">
                            {(canManage || (assignee && assignee.id === user?.id)) && task.status !== "concluido" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTaskStatusMutation.mutate({ id: task.id, status: task.status === "pendente" ? "em_andamento" : "concluido" })}
                                className="h-7 text-xs border-[#24B68E]/30 text-[#24B68E] hover:bg-[#F3F9F6]"
                              >
                                {task.status === "pendente" ? "Iniciar" : "Concluir"}
                              </Button>
                            )}
                            {canManage && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteTaskMutation.mutate({ id: task.id })}
                                className="h-7 px-2 text-[#9CA3AF] hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Info Card */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                <h3 className="font-700 text-[#1F2937] text-sm mb-4">Informações</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F3F9F6] flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-[#24B68E]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">Início</p>
                      <p className="text-sm font-600 text-[#1F2937]">
                        {new Date(project.startDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  {project.endDate && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F3F9F6] flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-[#24B68E]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#6B7280]">Previsão de Término</p>
                        <p className="text-sm font-600 text-[#1F2937]">
                          {new Date(project.endDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F3F9F6] flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#24B68E]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">Membros</p>
                      <p className="text-sm font-600 text-[#1F2937]">
                        {members.length} / {project.maxMembers ?? 10}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Join Button */}
                {isAuthenticated && !isMember && !isOwner && (
                  <Button
                    onClick={() => setShowRequestDialog(true)}
                    className="w-full mt-4 bg-[#24B68E] hover:bg-[#1E9A78] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-300"
                  >
                    <UserPlus className="w-4 h-4" />
                    Solicitar Participação
                  </Button>
                )}
                {isMember && (
                  <div className="mt-4 flex items-center justify-center sm:justify-start gap-2 text-sm text-[#24B68E] font-semibold bg-[#F3F9F6] rounded-xl px-3 py-2 border border-[#24B68E]/20">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Você é membro deste projeto
                  </div>
                )}
                {!isAuthenticated && (
                  <Link href="/login" className="block mt-4 w-full">
                    <Button className="w-full bg-[#24B68E] hover:bg-[#1E9A78] text-white rounded-xl font-bold flex items-center justify-center shadow-sm transition-all duration-300">
                      Entrar para participar
                    </Button>
                  </Link>
                )}
              </div>

              {/* Participation Requests (Admin/Owner only) */}
              {canManage && requestsData && requestsData.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                  <h3 className="font-700 text-[#1F2937] text-sm mb-4">
                    Solicitações de Participação
                  </h3>
                  <div className="space-y-4">
                    {requestsData.map(({ request, user: applicant }) => (
                      <div key={request.id} className="border border-[#E5E7EB] rounded-xl p-3">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="w-8 h-8 border border-[#E5E7EB]">
                            <AvatarFallback className="bg-[#F3F4F6] text-[#6B7280] text-xs font-700">
                              {applicant.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-600 text-[#1F2937] truncate">{applicant.name}</p>
                            <p className="text-xs text-[#6B7280]">{applicant.email}</p>
                          </div>
                          <Badge 
                            variant={request.status === 'pendente' ? 'outline' : 'default'} 
                            className={`text-[10px] ${request.status === 'aprovado' ? 'bg-[#24B68E] hover:bg-[#1E9A78]' : request.status === 'rejeitado' ? 'bg-red-500 hover:bg-red-600' : ''}`}
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>
                        {request.message && (
                          <p className="text-xs text-[#4B5563] bg-[#F9FAFB] p-2 rounded-lg mb-3">
                            {request.message}
                          </p>
                        )}
                        {request.status === 'pendente' && (
                          <div className="flex gap-2 mt-2">
                            <Button 
                              size="sm" 
                              onClick={() => reviewRequestMutation.mutate({ id: request.id, status: "aprovado", projectId: project.id })}
                              disabled={reviewRequestMutation.isPending}
                              className="flex-1 bg-[#24B68E] hover:bg-[#1E9A78] text-white h-8 text-xs rounded-lg shadow-sm"
                            >
                              Aprovar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setRequestToReject(request.id)}
                              disabled={reviewRequestMutation.isPending}
                              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs rounded-lg border-red-200 transition-colors"
                            >
                              Rejeitar
                            </Button>
                          </div>
                        )}
                        {request.status !== 'pendente' && (
                          <div className="flex justify-end mt-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteRequestMutation.mutate({ id: request.id })}
                              disabled={deleteRequestMutation.isPending}
                              className="h-7 px-2 text-xs text-[#6B7280] hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Excluir Solicitação
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                <h3 className="font-700 text-[#1F2937] text-sm mb-4">
                  Equipe ({members.length})
                </h3>
                {members.length === 0 ? (
                  <p className="text-xs text-[#6B7280]">Nenhum membro ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {/* Owner */}
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 border-2 border-[#24B68E]/20">
                        <AvatarFallback className="bg-[#24B68E] text-white text-xs font-700">
                          {owner?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-600 text-[#1F2937] truncate">{owner?.name}</p>
                        <p className="text-xs text-[#24B68E] font-600">Responsável</p>
                      </div>
                    </div>
                    {members.map(({ member, user: memberUser }) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 border border-[#E5E7EB]">
                          <AvatarFallback className="bg-[#F3F4F6] text-[#6B7280] text-xs font-700">
                            {memberUser.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-600 text-[#1F2937] truncate">{memberUser.name}</p>
                          <p className="text-xs text-[#6B7280]">{member.memberRole ?? "Membro"}</p>
                        </div>
                        {canManage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setMemberToRemove(member.userId)}
                            className="h-8 w-8 p-0 text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover membro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-700 text-[#1F2937]">Solicitar Participação</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">
            Envie uma mensagem ao responsável explicando por que deseja participar deste projeto.
          </p>
          <Textarea
            placeholder="Descreva sua motivação e como pode contribuir..."
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            className="min-h-[100px] rounded-xl border-[#E5E7EB] focus:border-[#24B68E]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={() => requestMutation.mutate({ projectId: project.id, message: requestMessage })}
              disabled={requestMutation.isPending}
              className="bg-[#24B68E] hover:bg-[#1E9A78] text-white rounded-xl font-700"
            >
              {requestMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-700 text-red-600">Remover Projeto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">
            Tem certeza que deseja remover <strong>{project.title}</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={() => deleteMutation.mutate({ id: project.id })}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-700"
            >
              {deleteMutation.isPending ? "Removendo..." : "Remover Projeto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Request Dialog */}
      <Dialog open={requestToReject !== null} onOpenChange={(open) => !open && setRequestToReject(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-700 text-[#1F2937]">Rejeitar Solicitação</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">
            Por favor, justifique o motivo da rejeição. O aluno será notificado.
          </p>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Motivo da rejeição..."
            className="mt-2 min-h-[100px] resize-none rounded-xl"
          />
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setRequestToReject(null)} className="rounded-xl font-600">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (requestToReject) {
                  reviewRequestMutation.mutate({ id: requestToReject, status: "rejeitado", projectId: project.id, reason: rejectReason });
                }
              }}
              disabled={reviewRequestMutation.isPending || rejectReason.length < 5}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-700"
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={memberToRemove !== null} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-700 text-[#1F2937]">Remover Membro</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">
            Por favor, justifique o motivo da remoção. O membro será notificado.
          </p>
          <Textarea
            value={removeReason}
            onChange={(e) => setRemoveReason(e.target.value)}
            placeholder="Motivo da remoção..."
            className="mt-2 min-h-[100px] resize-none rounded-xl"
          />
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setMemberToRemove(null)} className="rounded-xl font-600">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (memberToRemove) {
                  removeMemberMutation.mutate({ projectId: project.id, userId: memberToRemove, reason: removeReason });
                }
              }}
              disabled={removeMemberMutation.isPending || removeReason.length < 5}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-700"
            >
              Confirmar Remoção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-700 text-[#1F2937]">Nova Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-600 text-[#374151] mb-1 block">Título da Tarefa</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Ex: Revisar documentação..."
                className="w-full flex h-10 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#24B68E] focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-600 text-[#374151] mb-1 block">Descrição (opcional)</label>
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Detalhes sobre a tarefa..."
                className="min-h-[80px] rounded-xl border-[#E5E7EB] focus:border-[#24B68E]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-600 text-[#374151] mb-1 block">Responsável</label>
                <select
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value ? Number(e.target.value) : "")}
                  className="w-full h-10 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#24B68E] transition-all"
                >
                  <option value="">Nenhum (Geral)</option>
                  {members.map(m => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-600 text-[#374151] mb-1 block">Data de Entrega</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#24B68E] transition-all"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)} className="rounded-xl font-600">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                createTaskMutation.mutate({
                  projectId: project.id,
                  title: taskTitle,
                  description: taskDescription,
                  assignedTo: taskAssignee === "" ? undefined : taskAssignee,
                  dueDate: taskDueDate || undefined,
                });
              }}
              disabled={createTaskMutation.isPending || taskTitle.length < 3}
              className="bg-[#24B68E] hover:bg-[#1E9A78] text-white rounded-xl font-700"
            >
              Criar Tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
