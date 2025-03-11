import React, { useState } from 'react';
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
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
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