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
import { Loader2 } from "lucide-react";
import { useState } from "react";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="username">Nome de usuário</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Seu nome de usuário"
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sua senha"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500">Use admin/admin123 para o usuário padrão</p>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        Entrar
      </Button>
    </form>
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
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <>
      <Dialog open={!isAuthenticated} modal>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Acesso ao Sistema</DialogTitle>
            <DialogDescription>
              Entre com suas credenciais para acessar o LaunchRocket.
            </DialogDescription>
          </DialogHeader>
          <LoginForm onSubmit={login} isLoading={isLoading} />
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
