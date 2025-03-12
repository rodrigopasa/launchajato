
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { Menu, Bell, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function MobileNavbar() {
  const { user } = useAuth();
  const { toggleMobileOpen, mobileOpen } = useSidebar();

  return (
    <div className="md:hidden bg-gray-900 text-white w-full h-16 fixed top-0 left-0 z-30 flex items-center justify-between px-4 shadow-md">
      <div className="flex items-center">
        <button
          onClick={toggleMobileOpen}
          className="text-gray-400 hover:text-white mr-3 p-2 rounded-md transition-colors"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
        <h1 className="text-xl font-semibold">LaunchPro</h1>
      </div>
      <div className="flex items-center">
        <button 
          className="text-gray-400 hover:text-white mr-4 relative p-2 rounded-md transition-colors" 
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        {user && (
          <Avatar className="border-2 border-gray-700">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary text-white">
              {user.name?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
