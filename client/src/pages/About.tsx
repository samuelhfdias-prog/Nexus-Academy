import { Logo } from "@/components/Logo";
import {  Target, Users, Lightbulb, Globe, Award, CheckCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function About() {
  const objectives = [
    "Centralizar informações sobre projetos de PD&I em andamento no campus",
    "Facilitar a conexão entre alunos interessados e projetos que precisam de colaboradores",
    "Promover visibilidade para as iniciativas de pesquisa e inovação",
    "Criar um histórico acadêmico digital de participações e competências",
    "Apoiar a gestão institucional de projetos de forma transparente",
  ];

  const team = [
    { name: "Equipe de Desenvolvimento", role: "Sistemas Inteligentes II · 2026", initials: "SI" },
    { name: "FATEC Pompéia", role: "Faculdade de Tecnologia", initials: "FT" },
    { name: "Orientação Acadêmica", role: "Corpo Docente FATEC", initials: "OA" },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-white">
        {/* Hero */}
        <div style={{ backgroundColor: "#24B68E" }} className="pt-8 pb-24 relative overflow-hidden">
          <div className="container relative z-10 text-center">
            <div className="h-16" />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white/90 text-sm font-700 mb-4">
              <Logo className="w-3.5 h-3.5" />
              Projeto Integrador · FATEC Pompéia
            </div>
            <h1 className="text-4xl font-800 text-white mb-4">Sobre o Nexus Academic</h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed">
              Uma plataforma desenvolvida para conectar a comunidade acadêmica da FATEC Pompéia ao ecossistema de Pesquisa, Desenvolvimento e Inovação.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-10">
              <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="white" />
            </svg>
          </div>
        </div>

        {/* Sobre */}
        <section className="section-padding">
          <div className="container max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F3F9F6] text-[#24B68E] text-sm font-700 mb-4">
                  <Lightbulb className="w-3.5 h-3.5" /> O Projeto
                </span>
                <h2 className="text-2xl font-800 text-[#1F2937] mb-4">
                  Gestão inteligente de PD&I acadêmica
                </h2>
                <p className="text-[#4B5563] leading-relaxed mb-4">
                  O Nexus Academic nasceu como Projeto Integrador da disciplina de Sistemas Inteligentes II da FATEC Pompéia — Shunji Nishimura, com o objetivo de criar uma solução digital para os desafios de visibilidade e gestão dos projetos de PD&I no campus.
                </p>
                <p className="text-[#4B5563] leading-relaxed">
                  A plataforma conecta alunos, professores e administradores num ambiente organizado, permitindo que projetos de pesquisa ganhem visibilidade e que alunos encontrem oportunidades alinhadas às suas competências.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Globe, title: "Visibilidade", desc: "Projetos acessíveis a toda a comunidade" },
                  { icon: Users, title: "Colaboração", desc: "Conexão entre alunos e projetos" },
                  { icon: Award, title: "Competências", desc: "Perfis acadêmicos completos" },
                  { icon: Target, title: "Gestão", desc: "Acompanhamento estruturado" },
                ].map((item) => (
                  <div key={item.title} className="bg-[#F3F9F6] rounded-2xl p-4">
                    <div className="w-10 h-10 rounded-xl bg-[#24B68E] flex items-center justify-center mb-3">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-700 text-[#1F2937] text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-[#6B7280]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Objectives */}
        <section id="objetivos" className="section-padding" style={{ backgroundColor: "#F3F9F6" }}>
          <div className="container max-w-3xl">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#24B68E]/10 text-[#24B68E] text-sm font-700 mb-4">
                <Target className="w-3.5 h-3.5" /> Objetivos
              </span>
              <h2 className="text-2xl font-800 text-[#1F2937]">O que o Nexus Academic busca alcançar</h2>
            </div>
            <div className="space-y-3">
              {objectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-[#E5E7EB]">
                  <div className="w-6 h-6 rounded-full bg-[#24B68E] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-sm text-[#4B5563] leading-relaxed">{obj}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section id="equipe" className="section-padding bg-white">
          <div className="container max-w-3xl">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F3F9F6] text-[#24B68E] text-sm font-700 mb-4">
                <Users className="w-3.5 h-3.5" /> Equipe
              </span>
              <h2 className="text-2xl font-800 text-[#1F2937]">Quem está por trás do Nexus</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {team.map((member) => (
                <div key={member.name} className="text-center bg-[#F9FAFB] rounded-2xl p-6 border border-[#E5E7EB]">
                  <div className="w-16 h-16 rounded-2xl bg-[#24B68E] text-white text-xl font-800 flex items-center justify-center mx-auto mb-3">
                    {member.initials}
                  </div>
                  <h3 className="font-700 text-[#1F2937] text-sm">{member.name}</h3>
                  <p className="text-xs text-[#6B7280] mt-1">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding" style={{ backgroundColor: "#24B68E" }}>
          <div className="container text-center">
            <h2 className="text-2xl font-800 text-white mb-4">Faça parte da inovação</h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Junte-se à plataforma e contribua para o ecossistema de PD&I da FATEC Pompéia.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#24B68E] rounded-full font-700 text-sm shadow-md hover:bg-[#F9FAFB] transition-all">
                Começar Agora
              </a>
              <Link href="/projetos" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/40 text-white rounded-full font-700 text-sm hover:bg-white/10 transition-all">
                Ver Projetos
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
