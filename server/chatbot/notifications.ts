import { storage } from '../storage';
import { Activity, ProjectMember, User } from '@shared/schema';

// Interface para armazenar as preferências de notificação dos usuários
interface NotificationPreference {
  userId: number;
  phoneNumber: string;
  projectUpdates: boolean;
  taskUpdates: boolean;
  dailySummary: boolean;
  lastNotified: Date;
}

// Armazenamento de preferências (em produção, isso seria armazenado no banco de dados)
const notificationPreferences = new Map<number, NotificationPreference>();

// Sistema de cache de atividades já notificadas para evitar duplicatas
const notifiedActivities = new Set<number>();

// Adicionar preferência de notificação para um usuário
export function addNotificationPreference(
  userId: number,
  phoneNumber: string,
  projectUpdates = true,
  taskUpdates = true,
  dailySummary = false
): void {
  notificationPreferences.set(userId, {
    userId,
    phoneNumber,
    projectUpdates,
    taskUpdates,
    dailySummary,
    lastNotified: new Date()
  });
}

// Remover preferência de notificação
export function removeNotificationPreference(userId: number): boolean {
  return notificationPreferences.delete(userId);
}

// Atualizar preferência de notificação
export function updateNotificationPreference(
  userId: number,
  updates: Partial<Omit<NotificationPreference, 'userId'>>
): boolean {
  const preference = notificationPreferences.get(userId);
  
  if (!preference) {
    return false;
  }
  
  notificationPreferences.set(userId, { ...preference, ...updates });
  return true;
}

// Verificar novas atividades e enviar notificações
export async function processNotifications(): Promise<void> {
  try {
    // Para cada usuário com preferências de notificação
    for (const [userId, preference] of notificationPreferences.entries()) {
      // Buscar projetos do usuário
      const projects = await storage.getProjectsByUser(userId);
      
      if (!projects || projects.length === 0) {
        continue;
      }
      
      // Para cada projeto, verificar atividades recentes
      for (const project of projects) {
        // Buscar atividades recentes (desde a última notificação)
        const activities = await storage.getActivitiesByProject(project.id);
        
        if (!activities || activities.length === 0) {
          continue;
        }
        
        // Filtrar atividades não notificadas e mais recentes que a última notificação
        const newActivities = activities.filter(activity => 
          !notifiedActivities.has(activity.id) && 
          new Date(activity.createdAt) > preference.lastNotified
        );
        
        if (newActivities.length === 0) {
          continue;
        }
        
        // Notificar o usuário sobre as novas atividades
        for (const activity of newActivities) {
          // Verificar se é uma atualização de projeto ou tarefa
          if (
            (activity.subject === 'projeto' && preference.projectUpdates) || 
            (activity.subject === 'tarefa' && preference.taskUpdates)
          ) {
            // Aqui você chamaria a função para enviar mensagem via WhatsApp
            // Por exemplo: await sendWhatsAppMessage(preference.phoneNumber, formatNotificationMessage(activity));
            
            // Marcar a atividade como notificada
            notifiedActivities.add(activity.id);
            
            // Log
            console.log(`[NOTIFICAÇÃO] Enviada para ${preference.phoneNumber} sobre ${activity.action} ${activity.subject}`);
          }
        }
      }
      
      // Atualizar a data da última notificação
      preference.lastNotified = new Date();
    }
  } catch (error) {
    console.error('Erro ao processar notificações:', error);
  }
}

// Processar relatórios diários para usuários que optaram por recebê-los
export async function processDailySummaries(): Promise<void> {
  try {
    const now = new Date();
    const targetHour = 8; // Enviar relatório diário às 8h da manhã
    
    // Verificar se é hora de enviar o relatório (entre 8:00 e 8:10)
    if (now.getHours() === targetHour && now.getMinutes() < 10) {
      // Para cada usuário com preferências de notificação
      for (const [userId, preference] of notificationPreferences.entries()) {
        // Verificar se o usuário optou por receber resumos diários
        if (!preference.dailySummary) {
          continue;
        }
        
        // Buscar dados para o relatório diário
        const user = await storage.getUser(userId);
        const tasks = await storage.getTasksByUser(userId);
        const projects = await storage.getProjectsByUser(userId);
        
        if (!user) {
          continue;
        }
        
        // Filtrar tarefas pendentes e com prazo próximo
        const pendingTasks = tasks.filter(task => 
          task.status !== 'completed' && 
          task.dueDate && 
          new Date(task.dueDate).getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000 // 3 dias
        );
        
        // Formar a mensagem do relatório diário
        let message = `*Bom dia, ${user.name}!*\n\n`;
        message += `Aqui está seu resumo diário do LaunchRocket de ${now.toLocaleDateString('pt-BR')}:\n\n`;
        
        // Adicionar tarefas pendentes
        if (pendingTasks.length > 0) {
          message += `*Tarefas pendentes com prazo próximo (3 dias):* ${pendingTasks.length}\n`;
          pendingTasks.forEach((task, index) => {
            if (index < 5) { // Limitar a 5 tarefas para não sobrecarregar a mensagem
              const dueDate = new Date(task.dueDate!).toLocaleDateString('pt-BR');
              message += `${index + 1}. *${task.name}* - Prazo: ${dueDate}\n`;
            }
          });
          
          if (pendingTasks.length > 5) {
            message += `... e mais ${pendingTasks.length - 5} tarefas pendentes\n`;
          }
          
          message += '\n';
        } else {
          message += "*Você não tem tarefas pendentes com prazo próximo. Bom trabalho!*\n\n";
        }
        
        // Adicionar informações sobre projetos
        if (projects.length > 0) {
          message += `*Seus projetos:* ${projects.length}\n`;
          for (let i = 0; i < Math.min(3, projects.length); i++) {
            const project = projects[i];
            message += `${i + 1}. *${project.name}* - Progresso: ${project.progress}%\n`;
          }
          
          if (projects.length > 3) {
            message += `... e mais ${projects.length - 3} projetos\n`;
          }
        }
        
        // Enviar mensagem
        // Aqui você chamaria a função para enviar mensagem via WhatsApp
        // Por exemplo: await sendWhatsAppMessage(preference.phoneNumber, message);
        
        // Log
        console.log(`[RELATÓRIO DIÁRIO] Enviado para ${preference.phoneNumber}`);
      }
    }
  } catch (error) {
    console.error('Erro ao processar relatórios diários:', error);
  }
}

// Formatar uma mensagem de notificação com base na atividade
function formatNotificationMessage(activity: Activity): string {
  let message = `*Notificação do LaunchRocket*\n\n`;
  
  if (activity.subject === 'projeto') {
    message += `Um projeto foi ${activity.action}:\n`;
  } else if (activity.subject === 'tarefa') {
    message += `Uma tarefa foi ${activity.action}:\n`;
  } else {
    message += `Atualização: ${activity.action} ${activity.subject}\n`;
  }
  
  if (activity.details) {
    message += `${activity.details}\n`;
  }
  
  message += `\nData: ${new Date(activity.createdAt).toLocaleString('pt-BR')}`;
  
  return message;
}

// Configurar agendador para verificar notificações a cada 5 minutos
export function setupNotificationScheduler(): void {
  // Verificar notificações a cada 5 minutos
  setInterval(processNotifications, 5 * 60 * 1000);
  
  // Verificar relatórios diários a cada hora
  setInterval(processDailySummaries, 60 * 60 * 1000);
  
  console.log('Sistema de notificações do ChatBot inicializado');
}

export default {
  addNotificationPreference,
  removeNotificationPreference,
  updateNotificationPreference,
  processNotifications,
  processDailySummaries,
  setupNotificationScheduler
};