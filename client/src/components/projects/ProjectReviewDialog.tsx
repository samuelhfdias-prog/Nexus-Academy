/**
 * Project Review Dialog
 * Dialog para professores/admins revisar e aprovar/rejeitar projetos
 */

import { useState } from "react";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export interface ProjectReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function ProjectReviewDialog({
  isOpen,
  onClose,
  projectTitle,
  onApprove,
  onReject,
  isLoading = false,
}: ProjectReviewDialogProps) {
  const [reviewType, setReviewType] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove();
      toast.success("Projeto aprovado com sucesso!");
      handleClose();
    } catch (error) {
      toast.error("Erro ao aprovar projeto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Forneça um motivo para a rejeição");
      return;
    }

    setIsSubmitting(true);
    try {
      await onReject(rejectionReason);
      toast.success("Projeto rejeitado");
      handleClose();
    } catch (error) {
      toast.error("Erro ao rejeitar projeto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReviewType(null);
    setRejectionReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Revisar Projeto
          </DialogTitle>
        </DialogHeader>

        {!reviewType ? (
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Projeto:</p>
              <p className="font-600 text-gray-900">{projectTitle}</p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Escolha uma ação abaixo para revisar este projeto.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={() => setReviewType("approve")}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                disabled={isLoading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
              <Button
                onClick={() => setReviewType("reject")}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                disabled={isLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          </div>
        ) : reviewType === "approve" ? (
          <div className="space-y-4 py-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Você está aprovando o projeto <strong>{projectTitle}</strong>.
                O aluno será notificado sobre a aprovação.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReviewType(null)}
                disabled={isSubmitting}
              >
                Voltar
              </Button>
              <Button
                onClick={handleApprove}
                className="bg-green-500 hover:bg-green-600 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processando..." : "Confirmar Aprovação"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Você está rejeitando o projeto <strong>{projectTitle}</strong>.
                Forneça um motivo para que o aluno possa fazer melhorias.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="rejection-reason" className="font-600">
                Motivo da Rejeição
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explique por que o projeto está sendo rejeitado e o que pode ser melhorado..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                minLength={5}
                maxLength={500}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                {rejectionReason.length}/500 caracteres
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReviewType(null)}
                disabled={isSubmitting}
              >
                Voltar
              </Button>
              <Button
                onClick={handleReject}
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={isSubmitting || rejectionReason.trim().length < 5}
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
