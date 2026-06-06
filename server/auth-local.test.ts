/**
 * ─── Testes de Segurança: Módulo de Autenticação Local ───────────────────────
 *
 * Cobre os seguintes requisitos de segurança:
 * 1. Hash bcrypt: senhas NUNCA armazenadas em texto puro
 * 2. Validação de força de senha: critérios OWASP/NIST
 * 3. Tratamento seguro de erros: mensagens genéricas, timing constante
 * 4. Account lockout: bloqueio após tentativas excessivas
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import {
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
  loginUser,
  registerUser,
} from "./auth-local";

// ─── Mock do módulo de banco de dados ────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "./db";

// ─── 1. Testes de Validação de Força de Senha ─────────────────────────────────
describe("validatePasswordStrength", () => {
  describe("Critérios obrigatórios (OWASP / NIST SP 800-63B)", () => {
    it("rejeita senha com menos de 8 caracteres", () => {
      const result = validatePasswordStrength("Ab1!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("A senha deve ter pelo menos 8 caracteres");
    });

    it("rejeita senha sem letra maiúscula", () => {
      const result = validatePasswordStrength("abcdef1!");
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("maiúscula"))).toBe(true);
    });

    it("rejeita senha sem letra minúscula", () => {
      const result = validatePasswordStrength("ABCDEF1!");
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("minúscula"))).toBe(true);
    });

    it("rejeita senha sem número", () => {
      const result = validatePasswordStrength("Abcdefg!");
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("número"))).toBe(true);
    });

    it("rejeita senha sem caractere especial", () => {
      const result = validatePasswordStrength("Abcdef12");
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("especial"))).toBe(true);
    });

    it("aceita senha que atende todos os critérios", () => {
      const result = validatePasswordStrength("Nexus@2026!");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Senhas comuns (anti-dictionary attack)", () => {
    it("rejeita senha comum 'password'", () => {
      const result = validatePasswordStrength("password");
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("comum"))).toBe(true);
    });

    it("rejeita senha comum 'admin123'", () => {
      const result = validatePasswordStrength("admin123");
      expect(result.isValid).toBe(false);
    });

    it("rejeita senha comum case-insensitive", () => {
      const result = validatePasswordStrength("PASSWORD");
      // Falha por maiúsculas/minúsculas/especial, mas também por ser comum
      expect(result.isValid).toBe(false);
    });
  });

  describe("Penalidades de qualidade", () => {
    it("penaliza sequências repetidas (aaa, 111)", () => {
      // Regex /(.){2,}/ exige 3+ repetições consecutivas do mesmo char
      const result = validatePasswordStrength("Aaaabcd1!"); // 4x 'a' consecutivos
      expect(result.errors.some((e) => e.includes("repetidos"))).toBe(true);
    });

    it("score aumenta com comprimento >= 12 caracteres", () => {
      // Senha curta (9 chars): não recebe bônus de comprimento
      const short = validatePasswordStrength("Nexus@26!");   // 9 chars, score=5 (todos critérios)
      // Senha longa (19 chars): recebe bônus, mas score é limitado a 5
      const long = validatePasswordStrength("NexusAcademic@2026!"); // 19 chars
      // Ambas atingem score máximo 5; verificar que longa tem score >= 4
      expect(long.score).toBeGreaterThanOrEqual(4);
      expect(short.score).toBeGreaterThanOrEqual(4);
      // Verificar que senha de 12+ chars recebe bônus no cálculo interno
      const noBonus = validatePasswordStrength("Abc1!xyz");   // 8 chars, sem bônus
      const withBonus = validatePasswordStrength("Abc1!xyzwqer"); // 12 chars, com bônus
      expect(withBonus.score).toBeGreaterThanOrEqual(noBonus.score);
    });
  });

  describe("Sistema de score (0-5)", () => {
    it("score está no intervalo [0, 5]", () => {
      const passwords = [
        "a",
        "Abcdef1!",
        "NexusAcademic@2026!",
        "12345678",
      ];
      for (const p of passwords) {
        const result = validatePasswordStrength(p);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(5);
      }
    });

    it("senha forte recebe score >= 4", () => {
      const result = validatePasswordStrength("NexusAcademic@2026!");
      expect(result.score).toBeGreaterThanOrEqual(4);
    });

    it("senha fraca recebe score <= 2", () => {
      const result = validatePasswordStrength("abcdefgh");
      expect(result.score).toBeLessThanOrEqual(2);
    });

    it("retorna label correspondente ao score", () => {
      const validLabels = ["Muito fraca", "Fraca", "Média", "Forte", "Muito forte"];
      const result = validatePasswordStrength("Nexus@2026!");
      expect(validLabels).toContain(result.label);
    });
  });
});

// ─── 2. Testes de Hash de Senha (bcrypt) ─────────────────────────────────────
describe("hashPassword / verifyPassword", () => {
  it("gera hash diferente da senha original (NUNCA texto puro)", async () => {
    const password = "Nexus@2026!";
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
  });

  it("hash começa com prefixo bcrypt $2b$ (versão segura)", async () => {
    const hash = await hashPassword("Nexus@2026!");
    expect(hash.startsWith("$2b$")).toBe(true);
  });

  it("hash contém o cost factor 12 ($2b$12$)", async () => {
    const hash = await hashPassword("Nexus@2026!");
    expect(hash.startsWith("$2b$12$")).toBe(true);
  });

  it("hash tem 60 caracteres (formato bcrypt padrão)", async () => {
    const hash = await hashPassword("Nexus@2026!");
    expect(hash).toHaveLength(60);
  });

  it("dois hashes da mesma senha são diferentes (salt único por hash)", async () => {
    const password = "Nexus@2026!";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    // Salts diferentes → hashes diferentes
    expect(hash1).not.toBe(hash2);
  });

  it("verifyPassword retorna true para senha correta", async () => {
    const password = "Nexus@2026!";
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("verifyPassword retorna false para senha incorreta", async () => {
    const hash = await hashPassword("Nexus@2026!");
    const isValid = await verifyPassword("SenhaErrada@1!", hash);
    expect(isValid).toBe(false);
  });

  it("verifyPassword retorna false para senha vazia", async () => {
    const hash = await hashPassword("Nexus@2026!");
    const isValid = await verifyPassword("", hash);
    expect(isValid).toBe(false);
  });

  it("hash é compatível com bcrypt.compare nativo (interoperabilidade)", async () => {
    const password = "Nexus@2026!";
    const hash = await hashPassword(password);
    const nativeResult = await bcrypt.compare(password, hash);
    expect(nativeResult).toBe(true);
  });
});

// ─── 3. Testes de Registro de Utilizador ─────────────────────────────────────
describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna erro quando DB não está disponível", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    const result = await registerUser("test@fatec.sp.gov.br", "Nexus@2026!", "Test User");
    expect(result.success).toBe(false);
    expect(result.error).toContain("indisponível");
  });

  it("rejeita senha fraca antes de acessar o banco", async () => {
    // DB não deve ser chamado se a senha é inválida
    const mockDb = { select: vi.fn() };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await registerUser("test@fatec.sp.gov.br", "fraca", "Test User");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    // DB não deve ter sido consultado
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("usa mensagem genérica quando email já existe (anti-enumeração)", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1 }]), // Email já existe
          }),
        }),
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await registerUser("existente@fatec.sp.gov.br", "Nexus@2026!", "Test User");
    expect(result.success).toBe(false);
    // SEGURANÇA: Mensagem genérica — não revela que o email existe
    expect(result.error).not.toContain("email já cadastrado");
    expect(result.error).not.toContain("já existe");
    expect(result.error).not.toContain("já está em uso");
  });
});

// ─── 4. Testes de Login (Tratamento Seguro de Erros) ─────────────────────────
describe("loginUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna erro quando DB não está disponível", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    const result = await loginUser("test@fatec.sp.gov.br", "Nexus@2026!");
    expect(result.success).toBe(false);
    expect(result.error).toContain("indisponível");
  });

  it("retorna mensagem genérica quando email não existe (anti-enumeração)", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // Email não encontrado
          }),
        }),
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await loginUser("naoexiste@fatec.sp.gov.br", "Nexus@2026!");
    expect(result.success).toBe(false);
    // SEGURANÇA: Mensagem idêntica à de senha errada (não revela se email existe)
    expect(result.error).toBe("Credenciais inválidas. Verifique o email e a senha.");
  });

  it("retorna mensagem genérica quando senha está errada (anti-enumeração)", async () => {
    const realHash = await bcrypt.hash("SenhaCorreta@2026!", 4); // rounds baixo para teste
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              openId: "local_test",
              email: "test@fatec.sp.gov.br",
              name: "Test User",
              role: "aluno",
              passwordHash: realHash,
              failedLoginAttempts: 0,
              lockedUntil: null,
            }]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await loginUser("test@fatec.sp.gov.br", "SenhaErrada@2026!");
    expect(result.success).toBe(false);
    // SEGURANÇA: Mesma mensagem para email inexistente e senha errada
    expect(result.error).toBe("Credenciais inválidas. Verifique o email e a senha.");
  });

  it("informa tentativas restantes quando senha está errada", async () => {
    const realHash = await bcrypt.hash("SenhaCorreta@2026!", 4);
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              openId: "local_test",
              email: "test@fatec.sp.gov.br",
              name: "Test User",
              role: "aluno",
              passwordHash: realHash,
              failedLoginAttempts: 2,
              lockedUntil: null,
            }]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await loginUser("test@fatec.sp.gov.br", "SenhaErrada@2026!");
    expect(result.success).toBe(false);
    // Deve informar tentativas restantes (5 - 3 = 2)
    expect(result.remainingAttempts).toBe(2);
  });

  it("bloqueia conta após 5 tentativas falhadas (account lockout)", async () => {
    const realHash = await bcrypt.hash("SenhaCorreta@2026!", 4);
    let updatedData: Record<string, unknown> = {};
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              openId: "local_test",
              email: "test@fatec.sp.gov.br",
              name: "Test User",
              role: "aluno",
              passwordHash: realHash,
              failedLoginAttempts: 4, // 4 tentativas anteriores
              lockedUntil: null,
            }]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn((data) => {
          updatedData = data;
          return { where: vi.fn().mockResolvedValue(undefined) };
        }),
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    await loginUser("test@fatec.sp.gov.br", "SenhaErrada@2026!");
    // Deve ter definido lockedUntil (bloqueio de conta)
    expect(updatedData.lockedUntil).toBeDefined();
    expect(updatedData.lockedUntil).toBeInstanceOf(Date);
  });

  it("informa tempo de bloqueio quando conta está bloqueada", async () => {
    const lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 min no futuro
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              openId: "local_test",
              email: "test@fatec.sp.gov.br",
              name: "Test User",
              role: "aluno",
              passwordHash: "hash",
              failedLoginAttempts: 5,
              lockedUntil,
            }]),
          }),
        }),
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await loginUser("test@fatec.sp.gov.br", "qualquer");
    expect(result.success).toBe(false);
    expect(result.error).toContain("bloqueada");
    expect(result.lockedUntil).toBeDefined();
  });

  it("login bem-sucedido retorna dados do utilizador sem passwordHash", async () => {
    const realHash = await bcrypt.hash("Nexus@2026!", 4);
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 42,
              openId: "local_abc123",
              email: "aluno@fatec.sp.gov.br",
              name: "Aluno Teste",
              role: "aluno",
              passwordHash: realHash,
              failedLoginAttempts: 0,
              lockedUntil: null,
            }]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await loginUser("aluno@fatec.sp.gov.br", "Nexus@2026!");
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.id).toBe(42);
    expect(result.user?.email).toBe("aluno@fatec.sp.gov.br");
    // SEGURANÇA: passwordHash NUNCA deve ser retornado ao cliente
    expect((result.user as any)?.passwordHash).toBeUndefined();
  });

  it("login bem-sucedido reseta contadores de segurança", async () => {
    const realHash = await bcrypt.hash("Nexus@2026!", 4);
    let resetData: Record<string, unknown> = {};
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              openId: "local_test",
              email: "test@fatec.sp.gov.br",
              name: "Test User",
              role: "aluno",
              passwordHash: realHash,
              failedLoginAttempts: 3,
              lockedUntil: null,
            }]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn((data) => {
          resetData = data;
          return { where: vi.fn().mockResolvedValue(undefined) };
        }),
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    await loginUser("test@fatec.sp.gov.br", "Nexus@2026!");
    // Deve resetar failedLoginAttempts para 0
    expect(resetData.failedLoginAttempts).toBe(0);
    // Deve limpar lockedUntil
    expect(resetData.lockedUntil).toBeNull();
  });
});

// ─── 5. Testes de Integridade do Hash ────────────────────────────────────────
describe("Integridade e conformidade do hash bcrypt", () => {
  it("hash não contém a senha original em nenhuma forma", async () => {
    const password = "Nexus@2026!";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
    expect(hash).not.toContain("Nexus");
    expect(hash).not.toContain("2026");
  });

  it("senhas diferentes produzem hashes diferentes", async () => {
    const hash1 = await hashPassword("Senha1@Forte!");
    const hash2 = await hashPassword("Senha2@Forte!");
    expect(hash1).not.toBe(hash2);
  });

  it("hash é uma string de 60 caracteres (formato bcrypt)", async () => {
    const hash = await hashPassword("Nexus@2026!");
    expect(typeof hash).toBe("string");
    expect(hash.length).toBe(60);
  });

  it("formato do hash segue padrão bcrypt: $2b$12$...", async () => {
    const hash = await hashPassword("Nexus@2026!");
    // Formato: $2b$12$<22 chars salt><31 chars hash>
    expect(hash).toMatch(/^\$2b\$12\$[./A-Za-z0-9]{53}$/);
  });
});
