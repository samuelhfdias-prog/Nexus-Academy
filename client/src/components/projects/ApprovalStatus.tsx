/**
 * Project Approval Status Badge
 * Mostra o estado de aprovação de um projeto
 */

import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";

export type ApprovalStatusType = "rascunho" | "pendente_aprovacao" | "aprovado" | "rejeitado";

interface ApprovalStatusProps {
  status: ApprovalStatusType;
  className?: string;
}

const StatusConfig: Record<ApprovalStatusType, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  rascunho: {
    label: "Rascunho",
    icon: Clock,
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
    borderColor: "border-gray-300",
  },
  pendente_aprovacao: {
    label: "Aguardando Aprovação",
    icon: AlertCircle,
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-300",
  },
  aprovado: {
    label: "Aprovado",
    icon: CheckCircle,
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    borderColor: "border-green-300",
  },
  rejeitado: {
    label: "Rejeitado",
    icon: XCircle,
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    borderColor: "border-red-300",
  },
};

export function ApprovalStatusBadge({ status, className }: ApprovalStatusProps) {
  const config = StatusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5
        font-600 text-xs
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        border
        ${className}
      `}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

/**
 * Detailed status card para mostrar informações de aprovação
 */
interface ApprovalStatusCardProps {
  status: ApprovalStatusType;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export function ApprovalStatusCard({
  status,
  submittedAt,
  reviewedAt,
  reviewedBy,
  rejectionReason,
}: ApprovalStatusCardProps) {
  const config = StatusConfig[status];

  return (
    <div className={`
      rounded-lg border-2 p-4
      ${config.bgColor} ${config.borderColor}
    `}>
      <div className="flex items-start gap-3">
        <div className={`mt-1 ${config.textColor}`}>
          {/* Icon will be rendered by Badge */}
        </div>
        <div className="flex-1">
          <h3 className={`font-600 text-sm ${config.textColor}`}>
            {config.label}
          </h3>
          
          {/* Draft state */}
          {status === "rascunho" && (
            <p className="text-sm text-gray-600 mt-1">
              Este projeto está em rascunho e não será visível para outros usuários.
              Você pode editá-lo ou submetê-lo para revisão.
            </p>
          )}
          
          {/* Pending state */}
          {status === "pendente_aprovacao" && submittedAt && (
            <div className="text-sm text-yellow-700 mt-1 space-y-1">
              <p>Submetido em: <span className="font-500">{new Date(submittedAt).toLocaleDateString("pt-BR")}</span></p>
              <p>Aguardando revisão de um professor.</p>
            </div>
          )}
          
          {/* Approved state */}
          {status === "aprovado" && reviewedAt && reviewedBy && (
            <div className="text-sm text-green-700 mt-1 space-y-1">
              <p>Aprovado em: <span className="font-500">{new Date(reviewedAt).toLocaleDateString("pt-BR")}</span></p>
              <p>Aprovado por: <span className="font-500">{reviewedBy}</span></p>
              <p className="mt-2">Este projeto está ativo e visível para todos os usuários.</p>
            </div>
          )}
          
          {/* Rejected state */}
          {status === "rejeitado" && reviewedAt && rejectionReason && (
            <div className="text-sm text-red-700 mt-1 space-y-1">
              <p>Rejeitado em: <span className="font-500">{new Date(reviewedAt).toLocaleDateString("pt-BR")}</span></p>
              <p className="mt-2"><span className="font-600">Motivo:</span></p>
              <p className="italic border-l-2 border-red-300 pl-2 py-1">{rejectionReason}</p>
              <p className="mt-2">Você pode editar o projeto e resubmetê-lo para uma nova revisão.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
