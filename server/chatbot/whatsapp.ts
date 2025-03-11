import { Request, Response } from 'express';
import { storage } from '../storage';
import crypto from 'crypto';

// Armazenamento temporário de sessões de usuários no chatbot
interface ChatSession {
  userId?: number;
  authenticated: boolean;
  username?: string;
  pendingAuth: boolean;
  lastActivity: Date;
  conversationState: 'initial' | 'awaiting_username' | 'awaiting_password' | 'authenticated' | 'viewing_project' | 'viewing_task';
  currentProjectId?: number;
  currentTaskId?: number;
}

const chatSessions = new Map<string, ChatSession>();

// Gerencia as sessões do chat (expiração após 30 minutos de inatividade)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos em milissegundos

function cleanupSessions() {
  const now = new Date();
  // Usando Array.from para evitar problemas de iteração
  Array.from(chatSessions.entries()).forEach(([phoneNumber, session]) => {
    if (now.getTime() - session.lastActivity.getTime() > SESSION_TIMEOUT) {
      chatSessions.delete(phoneNumber);
    }
  });
}

// Executar limpeza de sessão a cada 5 minutos
setInterval(cleanupSessions, 5 * 60 * 1000);

// Obter ou criar uma sessão para um número de telefone
function getSession(phoneNumber: string): ChatSession {
  if (!chatSessions.has(phoneNumber)) {
    chatSessions.set(phoneNumber, {
      authenticated: false,
      pendingAuth: false,
      lastActivity: new Date(),
      conversationState: 'initial',
    });
  }

  const session = chatSessions.get(phoneNumber)!;
  session.lastActivity = new Date(); // Atualiza a hora da última atividade
  return session;
}

// Processa a mensagem do usuário e retorna uma resposta apropriada
async function processMessage(phoneNumber: string, message: string): Promise<string> {
  const session = getSession(phoneNumber);
  message = message.trim().toLowerCase();

  // Se o usuário não está autenticado, inicia o fluxo de autenticação
  if (!session.authenticated) {
    return await handleAuthFlow(session, message);
  }

  // Usuário está autenticado, processar comandos
  return await handleAuthenticatedCommands(session, message);
}

// Gerencia o fluxo de autenticação
async function handleAuthFlow(session: ChatSession, message: string): Promise<string> {
  if (session.conversationState === 'initial' || message === 'login') {
    session.conversationState = 'awaiting_username';
    return 'Bem-vindo ao LaunchRocket! Para acessar informações sobre seus projetos, por favor faça login.\n\nDigite seu nome de usuário:';
  } 
  
  if (session.conversationState === 'awaiting_username') {
    session.username = message;
    session.conversationState = 'awaiting_password';
    return 'Digite sua senha:';
  }
  
  if (session.conversationState === 'awaiting_password') {
    const username = session.username!;
    const password = message;
    
    // Verificar autenticação com o sistema
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        session.conversationState = 'awaiting_username';
        return 'Usuário não encontrado. Por favor, digite seu nome de usuário novamente:';
      }
      
      // Normalmente você teria uma função para verificar a senha
      // Isso é apenas uma simulação básica
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      
      // Simulação da verificação - na implementação real, isso viria de um middleware de autenticação
      if (passwordHash !== user.password) {
        session.conversationState = 'awaiting_password';
        return 'Senha incorreta. Por favor, tente novamente:';
      }
      
      // Autenticação bem-sucedida
      session.authenticated = true;
      session.userId = user.id;
      session.conversationState = 'authenticated';
      
      return `Olá, ${user.name}! Você está logado no LaunchRocket. Você pode usar os seguintes comandos:\n\n- *projetos*: Listar seus projetos\n- *tarefas*: Listar suas tarefas\n- *pendente*: Ver tarefas pendentes\n- *relatorio X*: Gerar relatório do projeto X\n- *status*: Ver seu status atual\n- *ajuda*: Ver lista de comandos`;
    } catch (error) {
      console.error('Erro na autenticação:', error);
      session.conversationState = 'initial';
      return 'Ocorreu um erro durante a autenticação. Por favor, tente novamente digitando "login".';
    }
  }
  
  return 'Digite "login" para iniciar o processo de autenticação.';
}

// Gerencia comandos depois que o usuário está autenticado
async function handleAuthenticatedCommands(session: ChatSession, message: string): Promise<string> {
  if (message === 'logout') {
    session.authenticated = false;
    session.userId = undefined;
    session.conversationState = 'initial';
    return 'Você saiu da sua conta. Digite "login" para entrar novamente.';
  }
  
  if (message === 'ajuda') {
    return 'Comandos disponíveis:\n\n- *projetos*: Listar seus projetos\n- *tarefas*: Listar suas tarefas\n- *pendente*: Ver tarefas pendentes\n- *relatorio X*: Gerar relatório do projeto X\n- *projeto X*: Ver detalhes do projeto X\n- *tarefa X*: Ver detalhes da tarefa X\n- *status*: Ver seu status atual\n- *logout*: Sair da sua conta\n- *ajuda*: Ver esta lista de comandos';
  }
  
  if (message === 'projetos') {
    try {
      const projects = await storage.getProjectsByUser(session.userId!);
      
      if (!projects || projects.length === 0) {
        return 'Você não tem projetos atribuídos. Para ver todos os projetos, peça ao administrador.';
      }
      
      let response = 'Seus projetos:\n\n';
      projects.forEach((project, index) => {
        response += `${index + 1}. *${project.name}* (${getProjectStatusText(project.status)}) - Progresso: ${project.progress}%\n`;
      });
      
      response += '\nDigite "projeto X" para ver mais detalhes sobre um projeto específico, onde X é o número do projeto.';
      
      return response;
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      return 'Ocorreu um erro ao buscar seus projetos. Por favor, tente novamente.';
    }
  }
  
  if (message === 'tarefas') {
    try {
      const tasks = await storage.getTasksByUser(session.userId!);
      
      if (!tasks || tasks.length === 0) {
        return 'Você não tem tarefas atribuídas.';
      }
      
      let response = 'Suas tarefas:\n\n';
      tasks.forEach((task, index) => {
        response += `${index + 1}. *${task.name}* (${getTaskStatusText(task.status)}) - Prioridade: ${getTaskPriorityText(task.priority)}\n`;
      });
      
      response += '\nDigite "tarefa X" para ver mais detalhes sobre uma tarefa específica, onde X é o número da tarefa.';
      
      return response;
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      return 'Ocorreu um erro ao buscar suas tarefas. Por favor, tente novamente.';
    }
  }
  
  if (message === 'pendente') {
    try {
      const tasks = await storage.getTasksByUser(session.userId!);
      
      const pendingTasks = tasks.filter(task => 
        task.status === 'todo' || task.status === 'in_progress' || task.status === 'review'
      );
      
      if (!pendingTasks || pendingTasks.length === 0) {
        return 'Você não tem tarefas pendentes. Bom trabalho!';
      }
      
      let response = 'Suas tarefas pendentes:\n\n';
      pendingTasks.forEach((task, index) => {
        response += `${index + 1}. *${task.name}* (${getTaskStatusText(task.status)}) - Prioridade: ${getTaskPriorityText(task.priority)}\n`;
      });
      
      return response;
    } catch (error) {
      console.error('Erro ao buscar tarefas pendentes:', error);
      return 'Ocorreu um erro ao buscar suas tarefas pendentes. Por favor, tente novamente.';
    }
  }
  
  if (message.startsWith('projeto ')) {
    const projectIndex = parseInt(message.substring(8)) - 1;
    if (isNaN(projectIndex) || projectIndex < 0) {
      return 'Número de projeto inválido. Por favor, digite "projetos" para ver a lista numerada.';
    }
    
    try {
      const projects = await storage.getProjectsByUser(session.userId!);
      
      if (!projects || projectIndex >= projects.length) {
        return 'Projeto não encontrado. Por favor, digite "projetos" para ver a lista numerada.';
      }
      
      const project = projects[projectIndex];
      session.currentProjectId = project.id;
      session.conversationState = 'viewing_project';
      
      // Buscar membros do projeto
      const members = await storage.getProjectMembers(project.id);
      
      // Buscar tarefas do projeto
      const tasks = await storage.getTasksByProject(project.id);
      
      // Preparar contador de status de tarefas
      const taskStatusCounts = {
        todo: 0,
        in_progress: 0,
        review: 0,
        completed: 0
      };
      
      if (tasks && tasks.length > 0) {
        tasks.forEach(task => {
          if (task.status in taskStatusCounts) {
            taskStatusCounts[task.status as keyof typeof taskStatusCounts]++;
          }
        });
      }
      
      let response = `*Detalhes do Projeto: ${project.name}*\n\n`;
      response += `*Status:* ${getProjectStatusText(project.status)}\n`;
      response += `*Progresso:* ${project.progress}%\n`;
      response += `*Prazo:* ${project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Não definido'}\n`;
      response += `*Descrição:* ${project.description || 'Sem descrição'}\n\n`;
      
      response += `*Equipe:* ${members.length} membros\n`;
      response += `*Tarefas:* ${tasks.length} total\n`;
      response += `  - ${taskStatusCounts.todo} a fazer\n`;
      response += `  - ${taskStatusCounts.in_progress} em andamento\n`;
      response += `  - ${taskStatusCounts.review} em revisão\n`;
      response += `  - ${taskStatusCounts.completed} concluídas\n\n`;
      
      response += 'Digite "tarefas projeto" para ver as tarefas deste projeto ou "voltar" para retornar ao menu principal.';
      
      return response;
    } catch (error) {
      console.error('Erro ao buscar detalhes do projeto:', error);
      return 'Ocorreu um erro ao buscar os detalhes do projeto. Por favor, tente novamente.';
    }
  }
  
  if (message.startsWith('tarefa ')) {
    const taskIndex = parseInt(message.substring(7)) - 1;
    if (isNaN(taskIndex) || taskIndex < 0) {
      return 'Número de tarefa inválido. Por favor, digite "tarefas" para ver a lista numerada.';
    }
    
    try {
      const tasks = await storage.getTasksByUser(session.userId!);
      
      if (!tasks || taskIndex >= tasks.length) {
        return 'Tarefa não encontrada. Por favor, digite "tarefas" para ver a lista numerada.';
      }
      
      const task = tasks[taskIndex];
      session.currentTaskId = task.id;
      session.conversationState = 'viewing_task';
      
      // Buscar o projeto da tarefa
      const project = await storage.getProject(task.projectId);
      
      // Buscar itens da checklist
      const checklistItems = await storage.getChecklistItems(task.id);
      
      let response = `*Detalhes da Tarefa: ${task.name}*\n\n`;
      response += `*Projeto:* ${project ? project.name : 'Desconhecido'}\n`;
      response += `*Status:* ${getTaskStatusText(task.status)}\n`;
      response += `*Prioridade:* ${getTaskPriorityText(task.priority)}\n`;
      response += `*Prazo:* ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Não definido'}\n`;
      response += `*Descrição:* ${task.description || 'Sem descrição'}\n\n`;
      
      if (checklistItems && checklistItems.length > 0) {
        response += '*Checklist:*\n';
        checklistItems.forEach((item, index) => {
          response += `${index + 1}. [${item.isCompleted ? '✓' : ' '}] ${item.text}\n`;
        });
      }
      
      response += '\nDigite "voltar" para retornar ao menu principal.';
      
      return response;
    } catch (error) {
      console.error('Erro ao buscar detalhes da tarefa:', error);
      return 'Ocorreu um erro ao buscar os detalhes da tarefa. Por favor, tente novamente.';
    }
  }
  
  if (message.startsWith('relatorio ')) {
    const projectIndex = parseInt(message.substring(10)) - 1;
    if (isNaN(projectIndex) || projectIndex < 0) {
      return 'Número de projeto inválido. Por favor, digite "projetos" para ver a lista numerada.';
    }
    
    try {
      const projects = await storage.getProjectsByUser(session.userId!);
      
      if (!projects || projectIndex >= projects.length) {
        return 'Projeto não encontrado. Por favor, digite "projetos" para ver a lista numerada.';
      }
      
      const project = projects[projectIndex];
      
      // Buscar tarefas do projeto
      const tasks = await storage.getTasksByProject(project.id);
      
      // Buscar membros do projeto
      const members = await storage.getProjectMembers(project.id);
      
      // Buscar atividades recentes
      const activities = await storage.getActivitiesByProject(project.id, 5);
      
      let response = `*Relatório do Projeto: ${project.name}*\n\n`;
      response += `*Status:* ${getProjectStatusText(project.status)}\n`;
      response += `*Progresso:* ${project.progress}%\n`;
      response += `*Prazo:* ${project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Não definido'}\n\n`;
      
      // Contar tarefas por status
      const taskStatusCounts = {
        todo: 0,
        in_progress: 0,
        review: 0,
        completed: 0
      };
      
      if (tasks && tasks.length > 0) {
        tasks.forEach(task => {
          if (task.status in taskStatusCounts) {
            taskStatusCounts[task.status as keyof typeof taskStatusCounts]++;
          }
        });
      }
      
      response += `*Progresso de Tarefas:*\n`;
      const totalTasks = tasks ? tasks.length : 0;
      if (totalTasks > 0) {
        const completedPercentage = Math.round((taskStatusCounts.completed / totalTasks) * 100);
        response += `- ${completedPercentage}% concluído (${taskStatusCounts.completed}/${totalTasks})\n`;
        response += `- ${taskStatusCounts.todo} tarefas a fazer\n`;
        response += `- ${taskStatusCounts.in_progress} tarefas em andamento\n`;
        response += `- ${taskStatusCounts.review} tarefas em revisão\n`;
      } else {
        response += '- Não há tarefas cadastradas\n';
      }
      
      response += `\n*Equipe:* ${members.length} membros\n`;
      
      // Mostrar atividades recentes
      if (activities && activities.length > 0) {
        response += '\n*Atividades Recentes:*\n';
        activities.forEach((activity, index) => {
          const date = new Date(activity.createdAt).toLocaleDateString('pt-BR');
          response += `${index + 1}. [${date}] ${activity.action} ${activity.subject}\n`;
        });
      }
      
      return response;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return 'Ocorreu um erro ao gerar o relatório. Por favor, tente novamente.';
    }
  }
  
  if (message === 'status') {
    try {
      const user = await storage.getUser(session.userId!);
      
      if (!user) {
        return 'Erro ao recuperar informações do usuário.';
      }
      
      const projects = await storage.getProjectsByUser(session.userId!);
      const tasks = await storage.getTasksByUser(session.userId!);
      
      const pendingTasks = tasks.filter(task => 
        task.status === 'todo' || task.status === 'in_progress' || task.status === 'review'
      );
      
      let response = `*Status de ${user.name}*\n\n`;
      response += `*Projetos:* ${projects.length} atribuídos\n`;
      response += `*Tarefas:* ${tasks.length} total\n`;
      response += `*Pendentes:* ${pendingTasks.length} tarefas\n\n`;
      
      // Mostrar próximas tarefas com prazo
      const upcomingTasks = pendingTasks
        .filter(task => task.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 3);
      
      if (upcomingTasks.length > 0) {
        response += '*Próximos prazos:*\n';
        upcomingTasks.forEach((task, index) => {
          const dueDate = new Date(task.dueDate!).toLocaleDateString('pt-BR');
          response += `${index + 1}. *${task.name}* - ${dueDate}\n`;
        });
      }
      
      return response;
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      return 'Ocorreu um erro ao buscar seu status. Por favor, tente novamente.';
    }
  }
  
  if (message === 'voltar' && (session.conversationState === 'viewing_project' || session.conversationState === 'viewing_task')) {
    session.conversationState = 'authenticated';
    session.currentProjectId = undefined;
    session.currentTaskId = undefined;
    return 'Voltando ao menu principal. Digite "ajuda" para ver a lista de comandos disponíveis.';
  }
  
  if (session.conversationState === 'viewing_project' && message === 'tarefas projeto') {
    try {
      const tasks = await storage.getTasksByProject(session.currentProjectId!);
      
      if (!tasks || tasks.length === 0) {
        return 'Este projeto não tem tarefas cadastradas.';
      }
      
      let response = 'Tarefas do projeto:\n\n';
      tasks.forEach((task, index) => {
        response += `${index + 1}. *${task.name}* (${getTaskStatusText(task.status)}) - Prioridade: ${getTaskPriorityText(task.priority)}\n`;
      });
      
      response += '\nDigite "voltar" para retornar ao menu principal.';
      
      return response;
    } catch (error) {
      console.error('Erro ao buscar tarefas do projeto:', error);
      return 'Ocorreu um erro ao buscar as tarefas do projeto. Por favor, tente novamente.';
    }
  }
  
  return 'Comando não reconhecido. Digite "ajuda" para ver a lista de comandos disponíveis.';
}

// Funções auxiliares para formatação do texto
function getProjectStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    planning: 'Em planejamento',
    in_progress: 'Em andamento',
    testing: 'Em testes',
    completed: 'Concluído',
    on_hold: 'Em pausa'
  };
  
  return statusTexts[status] || status;
}

function getTaskStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    todo: 'A fazer',
    in_progress: 'Em andamento',
    review: 'Em revisão',
    completed: 'Concluído'
  };
  
  return statusTexts[status] || status;
}

function getTaskPriorityText(priority: string): string {
  const priorityTexts: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta'
  };
  
  return priorityTexts[priority] || priority;
}

// Webhook para receber mensagens do WhatsApp
export async function webhookHandler(req: Request, res: Response) {
  try {
    // Verificação da API do WhatsApp (WEBHOOK_VERIFY_TOKEN deve ser configurado no .env)
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      
      // Verificar o token do webhook (isso vem da configuração do Facebook Developer)
      if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        console.log('Webhook verificado com sucesso');
        return res.status(200).send(challenge);
      } else {
        return res.sendStatus(403);
      }
    }

    // Processar mensagens recebidas
    if (req.method === 'POST') {
      const body = req.body;
      
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          // Obter as alterações (pode conter múltiplas mensagens)
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              for (const message of change.value.messages) {
                if (message.type === 'text') {
                  const phoneNumber = message.from;
                  const text = message.text.body;
                  
                  console.log(`Mensagem recebida de ${phoneNumber}: ${text}`);
                  
                  // Processar a mensagem e obter a resposta
                  const response = await processMessage(phoneNumber, text);
                  
                  // Enviar resposta (simulado aqui - na implementação real, você chamaria a API do WhatsApp)
                  console.log(`Enviando resposta para ${phoneNumber}: ${response}`);
                  
                  // Aqui você chamaria a API do WhatsApp para enviar a resposta ao usuário
                  // sendWhatsAppMessage(phoneNumber, response);
                }
              }
            }
          }
        }
      }
      
      return res.sendStatus(200);
    }
  } catch (error) {
    console.error('Erro no webhook do WhatsApp:', error);
    return res.sendStatus(500);
  }
}

// Função para enviar mensagem via API do WhatsApp (implementação conforme sua API)
async function sendWhatsAppMessage(to: string, message: string) {
  try {
    // Aqui você implementaria a chamada para a API da Meta/WhatsApp Business
    // Exemplo usando fetch:
    /*
    const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: message }
      })
    });
    
    const result = await response.json();
    console.log('Mensagem enviada:', result);
    return result;
    */
    
    // Log para simular o envio da mensagem
    console.log(`[SIMULAÇÃO] Mensagem enviada para ${to}: ${message}`);
  } catch (error) {
    console.error('Erro ao enviar mensagem via WhatsApp:', error);
    throw error;
  }
}

export default {
  webhookHandler
};