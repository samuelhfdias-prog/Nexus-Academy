import {
  sqliteTable,
  text,
  integer,
  index,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const timestampNow = () => text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull();
const timestampUpdate = () => text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull();

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").$type<"aluno" | "professor" | "admin">().default("aluno").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  institution: text("institution"),
  course: text("course"),
  semester: integer("semester", { mode: "number" }),
  birthDate: text("birthDate"), // ISO date string YYYY-MM-DD
  // ─── Autenticação Local (Segurança) ───
  passwordHash: text("passwordHash"), // bcrypt hash - NUNCA texto puro
  failedLoginAttempts: integer("failedLoginAttempts", { mode: "number" }).default(0).notNull(),
  lockedUntil: integer("lockedUntil", { mode: "timestamp" }),
  lastFailedLogin: integer("lastFailedLogin", { mode: "timestamp" }),
  createdAt: timestampNow(),
  updatedAt: timestampUpdate(),
  lastSignedIn: text("lastSignedIn").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Skills (Competências) ────────────────────────────────────────────────────
export const skills = sqliteTable("skills", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  category: text("category"),
  createdAt: timestampNow(),
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

// ─── User Skills ──────────────────────────────────────────────────────────────
export const userSkills = sqliteTable("user_skills", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  skillId: integer("skillId", { mode: "number" }).notNull().references(() => skills.id, { onDelete: "cascade" }),
  level: text("level").$type<"basico" | "intermediario" | "avancado">().default("basico").notNull(),
  createdAt: timestampNow(),
}, (t) => [index("user_skills_user_idx").on(t.userId)]);

export type UserSkill = typeof userSkills.$inferSelect;
export type InsertUserSkill = typeof userSkills.$inferInsert;

// ─── Projects (Projetos de Professores / PD&I) ────────────────────────────────
export const projects = sqliteTable("projects", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thematicArea: text("thematicArea").notNull(),
  
  // Lifecycle status (ativo, concluído, pausa)
  status: text("status").$type<"ativo" | "concluido" | "em_pausa">().default("ativo").notNull(),
  
  // Approval workflow status (para professores submeterem e admins aprovarem)
  approvalStatus: text("approvalStatus").$type<"rascunho" | "pendente_aprovacao" | "aprovado" | "rejeitado">().default("rascunho").notNull(),
  
  ownerId: integer("ownerId", { mode: "number" }).notNull().references(() => users.id),
  startDate: text("startDate").notNull(),
  endDate: text("endDate"),
  imageUrl: text("imageUrl"),
  tags: text("tags"), // JSON array stored as text
  maxMembers: integer("maxMembers", { mode: "number" }).default(10),
  isPublic: integer("isPublic", { mode: "boolean" }).default(true).notNull(),
  
  // Approval tracking
  submittedAt: text("submittedAt"), // When submitted for approval
  reviewedBy: integer("reviewedBy", { mode: "number" }).references(() => users.id, { onDelete: "set null" }),
  reviewedAt: text("reviewedAt"),
  rejectionReason: text("rejectionReason"), // Why was it rejected
  
  createdAt: timestampNow(),
  updatedAt: timestampUpdate(),
}, (t) => [
  index("projects_owner_idx").on(t.ownerId),
  index("projects_status_idx").on(t.status),
  index("projects_approval_idx").on(t.approvalStatus),
  index("projects_area_idx").on(t.thematicArea),
  index("projects_reviewed_by_idx").on(t.reviewedBy),
]);

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ─── Student Projects (Projetos Propostos por Alunos) ──────────────────────────
/**
 * Projetos criados por alunos que precisam de aprovação de um professor.
 * Uma vez aprovado, um projeto de aluno pode se tornar um projeto oficial.
 * Isso incentiva alunos a proporem ideias de P&I.
 */
export const studentProjects = sqliteTable("student_projects", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thematicArea: text("thematicArea").notNull(),
  
  // Aluno propositor
  studentId: integer("studentId", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Approval workflow
  status: text("status").$type<"rascunho" | "pendente_aprovacao" | "aprovado" | "rejeitado">().default("rascunho").notNull(),
  submittedAt: text("submittedAt"), // When submitted for review
  reviewedBy: integer("reviewedBy", { mode: "number" }).references(() => users.id, { onDelete: "set null" }), // Professor que aprovou/rejeitou
  reviewedAt: text("reviewedAt"),
  rejectionReason: text("rejectionReason"),
  
  // When approved, link to the official project created from this proposal
  linkedProjectId: integer("linkedProjectId", { mode: "number" }).references(() => projects.id, { onDelete: "set null" }),
  
  tags: text("tags"), // JSON array
  suggestedMaxMembers: integer("suggestedMaxMembers", { mode: "number" }).default(5),
  
  createdAt: timestampNow(),
  updatedAt: timestampUpdate(),
}, (t) => [
  index("student_projects_student_idx").on(t.studentId),
  index("student_projects_status_idx").on(t.status),
  index("student_projects_area_idx").on(t.thematicArea),
  index("student_projects_reviewed_by_idx").on(t.reviewedBy),
  index("student_projects_linked_idx").on(t.linkedProjectId),
]);

export type StudentProject = typeof studentProjects.$inferSelect;
export type InsertStudentProject = typeof studentProjects.$inferInsert;

// ─── Project Skills (Demandas) ────────────────────────────────────────────────
export const projectSkills = sqliteTable("project_skills", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  projectId: integer("projectId", { mode: "number" }).notNull().references(() => projects.id, { onDelete: "cascade" }),
  skillId: integer("skillId", { mode: "number" }).notNull().references(() => skills.id, { onDelete: "cascade" }),
  required: integer("required", { mode: "boolean" }).default(true).notNull(),
  createdAt: timestampNow(),
}, (t) => [index("project_skills_project_idx").on(t.projectId)]);

export type ProjectSkill = typeof projectSkills.$inferSelect;
export type InsertProjectSkill = typeof projectSkills.$inferInsert;

// ─── Project Members ──────────────────────────────────────────────────────────
export const projectMembers = sqliteTable("project_members", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  projectId: integer("projectId", { mode: "number" }).notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  memberRole: text("memberRole").default("membro"),
  joinedAt: text("joinedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index("project_members_project_idx").on(t.projectId),
  index("project_members_user_idx").on(t.userId),
]);

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;

// ─── Participation Requests ───────────────────────────────────────────────────
export const participationRequests = sqliteTable("participation_requests", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  projectId: integer("projectId", { mode: "number" }).notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message"),
  status: text("status").$type<"pendente" | "aprovado" | "rejeitado">().default("pendente").notNull(),
  reviewedBy: integer("reviewedBy", { mode: "number" }).references(() => users.id),
  reviewedAt: text("reviewedAt"),
  createdAt: timestampNow(),
}, (t) => [
  index("participation_requests_project_idx").on(t.projectId),
  index("participation_requests_user_idx").on(t.userId),
]);

export type ParticipationRequest = typeof participationRequests.$inferSelect;
export type InsertParticipationRequest = typeof participationRequests.$inferInsert;

// ─── Project Timeline ─────────────────────────────────────────────────────────
export const projectTimeline = sqliteTable("project_timeline", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  projectId: integer("projectId", { mode: "number" }).notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: text("eventDate").notNull(),
  eventType: text("eventType").$type<"marco" | "entrega" | "reuniao" | "publicacao" | "outro">().default("outro").notNull(),
  createdBy: integer("createdBy", { mode: "number" }).notNull().references(() => users.id),
  createdAt: timestampNow(),
}, (t) => [index("project_timeline_project_idx").on(t.projectId)]);

export type ProjectTimeline = typeof projectTimeline.$inferSelect;
export type InsertProjectTimeline = typeof projectTimeline.$inferInsert;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = sqliteTable("notifications", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: integer("read", { mode: "boolean" }).default(false).notNull(),
  createdAt: timestampNow(),
}, (t) => [index("notifications_user_idx").on(t.userId)]);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── Project Tasks ────────────────────────────────────────────────────────────
export const projectTasks = sqliteTable("project_tasks", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  projectId: integer("projectId", { mode: "number" }).notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").$type<"pendente" | "em_andamento" | "concluido">().default("pendente").notNull(),
  assignedTo: integer("assignedTo", { mode: "number" }).references(() => users.id, { onDelete: "set null" }),
  createdBy: integer("createdBy", { mode: "number" }).notNull().references(() => users.id),
  dueDate: text("dueDate"),
  createdAt: timestampNow(),
  updatedAt: timestampUpdate(),
}, (t) => [
  index("project_tasks_project_idx").on(t.projectId),
  index("project_tasks_assigned_idx").on(t.assignedTo),
]);

export type ProjectTask = typeof projectTasks.$inferSelect;
export type InsertProjectTask = typeof projectTasks.$inferInsert;
