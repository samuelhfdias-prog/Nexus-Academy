/**
 * Project Approval Card
 * Card para mostrar projetos pendentes de aprovação
 */

import { useState } from "react";
import { Link } from "wouter";
import { Clock, Eye, CheckCircle, XCircle, Calendar, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectReviewDialog } from "./ProjectReviewDialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ProjectApprovalCardProps {
  id: number;
  title: string;
  description: string;
  thematicArea: string;
  ownerName?: string;
  submittedAt?: string;
  status: "pendente_aprovacao";
  onReviewComplete?: () => void;
}

export function ProjectApprovalCard({
  id,
  title,
  description,
  thematicArea,
  ownerName,
  submittedAt,
  onReviewComplete,
}: ProjectApprovalCardProps) {
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const approveMutation = trpc.projectApproval.approve.useMutation();
  const rejectMutation = trpc.projectApproval.reject.useMutation();

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await approveMutation.mutateAsync({ projectId: id });
      toast.success("Projeto aprovado com sucesso!");
      onReviewComplete?.();
      setShowReviewDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao aprovar projeto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    setIsLoading(true);
    try {
      await rejectMutation.mutateAsync({ projectId: id, reason });
      toast.success("Projeto rejeitado");
      onReviewComplete?.();
      setShowReviewDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao rejeitar projeto");
    } finally {
      setIsLoading(false);
    }
  };

  const submittedDate = submittedAt ? new Date(submittedAt) : null;
  const daysSinceSubmission = submittedDate
    ? Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <>
      <div className="bg-white rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Header with status */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-amber-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-700 text-gray-900 text-base line-clamp-2 mb-2">
                {title}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-600">
                  <Clock className="w-3 h-3 mr-1" />
                  Pendente de Aprovação
                </Badge>
                {daysSinceSubmission > 0 && (
                  <span className="text-xs text-amber-600 font-500">
                    Há {daysSinceSubmission} dia{daysSinceSubmission !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Description preview */}
          <div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {description}
            </p>
          </div>

          {/* Meta information */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Layers className="w-4 h-4 text-gray-400" />
              <span>{thematicArea}</span>
            </div>
            {ownerName && (
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-500">Professor:</span>
                <span>{ownerName}</span>
              </div>
            )}
            {submittedDate && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{submittedDate.toLocaleDateString("pt-BR")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <Link href={`/projetos/${id}`}>
            <Button variant="outline" className="flex-1" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
          </Link>
          <Button
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white font-600"
            onClick={() => setShowReviewDialog(true)}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Revisar
          </Button>
        </div>
      </div>

      <ProjectReviewDialog
        isOpen={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        projectTitle={title}
        onApprove={handleApprove}
        onReject={handleReject}
        isLoading={isLoading}
      />
    </>
  );
}
