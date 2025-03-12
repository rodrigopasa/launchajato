
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNavbar from "./MobileNavbar";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { SidebarBackdrop } from "./SidebarBackdrop";

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <SidebarBackdrop />
        <MobileNavbar />
        <main className="flex-1 overflow-auto p-4 md:p-6 pt-16 md:pt-6">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
