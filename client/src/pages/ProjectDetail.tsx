import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/ProjectForm";
import { TaskForm, type TaskFormValues } from "@/components/tasks/TaskForm";
import TaskItem from "@/components/dashboard/TaskItem";
import ActivityItem from "@/components/dashboard/ActivityItem";
import FileUpload from "@/components/files/FileUpload";
import FileList from "@/components/files/FileList";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useParams, Link } from "wouter";
import {
  Calendar,
  Clock,
  Edit,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = parseInt(id);
  const { toast } = useToast();

  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false);
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState(1);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [isUploadFileDialogOpen, setIsUploadFileDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !isNaN(projectId),
  });

  // Fetch project tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/tasks`],
    enabled: !isNaN(projectId),
  });

  // Fetch project members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/members`],
    enabled: !isNaN(projectId),
  });

  // Fetch project activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/activities`],
    enabled: !isNaN(projectId),
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const response = await apiRequest("PUT", `/api/projects/${projectId}`, data);
      return response.json();
    },
    onSuccess: () => {
      setIsEditProjectDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({
        title: "Projeto atualizado",
        description: "As informações do projeto foram atualizadas com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar projeto",
        description: error.message || "Ocorreu um erro ao atualizar o projeto",
        variant: "destructive",
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/projects/${projectId}`, undefined);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Projeto excluído",
        description: "O projeto foi excluído com sucesso",
      });
      window.location.href = "/projects";
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir projeto",
        description: error.message || "Ocorreu um erro ao excluir o projeto",
        variant: "destructive",
      });
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/tasks`, data);
      return response.json();
    },
    onSuccess: () => {
      setIsNewTaskDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      toast({
        title: "Tarefa criada",
        description: "A tarefa foi criada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar tarefa",
        description: error.message || "Ocorreu um erro ao criar a tarefa",
        variant: "destructive",
      });
    },
  });

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const response = await apiRequest("PUT", `/api/tasks/${id}`, {
        status: completed ? "completed" : "todo",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message || "Ocorreu um erro ao atualizar a tarefa",
        variant: "destructive",
      });
    },
  });

  const handleUpdateProject = (data: ProjectFormValues) => {
    updateProjectMutation.mutate(data);
  };

  const handleDeleteProject = () => {
    if (deleteConfirmationStep === 1) {
      setDeleteConfirmationStep(2);
    } else {
      deleteProjectMutation.mutate();
    }
  };
  
  const resetDeleteDialog = () => {
    setDeleteConfirmationStep(1);
    setIsDeleteProjectDialogOpen(false);
  };

  const handleCreateTask = (data: TaskFormValues) => {
    createTaskMutation.mutate({
      ...data,
      projectId,
    });
  };

  const handleTaskStatusChange = (id: number, completed: boolean) => {
    updateTaskStatusMutation.mutate({ id, completed });
  };

  if (projectLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Projeto não encontrado</h2>
        <p className="text-gray-600 mb-4">O projeto que você está procurando não existe ou foi removido.</p>
        <Link href="/projects">
          <Button>Voltar para projetos</Button>
        </Link>
      </div>
    );
  }

  // Status badge colors
  const statusConfig: any = {
    planning: {
      color: "text-yellow-800",
      bg: "bg-yellow-100",
      label: "Em planejamento",
    },
    in_progress: {
      color: "text-green-800",
      bg: "bg-green-100",
      label: "Em progresso",
    },
    testing: {
      color: "text-blue-800",
      bg: "bg-blue-100",
      label: "Em testes",
    },
    completed: {
      color: "text-indigo-800",
      bg: "bg-indigo-100",
      label: "Concluído",
    },
    on_hold: {
      color: "text-gray-800",
      bg: "bg-gray-100",
      label: "Em pausa",
    },
  };

  const statusData = statusConfig[project.status] || statusConfig.planning;

  return (
    <div className="py-6 px-4 md:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-800">{project.name}</h2>
            <span className={`px-2 py-1 text-xs rounded-full ${statusData.bg} ${statusData.color}`}>
              {statusData.label}
            </span>
          </div>
          <p className="text-gray-600 mt-1">{project.description || "Sem descrição"}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsUploadFileDialogOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Adicionar Arquivo
          </Button>
          <Button onClick={() => setIsNewTaskDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditProjectDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Projeto
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsDeleteProjectDialogOpen(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Projeto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500">Progresso</div>
              <div className="flex items-center">
                <div className="w-full h-2 bg-gray-200 rounded-full mr-2">
                  <div
                    className={`h-full rounded-full ${
                      project.progress >= 80
                        ? "bg-green-500"
                        : project.progress >= 40
                        ? "bg-blue-500"
                        : "bg-yellow-500"
                    }`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">{project.progress}%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500">Prazo</div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {project.deadline
                    ? format(new Date(project.deadline), "dd 'de' MMMM, yyyy", { locale: ptBR })
                    : "Não definido"}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500">Criado em</div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {format(new Date(project.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500">Equipe</div>
              <div className="flex items-center">
                <div className="flex -space-x-2 mr-2">
                  {membersLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : members && members.length > 0 ? (
                    <>
                      {members.slice(0, 3).map((member: any) => (
                        <Avatar key={member.id} className="h-6 w-6 border-2 border-white">
                          <AvatarImage src={member.user?.avatar} alt={member.user?.name} />
                          <AvatarFallback>
                            {member.user?.name?.substring(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {members.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-500">
                          +{members.length - 3}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-700">Sem membros</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="activity">Atividades</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <div className="py-4 px-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Tarefas Recentes</h3>
              </div>
              <div className="p-5">
                {tasksLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !tasks || tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhuma tarefa encontrada</p>
                    <Button
                      variant="link"
                      onClick={() => setIsNewTaskDialogOpen(true)}
                      className="mt-2"
                    >
                      Adicionar tarefa
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.slice(0, 5).map((task: any) => (
                      <TaskItem
                        key={task.id}
                        id={task.id}
                        name={task.name}
                        priority={task.priority}
                        project={project.name}
                        dueDate={task.dueDate || new Date().toISOString()}
                        completed={task.status === "completed"}
                        onStatusChange={handleTaskStatusChange}
                        onViewDetails={() => window.location.href = `/tasks/${task.id}`}
                      />
                    ))}
                  </div>
                )}

                {!tasksLoading && tasks && tasks.length > 5 && (
                  <div className="mt-4 text-center">
                    <Button variant="link" onClick={() => setActiveTab("tasks")}>
                      Ver todas as tarefas
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="py-4 px-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Atividades Recentes</h3>
              </div>
              <div className="p-5">
                {activitiesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !activities || activities.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhuma atividade recente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.slice(0, 3).map((activity: any) => (
                      <ActivityItem
                        key={activity.id}
                        user={{
                          id: activity.user?.id || activity.userId,
                          name: activity.user?.name || "Usuário",
                          avatar: activity.user?.avatar,
                        }}
                        action={activity.action}
                        subject={activity.subject}
                        details={activity.details}
                        time={activity.createdAt}
                      />
                    ))}
                  </div>
                )}

                {!activitiesLoading && activities && activities.length > 3 && (
                  <div className="mt-4 text-center">
                    <Button variant="link" onClick={() => setActiveTab("activity")}>
                      Ver mais atividades
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks">
          <Card>
            <div className="py-4 px-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Tarefas do Projeto</h3>
              <Button size="sm" onClick={() => setIsNewTaskDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>
            <div className="p-5">
              {tasksLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !tasks || tasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Nenhuma tarefa encontrada</p>
                  <Button onClick={() => setIsNewTaskDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Tarefa
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task: any) => (
                    <TaskItem
                      key={task.id}
                      id={task.id}
                      name={task.name}
                      priority={task.priority}
                      project={project.name}
                      dueDate={task.dueDate || new Date().toISOString()}
                      completed={task.status === "completed"}
                      onStatusChange={handleTaskStatusChange}
                      onViewDetails={() => window.location.href = `/tasks/${task.id}`}
                      onEdit={() => {
                        // Implementaremos isso depois
                      }}
                      onDelete={() => {
                        // Implementaremos isso depois
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="files">
          <Card>
            <div className="py-4 px-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Arquivos do Projeto</h3>
              <Button size="sm" onClick={() => setIsUploadFileDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Arquivo
              </Button>
            </div>
            <div className="p-5">
              <FileList projectId={projectId} />
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="team">
          <Card>
            <div className="py-4 px-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Membros da Equipe</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Membro
              </Button>
            </div>
            <div className="p-5">
              {membersLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !members || members.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Nenhum membro encontrado</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Membro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={member.user?.avatar} alt={member.user?.name} />
                          <AvatarFallback>
                            {member.user?.name?.substring(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.user?.name}</p>
                          <p className="text-sm text-gray-500">{member.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full 
                            ${member.role === "admin" ? "bg-purple-100 text-purple-800" : 
                              member.role === "manager" ? "bg-blue-100 text-blue-800" : 
                              "bg-gray-100 text-gray-800"}`}
                        >
                          {member.role === "admin" ? "Administrador" : 
                           member.role === "manager" ? "Gerente" : "Membro"}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Alterar função</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600">
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <Card>
            <div className="py-4 px-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Histórico de Atividades</h3>
            </div>
            <div className="p-5">
              {activitiesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !activities || activities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma atividade encontrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity: any) => (
                    <ActivityItem
                      key={activity.id}
                      user={{
                        id: activity.user?.id || activity.userId,
                        name: activity.user?.name || "Usuário",
                        avatar: activity.user?.avatar,
                      }}
                      action={activity.action}
                      subject={activity.subject}
                      details={activity.details}
                      time={activity.createdAt}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Project Dialog */}
      <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Projeto</DialogTitle>
          </DialogHeader>
          <ProjectForm
            defaultValues={{
              name: project.name,
              description: project.description || "",
              status: project.status,
              progress: project.progress,
              deadline: project.deadline ? new Date(project.deadline) : undefined,
            }}
            onSubmit={handleUpdateProject}
            isLoading={updateProjectMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation */}
      <AlertDialog open={isDeleteProjectDialogOpen} onOpenChange={(open) => {
        if (!open) {
          resetDeleteDialog();
        } else {
          setIsDeleteProjectDialogOpen(open);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirmationStep === 1 ? "Confirmar exclusão" : "Tem absoluta certeza?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmationStep === 1 ? (
                <>Tem certeza que deseja excluir o projeto "{project.name}"? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.</>
              ) : (
                <>Esta é a última etapa de confirmação. Ao confirmar, o projeto "{project.name}" será permanentemente excluído junto com todas as suas tarefas, arquivos e histórico de atividades.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={resetDeleteDialog}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProjectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {deleteConfirmationStep === 1 ? "Confirmar" : "Sim, excluir projeto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Task Dialog */}
      <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Tarefa</DialogTitle>
          </DialogHeader>
          <TaskForm
            projectId={projectId}
            onSubmit={handleCreateTask}
            isLoading={createTaskMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Upload File Dialog */}
      <Dialog open={isUploadFileDialogOpen} onOpenChange={setIsUploadFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Arquivo</DialogTitle>
          </DialogHeader>
          <FileUpload
            projectId={projectId}
            onSuccess={() => setIsUploadFileDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
