import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
// import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
  Search,
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
      <motion.div
        className={cn(
          "flex items-center px-4 py-3 text-gray-300 rounded-lg mb-1 cursor-pointer relative overflow-hidden group",
          active ? "bg-gray-800" : "hover:bg-gray-800"
        )}
        whileHover={{ x: 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {/* Efeito de brilho espacial nos itens ativos */}
        {active && (
          <motion.div 
            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 via-blue-500 to-indigo-500"
            layoutId="activeNavIndicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
        
        {/* Hover effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100"
          initial={{ opacity: 0, x: -100 }}
          whileHover={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        />
        
        <motion.span 
          className="w-5 h-5 relative z-10 text-blue-400"
          whileHover={{ scale: 1.2, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {icon}
        </motion.span>
        
        {!collapsed && (
          <motion.span 
            className="ml-3 relative z-10"
            initial={{ opacity: 1 }}
            whileHover={{ x: 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {children}
          </motion.span>
        )}
      </motion.div>
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
        <div className="p-4 flex items-center justify-between border-b border-gray-800 relative overflow-hidden">
          {/* Efeito de fundo espacial */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-transparent pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.1, 0.2, 0.1],
              x: [-20, 0, -20]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Partículas de estrela no header */}
          {!collapsed && Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-px h-px bg-white rounded-full pointer-events-none"
              initial={{ 
                x: Math.random() * 100, 
                y: Math.random() * 40,
                opacity: 0
              }}
              animate={{ 
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeInOut"
              }}
              style={{
                boxShadow: "0 0 3px 1px rgba(255,255,255,0.5)"
              }}
            />
          ))}
          
          {!collapsed && (
            <motion.div 
              className="flex items-center"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.h1 
                className="text-xl font-semibold flex items-center"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {organizationLogo ? (
                  <img 
                    src={organizationLogo} 
                    alt="Logo" 
                    className="h-8 mr-2"
                  />
                ) : (
                  <div className="flex items-center">
                    <motion.span 
                      className="text-blue-400 mr-1"
                      animate={{
                        rotate: [0, 5, 0, -5, 0],
                        y: [0, -2, 0, 2, 0]
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      🚀
                    </motion.span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-sky-300">
                      {organizationName}
                    </span>
                  </div>
                )}
              </motion.h1>
            </motion.div>
          )}
          
          <motion.button
            onClick={toggleCollapsed}
            className="relative text-blue-400 hover:text-blue-300 p-1 hover:bg-gray-800 rounded-full z-10"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            whileHover={{ scale: 1.2, rotate: collapsed ? -90 : 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform duration-300",
                collapsed && "rotate-180"
              )}
            />
            
            {/* Efeito de brilho */}
            <motion.div
              className="absolute inset-0 rounded-full bg-blue-400/20 blur-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ 
                opacity: 0.8, 
                scale: 1.2,
                rotate: 90
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
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
                href="/search"
                icon={<Search className="h-5 w-5" />}
                active={location.startsWith("/search")}
                collapsed={collapsed}
              >
                Busca Avançada
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
                <>
                  <NavItem
                    href="/integrations"
                    icon={<Link2 className="h-5 w-5" />}
                    active={location.startsWith("/integrations")}
                    collapsed={collapsed}
                  >
                    Integrações
                  </NavItem>
                  <NavItem
                    href="/admin"
                    icon={<Shield className="h-5 w-5" />}
                    active={location.startsWith("/admin")}
                    collapsed={collapsed}
                  >
                    Super Admin
                  </NavItem>
                </>
              )}
            </nav>
          </div>

          {!collapsed && (
            <div className="px-4 py-2 mt-6">
              <motion.p 
                className="text-xs uppercase tracking-wider text-gray-500 mb-2 flex items-center"
                initial={{ opacity: 0.7 }}
                whileHover={{ opacity: 1, x: 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <motion.span
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                >
                  ✨
                </motion.span>
                <span className="ml-1">Projetos recentes</span>
              </motion.p>
              
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
                      scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <Loader2 className="h-5 w-5 text-blue-400" />
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
                >
                  {recentProjects.map((project: any, index: number) => (
                    <motion.div 
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }}
                    >
                      <Link href={`/projects/${project.id}`}>
                        <motion.div 
                          className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg mb-1 text-sm cursor-pointer relative overflow-hidden group"
                          whileHover={{ 
                            x: 3,
                            backgroundColor: "rgba(30, 41, 59, 0.5)"
                          }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          {/* Efeito de fundo ao passar o mouse */}
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100"
                            initial={{ opacity: 0, x: -100 }}
                            whileHover={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                          />
                          
                          <motion.span
                            className={cn(
                              "w-2 h-2 rounded-full mr-2 relative z-10",
                              project.status === "completed"
                                ? "bg-green-500"
                                : project.status === "in_progress"
                                ? "bg-blue-500"
                                : project.status === "testing"
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                            )}
                            whileHover={{ scale: 1.5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            {/* Pulse effect for ongoing projects */}
                            {project.status === "in_progress" && (
                              <motion.span
                                className="absolute inset-0 rounded-full bg-blue-400"
                                initial={{ opacity: 0.5, scale: 1 }}
                                animate={{ 
                                  opacity: [0.7, 0, 0.7],
                                  scale: [1, 2, 1]
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                            )}
                          </motion.span>
                          
                          <motion.span 
                            className="truncate relative z-10"
                            whileHover={{ x: 2 }}
                            transition={{ type: "spring" }}
                          >
                            {project.name}
                          </motion.span>
                        </motion.div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {user && (
          <div className="absolute bottom-0 w-full border-t border-gray-800">
            <div className="px-4 py-4">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center cursor-pointer relative group"
                onClick={() => {
                  if (collapsed) {
                    toggleCollapsed();
                  }
                }}
              >
                <div className="relative">
                  <Avatar className="border-2 border-transparent group-hover:border-blue-400 transition-all duration-300">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-sky-600 text-white">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: [0.8, 1, 0.8],
                      opacity: [0, 0.15, 0] 
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 rounded-full bg-blue-400 blur-md -z-10"
                  />
                  
                  <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white transform translate-y-1 translate-x-1" />
                </div>
                
                {!collapsed && (
                  <div className="ml-3 flex-grow">
                    <motion.p 
                      className="text-sm font-medium truncate"
                      initial={{ x: 0 }}
                      whileHover={{ x: 3 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {user.name}
                    </motion.p>
                    <motion.p 
                      className="text-xs text-gray-500 truncate"
                      initial={{ x: 0 }}
                      whileHover={{ x: 3 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {user.role === 'admin' ? 'Administrador' : 
                       user.role === 'manager' ? 'Gerente' : 'Membro'}
                    </motion.p>
                  </div>
                )}
                
                {!collapsed && (
                  <div className="dropdown-wrapper relative">
                    <Link href="/settings">
                      <motion.button 
                        className="ml-auto text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded-full"
                        whileHover={{ rotate: 90 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <Settings className="h-5 w-5" />
                      </motion.button>
                    </Link>
                    
                    {/* Indicador de dropdown */}
                    <div className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
                      <motion.div 
                        className="h-10 w-0.5 bg-gray-700 absolute bottom-full mb-1"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                      />
                    </div>
                    
                    {/* Menu dropdown escondido - pode ser desenvolvido mais adiante */}
                    <div className="hidden group-hover:block absolute bottom-full mb-2 right-0 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
                        <Link href="/settings">
                          <span className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer">
                            Configurações
                          </span>
                        </Link>
                        <Link href="/settings/profile">
                          <span className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer">
                            Meu Perfil
                          </span>
                        </Link>
                        <hr className="border-gray-700 my-1" />
                        <Link href="/api/auth/logout">
                          <span className="block px-4 py-2 text-sm text-red-400 hover:bg-gray-700 cursor-pointer">
                            Sair do sistema
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
