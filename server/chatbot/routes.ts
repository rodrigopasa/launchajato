import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { webhookHandler } from './whatsapp';
import notifications from './notifications';

const router = Router();

// Esquema para as preferências do chatbot
const chatbotSettingsSchema = z.object({
  phoneNumber: z.string()
    .min(10, { message: 'O número de telefone precisa ter pelo menos 10 dígitos' })
    .max(15, { message: 'O número de telefone não pode exceder 15 dígitos' })
    .regex(/^\+?[0-9]+$/, { 
      message: 'O número de telefone deve conter apenas números e opcionalmente um + no início' 
    }),
  enabled: z.boolean().default(false),
  preferences: z.object({
    projectUpdates: z.boolean().default(true),
    taskUpdates: z.boolean().default(true),
    dailySummary: z.boolean().default(false),
    activeHours: z.boolean().default(false),
  }).optional(),
});

// Esquema para o envio de mensagem de teste
const testMessageSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  message: z.string().optional(),
});

// Armazenamento temporário das configurações dos usuários
// Em produção, isso seria armazenado no banco de dados
const userChatbotSettings = new Map<number, any>();

// Rota para obter configurações do chatbot do usuário
router.get('/settings', isAuthenticated, (req: Request, res: Response) => {
  const userId = req.session.userId!;
  
  // Verificar se o usuário já tem configurações salvas
  const settings = userChatbotSettings.get(userId) || {
    phoneNumber: '',
    enabled: false,
    preferences: {
      projectUpdates: true,
      taskUpdates: true,
      dailySummary: false,
      activeHours: false,
    },
  };
  
  res.json(settings);
});

// Rota para atualizar configurações do chatbot
router.put(
  '/settings', 
  isAuthenticated, 
  validateRequest(chatbotSettingsSchema), 
  (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const settings = req.body;
    
    // Salvar as configurações
    userChatbotSettings.set(userId, settings);
    
    // Se habilitado, adicionar às preferências de notificação
    if (settings.enabled) {
      notifications.addNotificationPreference(
        userId,
        settings.phoneNumber,
        settings.preferences?.projectUpdates,
        settings.preferences?.taskUpdates,
        settings.preferences?.dailySummary
      );
    } else {
      // Se desabilitado, remover das preferências de notificação
      notifications.removeNotificationPreference(userId);
    }
    
    res.json({ success: true, message: 'Configurações atualizadas com sucesso' });
  }
);

// Rota para enviar mensagem de teste
router.post(
  '/test-message', 
  isAuthenticated, 
  validateRequest(testMessageSchema), 
  (req: Request, res: Response) => {
    const { phoneNumber, message } = req.body;
    
    // Simulação de envio de mensagem
    // Em ambiente de produção, isso chamaria a API real do WhatsApp
    console.log(`[TESTE] Enviando mensagem para ${phoneNumber}: ${message || 'Olá! Esta é uma mensagem de teste do LaunchRocket.'}`);
    
    // Resposta de sucesso simulada
    res.json({ 
      success: true, 
      message: 'Mensagem de teste enviada com sucesso.' 
    });
  }
);

// Webhook do WhatsApp para receber e responder mensagens
router.get('/webhook', webhookHandler);
router.post('/webhook', webhookHandler);

export default router;