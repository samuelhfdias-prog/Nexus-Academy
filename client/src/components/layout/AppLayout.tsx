import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface AppLayoutProps {
  children: ReactNode;
  transparentNav?: boolean;
  hideFooter?: boolean;
}

export function AppLayout({ children, transparentNav = false, hideFooter = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar transparent={transparentNav} />
      <main className={`flex-1 flex flex-col ${transparentNav ? "" : "pt-[72px] lg:pt-[88px]"}`}>
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
