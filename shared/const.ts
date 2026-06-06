export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// ─── Whitelists (fonte única de verdade para frontend e backend) ───────────────

/**
 * Áreas temáticas permitidas para projetos e propostas de alunos.
 * Alterar aqui reflete automaticamente no backend (validação Zod)
 * e nos dropdowns do frontend.
 */
export const THEMATIC_AREAS = [
  "Inteligência Artificial",
  "Ciência de Dados",
  "Desenvolvimento Web",
  "IoT",
  "Segurança",
  "Robótica",
  "Sustentabilidade",
  "Educação",
  "Saúde",
  "Agronegócio",
  "Computação em Nuvem",
  "Realidade Virtual/Aumentada",
] as const;

export type ThematicArea = typeof THEMATIC_AREAS[number];

/**
 * Categorias de competências permitidas.
 * Professores só podem criar competências dentro destas categorias.
 */
export const SKILL_CATEGORIES = [
  "Programação",
  "Dados",
  "Design",
  "Gestão",
  "Hardware",
  "Ciências",
  "Redes",
  "Segurança",
  "DevOps",
  "Outros",
] as const;

export type SkillCategory = typeof SKILL_CATEGORIES[number];
