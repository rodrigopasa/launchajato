import { useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { LucideRocket, User, Lock, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  username: z.string().min(1, {
    message: "Por favor, digite seu nome de usuário",
  }),
  password: z.string().min(1, {
    message: "Por favor, digite sua senha",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao LaunchRocket.",
      });
      setLocation("/dashboard");
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao fazer login",
        description: "Nome de usuário ou senha incorretos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col items-center justify-center p-4 text-white">
      <Link href="/" className="absolute top-4 left-4 flex items-center gap-2 text-slate-400 hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Voltar para Home
      </Link>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <motion.div 
            className="flex items-center justify-center gap-2 mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-purple-500 opacity-75 blur"></div>
              <div className="relative bg-slate-800 p-2 rounded-full">
                <LucideRocket className="text-primary h-10 w-10" />
              </div>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              LaunchRocket
            </span>
          </motion.div>
          <motion.h1 
            className="text-3xl font-bold"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Bem-vindo de volta
          </motion.h1>
          <motion.p 
            className="text-slate-400 mt-2"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Faça login para acessar sua conta
          </motion.p>
        </div>

        <motion.div
          className="bg-slate-800 rounded-lg p-8 mb-6 shadow-lg"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Usuário</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input className="pl-10 bg-slate-700 border-slate-600" placeholder="Seu nome de usuário" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input className="pl-10 bg-slate-700 border-slate-600" type="password" placeholder="Sua senha" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/80 hover:to-purple-400"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Entrando...
                    </span>
                  ) : (
                    "Entrar"
                  )}
                </Button>

                <div className="text-center">
                  <Link href="/register" className="text-primary hover:text-primary/80 text-sm">
                    Não tem uma conta? Registre-se
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </motion.div>

        <RocketAnimation />

        <div className="text-center text-slate-400 text-sm mt-8">
          <p>Desenvolvido por: Rodrigo Pasa - Todos os Direitos Reservados - 2025</p>
        </div>
      </div>
    </div>
  );
}

function RocketAnimation() {
  return (
    <div className="relative h-20 w-full overflow-hidden">
      <motion.div
        className="absolute"
        initial={{ x: -50, y: 20 }}
        animate={{ 
          x: [null, 400],
          y: [null, -20]
        }}
        transition={{ 
          duration: 4,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop",
          delay: 1
        }}
      >
        <div className="relative">
          <div className="absolute -bottom-2 w-10 h-10 bg-gradient-to-t from-primary/20 to-transparent rounded-full blur-md"></div>
          <LucideRocket className="h-6 w-6 text-primary transform rotate-45" />
        </div>
      </motion.div>

      <motion.div
        className="absolute"
        initial={{ x: 50, y: 30 }}
        animate={{ 
          x: [null, 300],
          y: [null, 10]
        }}
        transition={{ 
          duration: 5,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop",
          delay: 0.5
        }}
      >
        <div className="relative">
          <div className="absolute -bottom-2 w-8 h-8 bg-gradient-to-t from-purple-500/20 to-transparent rounded-full blur-md"></div>
          <LucideRocket className="h-5 w-5 text-purple-500 transform rotate-45" />
        </div>
      </motion.div>
    </div>
  );
}