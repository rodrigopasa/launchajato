
import React from "react";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export function SidebarBackdrop() {
  const { mobile, mobileOpen, setMobileOpen } = useSidebar();

  if (!mobile) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/50 z-30 transition-opacity duration-300",
        mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={() => setMobileOpen(false)}
      aria-hidden="true"
    />
  );
}
