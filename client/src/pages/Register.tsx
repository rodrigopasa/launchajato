import { useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  LucideRocket,
  CheckCircle2,
  Mail,
  User,
  Building,
  Phone,
  Lock,
  ArrowLeft
} from "lucide-react";

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
import { apiRequest } from "@/lib/queryClient";

// Schemas específicos para cada etapa
const step1Schema = z.object({
  organizationName: z.string().min(2, {
    message: "O nome da organização deve ter pelo menos 2 caracteres",
  }),
});

const step2Schema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres",
  }),
  email: z.string().email({
    message: "Digite um endereço de email válido",
  }),
  phone: z.string().min(10, {
    message: "Digite um número de telefone válido",
  }),
});

const step3Schema = z.object({
  username: z.string().min(3, {
    message: "O nome de usuário deve ter pelo menos 3 caracteres",
  }),
  password: z.string().min(6, {
    message: "A senha deve ter pelo menos 6 caracteres",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

// Schema completo para o formulário
const formSchema = z.object({
  organizationName: z.string().min(2, {
    message: "O nome da organização deve ter pelo menos 2 caracteres",
  }),
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres",
  }),
  email: z.string().email({
    message: "Digite um endereço de email válido",
  }),
  phone: z.string().min(10, {
    message: "Digite um número de telefone válido",
  }),
  username: z.string().min(3, {
    message: "O nome de usuário deve ter pelo menos 3 caracteres",
  }),
  password: z.string().min(6, {
    message: "A senha deve ter pelo menos 6 caracteres",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: "",
      name: "",
      email: "",
      phone: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return form.trigger("organizationName");
      case 2:
        return Promise.all([
          form.trigger("name"),
          form.trigger("email"),
          form.trigger("phone")
        ]).then(results => results.every(Boolean));
      case 3:
        return Promise.all([
          form.trigger("username"),
          form.trigger("password"),
          form.trigger("confirmPassword")
        ]).then(results => results.every(Boolean));
      default:
        return Promise.resolve(true);
    }
  };

  // Função separada para lidar com o botão "Próximo"
  const handleNext = async () => {
    console.log("Tentando avançar para próxima etapa:", currentStep);
    if (currentStep < 3) {
      const isValid = await validateStep();
      console.log("Validação etapa atual:", isValid);
      if (isValid) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const onSubmit = async (data: FormValues) => {
    console.log("Formulário enviado:", currentStep);
    if (currentStep < 3) {
      handleNext();
      return;
    }

    setIsLoading(true);
    try {
      // Primeiro, criar a organização
      const orgData = await apiRequest<any>("/api/organizations", "POST", {
        name: data.organizationName,
      });

      // Em seguida, criar o usuário admin
      await apiRequest<any>("/api/users", "POST", {
        name: data.name,
        email: data.email,
        phone: data.phone,
        username: data.username,
        password: data.password,
        role: "admin",
        organizationId: orgData.id,
        orgRole: "owner"
      });

      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode fazer login no sistema.",
      });

      // Redirecionar para página de login
      setLocation("/login");
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao criar conta",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Informações da Organização</h2>
              <p className="text-slate-400">Vamos configurar sua empresa no sistema</p>
            </div>
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Organização</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input className="pl-10" placeholder="Sua Empresa Ltda." {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Seus dados pessoais</h2>
              <p className="text-slate-400">Informações do administrador da conta</p>
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input className="pl-10" placeholder="Seu Nome Completo" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input className="pl-10" placeholder="seu@email.com" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input className="pl-10" placeholder="(11) 99999-9999" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Acesso ao sistema</h2>
              <p className="text-slate-400">Defina suas credenciais de acesso</p>
            </div>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Usuário</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input className="pl-10" placeholder="usuario" {...field} />
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
                      <Input className="pl-10" type="password" placeholder="********" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirme a Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input className="pl-10" type="password" placeholder="********" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col items-center justify-center p-4 text-white">
      <Link href="/" className="absolute top-4 left-4 flex items-center gap-2 text-slate-400 hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Voltar para Home
      </Link>

      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <LucideRocket className="text-primary h-8 w-8" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              LaunchRocket
            </span>
          </div>
          <h1 className="text-3xl font-bold">Criar Sua Conta</h1>
        </div>

        <div className="bg-slate-800 rounded-lg p-8 mb-6 shadow-lg">
          <div className="flex items-center justify-center mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div 
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step === currentStep 
                      ? "bg-primary text-white" 
                      : step < currentStep 
                        ? "bg-green-500 text-white" 
                        : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {step < currentStep ? <CheckCircle2 className="h-5 w-5" /> : step}
                </div>
                {step < 3 && (
                  <div 
                    className={`w-12 h-1 ${
                      step < currentStep ? "bg-green-500" : "bg-slate-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {getStepContent()}
              </motion.div>

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    disabled={isLoading}
                  >
                    Voltar
                  </Button>
                ) : (
                  <Link href="/login">
                    <Button variant="ghost" className="w-full sm:w-auto">
                      Já possui conta? Entrar
                    </Button>
                  </Link>
                )}
                
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/80 hover:to-purple-400 w-full sm:w-auto"
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/80 hover:to-purple-400 w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Processando...
                      </span>
                    ) : (
                      "Criar Conta"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>

        <div className="text-center text-slate-400 text-sm">
          <p>Desenvolvido por: Rodrigo Pasa - Todos os Direitos Reservados - 2025</p>
        </div>
      </div>
    </div>
  );
}