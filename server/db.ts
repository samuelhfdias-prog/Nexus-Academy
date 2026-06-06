import { and, desc, eq, like, or, sql, inArray } from "drizzle-orm";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import {
  InsertUser,
  InsertProject,
  InsertSkill,
  InsertUserSkill,
  InsertProjectSkill,
  InsertProjectMember,
  InsertParticipationRequest,
  InsertProjectTimeline,
  InsertStudentProject,
  InsertNotification,
  InsertProjectTask,
  participationRequests,
  notifications,
  projectMembers,
  projectSkills,
  projectTimeline,
  projectTasks,
  projects,
  skills,
  studentProjects,
  userSkills,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    try {
      const client = createClient({ url: process.env.DATABASE_URL || "file:./sqlite.db" });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const fields = ["name", "email", "loginMethod", "bio", "avatarUrl", "institution", "course", "semester"] as const;
  for (const field of fields) {
    const value = user[field as keyof InsertUser];
    if (value !== undefined) {
      (values as Record<string, unknown>)[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date().toISOString();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date().toISOString();

  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function getAllUsers(page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const data = await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(users);
  return { data, total: Number(count) };
}

export async function updateUserRole(id: number, role: "aluno" | "professor" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, id));
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export async function getAllSkills() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(skills).orderBy(skills.name);
}

export async function createSkill(data: InsertSkill) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(skills).values(data);
  return result;
}

export async function getUserSkills(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ userSkill: userSkills, skill: skills })
    .from(userSkills)
    .innerJoin(skills, eq(userSkills.skillId, skills.id))
    .where(eq(userSkills.userId, userId));
}

export async function addUserSkill(data: InsertUserSkill) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(userSkills).where(and(eq(userSkills.userId, data.userId), eq(userSkills.skillId, data.skillId))).limit(1);
  if (existing.length > 0) {
    await db.update(userSkills).set({ level: data.level }).where(eq(userSkills.id, existing[0].id));
  } else {
    await db.insert(userSkills).values(data);
  }
}

export async function removeUserSkill(userId: number, skillId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(userSkills).where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, skillId)));
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(filters?: {
  status?: string;
  thematicArea?: string;
  search?: string;
  page?: number;
  limit?: number;
  includePrivate?: boolean;
}) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };

  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 12;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (filters?.status && filters.status !== "todos") {
    conditions.push(eq(projects.status, filters.status as "ativo" | "concluido" | "em_pausa"));
  }
  if (filters?.thematicArea && filters.thematicArea !== "todas") {
    conditions.push(eq(projects.thematicArea, filters.thematicArea));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(projects.title, `%${filters.search}%`),
        like(projects.description, `%${filters.search}%`)
      )
    );
  }

  // Se não estivermos forçando a inclusão de privados/pausados (ex: admin), esconder
  if (!filters?.includePrivate) {
    conditions.push(eq(projects.isPublic, true));
    // Se não filtrar por status específico que mostre pausados, oculta pausados
    if (filters?.status !== "em_pausa") {
      conditions.push(or(eq(projects.status, "ativo"), eq(projects.status, "concluido")));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      project: projects,
      owner: { id: users.id, name: users.name, email: users.email, role: users.role },
    })
    .from(projects)
    .leftJoin(users, eq(projects.ownerId, users.id))
    .where(whereClause)
    .orderBy(desc(projects.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(whereClause);

  return { data, total: Number(count) };
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      project: projects,
      owner: { id: users.id, name: users.name, email: users.email, role: users.role },
    })
    .from(projects)
    .leftJoin(users, eq(projects.ownerId, users.id))
    .where(eq(projects.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(projects).values(data);
  return result;
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) return;
  await db.update(projects).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(projects).where(eq(projects.id, id));
}

export async function getProjectMembers(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ member: projectMembers, user: { id: users.id, name: users.name, email: users.email, role: users.role, avatarUrl: users.avatarUrl } })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId));
}

export async function addProjectMember(data: InsertProjectMember) {
  const db = await getDb();
  if (!db) return;
  await db.insert(projectMembers).values(data);
}

export async function removeProjectMember(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
}

export async function isProjectMember(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select({ id: projectMembers.id })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);
  return result.length > 0;
}

export async function getProjectSkills(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ projectSkill: projectSkills, skill: skills })
    .from(projectSkills)
    .innerJoin(skills, eq(projectSkills.skillId, skills.id))
    .where(eq(projectSkills.projectId, projectId));
}

export async function addProjectSkill(data: InsertProjectSkill) {
  const db = await getDb();
  if (!db) return;
  await db.insert(projectSkills).values(data);
}

export async function removeProjectSkill(projectId: number, skillId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(projectSkills).where(and(eq(projectSkills.projectId, projectId), eq(projectSkills.skillId, skillId)));
}

// ─── Participation Requests ───────────────────────────────────────────────────

export async function createParticipationRequest(data: InsertParticipationRequest) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(participationRequests).values(data);
  return result;
}

export async function getParticipationRequests(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ request: participationRequests, user: { id: users.id, name: users.name, email: users.email, role: users.role } })
    .from(participationRequests)
    .innerJoin(users, eq(participationRequests.userId, users.id))
    .where(eq(participationRequests.projectId, projectId))
    .orderBy(desc(participationRequests.createdAt));
}

export async function getUserParticipationRequests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ request: participationRequests, project: { id: projects.id, title: projects.title, status: projects.status } })
    .from(participationRequests)
    .innerJoin(projects, eq(participationRequests.projectId, projects.id))
    .where(eq(participationRequests.userId, userId))
    .orderBy(desc(participationRequests.createdAt));
}

export async function getAllPendingRequests() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      request: participationRequests,
      user: { id: users.id, name: users.name, email: users.email },
      project: { id: projects.id, title: projects.title },
    })
    .from(participationRequests)
    .innerJoin(users, eq(participationRequests.userId, users.id))
    .innerJoin(projects, eq(participationRequests.projectId, projects.id))
    .where(eq(participationRequests.status, "pendente"))
    .orderBy(desc(participationRequests.createdAt));
}

export async function updateParticipationRequest(
  id: number,
  status: "aprovado" | "rejeitado",
  reviewedBy: number
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(participationRequests)
    .set({ status, reviewedBy, reviewedAt: new Date().toISOString() })
    .where(eq(participationRequests.id, id));
}

export async function hasExistingRequest(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select({ id: participationRequests.id })
    .from(participationRequests)
    .where(
      and(
        eq(participationRequests.projectId, projectId),
        eq(participationRequests.userId, userId),
        eq(participationRequests.status, "pendente")
      )
    )
    .limit(1);
  return result.length > 0;
}

export async function deleteParticipationRequest(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(participationRequests).where(eq(participationRequests.id, id));
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export async function getProjectTimeline(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ event: projectTimeline, createdBy: { id: users.id, name: users.name } })
    .from(projectTimeline)
    .innerJoin(users, eq(projectTimeline.createdBy, users.id))
    .where(eq(projectTimeline.projectId, projectId))
    .orderBy(projectTimeline.eventDate);
}

export async function addTimelineEvent(data: InsertProjectTimeline) {
  const db = await getDb();
  if (!db) return;
  await db.insert(projectTimeline).values(data);
}

// ─── Project Tasks ────────────────────────────────────────────────────────────

export async function getProjectTasks(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      task: projectTasks,
      assignee: { id: users.id, name: users.name, avatarUrl: users.avatarUrl },
      creator: { id: users.id, name: users.name },
    })
    .from(projectTasks)
    .leftJoin(users, eq(projectTasks.assignedTo, users.id))
    // We can just join twice or query separately. Since drizzle handles it:
    // Actually we only need assignee mostly. Let's just join assignee.
    .where(eq(projectTasks.projectId, projectId))
    .orderBy(desc(projectTasks.createdAt));
}

export async function createProjectTask(data: InsertProjectTask) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(projectTasks).values(data);
  return result;
}

export async function updateProjectTask(id: number, data: Partial<InsertProjectTask>) {
  const db = await getDb();
  if (!db) return;
  await db.update(projectTasks).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(projectTasks.id, id));
}

export async function deleteProjectTask(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(projectTasks).where(eq(projectTasks.id, id));
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalProjects] = await db.select({ count: sql<number>`count(*)` }).from(projects);
  const [activeProjects] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(eq(projects.status, "ativo"));
  const [totalMembers] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [totalSkills] = await db.select({ count: sql<number>`count(*)` }).from(skills);

  const byArea = await db
    .select({ area: projects.thematicArea, count: sql<number>`count(*)` })
    .from(projects)
    .groupBy(projects.thematicArea)
    .orderBy(desc(sql<number>`count(*)`));

  const byStatus = await db
    .select({ status: projects.status, count: sql<number>`count(*)` })
    .from(projects)
    .groupBy(projects.status);

  const recentProjects = await db
    .select({
      project: projects,
      owner: { id: users.id, name: users.name },
    })
    .from(projects)
    .leftJoin(users, eq(projects.ownerId, users.id))
    .orderBy(desc(projects.createdAt))
    .limit(5);

  return {
    totalProjects: Number(totalProjects.count),
    activeProjects: Number(activeProjects.count),
    totalMembers: Number(totalMembers.count),
    totalSkills: Number(totalSkills.count),
    byArea: byArea.map((r) => ({ area: r.area, count: Number(r.count) })),
    byStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
    recentProjects,
  };
}

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const owned = await db
    .select({ project: projects })
    .from(projects)
    .where(eq(projects.ownerId, userId))
    .orderBy(desc(projects.createdAt));

  const memberOf = await db
    .select({ project: projects })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(eq(projectMembers.userId, userId))
    .orderBy(desc(projects.createdAt));

  return { owned: owned.map((r) => r.project), memberOf: memberOf.map((r) => r.project) };
}

// ─── Student Projects ──────────────────────────────────────────────────────────

export async function createStudentProject(data: InsertStudentProject) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(studentProjects).values(data);
  return result;
}

export async function getStudentProjectById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      project: studentProjects,
      student: { id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl },
    })
    .from(studentProjects)
    .leftJoin(users, eq(studentProjects.studentId, users.id))
    .where(eq(studentProjects.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function getStudentProjectsByStudent(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ project: studentProjects })
    .from(studentProjects)
    .where(eq(studentProjects.studentId, studentId))
    .orderBy(desc(studentProjects.createdAt));
}

export async function getStudentProjectsByStatus(status: "rascunho" | "pendente_aprovacao" | "aprovado" | "rejeitado") {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      project: studentProjects,
      student: { id: users.id, name: users.name, email: users.email },
    })
    .from(studentProjects)
    .leftJoin(users, eq(studentProjects.studentId, users.id))
    .where(eq(studentProjects.status, status))
    .orderBy(desc(studentProjects.createdAt));
}

export async function getPendingStudentProjects() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      project: studentProjects,
      student: { id: users.id, name: users.name, email: users.email },
    })
    .from(studentProjects)
    .leftJoin(users, eq(studentProjects.studentId, users.id))
    .where(eq(studentProjects.status, "pendente_aprovacao"))
    .orderBy(desc(studentProjects.createdAt));
}

export async function updateStudentProject(id: number, data: Partial<InsertStudentProject>) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(studentProjects)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(studentProjects.id, id));
}

export async function deleteStudentProject(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(studentProjects).where(eq(studentProjects.id, id));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(data);
  return result;
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
}
