/**
 * MinhasPropostas Page – Painel do Aluno
 * Alunos visualizam suas propostas, editam rascunhos e enviam para revisão.
 */

import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, Plus, Clock, CheckCircle2, XCircle,
  Send, FileEdit, Trash2, AlertTriangle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { StudentProjectProposalForm } from "@/components/projects/StudentProjectProposalForm";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; Icon: React.ElementType }
> = {
  rascunho: {
    label: "Rascunho",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
    Icon: FileEdit,
  },
  pendente_aprovacao: {
    label: "Aguardando Revisão",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    Icon: Clock,
  },
  aprovado: {
    label: "Aprovado",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    Icon: CheckCircle2,
  },
  rejeitado: {
    label: "Rejeitado",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    Icon: XCircle,
  },
};

// ─── Proposal Card ────────────────────────────────────────────────────────────

interface ProposalRowProps {
  proposal: {
    project: {
      id: number;
      title: string;
      description: string;
      thematicArea: string;
      status: string;
      submittedAt: string | null;
      rejectionReason: string | null;
      linkedProjectId: number | null;
      createdAt: string;
    };
  };
  onSubmit: (id: number) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}

function ProposalRow({ proposal, onSubmit, onDelete, isLoading }: ProposalRowProps) {
  const p = proposal.project;
  const statusConf = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.rascunho;
  const StatusIcon = statusConf.Icon;

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:border-[#24B68E]/40 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-xs font-600 ${statusConf.badgeClass}`}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConf.label}
            </Badge>
            <span className="text-xs text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
              {p.thematicArea}
            </span>
          </div>
          <h3 className="font-700 text-[#1F2937] mb-1 truncate">{p.title}</h3>
          <p className="text-sm text-[#6B7280] line-clamp-2">{p.description}</p>

          {/* Rejection reason */}
          {p.status === "rejeitado" && p.rejectionReason && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-700 text-red-700 mb-0.5">Motivo da rejeição:</p>
                <p className="text-xs text-red-600">{p.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Linked project */}
          {p.status === "aprovado" && p.linkedProjectId && (
            <div className="mt-3">
              <Link href={`/projetos/${p.linkedProjectId}`}>
                <Button size="sm" variant="outline" className="rounded-xl text-[#24B68E] border-[#24B68E]/30 hover:bg-[#F3F9F6] text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Ver Projeto Oficial
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          {p.status === "rascunho" && (
            <>
              <Button
                size="sm"
                onClick={() => onSubmit(p.id)}
                disabled={isLoading}
                className="bg-[#24B68E] hover:bg-[#1E9A78] text-white rounded-xl font-700 text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Enviar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(p.id)}
                disabled={isLoading}
                className="border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MinhasPropostasPage() {
  const { user, isAuthenticated } = useAuth();
  const [showNewForm, setShowNewForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  // Access guard
  if (!isAuthenticated || user?.role !== "aluno") {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-700 text-[#1F2937] mb-2">Acesso Restrito</h2>
            <p className="text-[#6B7280] text-sm mb-4">
              Esta área é exclusiva para alunos.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-full">Voltar</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { data: proposals, isLoading } = trpc.studentProjects.listMine.useQuery();

  const submitMutation = trpc.studentProjects.submit.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.studentProjects.listMine.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.studentProjects.deleteDraft.useMutation({
    onSuccess: () => {
      toast.success("Rascunho excluído.");
      setConfirmDeleteId(null);
      utils.studentProjects.listMine.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const isActing = submitMutation.isPending || deleteMutation.isPending;

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F9FAFB]">
        {/* Header */}
        <div style={{ backgroundColor: "#24B68E" }} className="pt-8 pb-16 relative overflow-hidden">
          <div className="container relative z-10">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-600 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-800 text-white mb-1">Minhas Propostas</h1>
                <p className="text-white/80 text-sm">
                  Proponha projetos e acompanhe o processo de aprovação.
                </p>
              </div>
              <Button
                onClick={() => setShowNewForm(true)}
                className="bg-white text-[#24B68E] hover:bg-[#F9FAFB] font-700 rounded-full shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" /> Nova Proposta
              </Button>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-10">
              <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#F9FAFB" />
            </svg>
          </div>
        </div>

        <div className="container -mt-6 pb-16">
          {/* Status guide */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-6 shadow-sm">
            <p className="text-xs font-700 text-[#6B7280] uppercase tracking-wide mb-3">Fluxo das Propostas</p>
            <div className="flex items-center gap-2 flex-wrap text-xs text-[#6B7280]">
              <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                <FileEdit className="w-3 h-3" /> Rascunho
              </span>
              <span>→</span>
              <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                <Clock className="w-3 h-3" /> Aguardando
              </span>
              <span>→</span>
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Aprovado
              </span>
              <span className="text-[#D1D5DB]">ou</span>
              <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full">
                <XCircle className="w-3 h-3" /> Rejeitado
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !proposals || proposals.length === 0 ? (
            <Card className="p-12 text-center bg-white rounded-2xl border border-[#E5E7EB]">
              <div className="w-16 h-16 rounded-2xl bg-[#F3F9F6] flex items-center justify-center mx-auto mb-4">
                <FileEdit className="w-8 h-8 text-[#24B68E]/40" />
              </div>
              <h3 className="text-lg font-700 text-[#1F2937] mb-2">Nenhuma proposta ainda</h3>
              <p className="text-[#6B7280] text-sm mb-6">
                Tem uma ideia de projeto? Proponha e um professor poderá orientar você!
              </p>
              <Button
                onClick={() => setShowNewForm(true)}
                className="bg-[#24B68E] hover:bg-[#1E9A78] text-white rounded-full font-700"
              >
                <Plus className="w-4 h-4 mr-2" /> Criar Primeira Proposta
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <ProposalRow
                  key={proposal.project.id}
                  proposal={proposal}
                  onSubmit={(id) => submitMutation.mutate({ studentProjectId: id })}
                  onDelete={(id) => setConfirmDeleteId(id)}
                  isLoading={isActing}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Proposal Dialog */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-700 text-[#1F2937]">Nova Proposta de Projeto</DialogTitle>
          </DialogHeader>
          <StudentProjectProposalForm
            onSuccess={() => {
              setShowNewForm(false);
              utils.studentProjects.listMine.invalidate();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteId !== null} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-700 text-red-600">Excluir Rascunho</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">
            Tem certeza que deseja excluir este rascunho? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={() => confirmDeleteId !== null && deleteMutation.mutate({ studentProjectId: confirmDeleteId })}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-700"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
