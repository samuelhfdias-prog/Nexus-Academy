import { useState } from "react";
import { Award, Plus, Search, Zap, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SKILL_CATEGORIES } from "@shared/const";

const CATEGORY_COLORS: Record<string, string> = {
  "Programação": "bg-blue-50 text-blue-700 border-blue-200",
  "Dados": "bg-purple-50 text-purple-700 border-purple-200",
  "Design": "bg-pink-50 text-pink-700 border-pink-200",
  "Gestão": "bg-amber-50 text-amber-700 border-amber-200",
  "Hardware": "bg-orange-50 text-orange-700 border-orange-200",
  "Ciências": "bg-green-50 text-green-700 border-green-200",
};

export default function Skills() {
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("");
  const [skillToDelete, setSkillToDelete] = useState<{ id: number; name: string } | null>(null);
  const utils = trpc.useUtils();

  const { data: allSkills, isLoading } = trpc.skills.list.useQuery();

  const createMutation = trpc.skills.create.useMutation({
    onSuccess: () => {
      toast.success("Competência criada!");
      setShowCreate(false);
      setNewSkillName("");
      setNewSkillCategory("");
      utils.skills.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.skills.delete.useMutation({
    onSuccess: () => {
      toast.success("Competência removida com sucesso!");
      setSkillToDelete(null);
      utils.skills.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const canCreate = isAuthenticated && (user?.role === "professor" || user?.role === "admin");

  const filtered = allSkills?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const skillsCountText = (allSkills?.length ?? 0) === 1
    ? "1 competência disponível na plataforma"
    : `${allSkills?.length ?? 0} competências disponíveis na plataforma`;

  const grouped = filtered.reduce((acc, skill) => {
    const cat = skill.category ?? "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, typeof filtered>);

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F9FAFB]">
        {/* Header */}
        <div style={{ backgroundColor: "#24B68E" }} className="pt-8 pb-16 relative overflow-hidden">
          <div className="container relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-800 text-white mb-2">Competências</h1>
                <p className="text-white/80 text-sm">
                  {skillsCountText}
                </p>
              </div>
              {canCreate && (
                <Button
                  onClick={() => setShowCreate(true)}
                  className="bg-white text-[#24B68E] hover:bg-[#F9FAFB] font-700 rounded-full shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" /> Nova Competência
                </Button>
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
          {/* Search */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-6 shadow-sm relative z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <Input
                placeholder="Buscar competências..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#E5E7EB] focus:border-[#24B68E] rounded-xl"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-xl" />
              ))}
            </div>
          ) : Object.keys(grouped).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(grouped).map(([category, categorySkills]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-[#F3F9F6] flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-[#24B68E]" />
                    </div>
                    <h2 className="font-700 text-[#1F2937] text-base">{category}</h2>
                    <span className="text-xs text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
                      {categorySkills.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categorySkills.map((skill) => {
                      const colorClass = CATEGORY_COLORS[category] ?? "bg-[#F3F9F6] text-[#24B68E] border-[#24B68E]/20";
                      return (
                        <span
                          key={skill.id}
                          className={`group/skill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-600 border transition-all duration-200 hover:shadow-sm ${canCreate ? "cursor-pointer pr-2" : "cursor-default"} ${colorClass}`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          {skill.name}
                          {canCreate && (
                            <button
                              onClick={() => setSkillToDelete({ id: skill.id, name: skill.name })}
                              className="ml-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover/skill:opacity-100 transition-opacity duration-200 hover:bg-red-100 hover:text-red-600"
                              title="Remover competência"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-[#F3F9F6] flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-[#24B68E]/40" />
              </div>
              <h3 className="font-700 text-[#1F2937] text-lg mb-2">Nenhuma competência encontrada</h3>
              <p className="text-[#6B7280] text-sm">
                {search ? "Tente outro termo de busca." : "Ainda não há competências cadastradas."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-700 text-[#1F2937]">Nova Competência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-700 text-[#1F2937]">Nome *</Label>
              <Input
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Ex: Python, Machine Learning, React..."
                className="rounded-xl border-[#E5E7EB] focus:border-[#24B68E]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-700 text-[#1F2937]">Categoria</Label>
              <Select value={newSkillCategory} onValueChange={setNewSkillCategory}>
                <SelectTrigger className="rounded-xl border-[#E5E7EB]">
                  <SelectValue placeholder="Selecione uma categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate({ name: newSkillName, category: newSkillCategory || undefined })}
              disabled={!newSkillName || createMutation.isPending}
              className="bg-[#24B68E] hover:bg-[#1E9A78] text-white rounded-xl font-700"
            >
              {createMutation.isPending ? "Criando..." : "Criar Competência"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!skillToDelete} onOpenChange={() => setSkillToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-700 text-[#1F2937]">Remover Competência</DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Tem certeza que deseja remover a competência <strong className="text-[#1F2937]">"{skillToDelete?.name}"</strong>? 
              Esta ação irá removê-la de todos os perfis de usuários e projetos associados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkillToDelete(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={() => skillToDelete && deleteMutation.mutate({ skillId: skillToDelete.id })}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-700"
            >
              {deleteMutation.isPending ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
