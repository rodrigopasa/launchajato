import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Shield, Users, Settings, CreditCard, Globe, PlusCircle, RefreshCw, MoreVertical, Trash2, Edit, Key, DollarSign } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Formulário de Configuração do Sistema
const systemSettingsSchema = z.object({
  appName: z.string().min(1, "O nome do aplicativo é obrigatório"),
  defaultPlanTrialDays: z.coerce.number().int().min(0),
  maxFileSize: z.coerce.number().int().min(1),
  maintanceMode: z.boolean().default(false),
  disableRegistration: z.boolean().default(false),
  notificationEmail: z.string().email().optional(),
  customCss: z.string().optional(),
  defaultCurrency: z.string().min(1),
  termsUrl: z.string().url().optional().or(z.literal('')),
  privacyUrl: z.string().url().optional().or(z.literal('')),
});

type SystemSettingsValues = z.infer<typeof systemSettingsSchema>;

// Formulário para Mercado Pago
const mercadoPagoSchema = z.object({
  accessToken: z.string().min(1, "Token de acesso é obrigatório"),
  publicKey: z.string().min(1, "Chave pública é obrigatória"),
  enabled: z.boolean().default(true),
  testMode: z.boolean().default(true),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  webhookSecret: z.string().optional(),
});

type MercadoPagoValues = z.infer<typeof mercadoPagoSchema>;

// Formulário para Agências Parceiras
const partnerAgencySchema = z.object({
  name: z.string().min(3, "Nome da agência é obrigatório"),
  contactName: z.string().min(3, "Nome do contato é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  accessLevel: z.enum(["trial", "partner", "reseller"]).default("trial"),
  trialStartDate: z.date().default(() => new Date()),
  trialEndDate: z.date().optional(),
  maxOrganizations: z.coerce.number().int().min(1).default(1),
  status: z.enum(["active", "suspended", "expired"]).default("active"),
  notes: z.string().optional(),
});

type PartnerAgencyValues = z.infer<typeof partnerAgencySchema>;

export default function SuperAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [mercadoPagoDialogOpen, setMercadoPagoDialogOpen] = useState(false);

  // Verificar se o usuário é administrador
  if (user?.role !== "admin") {
    navigate("/dashboard");
    return null;
  }

  // Buscar configurações do sistema
  const { 
    data: systemSettings, 
    isLoading: isLoadingSettings 
  } = useQuery({
    queryKey: ["api/admin/settings"],
    queryFn: () => apiRequest<SystemSettingsValues>("/api/admin/settings")
  });

  // Buscar configuração do Mercado Pago
  const { 
    data: mercadoPagoSettings, 
    isLoading: isLoadingMercadoPago 
  } = useQuery({
    queryKey: ["api/admin/payment-integrations/mercado-pago"],
    queryFn: () => apiRequest<MercadoPagoValues>("/api/admin/payment-integrations/mercado-pago")
  });

  // Buscar agências parceiras
  const { 
    data: partnerAgencies, 
    isLoading: isLoadingPartners 
  } = useQuery({
    queryKey: ["api/admin/partner-agencies"],
    queryFn: () => apiRequest<any[]>("/api/admin/partner-agencies")
  });

  // Formulário de configurações do sistema
  const systemSettingsForm = useForm<SystemSettingsValues>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: systemSettings || {
      appName: "LaunchRocket",
      defaultPlanTrialDays: 14,
      maxFileSize: 10,
      maintanceMode: false,
      disableRegistration: false,
      notificationEmail: "",
      customCss: "",
      defaultCurrency: "BRL",
      termsUrl: "",
      privacyUrl: ""
    },
  });

  // Atualizar valores quando os dados forem carregados
  React.useEffect(() => {
    if (systemSettings) {
      systemSettingsForm.reset(systemSettings);
    }
  }, [systemSettings]);

  // Formulário do Mercado Pago
  const mercadoPagoForm = useForm<MercadoPagoValues>({
    resolver: zodResolver(mercadoPagoSchema),
    defaultValues: mercadoPagoSettings || {
      accessToken: "",
      publicKey: "",
      enabled: true,
      testMode: true,
      webhookUrl: "",
      webhookSecret: ""
    },
  });

  // Atualizar valores quando os dados forem carregados
  React.useEffect(() => {
    if (mercadoPagoSettings) {
      mercadoPagoForm.reset(mercadoPagoSettings);
    }
  }, [mercadoPagoSettings]);

  // Formulário de agência parceira
  const partnerAgencyForm = useForm<PartnerAgencyValues>({
    resolver: zodResolver(partnerAgencySchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      accessLevel: "trial",
      trialStartDate: new Date(),
      maxOrganizations: 1,
      status: "active",
      notes: ""
    },
  });

  // Atualizar valores quando uma agência for selecionada para edição
  React.useEffect(() => {
    if (selectedPartner) {
      // Converter datas de string para Date
      const trialStartDate = selectedPartner.trialStartDate ? new Date(selectedPartner.trialStartDate) : new Date();
      const trialEndDate = selectedPartner.trialEndDate ? new Date(selectedPartner.trialEndDate) : undefined;
      
      partnerAgencyForm.reset({
        ...selectedPartner,
        trialStartDate,
        trialEndDate
      });
    } else {
      partnerAgencyForm.reset({
        name: "",
        contactName: "",
        email: "",
        phone: "",
        accessLevel: "trial",
        trialStartDate: new Date(),
        maxOrganizations: 1,
        status: "active",
        notes: ""
      });
    }
  }, [selectedPartner]);

  // Mutação para salvar configurações do sistema
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: SystemSettingsValues) => {
      return apiRequest("/api/admin/settings", "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações do sistema foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["api/admin/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Falha ao salvar configurações: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = (data: SystemSettingsValues) => {
    saveSettingsMutation.mutate(data);
  };

  // Mutação para salvar configurações do Mercado Pago
  const saveMercadoPagoMutation = useMutation({
    mutationFn: async (data: MercadoPagoValues) => {
      return apiRequest("/api/admin/payment-integrations/mercado-pago", "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações do Mercado Pago foram atualizadas com sucesso.",
      });
      setMercadoPagoDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["api/admin/payment-integrations/mercado-pago"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Falha ao salvar configurações: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveMercadoPago = (data: MercadoPagoValues) => {
    saveMercadoPagoMutation.mutate(data);
  };

  // Mutação para salvar agência parceira
  const savePartnerAgencyMutation = useMutation({
    mutationFn: async (data: PartnerAgencyValues) => {
      const endpoint = selectedPartner 
        ? `/api/admin/partner-agencies/${selectedPartner.id}` 
        : "/api/admin/partner-agencies";
      const method = selectedPartner ? "PUT" : "POST";
      return apiRequest(endpoint, method, data);
    },
    onSuccess: () => {
      toast({
        title: selectedPartner ? "Agência atualizada" : "Agência criada",
        description: `A agência parceira foi ${selectedPartner ? "atualizada" : "criada"} com sucesso.`,
      });
      setPartnerDialogOpen(false);
      setSelectedPartner(null);
      queryClient.invalidateQueries({ queryKey: ["api/admin/partner-agencies"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Falha ao ${selectedPartner ? "atualizar" : "criar"} agência: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSavePartnerAgency = (data: PartnerAgencyValues) => {
    savePartnerAgencyMutation.mutate(data);
  };

  // Mutação para remover agência parceira
  const deletePartnerAgencyMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/partner-agencies/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Agência removida",
        description: "A agência parceira foi removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["api/admin/partner-agencies"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Falha ao remover agência: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeletePartnerAgency = (id: number) => {
    deletePartnerAgencyMutation.mutate(id);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Administração do Sistema</h1>
          <p className="text-muted-foreground">
            Configure as opções avançadas do sistema e gerencie agências parceiras
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Configurações
          </TabsTrigger>
          <TabsTrigger value="partners" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Agências Parceiras
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Integrações de Pagamento
          </TabsTrigger>
        </TabsList>

        {/* Aba de Configurações do Sistema */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Configure os parâmetros globais do sistema LaunchRocket
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSettings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...systemSettingsForm}>
                  <form onSubmit={systemSettingsForm.handleSubmit(handleSaveSettings)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={systemSettingsForm.control}
                        name="appName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Aplicativo</FormLabel>
                            <FormControl>
                              <Input placeholder="LaunchRocket" {...field} />
                            </FormControl>
                            <FormDescription>
                              Nome exibido no título das páginas e emails
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemSettingsForm.control}
                        name="defaultCurrency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Moeda Padrão</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a moeda padrão" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                                <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                                <SelectItem value="EUR">Euro (€)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Moeda usada para cobranças e exibição de valores
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemSettingsForm.control}
                        name="defaultPlanTrialDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dias de Teste (Trial)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>
                              Dias de teste gratuito para novos planos
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemSettingsForm.control}
                        name="maxFileSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tamanho Máximo de Arquivo (MB)</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormDescription>
                              Limite de tamanho para upload de arquivos
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemSettingsForm.control}
                        name="notificationEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email de Notificação</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="admin@example.com" {...field} />
                            </FormControl>
                            <FormDescription>
                              Email para receber notificações do sistema
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemSettingsForm.control}
                        name="termsUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL dos Termos de Uso</FormLabel>
                            <FormControl>
                              <Input placeholder="https://exemplo.com/termos" {...field} />
                            </FormControl>
                            <FormDescription>
                              Link para os termos de uso do sistema
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemSettingsForm.control}
                        name="privacyUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL da Política de Privacidade</FormLabel>
                            <FormControl>
                              <Input placeholder="https://exemplo.com/privacidade" {...field} />
                            </FormControl>
                            <FormDescription>
                              Link para a política de privacidade
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2">
                        <FormField
                          control={systemSettingsForm.control}
                          name="customCss"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CSS Personalizado</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder=".custom-class { color: red; }"
                                  className="font-mono"
                                  rows={5}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                CSS personalizado para estilizar a interface
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={systemSettingsForm.control}
                        name="maintanceMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Modo de Manutenção</FormLabel>
                              <FormDescription>
                                Ativa o modo de manutenção e impede novos logins
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
                        control={systemSettingsForm.control}
                        name="disableRegistration"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Desativar Cadastros</FormLabel>
                              <FormDescription>
                                Impede novos cadastros na plataforma
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

                    <Button
                      type="submit"
                      className="w-full md:w-auto"
                      disabled={saveSettingsMutation.isPending}
                    >
                      {saveSettingsMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Salvar Configurações
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Agências Parceiras */}
        <TabsContent value="partners">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Agências Parceiras</CardTitle>
                <CardDescription>
                  Gerencie agências parceiras e seus períodos de acesso
                </CardDescription>
              </div>
              <Button 
                onClick={() => {
                  setSelectedPartner(null);
                  setPartnerDialogOpen(true);
                }}
                className="bg-gradient-to-r from-primary to-indigo-600"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Agência
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingPartners ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : partnerAgencies && partnerAgencies.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Nível de Acesso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Início do Trial</TableHead>
                      <TableHead>Fim do Trial</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerAgencies.map((agency) => (
                      <TableRow key={agency.id}>
                        <TableCell className="font-medium">{agency.name}</TableCell>
                        <TableCell>
                          <div>
                            <div>{agency.contactName}</div>
                            <div className="text-sm text-muted-foreground">{agency.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            agency.accessLevel === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                            agency.accessLevel === 'partner' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {agency.accessLevel === 'trial' ? 'Trial' : 
                            agency.accessLevel === 'partner' ? 'Parceiro' : 'Revendedor'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            agency.status === 'active' ? 'bg-green-100 text-green-800' :
                            agency.status === 'suspended' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {agency.status === 'active' ? 'Ativo' : 
                            agency.status === 'suspended' ? 'Suspenso' : 'Expirado'}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(agency.trialStartDate)}</TableCell>
                        <TableCell>{formatDate(agency.trialEndDate) || "-"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPartner(agency);
                                  setPartnerDialogOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. Isso removerá permanentemente a agência 
                                      <span className="font-semibold"> {agency.name}</span> do sistema.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeletePartnerAgency(agency.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {deletePartnerAgencyMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      )}
                                      Confirmar Exclusão
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma agência parceira</h3>
                  <p className="text-muted-foreground mt-2 mb-4">
                    Você ainda não adicionou nenhuma agência parceira ao sistema.
                  </p>
                  <Button 
                    onClick={() => {
                      setSelectedPartner(null);
                      setPartnerDialogOpen(true);
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Agência
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal de criação/edição de agência parceira */}
          <Dialog open={partnerDialogOpen} onOpenChange={setPartnerDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedPartner ? "Editar Agência Parceira" : "Nova Agência Parceira"}
                </DialogTitle>
                <DialogDescription>
                  {selectedPartner
                    ? "Atualize as informações da agência parceira"
                    : "Adicione uma nova agência parceira ao sistema"}
                </DialogDescription>
              </DialogHeader>
              <Form {...partnerAgencyForm}>
                <form onSubmit={partnerAgencyForm.handleSubmit(handleSavePartnerAgency)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={partnerAgencyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Agência</FormLabel>
                          <FormControl>
                            <Input placeholder="Agência Creative Pixel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={partnerAgencyForm.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Contato</FormLabel>
                          <FormControl>
                            <Input placeholder="João da Silva" {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contato@agencia.com" {...field} />
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
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={partnerAgencyForm.control}
                      name="accessLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nível de Acesso</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o nível de acesso" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="trial">Trial</SelectItem>
                              <SelectItem value="partner">Parceiro</SelectItem>
                              <SelectItem value="reseller">Revendedor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              <SelectItem value="suspended">Suspenso</SelectItem>
                              <SelectItem value="expired">Expirado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={partnerAgencyForm.control}
                      name="maxOrganizations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Máximo de Organizações</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormDescription>
                            Quantas organizações essa agência pode criar
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2">
                      <FormField
                        control={partnerAgencyForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Observações sobre essa agência parceira..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPartnerDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={savePartnerAgencyMutation.isPending}
                    >
                      {savePartnerAgencyMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {selectedPartner ? "Atualizar" : "Adicionar"} Agência
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Aba de Integrações de Pagamento */}
        <TabsContent value="payment">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Integrações de Pagamento</CardTitle>
                <CardDescription>
                  Configure as integrações com provedores de pagamento
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card do Mercado Pago */}
                <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all">
                  <div className="absolute right-3 top-3">
                    {mercadoPagoSettings?.enabled ? (
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Ativo
                      </div>
                    ) : (
                      <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                        Desativado
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-4">
                    <div className="h-10 w-40 bg-gradient-to-r from-blue-400 to-primary rounded-md flex items-center justify-center text-white font-bold">
                      Mercado Pago
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Key className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Chave Pública:</p>
                          <p className="font-mono">
                            {mercadoPagoSettings?.publicKey 
                              ? `${mercadoPagoSettings.publicKey.substring(0, 12)}...${mercadoPagoSettings.publicKey.substring(mercadoPagoSettings.publicKey.length - 6)}` 
                              : "Não configurado"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Modo:</p>
                          <p>
                            {mercadoPagoSettings?.testMode 
                              ? "Teste (Sandbox)" 
                              : "Produção"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Webhook:</p>
                          <p>
                            {mercadoPagoSettings?.webhookUrl 
                              ? "Configurado" 
                              : "Não configurado"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setMercadoPagoDialogOpen(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Configurar
                    </Button>
                  </CardFooter>
                </Card>

                {/* Aqui podem ser adicionadas mais integrações de pagamento no futuro */}
              </div>
            </CardContent>
          </Card>

          {/* Modal de configuração do Mercado Pago */}
          <Dialog open={mercadoPagoDialogOpen} onOpenChange={setMercadoPagoDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Configurar Mercado Pago</DialogTitle>
                <DialogDescription>
                  Configure a integração com o Mercado Pago para processar pagamentos
                </DialogDescription>
              </DialogHeader>
              <Form {...mercadoPagoForm}>
                <form onSubmit={mercadoPagoForm.handleSubmit(handleSaveMercadoPago)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <FormField
                      control={mercadoPagoForm.control}
                      name="accessToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token de Acesso (Access Token)</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="APP_USR-0000000000000000-000000-00000000000000000000000000000000-000000000" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Token de acesso obtido no dashboard do Mercado Pago
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={mercadoPagoForm.control}
                      name="publicKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chave Pública (Public Key)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="APP_USR-0000000000000000-000000-00000000000000000000000000000000" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Chave pública usada para o checkout no front-end
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={mercadoPagoForm.control}
                      name="webhookUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL do Webhook (opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://seudominio.com/api/webhooks/mercadopago" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            URL para receber notificações do Mercado Pago
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={mercadoPagoForm.control}
                      name="webhookSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Segredo do Webhook (opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Segredo para validar os webhooks" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Chave secreta para verificar assinaturas de webhook
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={mercadoPagoForm.control}
                        name="testMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Modo de Teste</FormLabel>
                              <FormDescription>
                                Processa pagamentos no ambiente sandbox
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
                        control={mercadoPagoForm.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Ativar Integração</FormLabel>
                              <FormDescription>
                                Habilita esta integração no sistema
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
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMercadoPagoDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={saveMercadoPagoMutation.isPending}
                    >
                      {saveMercadoPagoMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Salvar Configurações
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}