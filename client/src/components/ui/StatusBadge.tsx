import { cn } from "@/lib/utils";

type Status = "ativo" | "concluido" | "em_pausa";

const STATUS_CONFIG: Record<Status, { label: string; className: string; dot: string }> = {
  ativo: {
    label: "Ativo",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  concluido: {
    label: "Concluído",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
  },
  em_pausa: {
    label: "Em Pausa",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
};

interface StatusBadgeProps {
  status: Status | string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as Status] ?? {
    label: status,
    className: "bg-gray-50 text-gray-700 border border-gray-200",
    dot: "bg-gray-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-700",
        config.className,
        className
      )}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      )}
      {config.label}
    </span>
  );
}
