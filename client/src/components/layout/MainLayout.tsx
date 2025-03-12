import { ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useRouter } from "wouter";
import Sidebar from "./Sidebar";
import MobileNavbar from "./MobileNavbar";
import Footer from "./Footer";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Rocket, Lock, User } from "lucide-react";
import { useState, useRef, useEffect as useEffectHook } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Efeito de estrelas para a tela de login
const StarField = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<{ x: number; y: number; size: number; opacity: number; speed: number }[]>([]);

  useEffectHook(() => {
    if (!containerRef.current) return;
    
    const generateStars = () => {
      const width = containerRef.current?.clientWidth || window.innerWidth;
      const height = containerRef.current?.clientHeight || window.innerHeight;
      const newStars = [];
      
      for (let i = 0; i < 100; i++) {
        newStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.5 + 0.1
        });
      }
      
      setStars(newStars);
    };
    
    generateStars();
    window.addEventListener('resize', generateStars);
    
    return () => {
      window.removeEventListener('resize', generateStars);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          initial={{ x: star.x, y: star.y, opacity: 0 }}
          animate={{
            x: star.x,
            y: [star.y, star.y - 10, star.y],
            opacity: [0, star.opacity, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 5 / star.speed,
            repeat: Infinity,
            delay: i * 0.01,
            ease: "easeInOut"
          }}
          style={{
            width: star.size,
            height: star.size,
          }}
        />
      ))}
    </div>
  );
};

// Componente de Planeta
const Planet = ({ size, color, orbitDuration, distance, delay }: { 
  size: number, 
  color: string, 
  orbitDuration: number,
  distance: number,
  delay: number
}) => {
  return (
    <motion.div
      className="absolute rounded-full"
      initial={{ scale: 0 }}
      animate={{ 
        scale: 1,
        rotate: 360
      }}
      transition={{
        rotate: {
          duration: orbitDuration,
          repeat: Infinity,
          ease: "linear",
          delay
        },
        scale: {
          duration: 1,
          delay
        }
      }}
      style={{
        width: 2 * distance,
        height: 2 * distance,
        border: '1px dashed rgba(255, 255, 255, 0.2)',
        borderRadius: '50%'
      }}
    >
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          boxShadow: `0 0 10px 2px ${color}`,
          top: 0,
          left: "50%",
          marginLeft: -size / 2,
          marginTop: -size / 2
        }}
      />
    </motion.div>
  );
};

interface MainLayoutProps {
  children: ReactNode;
}

interface LoginFormProps {
  onSubmit: (username: string, password: string) => Promise<void>;
  isLoading: boolean;
}

function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username || !password) {
      setError("Preencha todos os campos");
      return;
    }
    
    try {
      await onSubmit(username, password);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-6 relative z-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-2 rounded-lg bg-red-50 border border-red-200"
        >
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </motion.div>
      )}
      
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Label htmlFor="username" className="text-slate-700 font-medium">Nome de usuário</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
            <User size={18} />
          </div>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Seu nome de usuário"
            disabled={isLoading}
            className="pl-10 bg-slate-50 border-slate-200 focus:border-blue-400"
          />
        </div>
      </motion.div>
      
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Label htmlFor="password" className="text-slate-700 font-medium">Senha</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
            <Lock size={18} />
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            disabled={isLoading}
            className="pl-10 bg-slate-50 border-slate-200 focus:border-blue-400"
          />
        </div>
        <motion.p 
          className="text-xs text-gray-500 ml-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.5 }}
        >
          Use admin/admin123 para o usuário padrão
        </motion.p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Button 
          type="submit" 
          className="w-full relative group overflow-hidden"
          disabled={isLoading}
        >
          <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-12 bg-gradient-to-r from-blue-500 to-teal-400 group-hover:translate-x-full group-hover:scale-102 -z-10"></span>
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-sky-500 -z-10"></span>
          <span className="absolute top-0 left-0 w-full h-full transform -translate-y-full bg-gradient-to-b from-transparent to-white opacity-30 group-hover:translate-y-0 transition-transform duration-300 z-0"></span>
          
          <span className="relative z-10 flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin text-white" />
            ) : (
              <Rocket className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
            )}
            Entrar no Sistema
          </span>
        </Button>
      </motion.div>
    </motion.form>
  );
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, isLoading, isAuthenticated, login } = useAuth();
  const { mobile, collapsed } = useSidebar();
  const [location, setLocation] = useLocation();

  // Protected routes logic
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Authentication is handled by the login modal
    }
  }, [isLoading, isAuthenticated, location, setLocation]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-slate-900 to-blue-900">
        <div className="relative">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="text-sky-400"
          >
            <Rocket size={50} />
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-full bg-sky-400 opacity-20 blur-xl"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.3, 0.2]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={!isAuthenticated} modal>
        <DialogContent className="sm:max-w-[475px] p-0 overflow-hidden bg-gradient-to-b from-slate-800 to-blue-900 border-none">
          <div className="relative py-8 px-6 overflow-hidden">
            <StarField />
            
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Planet size={8} color="#4ade80" orbitDuration={20} distance={60} delay={0.2} />
              <Planet size={12} color="#60a5fa" orbitDuration={30} distance={90} delay={0.3} />
              <Planet size={6} color="#f472b6" orbitDuration={15} distance={120} delay={0.1} />
            </div>
            
            <motion.div 
              className="relative z-10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <DialogHeader className="relative z-10">
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <Rocket 
                        size={40} 
                        className="text-white" 
                      />
                      <motion.div
                        className="absolute -bottom-2 -right-2 w-16 h-8 bg-blue-500 blur-xl rounded-full opacity-40"
                        initial={{ scale: 0.8, opacity: 0.2 }}
                        animate={{ 
                          scale: [0.8, 1.2, 0.8],
                          opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </div>
                  </div>
                  <DialogTitle className="text-2xl font-bold text-center text-white bg-clip-text bg-gradient-to-r from-blue-200 to-sky-400 mb-2">
                    LaunchRocket
                  </DialogTitle>
                  <DialogDescription className="text-center text-blue-100 max-w-xs mx-auto opacity-90">
                    Entre com suas credenciais para acessar o sistema de gerenciamento de lançamentos digitais.
                  </DialogDescription>
                </motion.div>
              </DialogHeader>
              
              <div className="mt-6 bg-white rounded-lg p-6 backdrop-blur-lg shadow-lg bg-opacity-10 border border-white border-opacity-20">
                <LoginForm onSubmit={login} isLoading={isLoading} />
              </div>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="h-screen flex overflow-hidden">
        <Sidebar />
        {mobile && <MobileNavbar />}
        <main
          className={cn(
            "flex-1 overflow-y-auto bg-gray-100 flex flex-col",
            mobile ? "pt-16" : "pt-0",
            !mobile && collapsed ? "ml-20" : !mobile ? "ml-64" : "ml-0",
            "transition-all duration-300 ease-in-out"
          )}
        >
          {isAuthenticated && (
            <>
              <div className="flex-grow">
                {children}
              </div>
              <Footer />
            </>
          )}
        </main>
      </div>
    </>
  );
}
