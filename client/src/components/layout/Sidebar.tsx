import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
// import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  LayoutPanelLeft,
  CheckSquare,
  Users,
  FileText,
  MessageSquare,
  Settings,
  ChevronLeft,
  Loader2,
  BarChart,
  MessagesSquare,
  Link2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  collapsed?: boolean;
}

const NavItem = ({ href, icon, children, active, collapsed }: NavItemProps) => {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center px-4 py-3 text-gray-300 rounded-lg mb-1 transition-colors cursor-pointer",
          active ? "bg-gray-800" : "hover:bg-gray-800"
        )}
      >
        <span className="w-5 h-5">{icon}</span>
        {!collapsed && <span className="ml-3">{children}</span>}
      </div>
    </Link>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { collapsed, mobile, mobileOpen, toggleCollapsed, setMobileOpen } = useSidebar();
  // Usar dados hardcoded para simplificar
  const organizationName = "LaunchRocket";
  const organizationLogo = null;

  // Fetch recent projects
  const { data: projects, isLoading } = useQuery<any[]>({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  const recentProjects = Array.isArray(projects) ? projects.slice(0, 3) : [];

  return (
    <>
      {/* Overlay for mobile */}
      {mobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      <aside
        className={cn(
          "bg-gray-900 text-white flex-shrink-0 fixed lg:relative z-40 h-full",
          collapsed && !mobile ? "w-20" : "w-64",
          mobile ? (mobileOpen ? "left-0" : "-left-64") : "left-0",
          "transition-all duration-300 ease-in-out",
          mobile && "shadow-xl"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          {!collapsed && (
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">
                {organizationLogo ? (
                  <img 
                    src={organizationLogo} 
                    alt="Logo" 
                    className="h-8 mr-2"
                  />
                ) : (
                  organizationName
                )}
              </h1>
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            className="text-gray-400 hover:text-white p-1"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <ChevronLeft
              className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")}
            />
          </button>
        </div>

        <div className="py-4 h-[calc(100%-8rem)] overflow-y-auto">
          <div className="px-4 py-2">
            {!collapsed && (
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Menu</p>
            )}
            <nav>
              <NavItem
                href="/"
                icon={<Home className="h-5 w-5" />}
                active={location === "/"}
                collapsed={collapsed}
              >
                Dashboard
              </NavItem>
              <NavItem
                href="/projects"
                icon={<LayoutPanelLeft className="h-5 w-5" />}
                active={location.startsWith("/projects")}
                collapsed={collapsed}
              >
                Projetos
              </NavItem>
              <NavItem
                href="/tasks"
                icon={<CheckSquare className="h-5 w-5" />}
                active={location.startsWith("/tasks")}
                collapsed={collapsed}
              >
                Tarefas
              </NavItem>
              <NavItem
                href="/team"
                icon={<Users className="h-5 w-5" />}
                active={location.startsWith("/team")}
                collapsed={collapsed}
              >
                Equipe
              </NavItem>
              <NavItem
                href="/files"
                icon={<FileText className="h-5 w-5" />}
                active={location.startsWith("/files")}
                collapsed={collapsed}
              >
                Arquivos
              </NavItem>
              <NavItem
                href="/communication"
                icon={<MessageSquare className="h-5 w-5" />}
                active={location.startsWith("/communication")}
                collapsed={collapsed}
              >
                Comunicação
              </NavItem>
              <NavItem
                href="/reports"
                icon={<BarChart className="h-5 w-5" />}
                active={location.startsWith("/reports")}
                collapsed={collapsed}
              >
                Relatórios
              </NavItem>
              <NavItem
                href="/settings"
                icon={<Settings className="h-5 w-5" />}
                active={location.startsWith("/settings")}
                collapsed={collapsed}
              >
                Configurações
              </NavItem>
              <NavItem
                href="/chatbot"
                icon={<MessagesSquare className="h-5 w-5" />}
                active={location.startsWith("/chatbot")}
                collapsed={collapsed}
              >
                WhatsApp ChatBot
              </NavItem>
              {user?.role === 'admin' && (
                <NavItem
                  href="/integrations"
                  icon={<Link2 className="h-5 w-5" />}
                  active={location.startsWith("/integrations")}
                  collapsed={collapsed}
                >
                  Integrações
                </NavItem>
              )}
            </nav>
          </div>

          {!collapsed && (
            <div className="px-4 py-2 mt-6">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                Projetos recentes
              </p>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  {recentProjects.map((project: any) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg mb-1 text-sm cursor-pointer">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full mr-2",
                            project.status === "completed"
                              ? "bg-green-500"
                              : project.status === "in_progress"
                              ? "bg-blue-500"
                              : project.status === "testing"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                          )}
                        ></span>
                        <span className="truncate">{project.name}</span>
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {user && (
          <div className="absolute bottom-0 w-full border-t border-gray-800">
            <div className="px-4 py-4">
              <div className="flex items-center">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="ml-3">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.role}</p>
                  </div>
                )}
                {!collapsed && (
                  <button className="ml-auto text-gray-400 hover:text-white">
                    <Settings className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
