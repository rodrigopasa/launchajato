
import React from "react";
import { Route, Switch } from "wouter";
import Sidebar from "./Sidebar";
import MobileNavbar from "./MobileNavbar";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { SidebarBackdrop } from "./SidebarBackdrop";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";

// Importando as páginas
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Tasks from "@/pages/Tasks";
import TaskDetail from "@/pages/TaskDetail";
import Team from "@/pages/Team";
import Files from "@/pages/Files";
import Communication from "@/pages/Communication";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import ChatbotSettings from "@/pages/ChatbotSettings";
import Integrations from "@/pages/Integrations";
import NotFound from "@/pages/not-found";

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
        <Sidebar />
        <SidebarBackdrop />
        <MobileNavbar />
        <motion.main 
          className="flex-1 overflow-y-auto p-4 md:p-6 pt-20 md:pt-6 pb-20 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/projects" component={Projects} />
                <Route path="/projects/:id" component={ProjectDetail} />
                <Route path="/tasks" component={Tasks} />
                <Route path="/tasks/:id" component={TaskDetail} />
                <Route path="/team" component={Team} />
                <Route path="/files" component={Files} />
                <Route path="/communication" component={Communication} />
                <Route path="/reports" component={Reports} />
                <Route path="/settings" component={Settings} />
                <Route path="/chatbot" component={ChatbotSettings} />
                <Route path="/integrations" component={Integrations} />
                <Route component={NotFound} />
              </Switch>
            </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </SidebarProvider>
  );
}
