import { Logo } from "@/components/Logo";
import { Link } from "wouter";
import {
  ArrowRight,
  
  Users,
  BarChart3,
  Lightbulb,
  Search,
  Award,
  CheckCircle,
  Zap,
  Globe,
  ChevronRight,
  Star,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: "#24B68E", paddingTop: "1.5rem", paddingBottom: "10rem" }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: "#38C69F" }}
        />
        <div
          className="absolute top-1/2 -left-20 w-64 h-64 rounded-full opacity-10"
          style={{ backgroundColor: "#1E9A78" }}
        />
        <div
          className="absolute bottom-20 right-1/4 w-48 h-48 rounded-full opacity-5"
          style={{ backgroundColor: "#ffffff" }}
        />
      </div>

      <div className="container relative z-10">
        {/* Navbar space */}
        <div className="h-16" />

        {/* Hero Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-8">
          {/* Text */}
          <div className="text-white fade-up stagger-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white/90 text-sm font-600 mb-5">
              <Star className="w-3.5 h-3.5 fill-current" />
              FATEC Pompéia · Projeto Integrador 2026
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-900 leading-tight mb-5">
              Conectando alunos
              <br />
              <span className="text-white/80">à</span> inovação
            </h1>
            <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-lg">
              Plataforma integrada para gestão e visibilidade de projetos de PD&I. Encontre projetos, registre competências e colabore com a comunidade acadêmica.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <a
                href={isAuthenticated ? "/projetos" : "/registro"}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#24B68E] rounded-full font-700 text-sm shadow-lg hover:bg-[#F9FAFB] transition-all duration-200 active:scale-[0.97]"
              >
                {isAuthenticated ? "Explorar Projetos" : "Começar Agora"}
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/sobre"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/40 text-white rounded-full font-700 text-sm hover:bg-white/10 transition-all duration-200 active:scale-[0.97]"
              >
                Saiba Mais
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              {[
                { icon: Logo, value: "PD&I", label: "Projetos Ativos" },
                { icon: Users, value: "Alunos", label: "Conectados" },
                { icon: Lightbulb, value: "Inovação", label: "Aberta" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-700 text-sm leading-tight">{stat.value}</p>
                    <p className="text-white/70 text-xs">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration */}
          <div className="hidden lg:flex justify-end items-center fade-up stagger-2">
            <div className="relative w-[420px] h-[420px]">
              {/* Main Image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[340px] h-[340px] rounded-full bg-white/10 flex items-center justify-center">
                  <img
                    src="/images/student.png"
                    alt="Aluna Nexus Academic"
                    className="w-full h-full object-cover rounded-full shadow-2xl"
                  />
                </div>
              </div>
              {/* Floating cards */}
              <div className="absolute top-4 right-0 bg-white rounded-2xl p-3 shadow-xl w-36 fade-up stagger-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-[#F3F9F6] flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5 text-[#24B68E]" />
                  </div>
                  <span className="text-xs font-700 text-[#1F2937]">Dashboard</span>
                </div>
                <p className="text-xs text-[#6B7280]">Indicadores em tempo real</p>
              </div>
              <div className="absolute bottom-8 left-0 bg-white rounded-2xl p-3 shadow-xl w-40 fade-up stagger-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-[#F3F9F6] flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-[#24B68E]" />
                  </div>
                  <span className="text-xs font-700 text-[#1F2937]">Colaboração</span>
                </div>
                <p className="text-xs text-[#6B7280]">Conecte-se a projetos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Curved bottom */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-24 lg:h-32">
          <path
            d="M0,60 C360,120 1080,0 1440,60 L1440,120 L0,120 Z"
            fill="#F9FAFB"
          />
        </svg>
      </div>
    </section>
  );
}

// ─── Feature Cards ────────────────────────────────────────────────────────────
function FeatureCards() {
  const cards = [
    {
      icon: Search,
      title: "Descubra Projetos",
      description: "Explore projetos de PD&I ativos, filtre por área temática e encontre oportunidades alinhadas ao seu perfil.",
      color: "bg-[#F3F9F6]",
      iconBg: "bg-[#24B68E]",
      href: "/projetos",
    },
    {
      icon: Award,
      title: "Registre Competências",
      description: "Cadastre suas habilidades técnicas e acadêmicas para ser encontrado por projetos que precisam do seu perfil.",
      color: "bg-purple-50",
      iconBg: "bg-purple-500",
      href: "/competencias",
    },
    {
      icon: BarChart3,
      title: "Acompanhe Indicadores",
      description: "Visualize métricas de engajamento, distribuição por área e evolução dos projetos em tempo real.",
      color: "bg-blue-50",
      iconBg: "bg-blue-500",
      href: "/dashboard",
    },
  ];

  return (
    <section className="relative z-10 -mt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <Link
              key={card.title}
              href={card.href}
              className={`group block rounded-2xl p-6 ${card.color} border border-transparent hover:border-[#24B68E]/20 transition-all duration-200 card-hover fade-up stagger-${i + 1}`}
            >
              <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-700 text-[#1F2937] text-base mb-2">{card.title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed mb-4">{card.description}</p>
              <span className="inline-flex items-center gap-1 text-sm font-700 text-[#24B68E] group-hover:gap-2 transition-all duration-200">
                Explorar <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    {
      icon: Logo,
      title: "Gestão de Projetos PD&I",
      description: "Crie, gerencie e acompanhe projetos de pesquisa com campos estruturados: área temática, status, responsável e linha do tempo.",
    },
    {
      icon: Users,
      title: "Colaboração em Equipe",
      description: "Solicite participação em projetos, gerencie membros e construa equipes multidisciplinares de forma organizada.",
    },
    {
      icon: Zap,
      title: "Sistema de Competências",
      description: "Alunos registram habilidades; projetos publicam demandas. A plataforma conecta perfis às oportunidades certas.",
    },
    {
      icon: BarChart3,
      title: "Dashboard Analítico",
      description: "Indicadores institucionais em tempo real: projetos ativos, membros engajados e distribuição por área temática.",
    },
    {
      icon: Globe,
      title: "Visibilidade Institucional",
      description: "Toda a produção científica do campus centralizada e visível, promovendo transparência e ciência aberta.",
    },
    {
      icon: Award,
      title: "Perfil Acadêmico",
      description: "Histórico completo de participações, competências e conquistas acadêmicas num perfil profissional único.",
    },
  ];

  return (
    <section className="section-padding" style={{ backgroundColor: "#F3F9F6" }}>
      <div className="container">
        <div className="text-center mb-14 fade-up">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#24B68E]/10 text-[#24B68E] text-sm font-700 mb-4">
            <Zap className="w-3.5 h-3.5" />
            Funcionalidades
          </span>
          <h2 className="text-3xl lg:text-4xl font-800 text-[#1F2937] mb-4">
            Tudo que você precisa para
            <br />
            <span className="gradient-text">gerir projetos acadêmicos</span>
          </h2>
          <p className="text-[#6B7280] text-lg max-w-2xl mx-auto leading-relaxed">
            Uma plataforma completa que conecta alunos, professores e administradores num ecossistema de inovação organizado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`bg-white rounded-2xl p-6 border border-[#E5E7EB] hover:border-[#24B68E]/30 transition-all duration-200 card-hover fade-up stagger-${(i % 6) + 1}`}
            >
              <div className="w-11 h-11 rounded-xl bg-[#F3F9F6] flex items-center justify-center mb-4">
                <feature.icon className="w-5.5 h-5.5 text-[#24B68E]" />
              </div>
              <h3 className="font-700 text-[#1F2937] text-base mb-2">{feature.title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    { number: "01", title: "Crie sua conta", description: "Autentique-se via Manus OAuth e configure seu perfil acadêmico com curso, semestre e bio." },
    { number: "02", title: "Registre competências", description: "Adicione suas habilidades técnicas e acadêmicas ao seu perfil para ser encontrado por projetos." },
    { number: "03", title: "Explore projetos", description: "Navegue pelos projetos de PD&I ativos, filtre por área temática e encontre oportunidades." },
    { number: "04", title: "Colabore e cresça", description: "Solicite participação, contribua com projetos e construa seu histórico acadêmico." },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#24B68E]/10 text-[#24B68E] text-sm font-700 mb-4">
            <CheckCircle className="w-3.5 h-3.5" />
            Como Funciona
          </span>
          <h2 className="text-3xl lg:text-4xl font-800 text-[#1F2937] mb-4">
            Simples, rápido e eficiente
          </h2>
          <p className="text-[#6B7280] text-lg max-w-xl mx-auto">
            Em poucos passos, você está conectado ao ecossistema de inovação da FATEC Pompéia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.number} className={`relative fade-up stagger-${i + 1}`}>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-[#E5E7EB] z-0" style={{ width: "calc(100% - 2rem)" }} />
              )}
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#24B68E] text-white font-900 text-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  {step.number}
                </div>
                <h3 className="font-700 text-[#1F2937] text-base mb-2">{step.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────
function CTASection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="section-padding" style={{ backgroundColor: "#24B68E" }}>
      <div className="container text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-800 text-white mb-4">
            Pronto para fazer parte da inovação?
          </h2>
          <p className="text-white/80 text-lg mb-8 leading-relaxed">
            Junte-se à comunidade Nexus Academic e conecte-se a projetos de PD&I que transformam o campus da FATEC Pompéia.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={isAuthenticated ? "/projetos" : "/registro"}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#24B68E] rounded-full font-700 text-sm shadow-lg hover:bg-[#F9FAFB] transition-all duration-200 active:scale-[0.97]"
            >
              {isAuthenticated ? "Ver Projetos" : "Criar Conta Grátis"}
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/sobre"
              className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-white/40 text-white rounded-full font-700 text-sm hover:bg-white/10 transition-all duration-200 active:scale-[0.97]"
            >
              Conhecer o Projeto
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <AppLayout transparentNav hideFooter={false}>
      <HeroSection />
      <FeatureCards />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
    </AppLayout>
  );
}
