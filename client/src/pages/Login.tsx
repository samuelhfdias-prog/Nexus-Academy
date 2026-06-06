import { Logo } from "@/components/Logo";
/**
 * ─── Página de Login ──────────────────────────────────────────────────────────
 *
 * Implementa o fluxo de autenticação local com:
 * - Formulário de email e senha com validação client-side (Zod + react-hook-form)
 * - Feedback de erros genérico (não revela se email existe)
 * - Exibição de tentativas restantes e tempo de bloqueio
 * - Link para registro de nova conta
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff,  Lock, Mail, AlertCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Schema de Validação Client-Side ─────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Formato de email inválido")
    .max(320, "Email muito longo"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .max(128, "Senha muito longa"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function Login() {
  const [, navigate] = useLocation();
  const { refresh } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      setServerError(null);
      await refresh();
      navigate("/dashboard");
    },
    onError: (error) => {
      // SEGURANÇA: Exibir mensagem genérica do servidor.
      // O servidor nunca revela se o email existe ou qual campo está errado.
      setServerError(error.message || "Credenciais inválidas. Verifique o email e a senha.");

      // Extrair metadados de segurança da resposta se disponíveis
      const data = (error as any)?.data;
      if (data?.remainingAttempts !== undefined) {
        setRemainingAttempts(data.remainingAttempts);
      }
      if (data?.lockedUntil) {
        setLockedUntil(new Date(data.lockedUntil));
      }
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setServerError(null);
    setRemainingAttempts(null);
    setLockedUntil(null);
    loginMutation.mutate(data);
  };

  // Calcular tempo restante de bloqueio
  const lockoutMinutes = lockedUntil
    ? Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)
    : null;

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

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-800 text-[#1F2937]">Entrar na conta</h1>
            <p className="text-[#6B7280] text-sm mt-1">
              Acesse a plataforma com seu email institucional
            </p>
          </div>

          {/* Alerta de Bloqueio de Conta */}
          {lockoutMinutes && lockoutMinutes > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-600 text-amber-800">Conta temporariamente bloqueada</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Por segurança, sua conta foi bloqueada após múltiplas tentativas incorretas.
                  Tente novamente em <strong>{lockoutMinutes} minuto(s)</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Alerta de Erro Genérico */}
          {serverError && !lockoutMinutes && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-700">{serverError}</p>
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    Atenção: {remainingAttempts} tentativa(s) restante(s) antes do bloqueio temporário.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

            {/* Campo Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-600 text-[#374151] mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
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
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Botão de Submit */}
            <button
              type="submit"
              disabled={isSubmitting || loginMutation.isPending || (lockoutMinutes !== null && lockoutMinutes > 0)}
              className="w-full py-3 px-6 rounded-xl bg-[#24B68E] text-white font-700 text-sm transition-all duration-200 hover:bg-[#1E9A78] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  A verificar credenciais...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[#9CA3AF]">Não tem uma conta?</span>
            </div>
          </div>

          {/* Link para Registro */}
          <Link
            href="/registro"
            className="w-full flex items-center justify-center py-3 px-6 rounded-xl border-2 border-[#24B68E] text-[#24B68E] font-700 text-sm transition-all duration-200 hover:bg-[#F3F9F6] active:scale-[0.98]"
          >
            Criar nova conta
          </Link>
        </div>

        {/* Nota de segurança */}
        <p className="text-center text-xs text-[#9CA3AF] mt-6">
          <Lock className="w-3 h-3 inline mr-1" />
          Conexão segura · Senhas protegidas com bcrypt
        </p>
      </div>
    </div>
  );
}
