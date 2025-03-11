import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare, 
  Phone, 
  Settings, 
  Trash2, 
  XCircle 
} from 'lucide-react';

// Schema para validação do formulário WhatsApp
const whatsappConfigSchema = z.object({
  name: z.string().min(3, { message: 'Nome é obrigatório' }),
  enabled: z.boolean().optional().default(false),
  phoneNumberId: z.string().min(1, { message: 'ID do número de telefone é obrigatório' }),
  accessToken: z.string().min(1, { message: 'Token de acesso é obrigatório' }),
  webhookToken: z.string().min(1, { message: 'Token de verificação do webhook é obrigatório' })
});

type WhatsAppConfigValues = z.infer<typeof whatsappConfigSchema>;

export default function Integrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testingConnection, setTestingConnection] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [integrationToDelete, setIntegrationToDelete] = useState<number | null>(null);

  // Estados para WhatsApp Web
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [whatsappWebStatus, setWhatsappWebStatus] = useState<{ ready: boolean; authenticated: boolean } | null>(null);
  const [connectingWhatsAppWeb, setConnectingWhatsAppWeb] = useState(false);
  const [disconnectingWhatsAppWeb, setDisconnectingWhatsAppWeb] = useState(false);
  const [restartingWhatsAppWeb, setRestartingWhatsAppWeb] = useState(false);
  
  // Obter status do WhatsApp Web
  const { data: whatsappWebData, isLoading: isLoadingWhatsappWeb, refetch: refetchWhatsappWeb } = useQuery({
    queryKey: ['/api/whatsapp-web/status'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: user?.role === 'admin',
    refetchInterval: whatsappWebStatus && !whatsappWebStatus.authenticated ? 5000 : false
  });
  
  // Mutações para WhatsApp Web
  const connectWhatsAppWebMutation = useMutation({
    mutationFn: async () => {
      setConnectingWhatsAppWeb(true);
      const response = await fetch('/api/whatsapp-web/connect', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao conectar WhatsApp Web');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'WhatsApp Web',
        description: 'Conexão iniciada, aguarde o QR Code',
      });
      setTimeout(() => {
        fetchQRCode();
        refetchWhatsappWeb();
      }, 1000);
      setConnectingWhatsAppWeb(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
      setConnectingWhatsAppWeb(false);
    }
  });
  
  const disconnectWhatsAppWebMutation = useMutation({
    mutationFn: async () => {
      setDisconnectingWhatsAppWeb(true);
      const response = await fetch('/api/whatsapp-web/disconnect', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao desconectar WhatsApp Web');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'WhatsApp Web',
        description: 'Desconectado com sucesso',
      });
      setQrCode(null);
      refetchWhatsappWeb();
      setDisconnectingWhatsAppWeb(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
      setDisconnectingWhatsAppWeb(false);
    }
  });
  
  const restartWhatsAppWebMutation = useMutation({
    mutationFn: async () => {
      setRestartingWhatsAppWeb(true);
      const response = await fetch('/api/whatsapp-web/restart', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao reiniciar WhatsApp Web');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'WhatsApp Web',
        description: 'Reiniciado com sucesso, aguarde o QR Code',
      });
      setTimeout(() => {
        fetchQRCode();
        refetchWhatsappWeb();
      }, 1000);
      setRestartingWhatsAppWeb(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
      setRestartingWhatsAppWeb(false);
    }
  });
  
  // Buscar QR Code
  const fetchQRCode = async () => {
    try {
      const response = await fetch('/api/whatsapp-web/qr-code');
      if (!response.ok) {
        if (response.status !== 404) { // Ignorar 404 (QR Code não disponível)
          const error = await response.json();
          throw new Error(error.message);
        }
        return;
      }
      
      const data = await response.json();
      if (data.qrCode) {
        setQrCode(data.qrCode);
      }
    } catch (error) {
      console.error('Erro ao buscar QR Code:', error);
    }
  };
  
  // Atualizar status do WhatsApp Web quando os dados mudam
  useEffect(() => {
    if (whatsappWebData) {
      setWhatsappWebStatus(whatsappWebData.status);
      
      // Se não estiver autenticado e não tiver QR Code, tentar buscar
      if (whatsappWebData.status && !whatsappWebData.status.authenticated && !qrCode) {
        fetchQRCode();
      }
    }
  }, [whatsappWebData]);
  
  // Função para conectar WhatsApp Web
  const handleConnectWhatsAppWeb = () => {
    connectWhatsAppWebMutation.mutate();
  };
  
  // Função para desconectar WhatsApp Web
  const handleDisconnectWhatsAppWeb = () => {
    disconnectWhatsAppWebMutation.mutate();
  };
  
  // Função para reiniciar WhatsApp Web
  const handleRestartWhatsAppWeb = () => {
    restartWhatsAppWebMutation.mutate();
  };
  
  // Obter integrações existentes
  const { data: integrations = [], isLoading: isLoadingIntegrations } = useQuery({
    queryKey: ['/api/integrations'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: user?.role === 'admin'
  });

  // Formulário para configuração do WhatsApp
  const whatsappIntegration = integrations.find((i: any) => i.type === 'whatsapp') || null;
  
  const form = useForm<WhatsAppConfigValues>({
    resolver: zodResolver(whatsappConfigSchema),
    defaultValues: whatsappIntegration ? {
      name: whatsappIntegration.name,
      enabled: whatsappIntegration.enabled,
      phoneNumberId: whatsappIntegration.credentials?.phoneNumberId || '',
      accessToken: whatsappIntegration.credentials?.accessToken || '',
      webhookToken: whatsappIntegration.credentials?.webhookToken || '',
    } : {
      name: 'Integração WhatsApp',
      enabled: false,
      phoneNumberId: '',
      accessToken: '',
      webhookToken: '',
    },
  });

  // Mutation para criar/atualizar integração
  const saveMutation = useMutation({
    mutationFn: async (data: WhatsAppConfigValues) => {
      const credentials = {
        phoneNumberId: data.phoneNumberId,
        accessToken: data.accessToken,
        webhookToken: data.webhookToken
      };
      
      const payload = {
        type: 'whatsapp',
        name: data.name,
        enabled: data.enabled,
        credentials
      };
      
      if (whatsappIntegration) {
        return apiRequest(`/api/integrations/${whatsappIntegration.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        return apiRequest('/api/integrations', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
    },
    onSuccess: () => {
      toast({
        title: 'Integração salva',
        description: 'Configurações do WhatsApp foram salvas com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro ao salvar integração: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutation para excluir integração
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/integrations/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Integração excluída',
        description: 'A integração foi removida com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      setOpenDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro ao excluir integração: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutation para testar conexão do WhatsApp
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      setTestingConnection(true);
      const response = await fetch('/api/integrations/whatsapp/test', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao testar conexão');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Teste de conexão',
        description: data.message,
        variant: 'default',
      });
      setTestingConnection(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro de conexão',
        description: error.message,
        variant: 'destructive',
      });
      setTestingConnection(false);
    }
  });

  // Confirmar exclusão de integração
  const handleConfirmDelete = (id: number) => {
    setIntegrationToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleDelete = () => {
    if (integrationToDelete) {
      deleteMutation.mutate(integrationToDelete);
    }
  };

  // Salvar configuração do WhatsApp
  const onSubmitWhatsAppConfig = (data: WhatsAppConfigValues) => {
    saveMutation.mutate(data);
  };

  // Testar conexão WhatsApp
  const testConnection = () => {
    testConnectionMutation.mutate();
  };

  // Verificar se o usuário é administrador
  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Somente administradores podem acessar as configurações de integrações.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Integrações</h1>
          <p className="text-muted-foreground">
            Configure e gerencie integrações do sistema com serviços externos
          </p>
        </div>
      </div>

      <Tabs defaultValue="whatsapp">
        <TabsList className="mb-4">
          <TabsTrigger value="whatsapp">WhatsApp API</TabsTrigger>
          <TabsTrigger value="whatsapp_web">WhatsApp Web (QR)</TabsTrigger>
          <TabsTrigger value="email" disabled>Email</TabsTrigger>
          <TabsTrigger value="sms" disabled>SMS</TabsTrigger>
        </TabsList>
        
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Integração com WhatsApp
                  </CardTitle>
                  <CardDescription>
                    Conecte o sistema com a API do WhatsApp para enviar notificações e atualizações
                  </CardDescription>
                </div>
                {whatsappIntegration && (
                  <Badge variant={whatsappIntegration.enabled ? "secondary" : "outline"}>
                    {whatsappIntegration.enabled ? (
                      <span className="flex items-center">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Ativo
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <XCircle className="mr-1 h-3 w-3" /> Inativo
                      </span>
                    )}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitWhatsAppConfig)}>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="flex-1 mr-4">
                            <FormLabel>Nome da Integração</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 pt-8">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="mt-0">Ativar Integração</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <h3 className="text-lg font-medium flex items-center">
                      <Settings className="mr-2 h-4 w-4" /> Configurações da API
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="phoneNumberId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number ID</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            ID do número de telefone registrado no WhatsApp Business API
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="accessToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token de Acesso</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Token de acesso para autenticação na API do WhatsApp
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="webhookToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token de Verificação do Webhook</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Token usado para verificar webhooks recebidos do WhatsApp
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <div>
                      {whatsappIntegration && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleConfirmDelete(whatsappIntegration.id)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> Excluir
                        </Button>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={testConnection}
                        disabled={testingConnection || !whatsappIntegration?.enabled}
                      >
                        {testingConnection ? (
                          <>Testando...</>
                        ) : (
                          <>
                            <Phone className="mr-1 h-4 w-4" /> Testar Conexão
                          </>
                        )}
                      </Button>
                      
                      <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? (
                          <>Salvando...</>
                        ) : (
                          <>
                            Salvar Configurações <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="whatsapp_web">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <Smartphone className="mr-2 h-5 w-5" />
                    WhatsApp Web (via QR Code)
                  </CardTitle>
                  <CardDescription>
                    Conecte o sistema usando um QR Code para enviar notificações via WhatsApp
                  </CardDescription>
                </div>
                {whatsappWebStatus && (
                  <Badge variant={whatsappWebStatus.authenticated ? "secondary" : "outline"}>
                    {whatsappWebStatus.authenticated ? (
                      <span className="flex items-center">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Conectado
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <XCircle className="mr-1 h-3 w-3" /> Desconectado
                      </span>
                    )}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Esta opção permite conectar o sistema diretamente ao WhatsApp Web usando um dispositivo do WhatsApp existente, sem necessidade de API oficial ou aprovação do WhatsApp Business.
                </p>
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/2 space-y-4">
                    <div className="rounded-lg border p-4">
                      <h3 className="text-sm font-medium mb-2">Status da conexão</h3>
                      {isLoadingWhatsappWeb ? (
                        <div className="flex justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Cliente iniciado:</span>
                            <span className="font-medium">{whatsappWebStatus?.ready ? 'Sim' : 'Não'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Autenticado:</span>
                            <span className="font-medium">{whatsappWebStatus?.authenticated ? 'Sim' : 'Não'}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex flex-wrap gap-2 mt-4">
                            {whatsappWebStatus?.authenticated ? (
                              <>
                                <Button 
                                  variant="destructive"
                                  size="sm"
                                  onClick={handleDisconnectWhatsAppWeb}
                                  disabled={disconnectingWhatsAppWeb}
                                >
                                  {disconnectingWhatsAppWeb && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                  Desconectar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleRestartWhatsAppWeb}
                                  disabled={restartingWhatsAppWeb}
                                >
                                  {restartingWhatsAppWeb && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                  Reiniciar
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={handleConnectWhatsAppWeb}
                                disabled={connectingWhatsAppWeb}
                              >
                                {connectingWhatsAppWeb && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Conectar
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="rounded-lg border p-4">
                      <h3 className="text-sm font-medium mb-2">Como usar</h3>
                      <ol className="space-y-2 pl-5 text-sm list-decimal">
                        <li>Clique no botão "Conectar" para iniciar a conexão</li>
                        <li>Escaneie o QR Code com seu celular</li>
                        <li>Abra o WhatsApp no seu celular</li>
                        <li>Toque em Menu ou Configurações e selecione WhatsApp Web</li>
                        <li>Aponte seu celular para esta tela para capturar o código</li>
                        <li>A conexão será estabelecida em poucos segundos</li>
                      </ol>
                    </div>
                    
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Atenção</AlertTitle>
                      <AlertDescription>
                        Mantenha o sistema em execução para garantir que as notificações sejam enviadas corretamente. A desconexão do WhatsApp Web interromperá o envio de mensagens.
                      </AlertDescription>
                    </Alert>
                  </div>
                  
                  <div className="md:w-1/2 flex flex-col items-center justify-center">
                    {qrCode ? (
                      <div className="space-y-4 text-center">
                        <div className="border-2 border-dashed border-primary p-4 inline-block bg-white">
                          <img 
                            src={`data:image/png;base64,${qrCode}`} 
                            alt="QR Code para WhatsApp Web" 
                            className="h-64 w-64"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Escaneie o QR Code acima usando o WhatsApp do seu celular
                        </p>
                        <div className="flex justify-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={fetchQRCode}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Atualizar QR Code
                          </Button>
                        </div>
                      </div>
                    ) : whatsappWebStatus?.authenticated ? (
                      <div className="text-center">
                        <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                        <h3 className="mt-4 text-lg font-medium">WhatsApp conectado</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Seu WhatsApp Web está conectado e pronto para enviar mensagens.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Smartphone className="h-16 w-16 text-muted-foreground mx-auto" />
                        <h3 className="mt-4 text-lg font-medium">Não conectado</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Clique no botão "Conectar" para exibir o QR Code.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Integração</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta integração? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}