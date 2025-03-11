import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { Menu, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MobileNavbar() {
  const { user } = useAuth();
  const { toggleMobileOpen } = useSidebar();

  return (
    <div className="md:hidden bg-gray-900 text-white w-full h-16 fixed top-0 left-0 z-30 flex items-center justify-between px-4">
      <div className="flex items-center">
        <button
          onClick={toggleMobileOpen}
          className="text-gray-400 hover:text-white mr-3"
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold">LaunchPro</h1>
      </div>
      <div className="flex items-center">
        <button className="text-gray-400 hover:text-white mr-3" aria-label="Notificações">
          <Bell className="h-5 w-5" />
        </button>
        {user && (
          <Avatar>
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
