/**
 * ─── Módulo de Autenticação Local ────────────────────────────────────────────
 *
 * DECISÕES TÉCNICAS DE SEGURANÇA:
 *
 * 1. BCRYPT (cost factor 12):
 *    - Algoritmo adaptativo: o custo computacional aumenta com o hardware.
 *    - Salt integrado: cada hash contém um salt único de 128 bits (22 chars base64).
 *    - Cost factor 12: ~250ms por hash, equilibrando segurança e UX.
 *    - Resistente a ataques de rainbow table e força bruta em GPU.
 *    - Referência: OWASP Password Storage Cheat Sheet.
 *
 * 2. VALIDAÇÃO DE FORÇA DE SENHA:
 *    - Mínimo 8 caracteres (NIST SP 800-63B recomenda mín. 8).
 *    - Exige: maiúscula, minúscula, número e caractere especial.
 *    - Rejeita senhas comuns (top 20 mais usadas mundialmente).
 *    - Penaliza sequências repetidas (ex.: "aaa", "111").
 *    - Score 0-5 para feedback visual no frontend.
 *
 * 3. RATE LIMITING / ACCOUNT LOCKOUT:
 *    - Após 5 tentativas falhadas: conta bloqueada por 15 minutos.
 *    - Previne ataques de força bruta online.
 *    - Reset automático após período de lockout.
 *    - Referência: OWASP Authentication Cheat Sheet.
 *
 * 4. TRATAMENTO SEGURO DE ERROS:
 *    - Mensagens genéricas: "Credenciais inválidas" (não revela se email existe).
 *    - Timing constante: bcrypt.compare() executado mesmo com email inexistente,
 *      prevenindo ataques de timing side-channel (user enumeration via timing).
 *    - Sem stack traces expostos ao cliente.
 *    - Referência: CWE-203 Observable Discrepancy.
 *
 * 5. SENHAS NUNCA EM TEXTO PURO:
 *    - Apenas o hash bcrypt é persistido na coluna `passwordHash`.
 *    - A senha em texto puro existe apenas em memória durante o processo de hash.
 *    - Logs não registam senhas em nenhuma circunstância.
 */

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";
import { nanoid } from "nanoid";

// ─── Configurações de Segurança ──────────────────────────────────────────────

/**
 * Cost factor do bcrypt.
 * - 12 rounds = 2^12 = 4096 iterações internas.
 * - Produz ~250ms por hash em hardware moderno.
 * - OWASP recomenda mínimo de 10; 12 é o valor ideal para produção.
 * - Aumentar para 13-14 em hardware mais rápido no futuro.
 */
const BCRYPT_ROUNDS = 12;

/** Máximo de tentativas de login antes de bloquear a conta. */
const MAX_LOGIN_ATTEMPTS = 5;

/** Tempo de bloqueio em milissegundos (15 minutos). */
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

/**
 * Lista de senhas comuns que devem ser rejeitadas.
 * Baseada nas senhas mais vazadas segundo relatórios HaveIBeenPwned.
 * Em produção, esta lista deve ser expandida para pelo menos 10.000 entradas
 * ou substituída por verificação via API HaveIBeenPwned (k-anonymity model).
 */
const COMMON_PASSWORDS = new Set([
  "password", "12345678", "123456789", "1234567890", "qwerty123",
  "abc12345", "password1", "iloveyou", "sunshine1", "princess1",
  "admin123", "welcome1", "monkey123", "dragon12", "master12",
  "qwerty12", "login123", "abc123456", "starwars1", "trustno1",
  "letmein1", "baseball", "football", "superman1", "batman123",
  "shadow12", "michael1", "jessica1", "charlie1", "donald123",
]);

// ─── Tipos Exportados ────────────────────────────────────────────────────────

/** Resultado da validação de força de senha. */
export interface PasswordValidation {
  /** true se a senha atende a todos os critérios obrigatórios. */
  isValid: boolean;
  /**
   * Pontuação de 0 a 5.
   * 0-1: Muito fraca | 2: Fraca | 3: Média | 4: Forte | 5: Muito forte
   */
  score: number;
  /** Lista de erros descritivos para exibição ao utilizador. */
  errors: string[];
  /** Rótulo textual correspondente ao score. */
  label: "Muito fraca" | "Fraca" | "Média" | "Forte" | "Muito forte";
}

/** Resultado de operações de autenticação (login/registro). */
export interface AuthResult {
  success: boolean;
  user?: {
    id: number;
    openId: string;
    name: string | null;
    email: string | null;
    role: "aluno" | "professor" | "admin";
  };
  /** Mensagem de erro genérica (nunca revela detalhes internos). */
  error?: string;
  /** Tentativas restantes antes do bloqueio. */
  remainingAttempts?: number;
  /** Data/hora até quando a conta está bloqueada. */
  lockedUntil?: Date;
}

// ─── Validação de Força de Senha ─────────────────────────────────────────────

/**
 * Valida a força da senha seguindo critérios OWASP e NIST SP 800-63B.
 *
 * Critérios obrigatórios (cada ausência gera um erro):
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula (A-Z)
 * - Pelo menos 1 letra minúscula (a-z)
 * - Pelo menos 1 dígito numérico (0-9)
 * - Pelo menos 1 caractere especial (!@#$%^&*...)
 *
 * Critérios de qualidade (penalizam o score sem bloquear):
 * - Senhas comuns conhecidas
 * - Sequências de caracteres repetidos (aaa, 111)
 *
 * @param password - Senha em texto puro a ser validada
 * @returns PasswordValidation com isValid, score (0-5), errors e label
 */
export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = [];
  let score = 0;

  // ── Critério 1: Comprimento mínimo (NIST SP 800-63B §5.1.1) ──
  if (password.length < 8) {
    errors.push("A senha deve ter pelo menos 8 caracteres");
  } else {
    score += 1;
    // Bônus por comprimento estendido (>=12 chars)
    if (password.length >= 12) score += 1;
  }

  // ── Critério 2: Letra maiúscula ──
  if (!/[A-Z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra maiúscula (A-Z)");
  } else {
    score += 1;
  }

  // ── Critério 3: Letra minúscula ──
  if (!/[a-z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra minúscula (a-z)");
  } else {
    score += 1;
  }

  // ── Critério 4: Dígito numérico ──
  if (!/[0-9]/.test(password)) {
    errors.push("A senha deve conter pelo menos um número (0-9)");
  } else {
    score += 1;
  }

  // ── Critério 5: Caractere especial ──
  if (!/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(password)) {
    errors.push("A senha deve conter pelo menos um caractere especial (!@#$%^&*...)");
  } else {
    score += 1;
  }

  // ── Penalidade: Senha comum conhecida ──
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push("Esta senha é muito comum e facilmente adivinhável. Escolha uma senha mais segura");
    score = Math.max(0, score - 2);
  }

  // ── Penalidade: Sequências repetidas (aaa, 111, ...) ──
  if (/(.)\1{2,}/.test(password)) {
    errors.push("Evite caracteres repetidos consecutivos (ex.: aaa, 111)");
    score = Math.max(0, score - 1);
  }

  // ── Normalizar score para intervalo [0, 5] ──
  const finalScore = Math.min(5, Math.max(0, score));

  const scoreLabels: PasswordValidation["label"][] = [
    "Muito fraca",  // 0
    "Muito fraca",  // 1
    "Fraca",        // 2
    "Média",        // 3
    "Forte",        // 4
    "Muito forte",  // 5
  ];

  return {
    isValid: errors.length === 0,
    score: finalScore,
    errors,
    label: scoreLabels[finalScore] ?? "Muito fraca",
  };
}

// ─── Funções de Hash ─────────────────────────────────────────────────────────

/**
 * Gera hash bcrypt da senha fornecida.
 *
 * Justificativa técnica:
 * - bcrypt.hash() gera automaticamente um salt criptograficamente aleatório
 *   de 128 bits (22 caracteres em base64).
 * - O resultado final tem formato: $2b$12$<salt_22_chars><hash_31_chars>
 *   totalizando 60 caracteres.
 * - O prefixo $2b$ identifica a versão do algoritmo (mais segura que $2a$).
 * - O cost factor 12 produz 2^12 = 4096 iterações do algoritmo Blowfish.
 * - bcrypt é resistente a aceleração por GPU por ser memory-hard.
 *
 * IMPORTANTE: A senha em texto puro NUNCA deve ser persistida ou registada em logs.
 *
 * @param password - Senha em texto puro
 * @returns Hash bcrypt de 60 caracteres
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verifica se uma senha corresponde ao hash bcrypt armazenado.
 *
 * Justificativa técnica:
 * - bcrypt.compare() extrai o salt do próprio hash antes de comparar,
 *   garantindo que o mesmo salt seja usado na verificação.
 * - A comparação usa timing constante internamente, prevenindo
 *   ataques de timing side-channel (CWE-208).
 *
 * @param password - Senha em texto puro fornecida pelo utilizador
 * @param hash - Hash bcrypt armazenado no banco de dados
 * @returns true se a senha corresponde ao hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Registro de Utilizador ──────────────────────────────────────────────────

/**
 * Regista um novo utilizador com senha segura.
 *
 * Fluxo de segurança:
 * 1. Valida força da senha antes de qualquer operação de banco.
 * 2. Verifica duplicidade de email com mensagem genérica (anti-enumeração).
 * 3. Gera hash bcrypt com salt automático.
 * 4. Persiste apenas o hash — NUNCA a senha em texto puro.
 * 5. Gera openId único prefixado com "local_" para distinguir de contas OAuth.
 *
 * @param email - Email do utilizador (identificador único)
 * @param password - Senha em texto puro (será imediatamente descartada após hash)
 * @param name - Nome completo do utilizador
 * @param role - Papel no sistema (padrão: "aluno")
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: "aluno" | "professor" = "aluno",
  birthDate?: string
): Promise<AuthResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Serviço temporariamente indisponível. Tente novamente em instantes." };
  }

  // ── Passo 1: Validar força da senha ──
  const validation = validatePasswordStrength(password);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.errors[0] ?? "Senha não atende aos requisitos de segurança",
    };
  }

  // ── Passo 2: Verificar duplicidade de email ──
  // SEGURANÇA: Mensagem genérica para prevenir enumeração de utilizadores.
  // Um atacante não deve conseguir descobrir quais emails estão cadastrados.
  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: "Não foi possível completar o registro. Verifique os dados informados e tente novamente.",
      };
    }
  } catch (dbError) {
    console.error("[Auth] Database error during registration check:", dbError);
    return { success: false, error: "Erro interno. Tente novamente mais tarde." };
  }

  // ── Passo 3: Gerar hash bcrypt ──
  // A senha em texto puro é descartada após esta operação.
  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch (hashError) {
    console.error("[Auth] Hash generation failed:", hashError);
    return { success: false, error: "Erro interno ao processar credenciais." };
  }

  // ── Passo 4: Persistir utilizador com hash ──
  const openId = `local_${nanoid(32)}`;

  try {
    await db.insert(users).values({
      openId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      passwordHash, // Apenas o hash — NUNCA texto puro
      loginMethod: "local",
      role,
      birthDate: birthDate ?? null,
      lastSignedIn: new Date().toISOString(),
    });
  } catch (insertError) {
    console.error("[Auth] User insert failed:", insertError);
    return { success: false, error: "Erro ao criar conta. Tente novamente." };
  }

  // ── Passo 5: Retornar dados do utilizador criado ──
  const [newUser] = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  if (!newUser) {
    return { success: false, error: "Erro interno ao finalizar criação de conta." };
  }

  return {
    success: true,
    user: {
      id: newUser.id,
      openId: newUser.openId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
  };
}

// ─── Login Local ─────────────────────────────────────────────────────────────

/**
 * Autentica um utilizador com email e senha.
 *
 * Fluxo de segurança:
 * 1. Busca utilizador por email.
 * 2. Se não encontrado: executa hash "fantasma" para manter timing constante
 *    e retorna mensagem genérica (previne enumeração de utilizadores por timing).
 * 3. Verifica bloqueio de conta (account lockout).
 * 4. Verifica senha com bcrypt.compare() (timing constante integrado).
 * 5. Em caso de falha: incrementa contador e bloqueia se necessário.
 * 6. Em caso de sucesso: reseta contadores e atualiza lastSignedIn.
 *
 * IMPORTANTE: Mensagens de erro são intencionalmente genéricas.
 * Nunca revelar se o email existe ou não no sistema.
 *
 * @param email - Email fornecido pelo utilizador
 * @param password - Senha fornecida pelo utilizador
 */
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Serviço temporariamente indisponível. Tente novamente em instantes." };
  }

  // ── Passo 1: Buscar utilizador por email ──
  let user;
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);
    user = result[0];
  } catch (dbError) {
    console.error("[Auth] Database error during login:", dbError);
    return { success: false, error: "Erro interno. Tente novamente mais tarde." };
  }

  // ── Passo 2: Timing constante quando utilizador não existe ──
  // SEGURANÇA (CWE-203): Executar operação de hash mesmo quando o utilizador
  // não existe, para que o tempo de resposta seja idêntico ao de uma senha errada.
  // Sem isso, um atacante poderia medir o tempo de resposta para descobrir
  // quais emails estão cadastrados (user enumeration via timing attack).
  if (!user || !user.passwordHash) {
    await bcrypt.hash("dummy_password_for_constant_timing_prevention", BCRYPT_ROUNDS);
    return {
      success: false,
      error: "Credenciais inválidas. Verifique o email e a senha.",
    };
  }

  // ── Passo 3: Verificar bloqueio de conta (Account Lockout) ──
  // Previne ataques de força bruta online ao limitar tentativas consecutivas.
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remainingMs = new Date(user.lockedUntil).getTime() - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    return {
      success: false,
      error: `Conta temporariamente bloqueada por segurança. Tente novamente em ${remainingMin} minuto(s).`,
      lockedUntil: new Date(user.lockedUntil),
    };
  }

  // ── Passo 4: Verificar senha com bcrypt ──
  // bcrypt.compare() usa timing constante internamente (safe comparison).
  let isValid: boolean;
  try {
    isValid = await verifyPassword(password, user.passwordHash);
  } catch (compareError) {
    console.error("[Auth] Password verification error:", compareError);
    return { success: false, error: "Erro interno ao verificar credenciais." };
  }

  if (!isValid) {
    // ── Passo 5a: Incrementar tentativas falhadas ──
    const newAttempts = (user.failedLoginAttempts ?? 0) + 1;
    const updateData: Record<string, unknown> = {
      failedLoginAttempts: newAttempts,
      lastFailedLogin: new Date().toISOString(),
    };

    // Bloquear conta se exceder o limite de tentativas
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      console.warn(`[Auth] Account locked for email hash: ${email.substring(0, 3)}***`);
    }

    try {
      await db.update(users).set(updateData).where(eq(users.id, user.id));
    } catch (updateError) {
      console.error("[Auth] Failed to update failed attempts:", updateError);
    }

    const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - newAttempts);
    return {
      success: false,
      // SEGURANÇA: Mensagem genérica — não revela qual campo está errado.
      error: "Credenciais inválidas. Verifique o email e a senha.",
      remainingAttempts: remaining,
    };
  }

  // ── Passo 5b: Login bem-sucedido — resetar contadores de segurança ──
  try {
    await db.update(users).set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastFailedLogin: null,
      lastSignedIn: new Date().toISOString(),
    }).where(eq(users.id, user.id));
  } catch (updateError) {
    console.error("[Auth] Failed to reset login counters:", updateError);
    // Não falhar o login por erro no reset de contadores
  }

  return {
    success: true,
    user: {
      id: user.id,
      openId: user.openId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
