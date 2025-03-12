import { useState, useEffect } from "react";
import { 
  Bell, 
  X, 
  Check, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Clock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { transitions } from "@/lib/animations";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// Types para notificações
type NotificationType = "info" | "warning" | "success" | "error";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: Date;
  link?: string;
  actionText?: string;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Em produção, você buscaria notificações da API
  useEffect(() => {
    // Simulação de carregamento de dados da API
    const loadNotifications = async () => {
      try {
        // Em produção: const response = await fetch('/api/notifications');
        // const data = await response.json();
        
        // Notificações temporárias para visualização
        const tempNotifications: Notification[] = [
          {
            id: "1",
            title: "Tarefa atribuída",
            message: "Você foi designado para uma nova tarefa no projeto 'LaunchRocket'",
            type: "info",
            read: false,
            timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutos atrás
          },
          {
            id: "2",
            title: "Prazo se aproximando",
            message: "O prazo para a entrega do projeto 'Website Redesign' é amanhã",
            type: "warning",
            read: false,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
          }
        ];
        
        setNotifications(tempNotifications);
      } catch (error) {
        console.error("Erro ao carregar notificações:", error);
      }
    };
    
    loadNotifications();
    
    // Em produção, você usaria WebSockets para notificações em tempo real
    return () => {
      // Cleanup do WebSocket em produção
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const getFilteredNotifications = () => {
    if (activeTab === "unread") {
      return notifications.filter(n => !n.read);
    } else if (activeTab === "read") {
      return notifications.filter(n => n.read);
    }
    return notifications;
  };
  
  const markAsRead = (id: string) => {
    // Em produção: await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };
  
  const markAllAsRead = () => {
    // Em produção: await fetch(`/api/notifications/markAllRead`, { method: 'PUT' });
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };
  
  const deleteNotification = (id: string) => {
    // Em produção: await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    setNotifications(prev => 
      prev.filter(n => n.id !== id)
    );
  };
  
  const clearAllNotifications = () => {
    // Em produção: await fetch(`/api/notifications/clear`, { method: 'DELETE' });
    setNotifications([]);
  };
  
  const getIcon = (type: NotificationType) => {
    switch(type) {
      case "info": return <Info className="h-4 w-4 text-blue-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "success": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative p-2"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={transitions.quick}
              className="absolute -top-1 -right-1"
            >
              <Badge variant="destructive" className="px-1.5 py-0.5 text-xs font-semibold">
                {unreadCount}
              </Badge>
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0" align="end">
        <div className="p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Notificações</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="h-8 px-2 text-xs"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Marcar tudo como lido
              </Button>
            )}
          </div>
        </div>
        
        <Separator />
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="p-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-xs">
                Todas
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                Não lidas {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="read" className="text-xs">
                Lidas
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="mt-0">
            <NotificationList 
              notifications={getFilteredNotifications()} 
              markAsRead={markAsRead} 
              deleteNotification={deleteNotification}
              getIcon={getIcon}
            />
          </TabsContent>
          
          <TabsContent value="unread" className="mt-0">
            <NotificationList 
              notifications={getFilteredNotifications()} 
              markAsRead={markAsRead} 
              deleteNotification={deleteNotification}
              getIcon={getIcon}
            />
          </TabsContent>
          
          <TabsContent value="read" className="mt-0">
            <NotificationList 
              notifications={getFilteredNotifications()} 
              markAsRead={markAsRead} 
              deleteNotification={deleteNotification}
              getIcon={getIcon}
            />
          </TabsContent>
        </Tabs>
        
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-3 flex justify-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllNotifications}
                className="text-xs"
              >
                Limpar todas as notificações
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  getIcon: (type: NotificationType) => JSX.Element;
}

function NotificationList({ 
  notifications, 
  markAsRead, 
  deleteNotification,
  getIcon
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <Bell className="h-10 w-10 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500 text-center">
          Não há notificações para exibir
        </p>
      </div>
    );
  }
  
  return (
    <ScrollArea className="max-h-[400px]">
      <div className="divide-y">
        <AnimatePresence initial={false}>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ ...transitions.quick }}
              className="overflow-hidden"
            >
              <div 
                className={cn(
                  "p-3 hover:bg-gray-50 transition-colors relative",
                  !notification.read && "bg-blue-50"
                )}
              >
                {!notification.read && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-full bg-blue-500"
                  />
                )}
                
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "text-sm font-medium mb-1 line-clamp-1",
                      !notification.read && "font-semibold"
                    )}>
                      {notification.title}
                    </h4>
                    <p className="text-xs text-gray-500 mb-1.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {formatDistanceToNow(notification.timestamp, { 
                            addSuffix: true,
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                      
                      <div className="flex gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}