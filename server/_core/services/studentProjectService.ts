/**
 * Student Project Service
 * Implementa lógica para projetos propostos por alunos
 * Alunos podem propor ideias que professores aprovam
 */

import { TRPCError } from "@trpc/server";
import { UserRole } from "./projectTypes";

// ─── Student Project Creation ──────────────────────────────────────────────────

/**
 * Permite que alunos criem propostas de projetos
 * Projeto fica em estado DRAFT até ser submetido
 */
export async function createStudentProjectProposal(
  input: {
    title: string;
    description: string;
    thematicArea: string;
    tags?: string[];
    suggestedMaxMembers?: number;
  },
  studentId: number
) {
  // Validar entrada (em produção usar Zod)
  if (!input.title || input.title.length < 3) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Título deve ter no mínimo 3 caracteres",
    });
  }

  if (!input.description || input.description.length < 10) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Descrição deve ter no mínimo 10 caracteres",
    });
  }

  // TODO: Implementar criação no banco de dados
  return {
    success: true,
    message: "Proposta de projeto criada com sucesso",
    studentProjectId: 1, // Placeholder
  };
}

/**
 * Aluno submete proposta para revisão de professor
 */
export async function submitStudentProjectForReview(
  studentProjectId: number,
  studentId: number
) {
  // TODO: Verificar que pertence ao aluno
  // TODO: Mudar status para PENDING
  return {
    success: true,
    message: "Proposta submetida para revisão de professor",
  };
}

// ─── Student Project Review ────────────────────────────────────────────────────

/**
 * Professor/Admin revisa proposta de aluno
 * Pode aprovar (criar projeto oficial) ou rejeitar
 */
export async function reviewStudentProjectProposal(
  studentProjectId: number,
  input: {
    approved: boolean;
    rejectionReason?: string;
    createOfficialProject?: boolean;
    maxMembers?: number;
  },
  reviewerId: number,
  reviewerRole: UserRole
) {
  // Validação de autorização
  if (reviewerRole !== "professor" && reviewerRole !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas professores e admins podem revisar propostas",
    });
  }

  if (!input.approved && !input.rejectionReason) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Motivo da rejeição é obrigatório",
    });
  }

  if (input.approved && input.createOfficialProject && !input.maxMembers) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Número máximo de membros é obrigatório ao criar projeto oficial",
    });
  }

  // TODO: Implementar lógica completa
  return {
    success: true,
    message: input.approved ? "Proposta aprovada" : "Proposta rejeitada",
    linkedProjectId: input.createOfficialProject ? 1 : undefined, // Placeholder
  };
}

/**
 * Quando uma proposta é aprovada, cria um projeto oficial
 * O projeto é criado com o professor como proprietário
 * O aluno que propôs pode se juntar automaticamente
 */
export async function createOfficialProjectFromProposal(
  studentProjectId: number,
  professorId: number,
  proposingStudentId: number,
  maxMembers: number
) {
  // TODO: Criar projeto oficial
  // TODO: Vincular ao student project via linkedProjectId
  // TODO: Adicionar aluno propositor como membro
  return {
    success: true,
    projectId: 1, // Placeholder
    message: "Projeto oficial criado com sucesso",
  };
}

// ─── Student Project Listing ───────────────────────────────────────────────────

/**
 * Aluno vê suas próprias propostas
 */
export async function getStudentProposals(studentId: number) {
  // TODO: Query DB
  return [];
}

/**
 * Professor vê propostas de seus alunos aguardando revisão
 */
export async function getPendingProposalsForProfessor(professorId: number) {
  // TODO: Query DB
  // Pode filtrar por professores que criaram projetos relacionados
  return [];
}

/**
 * Admin vê todas as propostas
 */
export async function getAllStudentProposals(status?: string) {
  // TODO: Query DB
  return [];
}

// ─── Status Labels ────────────────────────────────────────────────────────────

export const StudentProjectStatusLabels = {
  rascunho: "Rascunho",
  pendente_aprovacao: "Aguardando Revisão",
  aprovado: "Aprovada",
  rejeitado: "Rejeitada",
};

export const StudentProjectStatusDescriptions = {
  rascunho: "Sua proposta está em edição. Você pode editá-la ou submetê-la para revisão.",
  pendente_aprovacao: "Sua proposta foi enviada para um professor revisar. Você receberá uma resposta em breve.",
  aprovado: "Parabéns! Sua proposta foi aprovada e um projeto oficial foi criado.",
  rejeitado: "Sua proposta foi devolvida para melhorias. Veja o feedback e resubmeta.",
};
