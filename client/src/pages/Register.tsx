import { Logo } from "@/components/Logo";
/**
 * ─── Página de Registro ───────────────────────────────────────────────────────
 *
 * Implementa o fluxo de criação de conta com:
 * - Validação client-side com Zod (espelha regras do servidor)
 * - Indicador visual de força de senha em tempo real (score 0-5)
 * - Confirmação de senha com verificação de igualdade
 * - Seleção de papel (aluno / professor)
 * - Feedback de erros genérico (não revela se email já existe)
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye, EyeOff, Lock, Mail, User, AlertCircle,
  CheckCircle, ShieldCheck, GraduationCap, CalendarDays,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Schema de Validação Client-Side ─────────────────────────────────────────
// Espelha as regras do servidor para feedback imediato sem round-trip.
const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(255, "Nome muito longo"),
    email: z
      .string()
      .min(1, "Email é obrigatório")
      .email("Formato de email inválido")
      .max(320, "Email muito longo"),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .max(128, "Senha muito longa")
      .regex(/[A-Z]/, "Deve conter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "Deve conter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "Deve conter pelo menos um número")
      .regex(/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/, "Deve conter pelo menos um caractere especial"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
    role: z.enum(["aluno", "professor"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Componente: Indicador de Força de Senha ──────────────────────────────────
interface PasswordStrengthIndicatorProps {
  password: string;
  score: number;
  label: string;
  errors: string[];
}

function PasswordStrengthIndicator({ password, score, label, errors }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const colors = [
    "bg-red-500",    // 0 - Muito fraca
    "bg-red-400",    // 1 - Muito fraca
    "bg-orange-400", // 2 - Fraca
    "bg-yellow-400", // 3 - Média
    "bg-green-400",  // 4 - Forte
    "bg-green-500",  // 5 - Muito forte
  ];

  const textColors = [
    "text-red-600",    // 0
    "text-red-500",    // 1
    "text-orange-500", // 2
    "text-yellow-600", // 3
    "text-green-600",  // 4
    "text-green-700",  // 5
  ];

  const barColor = colors[score] ?? "bg-gray-200";
  const textColor = textColors[score] ?? "text-gray-500";

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de progresso */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < score ? barColor : "bg-[#E5E7EB]"
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-600 min-w-[80px] text-right ${textColor}`}>
          {label}
        </span>
      </div>

      {/* Erros de validação */}
      {errors.length > 0 && (
        <ul className="space-y-1">
          {errors.map((err, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {err}
            </li>
          ))}
        </ul>
      )}

      {/* Confirmação quando senha é válida */}
      {errors.length === 0 && score >= 3 && (
        <p className="flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle className="w-3.5 h-3.5" />
          Senha atende a todos os requisitos de segurança
        </p>
      )}
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function Register() {
  const [, navigate] = useLocation();
  const { refresh } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    label: string;
    errors: string[];
  }>({ score: 0, label: "Muito fraca", errors: [] });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "aluno" },
  });

  const passwordValue = watch("password") ?? "";
  const selectedRole = watch("role");

  // Verificar força da senha em tempo real via API do servidor
  const checkStrengthMutation = trpc.auth.checkPasswordStrength.useMutation({
    onSuccess: (data) => {
      setPasswordStrength({
        score: data.score,
        label: data.label,
        errors: data.errors,
      });
    },
  });

  // Debounce da verificação de força de senha
  useEffect(() => {
    if (!passwordValue) {
      setPasswordStrength({ score: 0, label: "Muito fraca", errors: [] });
      return;
    }
    const timer = setTimeout(() => {
      checkStrengthMutation.mutate({ password: passwordValue });
    }, 300);
    return () => clearTimeout(timer);
  }, [passwordValue]);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      setServerError(null);
      await refresh();
      navigate("/dashboard");
    },
    onError: (error) => {
      // SEGURANÇA: Mensagem genérica — não revela se o email já existe.
      setServerError(
        error.message || "Não foi possível criar a conta. Verifique os dados e tente novamente."
      );
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setServerError(null);
    registerMutation.mutate({
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role,
      birthDate: data.birthDate || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F9F6] to-[#E8F5F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-[#24B68E] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Logo className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl text-[#1F2937]">
              Nexus<span className="text-[#6B7280]">_</span>
              <span className="text-[#24B68E]">Academic</span>
            </span>
          </Link>
          <p className="mt-3 text-[#6B7280] text-sm">
            FATEC Pompéia · Plataforma de PD&I
          </p>
        </div>

        {/* Card de Registro */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-800 text-[#1F2937]">Criar nova conta</h1>
            <p className="text-[#6B7280] text-sm mt-1">
              Junte-se à comunidade acadêmica do Nexus
            </p>
          </div>

          {/* Alerta de Erro do Servidor */}
          {serverError && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Campo Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-600 text-[#374151] mb-1.5">
                Nome completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome completo"
                  {...register("name")}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors outline-none focus:ring-2 focus:ring-[#24B68E]/30 ${
                    errors.name
                      ? "border-red-300 bg-red-50 focus:border-red-400"
                      : "border-[#D1D5DB] bg-white focus:border-[#24B68E]"
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-600 text-[#374151] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu.email@fatec.sp.gov.br"
                  {...register("email")}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors outline-none focus:ring-2 focus:ring-[#24B68E]/30 ${
                    errors.email
                      ? "border-red-300 bg-red-50 focus:border-red-400"
                      : "border-[#D1D5DB] bg-white focus:border-[#24B68E]"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Campo Data de Nascimento */}
            <div>
              <label htmlFor="birthDate" className="block text-sm font-600 text-[#374151] mb-1.5">
                Data de nascimento <span className="text-[#9CA3AF] font-400">(opcional)</span>
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                <input
                  id="birthDate"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  min="1920-01-01"
                  {...register("birthDate")}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#1F2937] transition-colors outline-none focus:ring-2 focus:ring-[#24B68E]/30 focus:border-[#24B68E] [color-scheme:light]"
                />
              </div>
              {errors.birthDate && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.birthDate.message}
                </p>
              )}
            </div>

            {/* Seleção de Papel */}
            <div>
              <label className="block text-sm font-600 text-[#374151] mb-2">
                Perfil na instituição
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "aluno", label: "Aluno", icon: GraduationCap, desc: "Participo de projetos" },
                  { value: "professor", label: "Professor", icon: User, desc: "Coordeno projetos" },
                ].map(({ value, label, icon: Icon, desc }) => (
                  <label
                    key={value}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedRole === value
                        ? "border-[#24B68E] bg-[#F3F9F6]"
                        : "border-[#E5E7EB] hover:border-[#24B68E]/40"
                    }`}
                  >
                    <input
                      type="radio"
                      value={value}
                      {...register("role")}
                      className="sr-only"
                    />
                    <Icon className={`w-5 h-5 ${selectedRole === value ? "text-[#24B68E]" : "text-[#9CA3AF]"}`} />
                    <span className={`text-sm font-700 ${selectedRole === value ? "text-[#24B68E]" : "text-[#374151]"}`}>
                      {label}
                    </span>
                    <span className="text-xs text-[#9CA3AF] text-center">{desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Campo Senha com Indicador de Força */}
            <div>
              <label htmlFor="password" className="block text-sm font-600 text-[#374151] mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  {...register("password")}
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm transition-colors outline-none focus:ring-2 focus:ring-[#24B68E]/30 ${
                    errors.password
                      ? "border-red-300 bg-red-50 focus:border-red-400"
                      : "border-[#D1D5DB] bg-white focus:border-[#24B68E]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Erros de validação client-side */}
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.password.message}
                </p>
              )}

              {/* Indicador de força de senha (validação server-side em tempo real) */}
              <PasswordStrengthIndicator
                password={passwordValue}
                score={passwordStrength.score}
                label={passwordStrength.label}
                errors={!errors.password ? passwordStrength.errors : []}
              />

              {/* Requisitos de senha */}
              {!passwordValue && (
                <div className="mt-2 p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                  <p className="text-xs font-600 text-[#6B7280] mb-1.5">Requisitos de segurança:</p>
                  <ul className="space-y-1 text-xs text-[#9CA3AF]">
                    {[
                      "Mínimo 8 caracteres",
                      "Pelo menos 1 letra maiúscula (A-Z)",
                      "Pelo menos 1 letra minúscula (a-z)",
                      "Pelo menos 1 número (0-9)",
                      "Pelo menos 1 caractere especial (!@#$...)",
                    ].map((req) => (
                      <li key={req} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Campo Confirmar Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-600 text-[#374151] mb-1.5">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  {...register("confirmPassword")}
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm transition-colors outline-none focus:ring-2 focus:ring-[#24B68E]/30 ${
                    errors.confirmPassword
                      ? "border-red-300 bg-red-50 focus:border-red-400"
                      : "border-[#D1D5DB] bg-white focus:border-[#24B68E]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                  aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Botão de Submit */}
            <button
              type="submit"
              disabled={isSubmitting || registerMutation.isPending}
              className="w-full py-3 px-6 rounded-xl bg-[#24B68E] text-white font-700 text-sm transition-all duration-200 hover:bg-[#1E9A78] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {registerMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  A criar conta...
                </span>
              ) : (
                "Criar conta"
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[#9CA3AF]">Já tem uma conta?</span>
            </div>
          </div>

          {/* Link para Login */}
          <Link
            href="/login"
            className="w-full flex items-center justify-center py-3 px-6 rounded-xl border-2 border-[#24B68E] text-[#24B68E] font-700 text-sm transition-all duration-200 hover:bg-[#F3F9F6] active:scale-[0.98]"
          >
            Entrar na conta existente
          </Link>
        </div>

        {/* Nota de segurança */}
        <p className="text-center text-xs text-[#9CA3AF] mt-6">
          <ShieldCheck className="w-3 h-3 inline mr-1" />
          Senhas protegidas com bcrypt · Dados seguros
        </p>
      </div>
    </div>
  );
}
