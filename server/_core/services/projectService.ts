/**
 * Project Service
 * Implementa toda a lógica de negócio de projetos
 * Segue padrão de Service Layer para Clean Architecture
 */

import { TRPCError } from "@trpc/server";
import {
  createProject as createProjectDB,
  updateProject as updateProjectDB,
  getProjectById as getProjectByIdDB,
  deleteProject as deleteProjectDB,
  getUserProjects,
} from "../../db";
import {
  CreateProjectInput,
  UpdateProjectInput,
  ApprovalStatus,
  ProjectStatus,
} from "./projectTypes";

// ─── Project Lifecycle ────────────────────────────────────────────────────────

/**
 * Cria um novo projeto em estado DRAFT
 * Apenas professores e admins podem criar projetos
 */
export async function createNewProject(
  input: CreateProjectInput,
  userId: number,
  userRole: "aluno" | "professor" | "admin"
) {
  // Validação de autorização
  if (userRole === "aluno") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Alunos devem propor projetos através do módulo de Student Projects",
    });
  }

  // Criar projeto em estado draft
  const result = await createProjectDB({
    title: input.title,
    description: input.description,
    thematicArea: input.thematicArea,
    status: "ativo",
    approvalStatus: "rascunho", // Começa em draft
    ownerId: userId,
    startDate: new Date(input.startDate).toISOString(),
    endDate: input.endDate ? new Date(input.endDate).toISOString() : undefined,
    maxMembers: input.maxMembers ?? 10,
    isPublic: input.isPublic ?? true,
    tags: input.tags ? JSON.stringify(input.tags) : undefined,
  });

  return result;
}

/**
 * Submete um projeto para aprovação
 * Muda status de DRAFT para PENDING_APPROVAL
 * Apenas o dono ou admin pode submeter
 */
export async function submitProjectForApproval(projectId: number, userId: number, userRole: string) {
  const project = await getProjectByIdDB(projectId);

  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Projeto não encontrado",
    });
  }

  if (project.project.ownerId !== userId && userRole !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem permissão para submeter este projeto",
    });
  }

  if (project.project.approvalStatus !== "rascunho") {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Projeto já foi ${project.project.approvalStatus}. Estado atual: ${project.project.approvalStatus}`,
    });
  }

  // Validações de negócio
  validateProjectBeforeSubmission(project.project);

  await updateProjectDB(projectId, {
    approvalStatus: "pendente_aprovacao",
    submittedAt: new Date().toISOString(),
  });

  return { success: true, message: "Projeto submetido para aprovação" };
}

/**
 * Aprova um projeto enviado para revisão
 * Apenas admins e professores designados podem aprovar
 */
export async function approveProject(projectId: number, reviewerId: number, reviewerRole: string) {
  if (reviewerRole !== "admin" && reviewerRole !== "professor") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas professores e admins podem aprovar projetos",
    });
  }

  const project = await getProjectByIdDB(projectId);

  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Projeto não encontrado",
    });
  }

  if (project.project.approvalStatus !== "pendente_aprovacao") {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Projeto não está em estado pendente. Estado atual: ${project.project.approvalStatus}`,
    });
  }

  await updateProjectDB(projectId, {
    approvalStatus: "aprovado",
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString(),
    rejectionReason: null, // Clear any previous rejection
  });

  return { success: true, message: "Projeto aprovado com sucesso" };
}

/**
 * Rejeita um projeto enviado para revisão
 * Apenas admins e professores designados podem rejeitar
 */
export async function rejectProject(
  projectId: number,
  rejectionReason: string,
  reviewerId: number,
  reviewerRole: string
) {
  if (reviewerRole !== "admin" && reviewerRole !== "professor") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas professores e admins podem rejeitar projetos",
    });
  }

  if (!rejectionReason || rejectionReason.trim().length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Motivo da rejeição é obrigatório",
    });
  }

  const project = await getProjectByIdDB(projectId);

  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Projeto não encontrado",
    });
  }

  if (project.project.approvalStatus !== "pendente_aprovacao") {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Projeto não está em estado pendente. Estado atual: ${project.project.approvalStatus}`,
    });
  }

  await updateProjectDB(projectId, {
    approvalStatus: "rejeitado",
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString(),
    rejectionReason: rejectionReason.trim(),
  });

  return { success: true, message: "Projeto rejeitado" };
}

/**
 * Retorna um projeto para DRAFT para edições
 * Apenas o proprietário ou admin pode fazer isso com projetos rejeitados
 */
export async function resubmitRejectedProject(projectId: number, userId: number, userRole: string) {
  const project = await getProjectByIdDB(projectId);

  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Projeto não encontrado",
    });
  }

  if (project.project.ownerId !== userId && userRole !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem permissão para reenviar este projeto",
    });
  }

  if (project.project.approvalStatus !== "rejeitado") {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Apenas projetos rejeitados podem ser reenviados. Estado atual: ${project.project.approvalStatus}`,
    });
  }

  await updateProjectDB(projectId, {
    approvalStatus: "rascunho",
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
  });

  return { success: true, message: "Projeto retornado para edição" };
}

/**
 * Atualiza um projeto
 * Apenas pode atualizar projetos em estado DRAFT ou REJECTED
 */
export async function updateProjectSafely(
  projectId: number,
  input: UpdateProjectInput,
  userId: number,
  userRole: string
) {
  const project = await getProjectByIdDB(projectId);

  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Projeto não encontrado",
    });
  }

  if (project.project.ownerId !== userId && userRole !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem permissão para editar este projeto",
    });
  }

  // Validar que só pode editar em certos estados
  const editableStates: ApprovalStatus[] = ["rascunho", "rejeitado"];
  if (!editableStates.includes(project.project.approvalStatus)) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Não pode editar projeto em estado "${project.project.approvalStatus}". ` +
        `Edições permitidas apenas em rascunho ou rejeitado.`,
    });
  }

  const updateData: Record<string, unknown> = { ...input };
  if (input.endDate) {
    updateData.endDate = new Date(input.endDate).toISOString();
  }

  await updateProjectDB(projectId, updateData);

  return { success: true, message: "Projeto atualizado com sucesso" };
}

/**
 * Deleta um projeto
 * Apenas pode deletar em estado DRAFT ou REJECTED
 */
export async function deleteProjectSafely(projectId: number, userId: number, userRole: string) {
  const project = await getProjectByIdDB(projectId);

  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Projeto não encontrado",
    });
  }

  if (project.project.ownerId !== userId && userRole !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem permissão para deletar este projeto",
    });
  }

  const deletableStates: ApprovalStatus[] = ["rascunho", "rejeitado"];
  if (!deletableStates.includes(project.project.approvalStatus)) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Não pode deletar projeto em estado "${project.project.approvalStatus}". ` +
        `Deleção permitida apenas em rascunho ou rejeitado.`,
    });
  }

  await deleteProjectDB(projectId);

  return { success: true, message: "Projeto deletado com sucesso" };
}

// ─── Validações ────────────────────────────────────────────────────────────────

/**
 * Valida se um projeto está pronto para ser submetido
 */
function validateProjectBeforeSubmission(project: any) {
  const errors: string[] = [];

  if (!project.title || project.title.trim().length < 3) {
    errors.push("Título deve ter no mínimo 3 caracteres");
  }

  if (!project.description || project.description.trim().length < 10) {
    errors.push("Descrição deve ter no mínimo 10 caracteres");
  }

  if (!project.thematicArea) {
    errors.push("Área temática é obrigatória");
  }

  if (!project.startDate) {
    errors.push("Data de início é obrigatória");
  }

  if (errors.length > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Projeto não atende aos critérios mínimos: ${errors.join("; ")}`,
    });
  }
}

/**
 * Verifica se um projeto pode ser publicado (APPROVED -> ACTIVE)
 */
export function canPublishProject(project: any): boolean {
  return project.approvalStatus === "aprovado";
}

/**
 * Obtém status legível para o usuário
 */
export const StatusLabels: Record<ApprovalStatus, string> = {
  rascunho: "Rascunho",
  pendente_aprovacao: "Aguardando Aprovação",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

export const StatusDescriptions: Record<ApprovalStatus, string> = {
  rascunho: "Projeto em edição, não será visível para outros usuários",
  pendente_aprovacao: "Projeto enviado para revisão, aguardando feedback de professor/admin",
  aprovado: "Projeto foi aprovado e está pronto para uso",
  rejeitado: "Projeto foi rejeitado, você pode editar e reenviar",
};
