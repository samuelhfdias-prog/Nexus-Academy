/**
 * ProjectApprovals Page – Revisão de Propostas de Alunos
 * Apenas professores e administradores têm acesso.
 * Mostra propostas de alunos no status "pendente_aprovacao".
 */

import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Clock, ArrowLeft, Eye, GraduationCap, Layers, Calendar } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StudentProjectReviewDialog } from "@/components/projects/StudentProjectReviewDialog";

// ─── Student Proposal Card ────────────────────────────────────────────────────

interface ProposalCardProps {
  proposal: {
    project: {
      id: number;
      title: string;
      description: string;
      thematicArea: string;
      suggestedMaxMembers: number | null;
      submittedAt: string | null;
      status: string;
    };
    student: {
      id: number;
      name: string | null;
      email: string | null;
    } | null;
  };
  onReviewComplete: () => void;
}

function ProposalCard({ proposal, onReviewComplete }: ProposalCardProps) {
  const [showDialog, setShowDialog] = useState(false);

  const submittedDate = proposal.project.submittedAt
    ? new Date(proposal.project.submittedAt)
    : null;
  const daysSince = submittedDate
    ? Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <>
      <div className="bg-white rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
        {/* Status bar */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-amber-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-700 text-gray-900 text-base mb-2 line-clamp-2">
                {proposal.project.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-600 text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Aguardando Revisão
                </Badge>
                {daysSince > 0 && (
                  <span className="text-xs text-amber-600 font-500">
                    há {daysSince} dia{daysSince !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-gray-600 line-clamp-2">{proposal.project.description}</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Layers className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">{proposal.project.thematicArea}</span>
            </div>
            {proposal.student?.name && (
              <div className="flex items-center gap-2 text-gray-600">
                <GraduationCap className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{proposal.student.name}</span>
              </div>
            )}
            {submittedDate && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{submittedDate.toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            {proposal.project.suggestedMaxMembers && (
              <div className="flex items-center gap-2 text-gray-600 text-xs">
                <span>Sugestão: {proposal.project.suggestedMaxMembers} membros</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <Button
            size="sm"
            onClick={() => setShowDialog(true)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-700 rounded-xl"
          >
            <Eye className="w-4 h-4 mr-2" />
            Revisar Proposta
          </Button>
        </div>
      </div>

      <StudentProjectReviewDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        proposal={{
          id: proposal.project.id,
          title: proposal.project.title,
          description: proposal.project.description,
          thematicArea: proposal.project.thematicArea,
          studentName: proposal.student?.name ?? undefined,
          suggestedMaxMembers: proposal.project.suggestedMaxMembers,
        }}
        onReviewComplete={() => {
          setShowDialog(false);
          onReviewComplete();
        }}
      />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectApprovalsPage() {
  const { user, isAuthenticated } = useAuth();

  // Access guard – professor and admin only
  if (!isAuthenticated || (user?.role !== "professor" && user?.role !== "admin")) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-700 text-[#1F2937] mb-2">Acesso Restrito</h2>
            <p className="text-[#6B7280] text-sm mb-4">
              Apenas professores e administradores podem revisar propostas.
            </p>
            <Link href="/projetos">
              <Button variant="outline" className="rounded-full">Voltar</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const utils = trpc.useUtils();
  const { data: pendingProposals, isLoading } = trpc.studentProjects.listPending.useQuery();

  const handleReviewComplete = () => utils.studentProjects.listPending.invalidate();

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F9FAFB]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 pt-8 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="container relative z-10">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-600 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-800 text-white mb-2">Revisão de Propostas</h1>
              <p className="text-white/80 text-sm">
                Propostas de projetos enviadas por alunos aguardando sua aprovação.
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-10">
              <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#F9FAFB" />
            </svg>
          </div>
        </div>

        <div className="container -mt-6 pb-16 relative z-10">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-52 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !pendingProposals || pendingProposals.length === 0 ? (
            <Card className="p-12 text-center bg-white rounded-2xl border border-[#E5E7EB]">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-700 text-gray-900 mb-2">
                Nenhuma proposta pendente!
              </h3>
              <p className="text-gray-600 mb-6">
                Todos os projetos foram revisados. Volte mais tarde.
              </p>
              <Link href="/projetos">
                <Button className="bg-purple-500 hover:bg-purple-600 text-white rounded-full">
                  Ver Projetos
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Counter bar */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span className="font-600 text-gray-900">
                    {pendingProposals.length} proposta{pendingProposals.length !== 1 ? "s" : ""} pendente{pendingProposals.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <span className="text-sm text-gray-500">Revisão recomendada</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingProposals.map((p) => (
                  <ProposalCard
                    key={p.project.id}
                    proposal={p}
                    onReviewComplete={handleReviewComplete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
