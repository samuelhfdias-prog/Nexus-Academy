import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectForm from "./pages/ProjectForm";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Skills from "./pages/Skills";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MinhasPropostas from "./pages/MinhasPropostas";
import ProjectApprovals from "./pages/ProjectApprovals";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/projetos" component={Projects} />
      <Route path="/sobre" component={About} />
      <Route path="/competencias" component={Skills} />
      <Route path="/login" component={Login} />
      <Route path="/registro" component={Register} />

      {/* IMPORTANT: rotas estáticas /projetos/* devem vir ANTES de /projetos/:id
          para que o wouter não capture "novo" e "editar" como parâmetros dinâmicos */}
      <Route path="/projetos/novo">
        <ProtectedRoute allowedRoles={["professor", "admin"]}>
          <ProjectForm />
        </ProtectedRoute>
      </Route>
      <Route path="/projetos/:id/editar" component={ProjectForm} />

      {/* Rota dinâmica — deve ficar APÓS as estáticas */}
      <Route path="/projetos/:id" component={ProjectDetail} />

      {/* Protected: any authenticated user */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/perfil">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>

      {/* Protected: aluno only – gerenciar propostas */}
      <Route path="/minhas-propostas">
        <ProtectedRoute allowedRoles={["aluno"]}>
          <MinhasPropostas />
        </ProtectedRoute>
      </Route>

      {/* Protected: professor or admin – revisão de propostas */}
      <Route path="/aprovacoes">
        <ProtectedRoute allowedRoles={["professor", "admin"]}>
          <ProjectApprovals />
        </ProtectedRoute>
      </Route>

      {/* Protected: admin only */}
      <Route path="/admin">
        <ProtectedRoute allowedRoles={["admin"]}>
          <Admin />
        </ProtectedRoute>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
