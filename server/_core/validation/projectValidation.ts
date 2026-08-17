/**
 * Project Validation Schemas
 * Centraliza toda validação de entrada usando Zod
 * Segue padrão de "parsing at boundaries"
 */

import { z } from "zod";
import {
  ProjectStatus,
  ApprovalStatus,
  SkillLevel,
  TimelineEventType,
  UserRole,
} from "../types/projectTypes";

// ─── Base Schemas ──────────────────────────────────────────────────────────────

const ProjectIdSchema = z.number().int().positive("ID do projeto inválido");
const UserIdSchema = z.number().int().positive("ID do usuário inválido");
const DateSchema = z.string().datetime("Data inválida");

// ─── Project Creation ──────────────────────────────────────────────────────────

export const CreateProjectInputSchema = z.object({
  title: z
    .string()
    .min(3, "Título deve ter no mínimo 3 caracteres")
    .max(255, "Título deve ter no máximo 255 caracteres")
    .trim(),
  description: z
    .string()
    .min(10, "Descrição deve ter no mínimo 10 caracteres")
    .max(5000, "Descrição deve ter no máximo 5000 caracteres")
    .trim(),
  thematicArea: z
    .string()
    .min(1, "Área temática é obrigatória")
    .max(100, "Área temática deve ter no máximo 100 caracteres")
    .trim(),
  startDate: DateSchema,
  endDate: DateSchema.optional().nullable(),
  maxMembers: z.number().min(1, "Mínimo 1 membro").max(100, "Máximo 100 membros").default(10),
  isPublic: z.boolean().default(true),
  tags: z
    .array(z.string().max(50))
    .max(8, "Máximo 8 tags")
    .default([]),
  skillIds: z.array(z.number().positive()).optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

// ─── Project Update ────────────────────────────────────────────────────────────

export const UpdateProjectInputSchema = z.object({
  id: ProjectIdSchema,
  title: z
    .string()
    .min(3, "Título deve ter no mínimo 3 caracteres")
    .max(255, "Título deve ter no máximo 255 caracteres")
    .trim()
    .optional(),
  description: z
    .string()
    .min(10, "Descrição deve ter no mínimo 10 caracteres")
    .max(5000, "Descrição deve ter no máximo 5000 caracteres")
    .trim()
    .optional(),
  thematicArea: z
    .string()
    .min(1)
    .max(100)
    .trim()
    .optional(),
  status: z
    .enum(["ativo", "concluido", "em_pausa"] as const)
    .optional(),
  endDate: DateSchema.nullable().optional(),
  maxMembers: z.number().min(1).max(100).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(8).optional(),
});

export type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>;

// ─── Project Approval ──────────────────────────────────────────────────────────

export const SubmitProjectForApprovalSchema = z.object({
  projectId: ProjectIdSchema,
});

export type SubmitProjectForApproval = z.infer<typeof SubmitProjectForApprovalSchema>;

export const ReviewProjectApprovalSchema = z.object({
  projectId: ProjectIdSchema,
  approved: z.boolean(),
  rejectionReason: z
    .string()
    .max(500, "Motivo de rejeição deve ter no máximo 500 caracteres")
    .optional(),
}).refine(
  (data) => !data.approved || !data.rejectionReason,
  "Não forneça motivo de rejeição se aprovar o projeto"
);

export type ReviewProjectApproval = z.infer<typeof ReviewProjectApprovalSchema>;

// ─── Student Project ───────────────────────────────────────────────────────────

export const CreateStudentProjectInputSchema = z.object({
  title: z
    .string()
    .min(3, "Título deve ter no mínimo 3 caracteres")
    .max(255, "Título deve ter no máximo 255 caracteres")
    .trim(),
  description: z
    .string()
    .min(10, "Descrição deve ter no mínimo 10 caracteres")
    .max(5000, "Descrição deve ter no máximo 5000 caracteres")
    .trim(),
  thematicArea: z
    .string()
    .min(1, "Área temática é obrigatória")
    .max(100)
    .trim(),
  tags: z.array(z.string().max(50)).max(8).default([]),
  suggestedMaxMembers: z.number().min(1).max(50).default(5),
});

export type CreateStudentProjectInput = z.infer<typeof CreateStudentProjectInputSchema>;

export const ReviewStudentProjectSchema = z.object({
  studentProjectId: z.number().positive(),
  approved: z.boolean(),
  rejectionReason: z
    .string()
    .max(500)
    .optional(),
  createOfficialProject: z.boolean().default(false),
  maxMembers: z.number().min(1).max(100).optional(),
}).refine(
  (data) => !data.approved || !data.rejectionReason,
  "Não forneça motivo de rejeição se aprovar"
).refine(
  (data) => !data.approved || !data.createOfficialProject || data.maxMembers,
  "maxMembers é obrigatório se criar projeto oficial"
);

export type ReviewStudentProject = z.infer<typeof ReviewStudentProjectSchema>;

// ─── Project Members ───────────────────────────────────────────────────────────

export const AddProjectMemberSchema = z.object({
  projectId: ProjectIdSchema,
  userId: UserIdSchema,
  memberRole: z.string().max(50).optional(),
});

export const RemoveProjectMemberSchema = z.object({
  projectId: ProjectIdSchema,
  userId: UserIdSchema,
});

// ─── Project Skills ────────────────────────────────────────────────────────────

export const AddProjectSkillSchema = z.object({
  projectId: ProjectIdSchema,
  skillId: z.number().positive(),
  required: z.boolean().default(true),
});

export const RemoveProjectSkillSchema = z.object({
  projectId: ProjectIdSchema,
  skillId: z.number().positive(),
});

// ─── Timeline ──────────────────────────────────────────────────────────────────

export const AddTimelineEventSchema = z.object({
  projectId: ProjectIdSchema,
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(255)
    .trim(),
  description: z
    .string()
    .max(1000)
    .trim()
    .optional(),
  eventDate: DateSchema,
  eventType: z
    .enum(["marco", "entrega", "reuniao", "publicacao", "outro"] as const)
    .default("outro"),
});

export type AddTimelineEvent = z.infer<typeof AddTimelineEventSchema>;

// ─── Participation Requests ────────────────────────────────────────────────────

export const CreateParticipationRequestSchema = z.object({
  projectId: ProjectIdSchema,
  message: z
    .string()
    .max(500, "Mensagem deve ter no máximo 500 caracteres")
    .optional(),
});

export const ReviewParticipationRequestSchema = z.object({
  requestId: z.number().positive(),
  projectId: ProjectIdSchema,
  approved: z.boolean(),
  rejectionReason: z
    .string()
    .max(500)
    .optional(),
});

// ─── Query Schemas ─────────────────────────────────────────────────────────────

export const ListProjectsQuerySchema = z.object({
  search: z.string().max(100).optional(),
  status: z.string().optional(),
  thematicArea: z.string().optional(),
  approvalStatus: z
    .enum(["rascunho", "pendente_aprovacao", "aprovado", "rejeitado"] as const)
    .optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(12),
});

export type ListProjectsQuery = z.infer<typeof ListProjectsQuerySchema>;

export const ListStudentProjectsQuerySchema = z.object({
  status: z
    .enum(["rascunho", "pendente_aprovacao", "aprovado", "rejeitado"] as const)
    .optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(12),
});

export type ListStudentProjectsQuery = z.infer<typeof ListStudentProjectsQuerySchema>;

// ─── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Valida e retorna dados seguros de entrada
 * Padrão "Parsing at Boundaries"
 */
export async function validateCreateProjectInput(data: unknown) {
  return CreateProjectInputSchema.parseAsync(data);
}

export async function validateUpdateProjectInput(data: unknown) {
  return UpdateProjectInputSchema.parseAsync(data);
}

export async function validateReviewProjectApproval(data: unknown) {
  return ReviewProjectApprovalSchema.parseAsync(data);
}

export async function validateCreateStudentProject(data: unknown) {
  return CreateStudentProjectInputSchema.parseAsync(data);
}

export async function validateReviewStudentProject(data: unknown) {
  return ReviewStudentProjectSchema.parseAsync(data);
}
