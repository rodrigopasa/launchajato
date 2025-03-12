
import React from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import MobileNavbar from "./MobileNavbar";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { SidebarBackdrop } from "./SidebarBackdrop";
import { motion } from "framer-motion";

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
        <Sidebar />
        <SidebarBackdrop />
        <MobileNavbar />
        <motion.main 
          className="flex-1 overflow-y-auto p-4 md:p-6 pt-20 md:pt-6 pb-16 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </SidebarProvider>
  );
}
