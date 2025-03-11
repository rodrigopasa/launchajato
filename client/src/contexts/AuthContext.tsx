import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
        const response = await apiRequest("/api/auth/me");
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
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
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
      const response = await apiRequest("/api/auth/logout", {
        method: "POST"
      });
      return response.json();
    },
    onSuccess: () => {
      setUser(null);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao realizar logout",
        description: error.message,
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
