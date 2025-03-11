import { Router, Request, Response } from 'express';
import { getWhatsAppWebStatus, getLastQRCode, initWhatsAppWebClient, disconnectWhatsAppWeb, restartWhatsAppWeb } from './whatsapp-web';
import { storage } from '../storage';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Obter status da conexão WhatsApp Web
router.get('/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário é administrador
    if (res.locals.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Apenas administradores podem acessar configurações do WhatsApp'
      });
    }
    
    // Obter integração whatsapp_web do banco de dados
    const integration = await storage.getIntegrationByType('whatsapp_web');
    
    // Obter status do cliente
    const status = getWhatsAppWebStatus();
    
    return res.json({
      status,
      integration: integration || null
    });
  } catch (error) {
    console.error('Erro ao obter status do WhatsApp Web:', error);
    return res.status(500).json({ message: 'Erro ao obter status do WhatsApp Web' });
  }
});

// Obter QR Code para conexão
router.get('/qr-code', isAuthenticated, (req: Request, res: Response) => {
  try {
    // Verificar se o usuário é administrador
    if (res.locals.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Apenas administradores podem acessar configurações do WhatsApp'
      });
    }
    
    const qrCode = getLastQRCode();
    
    if (!qrCode) {
      return res.status(404).json({ message: 'QR Code não disponível' });
    }
    
    return res.json({ qrCode });
  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    return res.status(500).json({ message: 'Erro ao obter QR Code' });
  }
});

// Configurar e iniciar WhatsApp Web
router.post('/connect', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário é administrador
    if (res.locals.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Apenas administradores podem acessar configurações do WhatsApp'
      });
    }
    
    // Verificar se já existe uma integração
    let integration = await storage.getIntegrationByType('whatsapp_web');
    
    if (!integration) {
      // Criar uma nova integração
      integration = await storage.createIntegration({
        type: 'whatsapp_web',
        name: 'WhatsApp Web (QR Code)',
        enabled: true,
        credentials: {
          sessionActive: false,
          clientId: 'launchpro-whatsapp-web'
        },
        configuredBy: res.locals.user.id
      });
    } else {
      // Atualizar integração existente
      integration = await storage.updateIntegration(integration.id, {
        enabled: true,
        credentials: {
          ...(integration.credentials || {}),
          sessionActive: false,
          clientId: 'launchpro-whatsapp-web'
        }
      });
    }
    
    // Iniciar cliente
    await initWhatsAppWebClient();
    
    return res.json({
      message: 'Iniciando conexão WhatsApp Web, aguarde o QR Code',
      integration
    });
  } catch (error) {
    console.error('Erro ao iniciar conexão WhatsApp Web:', error);
    return res.status(500).json({ message: 'Erro ao iniciar conexão WhatsApp Web' });
  }
});

// Desconectar WhatsApp Web
router.post('/disconnect', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário é administrador
    if (res.locals.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Apenas administradores podem acessar configurações do WhatsApp'
      });
    }
    
    // Desativar integração no banco de dados
    const integration = await storage.getIntegrationByType('whatsapp_web');
    
    if (integration) {
      await storage.updateIntegration(integration.id, {
        enabled: false
      });
    }
    
    // Desconectar cliente
    const success = await disconnectWhatsAppWeb();
    
    if (success) {
      return res.json({ message: 'WhatsApp Web desconectado com sucesso' });
    } else {
      return res.status(500).json({ message: 'Erro ao desconectar WhatsApp Web' });
    }
  } catch (error) {
    console.error('Erro ao desconectar WhatsApp Web:', error);
    return res.status(500).json({ message: 'Erro ao desconectar WhatsApp Web' });
  }
});

// Reiniciar conexão
router.post('/restart', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário é administrador
    if (res.locals.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Apenas administradores podem acessar configurações do WhatsApp'
      });
    }
    
    await restartWhatsAppWeb();
    
    return res.json({ message: 'Conexão WhatsApp Web reiniciada, aguarde o QR Code' });
  } catch (error) {
    console.error('Erro ao reiniciar conexão WhatsApp Web:', error);
    return res.status(500).json({ message: 'Erro ao reiniciar conexão WhatsApp Web' });
  }
});

export default router;