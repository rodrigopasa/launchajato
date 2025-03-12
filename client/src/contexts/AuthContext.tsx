import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Fetch current user
  const { data, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include"
        });
        if (!response.ok) {
          return null;
        }
        const userData = await response.json();
        return userData as User;
      } catch (error) {
        return null;
      }
    },
    retry: false,
    enabled: true,
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);

  // Login mutation
  const loginMutation = useMutation<
    User, 
    Error, 
    { username: string; password: string }
  >({
    mutationFn: async ({ username, password }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Erro no login");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data);
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${data.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation<any, Error, void>({
    mutationFn: async () => {
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include"
        });
        
        // Mesmo que a resposta não seja OK, vamos desconectar o usuário localmente
        if (!response.ok) {
          console.warn("Erro na resposta do servidor durante logout:", response.status);
          // Não lançar erro aqui, apenas retornar para que possamos limpar o estado
          return null;
        }
        
        // Tentar obter JSON apenas se a resposta estiver OK
        return response.json().catch(() => null); // Se não for JSON válido, retornar null
      } catch (err) {
        console.error("Erro ao fazer logout:", err);
        // Não lançar erro, apenas retornar para que possamos limpar o estado
        return null;
      }
    },
    onSuccess: () => {
      // Limpar o estado do usuário independentemente da resposta do servidor
      setUser(null);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    },
    onError: (error: Error) => {
      // Mesmo com erro, desconectar o usuário localmente
      setUser(null);
      
      console.error("Erro durante logout:", error);
      toast({
        title: "Atenção",
        description: "Você foi desconectado, mas houve um problema na comunicação com o servidor",
        variant: "destructive",
      });
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const value = {
    user,
    isLoading: isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
