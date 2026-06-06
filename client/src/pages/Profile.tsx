import { Logo } from "@/components/Logo";
import { useState } from "react";
import { Link } from "wouter";
import {
  User, Edit, Save, X,  Award, Calendar,
  Building, GraduationCap, ArrowRight, Plus, Trash2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const LEVEL_LABELS: Record<string, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

const LEVEL_COLORS: Record<string, string> = {
  basico: "bg-blue-50 text-blue-700 border-blue-200",
  intermediario: "bg-amber-50 text-amber-700 border-amber-200",
  avancado: "bg-green-50 text-green-700 border-green-200",
};

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [institution, setInstitution] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<"basico" | "intermediario" | "avancado">("basico");

  const utils = trpc.useUtils();

  const { data: profileData, isLoading } = trpc.profile.get.useQuery(
    { userId: undefined },
    { enabled: isAuthenticated }
  );

  const { data: allSkills } = trpc.skills.list.useQuery();

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado!");
      setEditing(false);
      utils.profile.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const addSkillMutation = trpc.skills.addToProfile.useMutation({
    onSuccess: () => {
      toast.success("Competência adicionada!");
      utils.profile.get.invalidate();
      setSelectedSkillId("");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeSkillMutation = trpc.skills.removeFromProfile.useMutation({
    onSuccess: () => {
      toast.success("Competência removida!");
      utils.profile.get.invalidate();
    },
  });

  const startEdit = () => {
    if (profileData?.user) {
      setName(profileData.user.name ?? "");
      setBio(profileData.user.bio ?? "");
      setInstitution(profileData.user.institution ?? "");
      setCourse(profileData.user.course ?? "");
      setSemester(profileData.user.semester?.toString() ?? "");
      setBirthDate(profileData.user.birthDate ?? "");
    }
    setEditing(true);
  };

  if (loading || isLoading) {
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
          <div className="text-center">
            <h2 className="text-xl font-700 text-[#1F2937] mb-2">Acesso Restrito</h2>
            <p className="text-[#6B7280] text-sm mb-4">Faça login para ver seu perfil.</p>
            <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-6 py-3 bg-[#24B68E] text-white rounded-full font-700 text-sm">
              Entrar <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </AppLayout>
    );
  }

  const profile = profileData?.user;
  const userSkills = profileData?.skills ?? [];
  const projects = profileData?.projects;
  const initials = profile?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "U";

  const existingSkillIds = new Set(userSkills.map((s) => s.skill.id));
  const availableSkills = allSkills?.filter((s) => !existingSkillIds.has(s.id)) ?? [];

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F9FAFB]">
        {/* Header */}
        <div style={{ backgroundColor: "#24B68E" }} className="pt-8 pb-24 relative overflow-hidden">
          <div className="container relative z-10">
            <h1 className="text-2xl font-800 text-white mb-1">Meu Perfil</h1>
            <p className="text-white/70 text-sm">Gerencie suas informações e competências</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-10">
              <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#F9FAFB" />
            </svg>
          </div>
        </div>

        <div className="container max-w-4xl -mt-14 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-[#24B68E]/20">
                  <AvatarFallback className="bg-[#24B68E] text-white text-2xl font-800">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {editing ? (
                  <div className="space-y-3 text-left">
                    <div>
                      <Label className="text-xs font-700 text-[#1F2937]">Nome</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border-[#E5E7EB] mt-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs font-700 text-[#1F2937]">Bio</Label>
                      <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="rounded-xl border-[#E5E7EB] mt-1 text-sm min-h-[80px]" placeholder="Conte um pouco sobre você..." />
                    </div>
                    <div>
                      <Label className="text-xs font-700 text-[#1F2937]">Instituição</Label>
                      <Input value={institution} onChange={(e) => setInstitution(e.target.value)} className="rounded-xl border-[#E5E7EB] mt-1 text-sm" placeholder="FATEC Pompéia" />
                    </div>
                    <div>
                      <Label className="text-xs font-700 text-[#1F2937]">Curso</Label>
                      <Input value={course} onChange={(e) => setCourse(e.target.value)} className="rounded-xl border-[#E5E7EB] mt-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs font-700 text-[#1F2937]">Semestre</Label>
                      <Input type="number" min={1} max={12} value={semester} onChange={(e) => setSemester(e.target.value)} className="rounded-xl border-[#E5E7EB] mt-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs font-700 text-[#1F2937]">Data de nascimento</Label>
                      <Input type="date" value={birthDate} max={new Date().toISOString().split("T")[0]} onChange={(e) => setBirthDate(e.target.value)} className="rounded-xl border-[#E5E7EB] mt-1 text-sm [color-scheme:light]" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => updateMutation.mutate({ name, bio, institution, course, semester: semester ? parseInt(semester) : undefined, birthDate: birthDate || undefined })}
                        disabled={updateMutation.isPending}
                        className="flex-1 bg-[#24B68E] hover:bg-[#1E9A78] text-white rounded-xl text-sm font-700"
                        size="sm"
                      >
                        <Save className="w-3.5 h-3.5 mr-1" />
                        {updateMutation.isPending ? "..." : "Salvar"}
                      </Button>
                      <Button variant="outline" onClick={() => setEditing(false)} className="rounded-xl" size="sm">
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-700 text-[#1F2937] text-lg">{profile?.name ?? "—"}</h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">{profile?.email}</p>
                    <span className="inline-flex items-center mt-2 px-2.5 py-1 rounded-full bg-[#F3F9F6] text-[#24B68E] text-xs font-700 border border-[#24B68E]/20">
                      {profile?.role === "admin" ? "Administrador" : profile?.role === "professor" ? "Professor" : "Aluno"}
                    </span>
                    {profile?.bio && (
                      <p className="text-sm text-[#4B5563] mt-3 text-left leading-relaxed">{profile.bio}</p>
                    )}
                    <div className="mt-4 space-y-2 text-left">
                      {profile?.institution && (
                        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                          <Building className="w-3.5 h-3.5 text-[#24B68E]" />
                          {profile.institution}
                        </div>
                      )}
                      {profile?.course && (
                        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                          <GraduationCap className="w-3.5 h-3.5 text-[#24B68E]" />
                          {profile.course}
                          {profile.semester && ` · ${profile.semester}º semestre`}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                        <Calendar className="w-3.5 h-3.5 text-[#24B68E]" />
                        Membro desde {new Date(profile?.createdAt ?? Date.now()).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                      </div>
                      {profile?.birthDate && (
                        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                          <Calendar className="w-3.5 h-3.5 text-[#24B68E]" />
                          Nascimento: {new Date(profile.birthDate + "T12:00:00Z").toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={startEdit}
                      variant="outline"
                      className="w-full mt-4 rounded-xl border-[#E5E7EB] text-sm font-600"
                      size="sm"
                    >
                      <Edit className="w-3.5 h-3.5 mr-2" /> Editar Perfil
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Skills */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-700 text-[#1F2937] text-base">Competências</h3>
                  <span className="text-xs text-[#6B7280]">{userSkills.length} registadas</span>
                </div>

                {/* Add Skill */}
                <div className="flex gap-2 mb-4">
                  <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                    <SelectTrigger className="flex-1 rounded-xl border-[#E5E7EB] text-sm">
                      <SelectValue placeholder="Selecionar competência..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSkills.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as typeof selectedLevel)}>
                    <SelectTrigger className="w-36 rounded-xl border-[#E5E7EB] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Básico</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      if (selectedSkillId) {
                        addSkillMutation.mutate({ skillId: parseInt(selectedSkillId), level: selectedLevel });
                      }
                    }}
                    disabled={!selectedSkillId || addSkillMutation.isPending}
                    className="bg-[#24B68E] hover:bg-[#1E9A78] text-white rounded-xl"
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {userSkills.length === 0 ? (
                  <p className="text-sm text-[#6B7280] text-center py-4">Nenhuma competência cadastrada ainda.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {userSkills.map(({ skill, userSkill }) => (
                      <div
                        key={skill.id}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-700 border ${LEVEL_COLORS[userSkill.level]}`}
                      >
                        <Award className="w-3 h-3" />
                        {skill.name}
                        <span className="opacity-70">· {LEVEL_LABELS[userSkill.level]}</span>
                        <button
                          onClick={() => removeSkillMutation.mutate({ skillId: skill.id })}
                          className="ml-1 hover:opacity-100 opacity-50 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Projects */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-700 text-[#1F2937] text-base">Histórico de Projetos</h3>
                </div>

                {(!projects || (Array.isArray(projects) ? projects.length === 0 : projects.owned.length === 0 && projects.memberOf.length === 0)) ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-[#6B7280] mb-3">Você ainda não participa de nenhum projeto.</p>
                    <Link href="/projetos">
                      <button className="inline-flex items-center gap-2 text-sm font-700 text-[#24B68E] hover:text-[#1E9A78]">
                        Explorar Projetos <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects && 'owned' in projects && projects.owned.map((project) => (
                      <Link key={project.id} href={`/projetos/${project.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors group cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#F3F9F6] flex items-center justify-center">
                              <Logo className="w-4 h-4 text-[#24B68E]" />
                            </div>
                            <div>
                              <p className="text-sm font-700 text-[#1F2937] group-hover:text-[#24B68E] line-clamp-1">{project.title}</p>
                              <p className="text-xs text-[#6B7280]">{project.thematicArea} · Responsável</p>
                            </div>
                          </div>
                          <StatusBadge status={project.status} />
                        </div>
                      </Link>
                    ))}
                    {projects && 'memberOf' in projects && projects.memberOf.map((project) => (
                      <Link key={project.id} href={`/projetos/${project.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors group cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
                              <Logo className="w-4 h-4 text-[#6B7280]" />
                            </div>
                            <div>
                              <p className="text-sm font-700 text-[#1F2937] group-hover:text-[#24B68E] line-clamp-1">{project.title}</p>
                              <p className="text-xs text-[#6B7280]">{project.thematicArea} · Membro</p>
                            </div>
                          </div>
                          <StatusBadge status={project.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
