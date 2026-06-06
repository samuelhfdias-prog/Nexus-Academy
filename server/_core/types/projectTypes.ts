/**
 * Project Domain Types
 * Tipos refatorados com Enums e Discriminated Unions para melhor design
 * Segue princípios de Domain-Driven Design
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ProjectStatus = {
  ACTIVE: "ativo",
  COMPLETED: "concluido",
  PAUSED: "em_pausa",
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const ApprovalStatus = {
  DRAFT: "rascunho",
  PENDING: "pendente_aprovacao",
  APPROVED: "aprovado",
  REJECTED: "rejeitado",
} as const;

export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const SkillLevel = {
  BASIC: "basico",
  INTERMEDIATE: "intermediario",
  ADVANCED: "avancado",
} as const;

export type SkillLevel = (typeof SkillLevel)[keyof typeof SkillLevel];

export const ParticipationStatus = {
  PENDING: "pendente",
  APPROVED: "aprovado",
  REJECTED: "rejeitado",
} as const;

export type ParticipationStatus = (typeof ParticipationStatus)[keyof typeof ParticipationStatus];

export const TimelineEventType = {
  MILESTONE: "marco",
  DELIVERY: "entrega",
  MEETING: "reuniao",
  PUBLICATION: "publicacao",
  OTHER: "outro",
} as const;

export type TimelineEventType = (typeof TimelineEventType)[keyof typeof TimelineEventType];

export const UserRole = {
  STUDENT: "aluno",
  PROFESSOR: "professor",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// ─── Discriminated Unions ──────────────────────────────────────────────────────

/**
 * Project State - Discriminated Union para diferentes estados de um projeto
 * Isola a lógica de negócio de cada estado
 */
export type ProjectState =
  | { type: "draft"; data: { title: string; description: string } }
  | { type: "pending_approval"; data: { submittedAt: string } }
  | { type: "approved"; data: { approvedAt: string; approvedBy: number } }
  | { type: "rejected"; data: { rejectedAt: string; rejectionReason: string; rejectedBy: number } }
  | { type: "active"; data: { startDate: string; status: "ativo" } }
  | { type: "paused"; data: { pausedAt: string } }
  | { type: "completed"; data: { completedAt: string } };

/**
 * Project Approval Event - Discriminated Union para eventos de aprovação
 */
export type ProjectApprovalEvent =
  | { type: "submitted"; timestamp: string; submittedBy: number }
  | { type: "approved"; timestamp: string; approvedBy: number }
  | { type: "rejected"; timestamp: string; reason: string; rejectedBy: number };

// ─── DTOs (Data Transfer Objects) ──────────────────────────────────────────────

/**
 * CreateProjectInput - DTO para criação de projeto
 * Validação de entrada para criação de projetos
 */
export interface CreateProjectInput {
  title: string;
  description: string;
  thematicArea: string;
  startDate: Date;
  endDate?: Date;
  maxMembers?: number;
  isPublic?: boolean;
  tags?: string[];
}

/**
 * UpdateProjectInput - DTO para atualização de projeto
 */
export interface UpdateProjectInput {
  title?: string;
  description?: string;
  thematicArea?: string;
  status?: ProjectStatus;
  endDate?: Date;
  maxMembers?: number;
  isPublic?: boolean;
  tags?: string[];
}

/**
 * SubmitProjectForApprovalInput - DTO para submeter projeto para aprovação
 */
export interface SubmitProjectForApprovalInput {
  projectId: number;
}

/**
 * ReviewProjectApprovalInput - DTO para revisar aprovação de projeto
 */
export interface ReviewProjectApprovalInput {
  projectId: number;
  approved: boolean;
  rejectionReason?: string;
}

/**
 * CreateStudentProjectInput - DTO para criação de projeto proposto por aluno
 */
export interface CreateStudentProjectInput {
  title: string;
  description: string;
  thematicArea: string;
  tags?: string[];
  suggestedMaxMembers?: number;
}

/**
 * ReviewStudentProjectInput - DTO para revisar projeto de aluno
 */
export interface ReviewStudentProjectInput {
  studentProjectId: number;
  approved: boolean;
  rejectionReason?: string;
  // Se aprovado, estes campos são opcionais para criar o projeto oficial
  createOfficialProject?: boolean;
  maxMembers?: number;
}

/**
 * ProjectApprovalResponse - DTO para resposta de aprovação
 */
export interface ProjectApprovalResponse {
  success: boolean;
  message: string;
  projectId: number;
  newStatus: ApprovalStatus;
}

// ─── Aggregate Roots (DDD) ─────────────────────────────────────────────────────

/**
 * Aggregate Root para Project
 * Encapsula toda a lógica de negócio relacionada a projetos
 */
export interface ProjectAggregate {
  id: number;
  title: string;
  description: string;
  thematicArea: string;
  status: ProjectStatus;
  approvalStatus: ApprovalStatus;
  ownerId: number;
  startDate: Date;
  endDate?: Date;
  tags: string[];
  maxMembers: number;
  isPublic: boolean;
  submittedAt?: Date;
  reviewedBy?: number;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate Root para StudentProject
 * Encapsula lógica de projetos propostos por alunos
 */
export interface StudentProjectAggregate {
  id: number;
  title: string;
  description: string;
  thematicArea: string;
  studentId: number;
  status: ApprovalStatus;
  submittedAt?: Date;
  reviewedBy?: number;
  reviewedAt?: Date;
  rejectionReason?: string;
  linkedProjectId?: number;
  tags: string[];
  suggestedMaxMembers: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Value Objects ────────────────────────────────────────────────────────────

/**
 * ProjectId - Value Object para ID de projeto (type safety)
 */
export class ProjectId {
  constructor(readonly value: number) {
    if (value <= 0) throw new Error("ProjectId must be positive");
  }
}

/**
 * ProjectTitle - Value Object para título de projeto
 */
export class ProjectTitle {
  constructor(readonly value: string) {
    if (value.length < 3) throw new Error("ProjectTitle must be at least 3 characters");
    if (value.length > 255) throw new Error("ProjectTitle must be at most 255 characters");
  }
}
