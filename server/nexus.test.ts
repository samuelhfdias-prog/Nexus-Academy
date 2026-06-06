import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getProjects: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getProjectById: vi.fn().mockResolvedValue(null),
  createProject: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateProject: vi.fn().mockResolvedValue(undefined),
  deleteProject: vi.fn().mockResolvedValue(undefined),
  getProjectMembers: vi.fn().mockResolvedValue([]),
  getProjectSkills: vi.fn().mockResolvedValue([]),
  getProjectTimeline: vi.fn().mockResolvedValue([]),
  getUserProjects: vi.fn().mockResolvedValue({ owned: [], memberOf: [] }),
  addProjectMember: vi.fn().mockResolvedValue(undefined),
  removeProjectMember: vi.fn().mockResolvedValue(undefined),
  addProjectSkill: vi.fn().mockResolvedValue(undefined),
  removeProjectSkill: vi.fn().mockResolvedValue(undefined),
  addTimelineEvent: vi.fn().mockResolvedValue(undefined),
  createParticipationRequest: vi.fn().mockResolvedValue(undefined),
  getParticipationRequests: vi.fn().mockResolvedValue([]),
  getUserParticipationRequests: vi.fn().mockResolvedValue([]),
  getAllPendingRequests: vi.fn().mockResolvedValue([]),
  updateParticipationRequest: vi.fn().mockResolvedValue(undefined),
  isProjectMember: vi.fn().mockResolvedValue(false),
  hasExistingRequest: vi.fn().mockResolvedValue(false),
  getAllSkills: vi.fn().mockResolvedValue([]),
  createSkill: vi.fn().mockResolvedValue(undefined),
  getUserSkills: vi.fn().mockResolvedValue([]),
  addUserSkill: vi.fn().mockResolvedValue(undefined),
  removeUserSkill: vi.fn().mockResolvedValue(undefined),
  getDashboardStats: vi.fn().mockResolvedValue({
    totalProjects: 0,
    activeProjects: 0,
    totalMembers: 0,
    totalSkills: 0,
    byArea: [],
    byStatus: [],
    recentProjects: [],
  }),
  getUserById: vi.fn().mockResolvedValue(null),
  getAllUsers: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  updateUser: vi.fn().mockResolvedValue(undefined),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getDb: vi.fn().mockResolvedValue(null),
}));

// ─── Context Factories ────────────────────────────────────────────────────────
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(role: "aluno" | "professor" | "admin" = "aluno"): {
  ctx: TrpcContext;
  clearedCookies: { name: string; options: Record<string, unknown> }[];
} {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  const ctx: TrpcContext = {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@fatec.sp.gov.br",
      name: "Test User",
      loginMethod: "manus",
      role,
      bio: null,
      avatarUrl: null,
      institution: null,
      course: null,
      semester: null,
      birthDate: null,
      passwordHash: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastFailedLogin: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSignedIn: new Date().toISOString(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as unknown as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me → returns null when not authenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me → returns user when authenticated", async () => {
    const { ctx } = createUserContext("aluno");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.role).toBe("aluno");
  });

  it("logout → clears session cookie and returns success", async () => {
    const { ctx, clearedCookies } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1, httpOnly: true, path: "/" });
  });
});

// ─── Projects Tests ───────────────────────────────────────────────────────────
describe("projects", () => {
  it("list → returns empty list for public access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.projects.list({});
    expect(result).toEqual({ data: [], total: 0 });
  });

  it("byId → throws NOT_FOUND for non-existent project", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.projects.byId({ id: 9999 })).rejects.toThrow("Projeto não encontrado");
  });

  it("create → throws FORBIDDEN for aluno role", async () => {
    const { ctx } = createUserContext("aluno");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.projects.create({
        title: "Test Project",
        description: "Test description for project",
        thematicArea: "Inteligência Artificial",
        startDate: "2026-01-01",
      })
    ).rejects.toThrow();
  });

  it("create → succeeds for professor role", async () => {
    const { ctx } = createUserContext("professor");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.projects.create({
      title: "Test Project",
      description: "Test description for project",
      thematicArea: "Inteligência Artificial",
      startDate: "2026-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("create → succeeds for admin role", async () => {
    const { ctx } = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.projects.create({
      title: "Admin Project",
      description: "Admin project description here",
      thematicArea: "Ciência de Dados",
      startDate: "2026-02-01",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Skills Tests ─────────────────────────────────────────────────────────────
describe("skills", () => {
  it("list → accessible publicly", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.skills.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create → throws FORBIDDEN for aluno", async () => {
    const { ctx } = createUserContext("aluno");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.skills.create({ name: "Python" })
    ).rejects.toThrow();
  });

  it("create → succeeds for professor", async () => {
    const { ctx } = createUserContext("professor");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.skills.create({ name: "Python", category: "Programação" });
    expect(result.success).toBe(true);
  });
});

// ─── Dashboard Tests ──────────────────────────────────────────────────────────
describe("dashboard", () => {
  it("stats → requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.stats()).rejects.toThrow();
  });

  it("stats → returns stats for authenticated user", async () => {
    const { ctx } = createUserContext("aluno");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.stats();
    expect(result).toHaveProperty("totalProjects");
    expect(result).toHaveProperty("activeProjects");
    expect(result).toHaveProperty("totalMembers");
    expect(result).toHaveProperty("byArea");
    expect(result).toHaveProperty("byStatus");
  });
});

// ─── Admin Tests ──────────────────────────────────────────────────────────────
describe("admin", () => {
  it("users → throws FORBIDDEN for aluno", async () => {
    const { ctx } = createUserContext("aluno");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.users({ page: 1, limit: 20 })).rejects.toThrow();
  });

  it("users → accessible for admin", async () => {
    const { ctx } = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.users({ page: 1, limit: 20 });
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
  });

  it("updateUserRole → throws FORBIDDEN for non-admin", async () => {
    const { ctx } = createUserContext("professor");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.updateUserRole({ userId: 2, role: "admin" })
    ).rejects.toThrow();
  });

  it("updateUserRole → succeeds for admin", async () => {
    const { ctx } = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.updateUserRole({ userId: 2, role: "professor" });
    expect(result.success).toBe(true);
  });
});

// ─── Requests Tests ───────────────────────────────────────────────────────────
describe("requests", () => {
  it("allPending → throws FORBIDDEN for non-admin", async () => {
    const { ctx } = createUserContext("professor");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.requests.allPending()).rejects.toThrow();
  });

  it("allPending → accessible for admin", async () => {
    const { ctx } = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.requests.allPending();
    expect(Array.isArray(result)).toBe(true);
  });
});
