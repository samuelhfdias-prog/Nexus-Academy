import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { ArrowLeft, Plus, X, Save } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { THEMATIC_AREAS } from "@shared/const";


export default function ProjectForm() {
  const params = useParams<{ id: string }>();
  const isEdit = !!params.id;
  const projectId = isEdit ? parseInt(params.id!) : undefined;
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thematicArea, setThematicArea] = useState("");
  const [status, setStatus] = useState<"ativo" | "concluido" | "em_pausa">("ativo");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [maxMembers, setMaxMembers] = useState(10);
  const [isPublic, setIsPublic] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const { data: existingProject } = trpc.projects.byId.useQuery(
    { id: projectId! },
    { enabled: isEdit && !!projectId }
  );

  useEffect(() => {
    if (existingProject) {
      const p = existingProject.project;
      setTitle(p.title);
      setDescription(p.description);
      setThematicArea(p.thematicArea);
      setStatus(p.status);
      setStartDate(new Date(p.startDate).toISOString().split("T")[0]);
      if (p.endDate) setEndDate(new Date(p.endDate).toISOString().split("T")[0]);
      setMaxMembers(p.maxMembers ?? 10);
      setIsPublic(p.isPublic);
      if (p.tags) setTags(JSON.parse(p.tags));
    }
  }, [existingProject]);

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success("Projeto criado com sucesso!");
      // Redireciona para a página do projeto recém-criado (corrige bug de abertura)
      if (data.projectId) {
        navigate(`/projetos/${data.projectId}`);
      } else {
        navigate("/projetos");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Projeto atualizado com sucesso!");
      navigate(`/projetos/${projectId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  // Permitir acesso se for professor/admin ou se for edição e o usuário for o dono do projeto
  const canAccess = isAuthenticated && (
    user?.role === "professor" || 
    user?.role === "admin" || 
    (isEdit && (!existingProject || user?.id === existingProject.project.ownerId))
  );

  if (!canAccess) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-700 text-[#1F2937] mb-2">Acesso Restrito</h2>
            <p className="text-[#6B7280] text-sm mb-4">Você não tem permissão para editar este projeto.</p>
            <Link href="/projetos"><Button variant="outline" className="rounded-full">Voltar</Button></Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 8) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title, description, thematicArea, status,
      startDate, endDate: endDate || undefined,
      maxMembers, isPublic,
      tags: tags.length > 0 ? JSON.stringify(tags) : undefined,
    };
    if (isEdit && projectId) {
      updateMutation.mutate({ id: projectId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F9FAFB]">
        <div style={{ backgroundColor: "#24B68E" }} className="pt-8 pb-16 relative overflow-hidden">
          <div className="container relative z-10">
            <Link href="/projetos" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-600 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
            <h1 className="text-2xl font-800 text-white">
              {isEdit ? "Editar Projeto" : "Novo Projeto de PD&I"}
            </h1>
          </div>
          <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-10">
              <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#F9FAFB" />
            </svg>
          </div>
        </div>

        <div className="container max-w-3xl -mt-6 pb-16">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-sm font-700 text-[#1F2937]">Título do Projeto *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Sistema de Monitoramento Ambiental com IoT"
                required
                className="rounded-xl border-[#E5E7EB] focus:border-[#24B68E]"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-700 text-[#1F2937]">Descrição *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva os objetivos, metodologia e resultados esperados do projeto..."
                required
                className="min-h-[140px] rounded-xl border-[#E5E7EB] focus:border-[#24B68E]"
              />
            </div>

            {/* Area & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-700 text-[#1F2937]">Área Temática *</Label>
                <Select value={thematicArea} onValueChange={setThematicArea} required>
                  <SelectTrigger className="rounded-xl border-[#E5E7EB]">
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    {THEMATIC_AREAS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-700 text-[#1F2937]">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger className="rounded-xl border-[#E5E7EB]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="em_pausa">Em Pausa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-700 text-[#1F2937]">Data de Início *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="rounded-xl border-[#E5E7EB]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-700 text-[#1F2937]">Previsão de Término</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl border-[#E5E7EB]"
                />
              </div>
            </div>

            {/* Max Members & Public */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-700 text-[#1F2937]">Máximo de Membros</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                  className="rounded-xl border-[#E5E7EB]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-700 text-[#1F2937]">Visibilidade</Label>
                <div className="flex items-center gap-3 h-10">
                  <Switch
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                    className="data-[state=checked]:bg-[#24B68E]"
                  />
                  <span className="text-sm text-[#4B5563]">{isPublic ? "Público" : "Privado"}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-700 text-[#1F2937]">Tags (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                  placeholder="Ex: machine-learning, python..."
                  className="rounded-xl border-[#E5E7EB] flex-1"
                />
                <Button type="button" onClick={handleAddTag} variant="outline" className="rounded-xl border-[#E5E7EB]">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F3F9F6] text-[#24B68E] text-xs rounded-lg font-600 border border-[#24B68E]/20">
                      {tag}
                      <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                        <X className="w-3 h-3 hover:text-red-500" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isPending || !title || !description || !thematicArea}
                className="flex-1 bg-[#24B68E] hover:bg-[#1E9A78] text-white rounded-xl font-700 h-11"
              >
                <Save className="w-4 h-4 mr-2" />
                {isPending ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Projeto"}
              </Button>
              <Link href={isEdit ? `/projetos/${projectId}` : "/projetos"}>
                <Button type="button" variant="outline" className="rounded-xl h-11 px-6">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
