import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarContextType {
  collapsed: boolean;
  mobile: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  toggleMobileOpen: () => void;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  mobile: false,
  mobileOpen: false,
  toggleCollapsed: () => {},
  toggleMobileOpen: () => {},
  setMobileOpen: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Close mobile sidebar when switching to desktop
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile, mobileOpen]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => !prev);
  };

  const toggleMobileOpen = () => {
    setMobileOpen((prev) => !prev);
  };

  const value = {
    collapsed,
    mobile: isMobile,
    mobileOpen,
    toggleCollapsed,
    toggleMobileOpen,
    setMobileOpen,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};
