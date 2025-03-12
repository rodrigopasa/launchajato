import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, CreditCard, DollarSign, ExternalLink, Loader2, RefreshCcw, Settings, Shield, ShieldAlert, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React from "react";

// Schemas para validação de formulários
const systemSettingsSchema = z.object({
  siteName: z.string().min(3, { message: "Nome do site deve ter pelo menos 3 caracteres" }),
  adminEmail: z.string().email({ message: "Email inválido" }),
  maxFileSize: z.coerce.number().min(1, { message: "Tamanho mínimo de 1MB" }),
  defaultLanguage: z.string(),
  allowUserRegistration: z.boolean(),
  maintenanceMode: z.boolean(),
});

const stripeSchema = z.object({
  publicKey: z.string().min(5, { message: "Chave pública obrigatória" }),
  secretKey: z.string().min(5, { message: "Chave secreta obrigatória" }),
  webhookSecret: z.string().min(5, { message: "Webhook secret obrigatório" }),
  priceId: z.string().min(5, { message: "ID de preço obrigatório" }),
  testMode: z.boolean(),
});

const mercadoPagoSchema = z.object({
  publicKey: z.string().min(5, { message: "Chave pública obrigatória" }),
  accessToken: z.string().min(5, { message: "Token de acesso obrigatório" }),
  testMode: z.boolean(),
});

const pricingSchema = z.object({
  freeEnabled: z.boolean(),
  starterPrice: z.coerce.number().min(0),
  professionalPrice: z.coerce.number().min(0),
  enterprisePrice: z.coerce.number().min(0),
  customEnabled: z.boolean(),
});

const partnerAgencySchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  contactName: z.string().min(3, { message: "Nome do contato deve ter pelo menos 3 caracteres" }),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url({ message: "URL inválida" }).optional().or(z.literal("")),
  partnerLevel: z.string(),
  commissionRate: z.coerce.number().min(0).max(100),
  status: z.string(),
  notes: z.string().optional(),
});

type SystemSettingsValues = z.infer<typeof systemSettingsSchema>;
type StripeValues = z.infer<typeof stripeSchema>;
type MercadoPagoValues = z.infer<typeof mercadoPagoSchema>;
type PricingValues = z.infer<typeof pricingSchema>;
type PartnerAgencyValues = z.infer<typeof partnerAgencySchema>;

export default function SuperAdmin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("system");
  const [secretsVisible, setSecretsVisible] = useState(false);

  // Buscar configurações do sistema
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/admin/settings"],
    // Função de fallback caso a API ainda não exista
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/settings");
        return await res.json();
      } catch (error) {
        console.error("Error fetching settings:", error);
        // Retornar dados iniciais padrão
        return {
          siteName: "LaunchRocket",
          adminEmail: "admin@launchrocket.com",
          maxFileSize: 10,
          defaultLanguage: "pt-BR",
          allowUserRegistration: true,
          maintenanceMode: false,
        };
      }
    },
  });

  // Buscar configurações do Stripe
  const { data: stripeSettings, isLoading: isLoadingStripe } = useQuery({
    queryKey: ["/api/admin/payment-integrations/stripe"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/payment-integrations/stripe");
        return await res.json();
      } catch (error) {
        console.error("Error fetching Stripe settings:", error);
        // Retornar dados iniciais padrão
        return {
          publicKey: "",
          secretKey: "",
          webhookSecret: "",
          priceId: "",
          testMode: true,
        };
      }
    },
  });

  // Buscar configurações do Mercado Pago
  const { data: mercadoPagoSettings, isLoading: isLoadingMercadoPago } = useQuery({
    queryKey: ["/api/admin/payment-integrations/mercado-pago"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/payment-integrations/mercado-pago");
        return await res.json();
      } catch (error) {
        console.error("Error fetching Mercado Pago settings:", error);
        // Retornar dados iniciais padrão
        return {
          publicKey: "",
          accessToken: "",
          testMode: true,
        };
      }
    },
  });

  // Buscar informações de preços
  const { data: pricingSettings, isLoading: isLoadingPricing } = useQuery({
    queryKey: ["/api/admin/settings/pricing"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/settings/pricing");
        return await res.json();
      } catch (error) {
        console.error("Error fetching pricing:", error);
        // Retornar dados iniciais padrão
        return {
          freeEnabled: true,
          starterPrice: 29.90,
          professionalPrice: 99.90,
          enterprisePrice: 299.90,
          customEnabled: true,
        };
      }
    },
  });

  // Buscar agências parceiras
  const { data: partnerAgencies, isLoading: isLoadingPartners } = useQuery({
    queryKey: ["/api/admin/partner-agencies"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/partner-agencies");
        return await res.json();
      } catch (error) {
        console.error("Error fetching partner agencies:", error);
        return [];
      }
    },
  });

  // Formulário para configurações do sistema
  const systemForm = useForm<SystemSettingsValues>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: settings || {
      siteName: "",
      adminEmail: "",
      maxFileSize: 10,
      defaultLanguage: "pt-BR",
      allowUserRegistration: true,
      maintenanceMode: false,
    },
  });

  // Atualizar valores do formulário quando os dados forem carregados
  React.useEffect(() => {
    if (settings) {
      systemForm.reset(settings);
    }
  }, [settings, systemForm]);

  // Formulário para configurações do Stripe
  const stripeForm = useForm<StripeValues>({
    resolver: zodResolver(stripeSchema),
    defaultValues: stripeSettings || {
      publicKey: "",
      secretKey: "",
      webhookSecret: "",
      priceId: "",
      testMode: true,
    },
  });

  // Atualizar valores do formulário quando os dados forem carregados
  React.useEffect(() => {
    if (stripeSettings) {
      stripeForm.reset(stripeSettings);
    }
  }, [stripeSettings, stripeForm]);

  // Formulário para configurações do Mercado Pago
  const mercadoPagoForm = useForm<MercadoPagoValues>({
    resolver: zodResolver(mercadoPagoSchema),
    defaultValues: mercadoPagoSettings || {
      publicKey: "",
      accessToken: "",
      testMode: true,
    },
  });

  // Atualizar valores do formulário quando os dados forem carregados
  React.useEffect(() => {
    if (mercadoPagoSettings) {
      mercadoPagoForm.reset(mercadoPagoSettings);
    }
  }, [mercadoPagoSettings, mercadoPagoForm]);

  // Formulário para configurações de preços
  const pricingForm = useForm<PricingValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: pricingSettings || {
      freeEnabled: true,
      starterPrice: 29.90,
      professionalPrice: 99.90,
      enterprisePrice: 299.90,
      customEnabled: true,
    },
  });

  // Atualizar valores do formulário quando os dados forem carregados
  React.useEffect(() => {
    if (pricingSettings) {
      pricingForm.reset(pricingSettings);
    }
  }, [pricingSettings, pricingForm]);

  // Formulário para adicionar agência parceira
  const partnerAgencyForm = useForm<PartnerAgencyValues>({
    resolver: zodResolver(partnerAgencySchema),
    defaultValues: {
      name: "",
      email: "",
      contactName: "",
      phone: "",
      address: "",
      website: "",
      partnerLevel: "basic",
      commissionRate: 10,
      status: "active",
      notes: "",
    },
  });

  // Mutação para salvar configurações do sistema
  const saveSystemSettingsMutation = useMutation({
    mutationFn: async (data: SystemSettingsValues) => {
      const res = await apiRequest("PUT", "/api/admin/settings", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações do sistema foram atualizadas com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar as configurações do sistema.",
        variant: "destructive",
      });
    },
  });

  // Função para salvar configurações do sistema
  const handleSaveSettings = (data: SystemSettingsValues) => {
    saveSystemSettingsMutation.mutate(data);
  };

  // Mutação para salvar configurações do Mercado Pago
  const saveMercadoPagoMutation = useMutation({
    mutationFn: async (data: MercadoPagoValues) => {
      const res = await apiRequest("PUT", "/api/admin/payment-integrations/mercado-pago", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações do Mercado Pago foram atualizadas com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-integrations/mercado-pago"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar as configurações do Mercado Pago.",
        variant: "destructive",
      });
    },
  });

  // Função para salvar configurações do Mercado Pago
  const handleSaveMercadoPago = (data: MercadoPagoValues) => {
    saveMercadoPagoMutation.mutate(data);
  };

  // Mutação para salvar configurações do Stripe
  const saveStripeMutation = useMutation({
    mutationFn: async (data: StripeValues) => {
      const res = await apiRequest("PUT", "/api/admin/payment-integrations/stripe", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações do Stripe foram atualizadas com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-integrations/stripe"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar as configurações do Stripe.",
        variant: "destructive",
      });
    },
  });

  // Função para salvar configurações do Stripe
  const handleSaveStripe = (data: StripeValues) => {
    saveStripeMutation.mutate(data);
  };

  // Mutação para salvar nova agência parceira
  const savePartnerAgencyMutation = useMutation({
    mutationFn: async (data: PartnerAgencyValues) => {
      const res = await apiRequest("POST", "/api/admin/partner-agencies", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Agência adicionada",
        description: "A agência parceira foi adicionada com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-agencies"] });
      partnerAgencyForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar",
        description: error.message || "Ocorreu um erro ao adicionar a agência parceira.",
        variant: "destructive",
      });
    },
  });

  // Função para salvar nova agência parceira
  const handleSavePartnerAgency = (data: PartnerAgencyValues) => {
    savePartnerAgencyMutation.mutate(data);
  };

  // Mutação para excluir agência parceira
  const deletePartnerAgencyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/partner-agencies/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Agência removida",
        description: "A agência parceira foi removida com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-agencies"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover",
        description: error.message || "Ocorreu um erro ao remover a agência parceira.",
        variant: "destructive",
      });
    },
  });

  // Mutação para salvar configurações de preços
  const savePricingMutation = useMutation({
    mutationFn: async (data: PricingValues) => {
      const res = await apiRequest("PUT", "/api/admin/settings/pricing", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Preços atualizados",
        description: "As configurações de preços foram atualizadas com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/pricing"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar as configurações de preços.",
        variant: "destructive",
      });
    },
  });

  // Função para salvar configurações de preços
  const handleSavePricing = (data: PricingValues) => {
    savePricingMutation.mutate(data);
  };

  // Ícones para as abas
  const tabIcons = {
    system: <Settings className="h-4 w-4 mr-2" />,
    payments: <CreditCard className="h-4 w-4 mr-2" />,
    pricing: <DollarSign className="h-4 w-4 mr-2" />,
    partners: <Users className="h-4 w-4 mr-2" />,
    security: <ShieldAlert className="h-4 w-4 mr-2" />,
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Super Admin</h1>
            <p className="text-muted-foreground">
              Painel de configurações avançadas da plataforma
            </p>
          </div>
        </div>
      </div>
      
      <Alert className="mb-8 bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Acesso restrito</AlertTitle>
        <AlertDescription className="text-amber-700">
          Este painel contém configurações sensíveis que afetam todo o sistema. Tenha cuidado ao fazer alterações.
        </AlertDescription>
      </Alert>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="overflow-x-auto">
          <TabsList className="mb-4 h-10">
            <TabsTrigger value="system" className="flex items-center">
              {tabIcons.system} Sistema
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center">
              {tabIcons.payments} Pagamentos
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center">
              {tabIcons.pricing} Preços
            </TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center">
              {tabIcons.partners} Agências Parceiras
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              {tabIcons.security} Segurança
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: Configurações do Sistema */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Gerencie as configurações básicas da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...systemForm}>
                <form onSubmit={systemForm.handleSubmit(handleSaveSettings)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={systemForm.control}
                      name="siteName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Site</FormLabel>
                          <FormControl>
                            <Input placeholder="LaunchRocket" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={systemForm.control}
                      name="adminEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Administrativo</FormLabel>
                          <FormControl>
                            <Input placeholder="admin@launchrocket.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={systemForm.control}
                      name="maxFileSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tamanho Máximo de Arquivo (MB)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={systemForm.control}
                      name="defaultLanguage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Idioma Padrão</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o idioma" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                              <SelectItem value="en-US">English (US)</SelectItem>
                              <SelectItem value="es">Español</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={systemForm.control}
                      name="allowUserRegistration"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Permitir Registro de Usuários</FormLabel>
                            <FormDescription>
                              Habilitar registro público no sistema
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={systemForm.control}
                      name="maintenanceMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Modo de Manutenção</FormLabel>
                            <FormDescription>
                              Ativar modo de manutenção para todos os usuários
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={saveSystemSettingsMutation.isPending}
                    >
                      {saveSystemSettingsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Salvar alterações
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pagamentos */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Configurações do Stripe */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-credit-card text-blue-500">
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                  Stripe
                </CardTitle>
                <CardDescription>
                  Configurações de integração com o Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...stripeForm}>
                  <form onSubmit={stripeForm.handleSubmit(handleSaveStripe)} className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <FormLabel>Chaves de API</FormLabel>
                        <button
                          type="button"
                          onClick={() => setSecretsVisible(!secretsVisible)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {secretsVisible ? "Ocultar" : "Mostrar"}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <FormField
                          control={stripeForm.control}
                          name="publicKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-500">Chave Pública</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="pk_test_..."
                                  type={secretsVisible ? "text" : "password"}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={stripeForm.control}
                          name="secretKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-500">Chave Secreta</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="sk_test_..."
                                  type={secretsVisible ? "text" : "password"}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={stripeForm.control}
                          name="webhookSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-500">Webhook Secret</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="whsec_..."
                                  type={secretsVisible ? "text" : "password"}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={stripeForm.control}
                          name="priceId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-500">ID do Preço (Assinatura)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="price_..."
                                  type={secretsVisible ? "text" : "password"}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <FormField
                      control={stripeForm.control}
                      name="testMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Modo de Teste</FormLabel>
                            <FormDescription>
                              Ativar o modo de teste (sandbox) para o Stripe
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={saveStripeMutation.isPending}
                      >
                        {saveStripeMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <span>Salvar configurações</span>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Configurações do Mercado Pago */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-banknote text-blue-500">
                    <rect width="20" height="12" x="2" y="6" rx="2" />
                    <circle cx="12" cy="12" r="2" />
                    <path d="M6 12h.01M18 12h.01" />
                  </svg>
                  Mercado Pago
                </CardTitle>
                <CardDescription>
                  Configurações de integração com o Mercado Pago
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...mercadoPagoForm}>
                  <form onSubmit={mercadoPagoForm.handleSubmit(handleSaveMercadoPago)} className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <FormLabel>Chaves de API</FormLabel>
                        <button
                          type="button"
                          onClick={() => setSecretsVisible(!secretsVisible)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {secretsVisible ? "Ocultar" : "Mostrar"}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <FormField
                          control={mercadoPagoForm.control}
                          name="publicKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-500">Chave Pública</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="APP_USR-..."
                                  type={secretsVisible ? "text" : "password"}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={mercadoPagoForm.control}
                          name="accessToken"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-500">Token de Acesso</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="APP_USR-..."
                                  type={secretsVisible ? "text" : "password"}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <FormField
                      control={mercadoPagoForm.control}
                      name="testMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Modo de Teste</FormLabel>
                            <FormDescription>
                              Ativar o modo de teste (sandbox) para o Mercado Pago
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={saveMercadoPagoMutation.isPending}
                      >
                        {saveMercadoPagoMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <span>Salvar configurações</span>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Preços */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planos e Preços</CardTitle>
              <CardDescription>
                Configure os preços dos planos oferecidos na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...pricingForm}>
                <form onSubmit={pricingForm.handleSubmit(handleSavePricing)} className="space-y-4">
                  <div className="grid gap-8 md:grid-cols-4">
                    {/* Plano Gratuito */}
                    <Card className="border-dashed bg-gray-50">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="mb-2">Gratuito</Badge>
                          <FormField
                            control={pricingForm.control}
                            name="freeEnabled"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <CardTitle className="text-lg">Free</CardTitle>
                        <div className="mt-1 text-2xl font-bold">R$ 0,00</div>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-500">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>1 usuário</li>
                          <li>2 projetos</li>
                          <li>Armazenamento limitado</li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Plano Starter */}
                    <Card className="border-blue-200 bg-blue-50/50">
                      <CardHeader className="pb-2">
                        <Badge className="mb-2 bg-blue-500">Starter</Badge>
                        <CardTitle className="text-lg">Starter</CardTitle>
                        <div className="flex items-end gap-1">
                          <span className="text-sm text-muted-foreground">R$</span>
                          <FormField
                            control={pricingForm.control}
                            name="starterPrice"
                            render={({ field }) => (
                              <FormItem className="m-0 p-0">
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="h-8 w-20 bg-transparent text-2xl font-bold border-none p-0 focus-visible:ring-0"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <span className="text-sm text-muted-foreground">/mês</span>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-500">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>5 usuários</li>
                          <li>10 projetos</li>
                          <li>5GB de armazenamento</li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Plano Professional */}
                    <Card className="border-indigo-200 bg-indigo-50/50">
                      <CardHeader className="pb-2">
                        <Badge className="mb-2 bg-indigo-500">Popular</Badge>
                        <CardTitle className="text-lg">Professional</CardTitle>
                        <div className="flex items-end gap-1">
                          <span className="text-sm text-muted-foreground">R$</span>
                          <FormField
                            control={pricingForm.control}
                            name="professionalPrice"
                            render={({ field }) => (
                              <FormItem className="m-0 p-0">
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="h-8 w-20 bg-transparent text-2xl font-bold border-none p-0 focus-visible:ring-0"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <span className="text-sm text-muted-foreground">/mês</span>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-500">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>25 usuários</li>
                          <li>Projetos ilimitados</li>
                          <li>25GB de armazenamento</li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Plano Enterprise */}
                    <Card className="border-purple-200 bg-purple-50/50">
                      <CardHeader className="pb-2">
                        <Badge className="mb-2 bg-purple-500">Enterprise</Badge>
                        <CardTitle className="text-lg">Enterprise</CardTitle>
                        <div className="flex items-end gap-1">
                          <span className="text-sm text-muted-foreground">R$</span>
                          <FormField
                            control={pricingForm.control}
                            name="enterprisePrice"
                            render={({ field }) => (
                              <FormItem className="m-0 p-0">
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="h-8 w-20 bg-transparent text-2xl font-bold border-none p-0 focus-visible:ring-0"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <span className="text-sm text-muted-foreground">/mês</span>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-500">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Usuários ilimitados</li>
                          <li>Projetos ilimitados</li>
                          <li>Armazenamento ilimitado</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-6">
                    <FormField
                      control={pricingForm.control}
                      name="customEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Plano Personalizado</FormLabel>
                            <FormDescription>
                              Habilitar a opção de plano personalizado com preço negociável
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={savePricingMutation.isPending}
                    >
                      {savePricingMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Salvar preços
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Agências Parceiras */}
        <TabsContent value="partners" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cadastrar Nova Agência</CardTitle>
                <CardDescription>
                  Adicione uma nova agência parceira ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...partnerAgencyForm}>
                  <form onSubmit={partnerAgencyForm.handleSubmit(handleSavePartnerAgency)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={partnerAgencyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Agência</FormLabel>
                            <FormControl>
                              <Input placeholder="Agência XYZ" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={partnerAgencyForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email de Contato</FormLabel>
                            <FormControl>
                              <Input placeholder="contato@agencia.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={partnerAgencyForm.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Contato</FormLabel>
                            <FormControl>
                              <Input placeholder="João Silva" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={partnerAgencyForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(11) 98765-4321" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={partnerAgencyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua Exemplo, 123 - São Paulo, SP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={partnerAgencyForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.agencia.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={partnerAgencyForm.control}
                        name="partnerLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nível de Parceiro</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o nível" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="basic">Básico</SelectItem>
                                <SelectItem value="silver">Prata</SelectItem>
                                <SelectItem value="gold">Ouro</SelectItem>
                                <SelectItem value="platinum">Platina</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={partnerAgencyForm.control}
                        name="commissionRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taxa de Comissão (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min="0" max="100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={partnerAgencyForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="suspended">Suspenso</SelectItem>
                              <SelectItem value="inactive">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={partnerAgencyForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Informações adicionais sobre a agência parceira"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={savePartnerAgencyMutation.isPending}
                      >
                        {savePartnerAgencyMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Adicionar Agência"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agências Cadastradas</CardTitle>
                <CardDescription>
                  Lista de agências parceiras no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPartners ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : partnerAgencies && partnerAgencies.length > 0 ? (
                  <div className="space-y-4">
                    {partnerAgencies.map((agency: any) => (
                      <motion.div
                        key={agency.id}
                        className="rounded-lg border p-4 relative"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      >
                        <div className="absolute right-2 top-2">
                          <Badge
                            className={
                              agency.status === "active"
                                ? "bg-green-500"
                                : agency.status === "pending"
                                ? "bg-yellow-500"
                                : agency.status === "suspended"
                                ? "bg-red-500"
                                : "bg-gray-500"
                            }
                          >
                            {agency.status === "active"
                              ? "Ativo"
                              : agency.status === "pending"
                              ? "Pendente"
                              : agency.status === "suspended"
                              ? "Suspenso"
                              : "Inativo"}
                          </Badge>
                        </div>
                        <div className="mb-2 text-lg font-semibold">{agency.name}</div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div className="flex items-center">
                            <span className="font-medium">Contato:</span>
                            <span className="ml-1">{agency.contactName}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Email:</span>
                            <span className="ml-1">{agency.email}</span>
                          </div>
                          {agency.website && (
                            <div className="flex items-center">
                              <span className="font-medium">Website:</span>
                              <a
                                href={agency.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-blue-500 hover:underline flex items-center"
                              >
                                {agency.website}
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </div>
                          )}
                          <div className="flex items-center">
                            <span className="font-medium">Nível:</span>
                            <span className="ml-1">
                              {agency.partnerLevel === "basic"
                                ? "Básico"
                                : agency.partnerLevel === "silver"
                                ? "Prata"
                                : agency.partnerLevel === "gold"
                                ? "Ouro"
                                : "Platina"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Comissão:</span>
                            <span className="ml-1">{agency.commissionRate}%</span>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja remover esta agência parceira?")) {
                                deletePartnerAgencyMutation.mutate(agency.id);
                              }
                            }}
                            disabled={deletePartnerAgencyMutation.isPending}
                          >
                            {deletePartnerAgencyMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Remover"
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <div className="mb-2">Nenhuma agência parceira cadastrada</div>
                    <div className="text-sm">
                      Adicione uma nova agência utilizando o formulário ao lado
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Segurança */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Gerencie as configurações de segurança da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Alert className="mb-4 border-orange-200 bg-orange-50 text-orange-800">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertTitle>Configurações sensíveis</AlertTitle>
                  <AlertDescription>
                    As configurações nesta seção afetam diretamente a segurança da plataforma. Faça alterações com cuidado.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-6">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium">Verificação em duas etapas</h3>
                      <p className="text-sm text-gray-500">
                        Exigir verificação em duas etapas para todos os usuários administrativos
                      </p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium">Política de senhas</h3>
                      <p className="text-sm text-gray-500">
                        Exigir senha forte (mínimo 8 caracteres, letras, números e símbolos)
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium">Limite de tentativas de login</h3>
                      <p className="text-sm text-gray-500">
                        Bloquear conta após 5 tentativas de login malsucedidas
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium">Registros de auditoria</h3>
                      <p className="text-sm text-gray-500">
                        Manter registros de todas as ações realizadas por usuários administrativos
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-medium">Tempo limite de sessão</h3>
                    <p className="text-sm text-gray-500">
                      Encerrar sessões inativas automaticamente após o período especificado
                    </p>
                    <Select defaultValue="60">
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Selecione o tempo limite" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                        <SelectItem value="240">4 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Atualizar configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}