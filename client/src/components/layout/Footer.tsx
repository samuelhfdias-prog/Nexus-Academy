import { Logo } from "@/components/Logo";
import { Link } from "wouter";
import {  Mail, MapPin, Github, Linkedin } from "lucide-react";

const FOOTER_LINKS = {
  plataforma: [
    { href: "/projetos", label: "Projetos" },
    { href: "/competencias", label: "Competências" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/sobre", label: "Sobre o Nexus" },
  ],
  recursos: [
    { href: "/sobre#metodologia", label: "Metodologia" },
    { href: "/sobre#objetivos", label: "Objetivos" },
    { href: "/sobre#equipe", label: "Equipe" },
  ],
};

export function Footer() {
  return (
    <footer style={{ backgroundColor: "#0F1624" }} className="text-white">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="w-9 h-9 rounded-xl bg-[#24B68E] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                <Logo className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-xl text-white">
                Nexus<span className="text-white/50">_</span>
                <span className="text-[#38C69F]">Academic</span>
              </span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm mb-6">
              Plataforma integrada para gestão e visibilidade de projetos de Pesquisa, Desenvolvimento e Inovação (PD&I) no campus da FATEC Pompéia.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#24B68E] transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#24B68E] transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="mailto:nexus@fatec.sp.gov.br"
                className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#24B68E] transition-colors duration-200"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>

            <div className="mt-8">
              <p className="font-700 text-xs uppercase tracking-wider text-white/40 mb-3">Patrocínio Institucional</p>
              <img src="/images/fatec-patrocinador.png" alt="FATEC Pompéia" className="h-10 object-contain brightness-0 invert opacity-70 hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="font-700 text-sm uppercase tracking-wider text-white/40 mb-4">Plataforma</h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.plataforma.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-[#38C69F] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-700 text-sm uppercase tracking-wider text-white/40 mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#24B68E] mt-0.5 shrink-0" />
                <span className="text-sm text-white/60">
                  FATEC Pompéia - Shunji Nishimura<br />
                  Av. Prefeito Fábio Marques, 313<br />
                  Pompéia - SP
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#24B68E] shrink-0" />
                <a
                  href="mailto:nexus@fatec.sp.gov.br"
                  className="text-sm text-white/60 hover:text-[#38C69F] transition-colors"
                >
                  nexus@fatec.sp.gov.br
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Nexus Academic · FATEC Pompéia · Todos os direitos reservados
          </p>
          <p className="text-xs text-white/30">
            Projeto Integrador de Sistemas Inteligentes II · 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
