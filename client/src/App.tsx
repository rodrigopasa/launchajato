import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import TaskDetail from "@/pages/TaskDetail";
import Tasks from "@/pages/Tasks";
import Team from "@/pages/Team";
import Files from "@/pages/Files";
import Communication from "@/pages/Communication";
import Settings from "@/pages/Settings";
import Reports from "@/pages/Reports";
import ChatbotSettings from "@/pages/ChatbotSettings";
import Integrations from "@/pages/Integrations";
import Search from "@/pages/Search";
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import SuperAdmin from "@/pages/SuperAdmin";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { AnimatePresence, motion } from "framer-motion";
import { transitions } from "./lib/animations";

// Componente de transição de página
function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={transitions.default}
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Se estiver carregando, não faz nada ainda
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirecionamento baseado na autenticação
  if (isAuthenticated && (location === "/" || location === "/login" || location === "/register")) {
    setLocation("/dashboard");
    return null;
  }

  const publicPaths = ["/", "/login", "/register", "/checkout", "/payment-success"];
  if (!isAuthenticated && !publicPaths.includes(location)) {
    setLocation("/login");
    return null;
  }

  // Renderizar páginas públicas
  if (publicPaths.includes(location)) {
    return (
      <AnimatePresence mode="wait">
        <Switch location={location} key={location}>
          <Route path="/">
            <PageTransition>
              <LandingPage />
            </PageTransition>
          </Route>
          <Route path="/login">
            <PageTransition>
              <Login />
            </PageTransition>
          </Route>
          <Route path="/register">
            <PageTransition>
              <Register />
            </PageTransition>
          </Route>
          <Route path="/checkout">
            <PageTransition>
              <Checkout />
            </PageTransition>
          </Route>
          <Route path="/payment-success">
            <PageTransition>
              <PaymentSuccess />
            </PageTransition>
          </Route>
        </Switch>
      </AnimatePresence>
    );
  }
  
  // Renderizar páginas protegidas
  return (
    <MainLayout>
      <AnimatePresence mode="wait">
        <Switch location={location} key={location}>
          <Route path="/dashboard">
            <PageTransition>
              <Dashboard />
            </PageTransition>
          </Route>
          <Route path="/projects">
            <PageTransition>
              <Projects />
            </PageTransition>
          </Route>
          <Route path="/projects/:id">
            <PageTransition>
              <ProjectDetail />
            </PageTransition>
          </Route>
          <Route path="/tasks">
            <PageTransition>
              <Tasks />
            </PageTransition>
          </Route>
          <Route path="/tasks/:id">
            <PageTransition>
              <TaskDetail />
            </PageTransition>
          </Route>
          <Route path="/team">
            <PageTransition>
              <Team />
            </PageTransition>
          </Route>
          <Route path="/files">
            <PageTransition>
              <Files />
            </PageTransition>
          </Route>
          <Route path="/communication">
            <PageTransition>
              <Communication />
            </PageTransition>
          </Route>
          <Route path="/reports">
            <PageTransition>
              <Reports />
            </PageTransition>
          </Route>
          <Route path="/settings">
            <PageTransition>
              <Settings />
            </PageTransition>
          </Route>
          <Route path="/chatbot">
            <PageTransition>
              <ChatbotSettings />
            </PageTransition>
          </Route>
          <Route path="/integrations">
            <PageTransition>
              <Integrations />
            </PageTransition>
          </Route>
          <Route path="/search">
            <PageTransition>
              <Search />
            </PageTransition>
          </Route>
          <Route path="/admin">
            <PageTransition>
              <SuperAdmin />
            </PageTransition>
          </Route>
          <Route>
            <PageTransition>
              <NotFound />
            </PageTransition>
          </Route>
        </Switch>
      </AnimatePresence>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <SidebarProvider>
            <AppRoutes />
            <Toaster />
          </SidebarProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
