/**
 * Student Project Review Dialog
 * Dialog para professores revisar propostas de alunos com opção de se tornar orientador
 */

import { useState } from "react";
import { AlertCircle, CheckCircle, XCircle, GraduationCap, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export interface StudentProjectReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: {
    id: number;
    title: string;
    description: string;
    thematicArea: string;
    studentName?: string;
    suggestedMaxMembers?: number | null;
  };
  onReviewComplete?: () => void;
}

export function StudentProjectReviewDialog({
  isOpen,
  onClose,
  proposal,
  onReviewComplete,
}: StudentProjectReviewDialogProps) {
  const [step, setStep] = useState<"choose" | "approve" | "reject">("choose");
  const [rejectionReason, setRejectionReason] = useState("");
  const [becomeAdvisor, setBecomeAdvisor] = useState(true);
  const [maxMembers, setMaxMembers] = useState(proposal.suggestedMaxMembers ?? 10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviewMutation = trpc.studentProjects.review.useMutation();

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const result = await reviewMutation.mutateAsync({
        studentProjectId: proposal.id,
        approved: true,
        becomeAdvisor,
        maxMembers,
      });
      toast.success(result.message);
      onReviewComplete?.();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao aprovar proposta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      toast.error("Forneça um motivo com no mínimo 5 caracteres");
      return;
    }
    setIsSubmitting(true);
    try {
      await reviewMutation.mutateAsync({
        studentProjectId: proposal.id,
        approved: false,
        rejectionReason,
      });
      toast.success("Proposta rejeitada. O aluno foi notificado.");
      onReviewComplete?.();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao rejeitar proposta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("choose");
    setRejectionReason("");
    setBecomeAdvisor(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-700 text-[#1F2937]">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Revisar Proposta de Aluno
          </DialogTitle>
        </DialogHeader>

        {/* Proposal summary always visible */}
        <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-4 space-y-1">
          <p className="text-xs text-[#6B7280] font-600 uppercase tracking-wide">Proposta</p>
          <p className="font-700 text-[#1F2937]">{proposal.title}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">{proposal.thematicArea}</Badge>
            {proposal.studentName && (
              <span className="text-xs text-[#6B7280]">por {proposal.studentName}</span>
            )}
          </div>
        </div>

        {/* Step: Choose action */}
        {step === "choose" && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-[#6B7280]">
              Escolha uma ação para esta proposta.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setStep("approve")}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl h-12 font-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
              <Button
                onClick={() => setStep("reject")}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl h-12 font-700"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          </div>
        )}

        {/* Step: Approve */}
        {step === "approve" && (
          <div className="space-y-4 py-2">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Você está aprovando <strong>{proposal.title}</strong>.
              </AlertDescription>
            </Alert>

            {/* Become advisor option */}
            <div className="rounded-xl border border-[#E5E7EB] p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="w-4 h-4 text-[#24B68E]" />
                    <span className="font-700 text-[#1F2937] text-sm">Tornar-se Orientador</span>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    Cria um projeto oficial e você vira o orientador. O aluno entra como membro proponente.
                  </p>
                </div>
                <Switch
                  checked={becomeAdvisor}
                  onCheckedChange={setBecomeAdvisor}
                  className="data-[state=checked]:bg-[#24B68E] shrink-0 mt-1"
                />
              </div>

              {becomeAdvisor && (
                <div className="space-y-2 border-t border-[#E5E7EB] pt-3">
                  <Label className="text-xs font-700 text-[#4B5563] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Máximo de Membros
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(parseInt(e.target.value) || 10)}
                    className="rounded-lg border-[#E5E7EB] h-9 text-sm"
                  />
                  <p className="text-xs text-[#9CA3AF]">
                    Sugestão do aluno: {proposal.suggestedMaxMembers ?? 5} membros
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("choose")}
                disabled={isSubmitting}
                className="rounded-xl"
              >
                Voltar
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl font-700"
              >
                {isSubmitting
                  ? "Processando..."
                  : becomeAdvisor
                  ? "Aprovar e Orientar"
                  : "Confirmar Aprovação"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Reject */}
        {step === "reject" && (
          <div className="space-y-4 py-2">
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Rejeitar <strong>{proposal.title}</strong>. O aluno poderá revisar e reenviar.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="rejection-reason" className="text-sm font-700 text-[#1F2937]">
                Motivo da Rejeição *
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explique o motivo e o que pode ser melhorado (mínimo 5 caracteres)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                minLength={5}
                maxLength={500}
                rows={4}
                className="resize-none rounded-xl border-[#E5E7EB] focus:border-[#24B68E]"
              />
              <p className="text-xs text-[#9CA3AF]">{rejectionReason.length}/500</p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("choose")}
                disabled={isSubmitting}
                className="rounded-xl"
              >
                Voltar
              </Button>
              <Button
                onClick={handleReject}
                disabled={isSubmitting || rejectionReason.trim().length < 5}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-700"
              >
                {isSubmitting ? "Processando..." : "Confirmar Rejeição"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
