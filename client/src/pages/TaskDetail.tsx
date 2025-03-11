import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, ArrowLeft, Calendar, Edit, Trash, CheckCircle, Clock, ArrowRight, ListChecks, Send, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TaskForm, type TaskFormValues } from "@/components/tasks/TaskForm";
import FileUpload from "@/components/files/FileUpload";
import FileList from "@/components/files/FileList";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'todo':
      return 'bg-gray-100 text-gray-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'review':
      return 'bg-purple-100 text-purple-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'todo':
      return 'A fazer';
    case 'in_progress':
      return 'Em andamento';
    case 'review':
      return 'Em revisão';
    case 'completed':
      return 'Concluído';
    default:
      return status;
  }
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'Alta';
    case 'medium':
      return 'Média';
    case 'low':
      return 'Baixa';
    default:
      return priority;
  }
};

export default function TaskDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/tasks/:id");
  const taskId = params?.id ? parseInt(params.id) : 0;
  
  const [activeTab, setActiveTab] = useState("detalhes");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newComment, setNewComment] = useState("");
  
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  
  // Fetch task details
  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: [`/api/tasks/${taskId}`],
    enabled: taskId > 0,
  });
  
  // Fetch project details for this task
  const { data: project } = useQuery({
    queryKey: [`/api/projects/${task?.projectId}`],
    enabled: !!task?.projectId,
  });
  
  // Fetch user details for assigned user
  const { data: assignedUser } = useQuery({
    queryKey: [`/api/users/${task?.assignedTo}`],
    enabled: !!task?.assignedTo,
  });
  
  // Fetch comments for this task
  const { data: comments = [] } = useQuery({
    queryKey: [`/api/tasks/${taskId}/comments`],
    enabled: taskId > 0,
  });
  
  // Fetch checklist items for this task
  const { data: checklistItems = [], isLoading: checklistLoading } = useQuery({
    queryKey: [`/api/tasks/${taskId}/checklist`],
    enabled: taskId > 0,
  });
  
  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      return apiRequest(`/api/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/user/me"] });
      toast({
        title: "Tarefa atualizada",
        description: "A tarefa foi atualizada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message || "Ocorreu um erro ao atualizar a tarefa",
        variant: "destructive",
      });
    },
  });
  
  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Tarefa excluída",
        description: "A tarefa foi excluída com sucesso",
      });
      setLocation("/tasks");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir tarefa",
        description: error.message || "Ocorreu um erro ao excluir a tarefa",
        variant: "destructive",
      });
    },
  });
  
  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return apiRequest(`/api/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ ...task, status: newStatus }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/user/me"] });
      toast({
        title: "Status atualizado",
        description: "O status da tarefa foi atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro ao atualizar o status da tarefa",
        variant: "destructive",
      });
    },
  });
  
  // Add checklist item mutation
  const addChecklistItemMutation = useMutation({
    mutationFn: async (text: string) => {
      return apiRequest(`/api/tasks/${taskId}/checklist`, {
        method: "POST",
        body: JSON.stringify({ 
          text,
          taskId,
          order: checklistItems.length,
          isCompleted: false
        }),
      });
    },
    onSuccess: () => {
      setNewChecklistItem("");
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/checklist`] });
      toast({
        title: "Item adicionado",
        description: "O item foi adicionado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar item",
        description: error.message || "Ocorreu um erro ao adicionar o item",
        variant: "destructive",
      });
    },
  });
  
  // Toggle checklist item completion mutation
  const toggleChecklistItemMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: number; isCompleted: boolean }) => {
      return apiRequest(`/api/checklist/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isCompleted }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/checklist`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar item",
        description: error.message || "Ocorreu um erro ao atualizar o item",
        variant: "destructive",
      });
    },
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/projects/${task.projectId}/comments`, {
        method: "POST",
        body: JSON.stringify({ 
          content,
          projectId: task.projectId,
          taskId
        }),
      });
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/comments`] });
      toast({
        title: "Comentário adicionado",
        description: "O comentário foi adicionado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar comentário",
        description: error.message || "Ocorreu um erro ao adicionar o comentário",
        variant: "destructive",
      });
    },
  });
  
  const handleUpdateTask = (data: TaskFormValues) => {
    updateTaskMutation.mutate(data);
  };
  
  const handleDeleteTask = () => {
    deleteTaskMutation.mutate();
  };
  
  const handleStatusChange = (newStatus: string) => {
    updateTaskStatusMutation.mutate(newStatus);
  };
  
  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      addChecklistItemMutation.mutate(newChecklistItem.trim());
    }
  };
  
  const handleToggleChecklistItem = (id: number, isCompleted: boolean) => {
    toggleChecklistItemMutation.mutate({ id, isCompleted: !isCompleted });
  };
  
  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };
  
  if (taskLoading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando detalhes da tarefa...</p>
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center">
        <p className="text-xl font-medium mb-4">Tarefa não encontrada</p>
        <Button onClick={() => setLocation("/tasks")}>Voltar para Tarefas</Button>
      </div>
    );
  }
  
  return (
    <div className="py-6 px-4 md:px-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/tasks")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <h2 className="text-2xl font-semibold text-gray-800">{task.name}</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
              <TabsTrigger value="comentarios">Comentários</TabsTrigger>
            </TabsList>
            
            <TabsContent value="detalhes">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Descrição</h3>
                      <p className="text-gray-700">{task.description || "Sem descrição"}</p>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Projeto</h3>
                        <p className="text-gray-700">{project?.name || "Carregando..."}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusText(task.status)}
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Prioridade</h3>
                        <Badge className={getPriorityColor(task.priority)}>
                          {getPriorityText(task.priority)}
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Data de Conclusão</h3>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-gray-700">
                            {task.dueDate ? format(new Date(task.dueDate), "PPP", { locale: ptBR }) : "Sem data definida"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {task.assignedTo && (
                      <>
                        <Separator />
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Responsável</h3>
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={assignedUser?.avatar} alt={assignedUser?.name} />
                              <AvatarFallback>
                                {assignedUser?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-gray-700">{assignedUser?.name || "Carregando..."}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="arquivos">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Arquivos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Upload de Arquivos</h3>
                    <FileUpload projectId={task.projectId} taskId={task.id} />
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Arquivos da Tarefa</h3>
                    <FileList projectId={task.projectId} taskId={task.id} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="comentarios">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Comentários</CardTitle>
                </CardHeader>
                <CardContent>
                  {comments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-2">Nenhum comentário encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment: any) => (
                        <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={comment.user?.avatar} alt={comment.user?.name} />
                              <AvatarFallback>
                                {comment.user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{comment.user?.name}</span>
                            <span className="text-xs text-gray-500 ml-auto">
                              {format(new Date(comment.createdAt), "PPp", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Separator className="my-6" />
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Adicionar comentário</h3>
                    <div className="flex flex-col space-y-2">
                      <Textarea
                        ref={commentInputRef}
                        placeholder="Escreva seu comentário..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || addCommentMutation.isPending}
                        >
                          {addCommentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Enviar Comentário
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          {/* Ações da Tarefa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Tarefa
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
                  onClick={() => setIsDeleteAlertOpen(true)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Excluir Tarefa
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Mudar Status */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
              <CardDescription>Altere o status da tarefa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant={task.status === "todo" ? "default" : "outline"}
                  className="w-full justify-start mb-2"
                  onClick={() => handleStatusChange("todo")}
                  disabled={task.status === "todo" || updateTaskStatusMutation.isPending}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Não Iniciada
                </Button>
                
                <Button
                  variant={task.status === "in_progress" ? "default" : "outline"}
                  className="w-full justify-start mb-2"
                  onClick={() => handleStatusChange("in_progress")}
                  disabled={task.status === "in_progress" || updateTaskStatusMutation.isPending}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Em Andamento
                </Button>
                
                <Button
                  variant={task.status === "review" ? "default" : "outline"}
                  className="w-full justify-start mb-2"
                  onClick={() => handleStatusChange("review")}
                  disabled={task.status === "review" || updateTaskStatusMutation.isPending}
                >
                  <ListChecks className="h-4 w-4 mr-2" />
                  Em Revisão
                </Button>
                
                <Button
                  variant={task.status === "completed" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => handleStatusChange("completed")}
                  disabled={task.status === "completed" || updateTaskStatusMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Concluída
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Checklist */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Lista de Verificação</CardTitle>
              <CardDescription>Gerenciar itens a serem concluídos</CardDescription>
            </CardHeader>
            <CardContent>
              {checklistLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : checklistItems.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-2">Não há itens na lista</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {checklistItems.map((item: any) => (
                    <div key={item.id} className="flex items-start space-x-2 py-1">
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={item.isCompleted}
                        onCheckedChange={() => handleToggleChecklistItem(item.id, item.isCompleted)}
                      />
                      <label
                        htmlFor={`item-${item.id}`}
                        className={`text-sm ${
                          item.isCompleted ? "line-through text-gray-400" : "text-gray-700"
                        }`}
                      >
                        {item.text}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center space-x-2 mt-4">
                <Input
                  placeholder="Adicionar novo item..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddChecklistItem();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleAddChecklistItem}
                  disabled={!newChecklistItem.trim() || addChecklistItemMutation.isPending}
                >
                  {addChecklistItemMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              {checklistItems.length > 0 && (
                <div className="w-full">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{checklistItems.filter((item: any) => item.isCompleted).length} de {checklistItems.length} concluídos</span>
                    <span>{Math.round((checklistItems.filter((item: any) => item.isCompleted).length / checklistItems.length) * 100)}%</span>
                  </div>
                  <Progress value={(checklistItems.filter((item: any) => item.isCompleted).length / checklistItems.length) * 100} />
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          <TaskForm 
            defaultValues={{
              ...task,
              dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            }}
            onSubmit={handleUpdateTask}
            projectId={task.projectId}
            isLoading={updateTaskMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a tarefa
              e todos os dados associados a ela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTask} 
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteTaskMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Sim, excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}