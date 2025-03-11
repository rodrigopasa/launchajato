import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskForm, type TaskFormValues } from "@/components/tasks/TaskForm";
import TaskItem from "@/components/dashboard/TaskItem";
import { Plus, Search, Filter, Loader2 } from "lucide-react";

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const { toast } = useToast();

  // Fetch all tasks (assigned to user + all project tasks)
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  // Fetch projects for project selection
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const response = await apiRequest(
        "POST",
        `/api/projects/${data.projectId}/tasks`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      setIsNewTaskDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
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

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TaskFormValues> }) => {
      const response = await apiRequest("PUT", `/api/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      setTaskToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
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
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/tasks/${id}`, undefined);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tarefa excluída",
        description: "A tarefa foi excluída com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir tarefa",
        description: error.message || "Ocorreu um erro ao excluir a tarefa",
        variant: "destructive",
      });
    },
  });

  const handleOpenNewTaskDialog = (projectId?: number) => {
    if (projectId) {
      setSelectedProjectId(projectId);
    } else {
      setSelectedProjectId(null);
    }
    setIsNewTaskDialogOpen(true);
  };

  const handleCreateTask = (data: TaskFormValues) => {
    createTaskMutation.mutate(data);
  };

  const handleEditTask = (task: any) => {
    setTaskToEdit(task);
  };
  
  const handleViewTaskDetails = (taskId: number) => {
    window.location.href = `/tasks/${taskId}`;
  };

  const handleUpdateTask = (data: TaskFormValues) => {
    if (taskToEdit) {
      updateTaskMutation.mutate({
        id: taskToEdit.id,
        data,
      });
    }
  };

  const handleDeleteTask = (id: number) => {
    setTaskToDelete(id);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete !== null) {
      deleteTaskMutation.mutate(taskToDelete);
      setTaskToDelete(null);
    }
  };

  const handleTaskStatusChange = (id: number, completed: boolean) => {
    updateTaskMutation.mutate({
      id,
      data: { status: completed ? "completed" : "todo" },
    });
  };

  // Filter tasks
  const filteredTasks = tasks
    ? tasks.filter((task: any) => {
        const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === "all" || task.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
      })
    : [];

  // Group tasks by status
  const groupedTasks = {
    todo: filteredTasks.filter((task: any) => task.status === "todo"),
    in_progress: filteredTasks.filter((task: any) => task.status === "in_progress"),
    review: filteredTasks.filter((task: any) => task.status === "review"),
    completed: filteredTasks.filter((task: any) => task.status === "completed"),
  };

  return (
    <div className="py-6 px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Tarefas</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="sm:ml-2">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                Todos os status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("todo")}>
                A fazer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("in_progress")}>
                Em andamento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("review")}>
                Em revisão
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                Concluídas
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setPriorityFilter("all")}>
                Todas as prioridades
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter("high")}>
                Alta prioridade
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter("medium")}>
                Média prioridade
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter("low")}>
                Baixa prioridade
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => handleOpenNewTaskDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-500">
            {filteredTasks.length} tarefa{filteredTasks.length !== 1 ? "s" : ""} encontrada{filteredTasks.length !== 1 ? "s" : ""}
          </h3>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-6">
          <Card>
            {tasksLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-700">Nenhuma tarefa encontrada</h3>
                <p className="text-gray-500 mt-2 mb-4">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                    ? "Tente usar filtros diferentes"
                    : "Comece criando sua primeira tarefa"}
                </p>
                {!searchTerm && statusFilter === "all" && priorityFilter === "all" && (
                  <Button onClick={() => handleOpenNewTaskDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Tarefa
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {filteredTasks.map((task: any) => (
                  <TaskItem
                    key={task.id}
                    id={task.id}
                    name={task.name}
                    priority={task.priority}
                    project={task.projectId ? task.projectId.toString() : ""}
                    dueDate={task.dueDate || new Date().toISOString()}
                    completed={task.status === "completed"}
                    onStatusChange={handleTaskStatusChange}
                    onEdit={() => handleEditTask(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onViewDetails={() => window.location.href = `/tasks/${task.id}`}
                  />
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="kanban" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* To Do Column */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center justify-between">
                <span>A fazer</span>
                <span className="bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs">
                  {groupedTasks.todo.length}
                </span>
              </h3>
              {groupedTasks.todo.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500">Nenhuma tarefa</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedTasks.todo.map((task: any) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg shadow-sm p-3 border border-gray-100"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-800">{task.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium
                            ${task.priority === 'high' ? 'bg-red-100 text-red-800' : 
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'}`}
                        >
                          {task.priority === 'high' ? 'Alta' : 
                           task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Projeto {task.projectId}</span>
                        {task.dueDate && (
                          <span>
                            {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* In Progress Column */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center justify-between">
                <span>Em andamento</span>
                <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs">
                  {groupedTasks.in_progress.length}
                </span>
              </h3>
              {groupedTasks.in_progress.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500">Nenhuma tarefa</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedTasks.in_progress.map((task: any) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg shadow-sm p-3 border border-gray-100"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-800">{task.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium
                            ${task.priority === 'high' ? 'bg-red-100 text-red-800' : 
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'}`}
                        >
                          {task.priority === 'high' ? 'Alta' : 
                           task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Projeto {task.projectId}</span>
                        {task.dueDate && (
                          <span>
                            {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review Column */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center justify-between">
                <span>Em revisão</span>
                <span className="bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 text-xs">
                  {groupedTasks.review.length}
                </span>
              </h3>
              {groupedTasks.review.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500">Nenhuma tarefa</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedTasks.review.map((task: any) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg shadow-sm p-3 border border-gray-100"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-800">{task.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium
                            ${task.priority === 'high' ? 'bg-red-100 text-red-800' : 
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'}`}
                        >
                          {task.priority === 'high' ? 'Alta' : 
                           task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Projeto {task.projectId}</span>
                        {task.dueDate && (
                          <span>
                            {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Column */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center justify-between">
                <span>Concluídas</span>
                <span className="bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs">
                  {groupedTasks.completed.length}
                </span>
              </h3>
              {groupedTasks.completed.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500">Nenhuma tarefa</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedTasks.completed.map((task: any) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg shadow-sm p-3 border border-gray-100"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-800 line-through opacity-70">{task.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium
                            ${task.priority === 'high' ? 'bg-red-100 text-red-800' : 
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'}`}
                        >
                          {task.priority === 'high' ? 'Alta' : 
                           task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2 opacity-70">{task.description}</p>
                      )}
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Projeto {task.projectId}</span>
                        {task.dueDate && (
                          <span>
                            {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Task Dialog */}
      <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Tarefa</DialogTitle>
          </DialogHeader>
          <TaskForm
            projectId={selectedProjectId || undefined}
            onSubmit={handleCreateTask}
            isLoading={createTaskMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog
        open={!!taskToEdit}
        onOpenChange={(open) => !open && setTaskToEdit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          {taskToEdit && (
            <TaskForm
              defaultValues={{
                name: taskToEdit.name,
                description: taskToEdit.description || "",
                priority: taskToEdit.priority,
                status: taskToEdit.status,
                projectId: taskToEdit.projectId,
                phaseId: taskToEdit.phaseId,
                assignedTo: taskToEdit.assignedTo,
                dueDate: taskToEdit.dueDate ? new Date(taskToEdit.dueDate) : undefined,
              }}
              onSubmit={handleUpdateTask}
              isLoading={updateTaskMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Task Confirmation */}
      <AlertDialog
        open={taskToDelete !== null}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTask}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteTaskMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
