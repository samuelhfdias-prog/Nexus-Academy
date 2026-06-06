import { Link } from "wouter";
import { Calendar, Users, Tag, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";

interface ProjectCardProps {
  project: {
    id: number;
    title: string;
    description: string;
    thematicArea: string;
    status: string;
    startDate: Date | string;
    maxMembers?: number | null;
    tags?: string | null;
  };
  owner?: { name?: string | null } | null;
  memberCount?: number;
  className?: string;
}

const AREA_COLORS: Record<string, string> = {
  "Inteligência Artificial": "bg-purple-100 text-purple-700",
  "Ciência de Dados": "bg-blue-100 text-blue-700",
  "Desenvolvimento Web": "bg-green-100 text-green-700",
  "IoT": "bg-orange-100 text-orange-700",
  "Segurança": "bg-red-100 text-red-700",
  "Robótica": "bg-cyan-100 text-cyan-700",
  "Sustentabilidade": "bg-emerald-100 text-emerald-700",
  "Educação": "bg-yellow-100 text-yellow-700",
};

export function ProjectCard({ project, owner, memberCount = 0, className }: ProjectCardProps) {
  const areaColor = AREA_COLORS[project.thematicArea] ?? "bg-[#F3F9F6] text-[#24B68E]";
  const startDate = new Date(project.startDate).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });

  const tags = project.tags ? JSON.parse(project.tags) as string[] : [];

  return (
    <Card className={`group border border-[#E5E7EB] hover:border-[#24B68E]/30 transition-all duration-200 card-hover overflow-hidden ${className}`}>
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#24B68E] to-[#38C69F]" />
      
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-700 ${areaColor}`}>
            <Tag className="w-3 h-3" />
            {project.thematicArea}
          </span>
          <StatusBadge status={project.status} />
        </div>

        {/* Title */}
        <h3 className="font-700 text-[#1F2937] text-base leading-snug mb-2 line-clamp-2 group-hover:text-[#24B68E] transition-colors duration-200">
          {project.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-2 mb-4">
          {project.description}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-xs rounded-md font-500">
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-xs rounded-md font-500">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#F3F4F6]">
          <div className="flex items-center gap-3 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {startDate}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {memberCount}/{project.maxMembers ?? 10}
            </span>
          </div>
          <Link
            href={`/projetos/${project.id}`}
            className="flex items-center gap-1 text-xs font-700 text-[#24B68E] hover:text-[#1E9A78] transition-colors group/link"
          >
            Ver mais
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5" />
          </Link>
        </div>

        {/* Owner */}
        {owner?.name && (
          <p className="text-xs text-[#6B7280] mt-2">
            <span className="font-500">Responsável:</span> {owner.name}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
