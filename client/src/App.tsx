import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
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
import { AuthProvider } from "./contexts/AuthContext";
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

function Router() {
  const [location] = useLocation();
  
  return (
    <MainLayout>
      <AnimatePresence mode="wait">
        <Switch location={location} key={location}>
          <Route path="/">
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
            <Router />
            <Toaster />
          </SidebarProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
