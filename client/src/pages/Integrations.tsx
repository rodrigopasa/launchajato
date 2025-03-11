import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2Icon as LoaderIcon, CheckIcon, AlertCircleIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Esquema para configuração do WhatsApp
const whatsappConfigSchema = z.object({
  phoneNumberId: z.string().min(1, { message: 'ID do número de telefone é obrigatório' }),
  accessToken: z.string().min(1, { message: 'Token de acesso é obrigatório' }),
  webhookToken: z.string().min(1, { message: 'Token de verificação do webhook é obrigatório' }),
  enabled: z.boolean().default(false),
});

type WhatsAppConfigValues = z.infer<typeof whatsappConfigSchema>;

export default function Integrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('whatsapp');
  
  // Verificar se o usuário é administrador
  const isAdmin = user?.role === 'admin';
  
  // Buscar configurações de integração
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['/api/integrations'],
    retry: false,
    enabled: !!user,
  });
  
  // Encontrar a configuração do WhatsApp se existir
  const whatsappConfig = integrations?.find(
    (i: any) => i.type === 'whatsapp'
  );
  
  // Formulário para configuração do WhatsApp
  const whatsappForm = useForm<WhatsAppConfigValues>({
    resolver: zodResolver(whatsappConfigSchema),
    defaultValues: {
      phoneNumberId: whatsappConfig?.credentials?.phoneNumberId || '',
      accessToken: whatsappConfig?.credentials?.accessToken || '',
      webhookToken: whatsappConfig?.credentials?.webhookToken || '',
      enabled: whatsappConfig?.enabled || false,
    },
  });
  
  // Mutation para salvar configuração
  const saveConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = whatsappConfig 
        ? `/api/integrations/${whatsappConfig.id}` 
        : '/api/integrations';
      
      const method = whatsappConfig ? 'PUT' : 'POST';
      
      return apiRequest(endpoint, {
        method,
        body: JSON.stringify({
          type: 'whatsapp',
          name: 'WhatsApp Business API',
          enabled: data.enabled,
          credentials: {
            phoneNumberId: data.phoneNumberId,
            accessToken: data.accessToken,
            webhookToken: data.webhookToken,
          },
          configuredBy: user!.id,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Configuração salva',
        description: 'As configurações do WhatsApp foram salvas com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar',
        description: `Ocorreu um erro: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Mutation para testar conexão
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/integrations/whatsapp/test', {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Conexão testada',
        description: data.message || 'Conexão com WhatsApp realizada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro na conexão',
        description: `Falha ao conectar: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Handler para submissão do formulário
  const onSubmitWhatsAppConfig = (data: WhatsAppConfigValues) => {
    saveConfigMutation.mutate(data);
  };
  
  // Verificar se tem permissão para editar
  if (user && !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Apenas administradores podem acessar as configurações de integração.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
          <p className="text-muted-foreground mt-2">
            Configure integrações externas para expandir as funcionalidades do LaunchRocket.
          </p>
        </div>
        
        <Separator />
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="whatsapp">WhatsApp Business</TabsTrigger>
            <TabsTrigger value="email" disabled>Email (Em breve)</TabsTrigger>
            <TabsTrigger value="sms" disabled>SMS (Em breve)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="whatsapp" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Configuração do WhatsApp Business</CardTitle>
                    <CardDescription>
                      Configure a integração com a API do WhatsApp Business para notificações e chatbot.
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={whatsappConfig?.enabled ? "success" : "secondary"}
                  >
                    {whatsappConfig?.enabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <Form {...whatsappForm}>
                  <form onSubmit={whatsappForm.handleSubmit(onSubmitWhatsAppConfig)} className="space-y-6">
                    <FormField
                      control={whatsappForm.control}
                      name="phoneNumberId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID do Número de Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="123456789012345" {...field} />
                          </FormControl>
                          <FormDescription>
                            ID do número de telefone do WhatsApp Business (disponível no painel do Meta for Developers)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={whatsappForm.control}
                      name="accessToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token de Acesso</FormLabel>
                          <FormControl>
                            <Input placeholder="EAAxxxx..." type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Token de acesso à API do WhatsApp Business
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={whatsappForm.control}
                      name="webhookToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token de Verificação do Webhook</FormLabel>
                          <FormControl>
                            <Input placeholder="seu_token_secreto" {...field} />
                          </FormControl>
                          <FormDescription>
                            Token para verificação do webhook (você define este valor)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={whatsappForm.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Ativar integração
                            </FormLabel>
                            <FormDescription>
                              Ativa ou desativa a integração com WhatsApp
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
                    
                    <Alert>
                      <AlertTitle>Informação importante</AlertTitle>
                      <AlertDescription>
                        Para utilizar esta integração, você precisa configurar o Webhook do WhatsApp 
                        no painel do Meta for Developers para apontar para:
                        <code className="ml-2 px-2 py-1 bg-muted rounded">
                          https://sua-url.com/api/chatbot/webhook
                        </code>
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex gap-4">
                      <Button 
                        type="submit" 
                        disabled={saveConfigMutation.isPending || !isAdmin}
                      >
                        {saveConfigMutation.isPending ? (
                          <>
                            <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <CheckIcon className="mr-2 h-4 w-4" />
                            Salvar configuração
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => testConnectionMutation.mutate()}
                        disabled={testConnectionMutation.isPending || !whatsappConfig?.enabled || !isAdmin}
                      >
                        {testConnectionMutation.isPending ? (
                          <>
                            <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                            Testando...
                          </>
                        ) : (
                          'Testar conexão'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
              
              <CardFooter className="border-t px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Última atualização: {whatsappConfig 
                    ? new Date(whatsappConfig.updatedAt).toLocaleString('pt-BR') 
                    : 'Nunca configurado'}
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}