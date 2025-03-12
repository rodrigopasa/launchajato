// Importação em modo ESM com tratamento para ambiente sem as dependências necessárias
import { storage } from '../storage';
import { log } from '../vite';

// Importações com tratamento de erro
let WAWebJS: any = null;
let qrcode: any = null;

try {
  // Usando dynamic import para compatibilidade com ESM
  import('whatsapp-web.js').then(module => {
    WAWebJS = module;
    log('WhatsApp Web carregado com sucesso', 'whatsapp-web');
  }).catch(error => {
    log(`Erro ao carregar WhatsApp Web: ${error}`, 'whatsapp-web');
  });
  
  import('qrcode-terminal').then(module => {
    qrcode = module.default;
    log('QR Code Terminal carregado com sucesso', 'whatsapp-web');
  }).catch(error => {
    log(`Erro ao carregar QR Code Terminal: ${error}`, 'whatsapp-web');
  });
} catch (error) {
  log(`Não foi possível carregar dependências do WhatsApp Web: ${error}`, 'whatsapp-web');
}

// Estado do cliente
let client: any = null;
let isClientReady = false;
let lastQRCode = '';

// Handler para mensagens
type MessageHandler = (message: string, from: string) => Promise<string>;
let messageHandlers: MessageHandler[] = [];

// Iniciar o cliente WhatsApp Web
export async function initWhatsAppWebClient(): Promise<void> {
  try {
    // Verificar se as dependências foram carregadas corretamente
    if (!WAWebJS || !qrcode) {
      log('Dependências do WhatsApp Web não estão disponíveis. A funcionalidade será desativada.', 'whatsapp-web');
      return;
    }
    
    // Verificar se já existe uma integração WhatsApp Web configurada e ativa
    const integration = await storage.getIntegrationByType('whatsapp_web');
    
    if (!integration || !integration.enabled) {
      log('Integração WhatsApp Web não configurada ou não ativa', 'whatsapp-web');
      return;
    }
    
    // Configurar cliente com opções básicas
    client = new WAWebJS.default.Client({
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
      }
    });

    // Evento quando QR code é recebido
    client.on('qr', (qr: any) => {
      lastQRCode = qr;
      log('QR Code recebido, gerando para terminal', 'whatsapp-web');
      qrcode.generate(qr, { small: true });
    });

    // Evento de autenticação concluída
    client.on('authenticated', () => {
      log('Autenticação concluída!', 'whatsapp-web');
    });

    // Evento quando cliente está pronto
    client.on('ready', () => {
      isClientReady = true;
      log('Cliente WhatsApp Web pronto!', 'whatsapp-web');
    });

    // Lidar com mensagens recebidas
    client.on('message', async (msg: any) => {
      if (msg.from === 'status@broadcast') return;
      
      const from = msg.from;
      const messageContent = msg.body;
      
      // Processar mensagem com os handlers registrados
      for (const handler of messageHandlers) {
        try {
          const response = await handler(messageContent, from);
          if (response) {
            await sendWhatsAppWebMessage(from, response);
            break;
          }
        } catch (error) {
          log(`Erro ao processar mensagem: ${error}`, 'whatsapp-web');
        }
      }
    });

    // Iniciar cliente
    await client.initialize();
  } catch (error) {
    log(`Erro ao inicializar cliente WhatsApp Web: ${error}`, 'whatsapp-web');
  }
}

// Registrar um handler para processar mensagens
export function registerMessageHandler(handler: MessageHandler): void {
  messageHandlers.push(handler);
}

// Enviar mensagem via WhatsApp Web
export async function sendWhatsAppWebMessage(to: string, message: string): Promise<boolean> {
  if (!client || !isClientReady) {
    log('Cliente WhatsApp Web não está pronto', 'whatsapp-web');
    return false;
  }

  try {
    await client.sendMessage(to, message);
    return true;
  } catch (error) {
    log(`Erro ao enviar mensagem: ${error}`, 'whatsapp-web');
    return false;
  }
}

// Obter status do cliente
export function getWhatsAppWebStatus(): { ready: boolean; authenticated: boolean } {
  return {
    ready: isClientReady,
    authenticated: isClientReady // Se o cliente está pronto, consideramos que está autenticado
  };
}

// Obter o último QR Code gerado
export function getLastQRCode(): string {
  return lastQRCode;
}

// Desconectar o cliente
export async function disconnectWhatsAppWeb(): Promise<boolean> {
  if (!client) return true;
  
  try {
    await client.destroy();
    client = null;
    isClientReady = false;
    lastQRCode = '';
    return true;
  } catch (error) {
    log(`Erro ao desconectar cliente WhatsApp Web: ${error}`, 'whatsapp-web');
    return false;
  }
}

// Reiniciar o cliente
export async function restartWhatsAppWeb(): Promise<void> {
  await disconnectWhatsAppWeb();
  await initWhatsAppWebClient();
}