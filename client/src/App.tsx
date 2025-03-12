import React, { useEffect } from "react";
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
import SuperAdmin from "@/pages/admin";
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
  const publicPaths = ["/", "/login", "/register", "/checkout", "/payment-success"];
  
  // Usar useEffect para redirecionamentos para evitar alterações de estado durante a renderização
  useEffect(() => {
    // Redirecionamento baseado na autenticação
    if (isAuthenticated && (location === "/" || location === "/login" || location === "/register")) {
      setLocation("/dashboard");
    } else if (!isAuthenticated && !publicPaths.includes(location)) {
      setLocation("/login");
    }
  }, [isAuthenticated, location, publicPaths, setLocation]);

  // Se estiver carregando, não faz nada ainda
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
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
          <Route>
            <PageTransition>
              <NotFound />
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
              {/* Protegendo a rota de Integrações, permitindo apenas usuários com função 'admin' */}
              {useAuth().user?.role === 'admin' ? (
                <Integrations />
              ) : (
                <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
                  <div className="text-red-400 text-6xl mb-4">⚠️</div>
                  <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
                  <p className="text-slate-400 mb-6 text-center">
                    Você não tem permissão para acessar esta página. É necessário ser um administrador.
                  </p>
                  <button 
                    onClick={() => window.history.back()} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Voltar
                  </button>
                </div>
              )}
            </PageTransition>
          </Route>
          <Route path="/search">
            <PageTransition>
              <Search />
            </PageTransition>
          </Route>
          <Route path="/admin">
            <PageTransition>
              {/* Protegendo a rota SuperAdmin, permitindo apenas usuários com função 'admin' */}
              {useAuth().user?.role === 'admin' ? (
                <SuperAdmin />
              ) : (
                <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
                  <div className="text-red-400 text-6xl mb-4">⚠️</div>
                  <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
                  <p className="text-slate-400 mb-6 text-center">
                    Você não tem permissão para acessar esta página. É necessário ser um administrador.
                  </p>
                  <button 
                    onClick={() => window.history.back()} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Voltar
                  </button>
                </div>
              )}
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