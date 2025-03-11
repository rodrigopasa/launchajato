import { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, MessageSquare, Bell } from 'lucide-react';

// Esquema de validação para o formulário
const formSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, { message: 'O número de telefone precisa ter pelo menos 10 dígitos' })
    .max(15, { message: 'O número de telefone não pode exceder 15 dígitos' })
    .regex(/^\+?[0-9]+$/, { message: 'O número de telefone deve conter apenas números e opcionalmente um + no início' }),
  enableWhatsapp: z.boolean().default(false),
  projectUpdates: z.boolean().default(true),
  taskUpdates: z.boolean().default(true),
  dailySummary: z.boolean().default(false),
  activeHours: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function ChatbotSettings() {
  const { toast } = useToast();
  const [testMessageSent, setTestMessageSent] = useState(false);

  // Interface para as configurações do chatbot
  interface ChatbotSettings {
    phoneNumber: string;
    enabled: boolean;
    preferences: {
      projectUpdates: boolean;
      taskUpdates: boolean;
      dailySummary: boolean;
      activeHours: boolean;
    };
  }

  // Buscar configurações atuais do chatbot do usuário
  const { data: settings, isLoading: settingsLoading } = useQuery<ChatbotSettings>({
    queryKey: ['/api/chatbot/settings'],
  });

  // Formulário com valores padrão
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: '',
      enableWhatsapp: false,
      projectUpdates: true,
      taskUpdates: true,
      dailySummary: false,
      activeHours: false,
    },
  });

  // Preencher o formulário quando os dados são carregados
  useEffect(() => {
    if (settings) {
      form.reset({
        phoneNumber: settings.phoneNumber || '',
        enableWhatsapp: settings.enabled || false,
        projectUpdates: settings.preferences?.projectUpdates ?? true,
        taskUpdates: settings.preferences?.taskUpdates ?? true,
        dailySummary: settings.preferences?.dailySummary ?? false,
        activeHours: settings.preferences?.activeHours ?? false,
      });
    }
  }, [settings, form]);

  // Mutação para salvar as configurações
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest('PUT', '/api/chatbot/settings', {
        phoneNumber: data.phoneNumber,
        enabled: data.enableWhatsapp,
        preferences: {
          projectUpdates: data.projectUpdates,
          taskUpdates: data.taskUpdates,
          dailySummary: data.dailySummary,
          activeHours: data.activeHours,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chatbot/settings'] });
      toast({
        title: 'Configurações salvas',
        description: 'Suas configurações do chatbot foram atualizadas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message || 'Ocorreu um erro ao salvar suas configurações.',
        variant: 'destructive',
      });
    },
  });

  // Enviar mensagem de teste
  const sendTestMessageMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/chatbot/test-message', {
        phoneNumber: form.getValues('phoneNumber'),
      });
      return response.json();
    },
    onSuccess: () => {
      setTestMessageSent(true);
      setTimeout(() => setTestMessageSent(false), 5000);
      toast({
        title: 'Mensagem de teste enviada',
        description:
          'Uma mensagem de teste foi enviada para o seu WhatsApp. Verifique seu telefone para confirmar o recebimento.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar mensagem de teste',
        description: error.message || 'Não foi possível enviar a mensagem de teste para o seu WhatsApp.',
        variant: 'destructive',
      });
    },
  });

  // Função para lidar com o envio do formulário
  const onSubmit = (data: FormValues) => {
    saveSettingsMutation.mutate(data);
  };

  // Função para enviar mensagem de teste
  const handleSendTestMessage = () => {
    const phoneNumber = form.getValues('phoneNumber');
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: 'Número de telefone inválido',
        description: 'Por favor, insira um número de telefone válido antes de enviar uma mensagem de teste.',
        variant: 'destructive',
      });
      return;
    }
    sendTestMessageMutation.mutate();
  };

  return (
    <div className="py-6 px-4 md:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Configurações do ChatBot WhatsApp</h2>
          <p className="text-gray-600 mt-1">
            Configure as notificações e integrações do chatbot com seu WhatsApp.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Configurações do WhatsApp</h3>
            <p className="text-sm text-gray-600">
              Conecte seu número do WhatsApp para receber atualizações e interagir com seus projetos através do chatbot.
            </p>
          </div>

          {settingsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de telefone (WhatsApp)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+5511999999999"
                          {...field}
                          disabled={saveSettingsMutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        Insira seu número de telefone com código do país e DDD (exemplo: +5511999999999)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableWhatsapp"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Ativar integração com WhatsApp</FormLabel>
                        <FormDescription>
                          Ative para receber notificações e interagir com seus projetos pelo WhatsApp
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={saveSettingsMutation.isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4">
                  <h4 className="text-base font-medium mb-2">Preferências de notificação</h4>
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="projectUpdates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={saveSettingsMutation.isPending}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Notificações de Projetos</FormLabel>
                            <FormDescription>
                              Receba notificações quando projetos forem atualizados
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taskUpdates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={saveSettingsMutation.isPending}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Notificações de Tarefas</FormLabel>
                            <FormDescription>
                              Receba notificações quando tarefas forem atualizadas ou atribuídas a você
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dailySummary"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={saveSettingsMutation.isPending}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Resumo Diário</FormLabel>
                            <FormDescription>
                              Receba um resumo diário com suas tarefas pendentes e atualizações de projetos
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="activeHours"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={saveSettingsMutation.isPending}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Apenas em Horário Comercial</FormLabel>
                            <FormDescription>
                              Limitar notificações ao horário comercial (8h às 18h)
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <Button
                    type="submit"
                    disabled={saveSettingsMutation.isPending}
                    className="flex-1"
                  >
                    {saveSettingsMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar Configurações
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendTestMessage}
                    disabled={sendTestMessageMutation.isPending || !form.getValues('phoneNumber')}
                    className="flex-1"
                  >
                    {sendTestMessageMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="mr-2 h-4 w-4" />
                    )}
                    Enviar Mensagem de Teste
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Sobre o ChatBot</h3>
            <p className="text-sm text-gray-600">
              Instruções e comandos disponíveis no chatbot do WhatsApp.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                <Bell className="h-4 w-4 mr-2 text-primary" />
                Como se conectar
              </h4>
              <p className="text-sm text-gray-600">
                1. Adicione o número do WhatsApp do sistema aos seus contatos: <strong>(XX) XXXXX-XXXX</strong>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                2. Inicie uma conversa enviando "olá" ou "login"
              </p>
              <p className="text-sm text-gray-600 mt-1">
                3. O chatbot solicitará seu nome de usuário e senha para autenticação
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Comandos disponíveis</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  <strong>projetos</strong> - Listar seus projetos
                </li>
                <li>
                  <strong>tarefas</strong> - Listar suas tarefas
                </li>
                <li>
                  <strong>pendente</strong> - Ver tarefas pendentes
                </li>
                <li>
                  <strong>relatorio X</strong> - Gerar relatório do projeto X
                </li>
                <li>
                  <strong>projeto X</strong> - Ver detalhes do projeto X
                </li>
                <li>
                  <strong>tarefa X</strong> - Ver detalhes da tarefa X
                </li>
                <li>
                  <strong>status</strong> - Ver seu status atual
                </li>
                <li>
                  <strong>ajuda</strong> - Ver lista de comandos
                </li>
                <li>
                  <strong>logout</strong> - Sair da sua conta
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Suporte e ajuda</h4>
              <p className="text-sm text-gray-600">
                Se tiver dúvidas ou problemas com o chatbot, entre em contato com o administrador do
                sistema ou acesse a seção de ajuda nas configurações.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}