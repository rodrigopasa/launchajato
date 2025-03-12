
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { Menu, X, Home, LayoutPanelLeft, CheckSquare, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { transitions } from "@/lib/animations";
import NotificationCenter from "@/components/notifications/NotificationCenter";

export default function MobileNavbar() {
  const { user, logout } = useAuth();
  const { toggleMobileOpen, mobileOpen } = useSidebar();
  const [location] = useLocation();

  return (
    <>
      {/* Top navbar */}
      <motion.div 
        className="md:hidden bg-gray-900 text-white w-full h-16 fixed top-0 left-0 z-30 flex items-center justify-between px-4 shadow-md"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={transitions.spring}
      >
        <div className="flex items-center">
          <motion.button
            onClick={toggleMobileOpen}
            className="text-gray-400 hover:text-white mr-3 p-2 rounded-md transition-colors"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mobileOpen ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {mobileOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.button>
          <h1 className="text-xl font-semibold">LaunchRocket</h1>
        </div>
        <div className="flex items-center">
          <div className="text-white mr-2">
            <NotificationCenter />
          </div>
          {user && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Avatar className="border-2 border-gray-700">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary text-white">
                  {user.name?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Bottom navigation */}
      <motion.div 
        className="md:hidden bg-gray-900 text-white w-full h-16 fixed bottom-0 left-0 z-30 flex items-center justify-around px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={transitions.spring}
      >
        <Link href="/">
          <motion.div 
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg",
              location === "/" ? "text-primary" : "text-gray-400"
            )}
            whileTap={{ scale: 0.9 }}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Início</span>
          </motion.div>
        </Link>
        
        <Link href="/projects">
          <motion.div 
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg",
              location.startsWith("/projects") ? "text-primary" : "text-gray-400"
            )}
            whileTap={{ scale: 0.9 }}
          >
            <LayoutPanelLeft className="h-6 w-6" />
            <span className="text-xs mt-1">Projetos</span>
          </motion.div>
        </Link>

        <Link href="/tasks">
          <motion.div 
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg",
              location.startsWith("/tasks") ? "text-primary" : "text-gray-400"
            )}
            whileTap={{ scale: 0.9 }}
          >
            <CheckSquare className="h-6 w-6" />
            <span className="text-xs mt-1">Tarefas</span>
          </motion.div>
        </Link>

        <motion.div 
          className="flex flex-col items-center justify-center p-2 rounded-lg text-gray-400"
          whileTap={{ scale: 0.9 }}
          onClick={() => logout()}
        >
          <LogOut className="h-6 w-6" />
          <span className="text-xs mt-1">Sair</span>
        </motion.div>
      </motion.div>
    </>
  );
}
