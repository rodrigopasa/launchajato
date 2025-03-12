import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatCard from "@/components/dashboard/StatCard";
import ProjectCard from "@/components/dashboard/ProjectCard";
import ActivityItem from "@/components/dashboard/ActivityItem";
import TaskItem from "@/components/dashboard/TaskItem";
import RocketAnimation from "@/components/dashboard/RocketAnimation";
import { transitions } from "@/lib/animations";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/ProjectForm";
import { Link } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutPanelLeft,
  CheckCircle,
  Clock,
  Users,
  Plus,
  Filter,
  Loader2,
  Activity,
  ListChecks,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch projects
  const {
    data: projects,
    isLoading: projectsLoading,
  } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  // Fetch user tasks
  const {
    data: tasks,
    isLoading: tasksLoading,
  } = useQuery({
    queryKey: ["/api/tasks/user/me"],
    enabled: !!user,
  });

  // Fetch recent activities
  const {
    data: activities,
    isLoading: activitiesLoading,
  } = useQuery<any[]>({
    queryKey: projects && Array.isArray(projects) && projects.length > 0 ? [`/api/projects/${projects[0].id}/activities`, { limit: 5 }] : ['/api/activities'],
    enabled: !!user,
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      return apiRequest<any>("POST", "/api/projects", data);
    },
    onSuccess: () => {
      setIsNewProjectDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Projeto criado",
        description: "O projeto foi criado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar projeto",
        description: error.message || "Ocorreu um erro ao criar o projeto",
        variant: "destructive",
      });
    },
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { status: string } }) => {
      return apiRequest<any>("PUT", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/user/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message || "Ocorreu um erro ao atualizar a tarefa",
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = (data: ProjectFormValues) => {
    createProjectMutation.mutate(data);
  };

  const handleTaskStatusChange = (id: number, completed: boolean) => {
    updateTaskMutation.mutate({
      id,
      data: { status: completed ? "completed" : "todo" },
    });
  };

  // Coerção de tipos para evitar problemas de tipagem
  const projectsArray = Array.isArray(projects) ? projects : [];
  const tasksArray = Array.isArray(tasks) ? tasks : [];
  const activitiesArray = Array.isArray(activities) ? activities : [];

  // Calculate stats
  const stats = {
    activeProjects: projectsArray.filter((p: any) => p.status !== "completed").length,
    completedTasks: tasksArray.filter((t: any) => t.status === "completed").length,
    pendingTasks: tasksArray.filter((t: any) => t.status !== "completed").length,
    teamMembers: projectsArray.reduce((acc: number, project: any) => {
      // This is a placeholder as we don't have the actual team member count
      // In a real application, we'd fetch this data from the server
      return acc + (project.teamSize || 0);
    }, 0),
  };

  // Filter active projects for display
  const activeProjects = projectsArray
    .filter((p: any) => p.status !== "completed")
    .slice(0, 3);

  // Get upcoming tasks - non-completed tasks sorted by due date
  const upcomingTasks = [...tasksArray]
    .filter((t: any) => t.status !== "completed")
    .sort((a: any, b: any) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5);

  return (
    <div className="py-6 px-4 md:px-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">Dashboard</h2>
        <div className="flex">
          <Button variant="outline" size="sm" className="mr-2">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
          <Button size="sm" onClick={() => setIsNewProjectDialogOpen(true)} className="bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 text-white shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>
      </div>
      
      {/* Banner animado do foguete */}
      <RocketAnimation />

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Projetos Ativos"
          value={stats.activeProjects}
          icon={<LayoutPanelLeft />}
          iconColor="text-primary"
          iconBgColor="bg-indigo-100"
        />
        <StatCard
          title="Tarefas Concluídas"
          value={stats.completedTasks}
          icon={<CheckCircle />}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="Tarefas Pendentes"
          value={stats.pendingTasks}
          icon={<Clock />}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />
        <StatCard
          title="Membros da Equipe"
          value={stats.teamMembers}
          icon={<Users />}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
      </div>

      {/* Projects Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Projetos em Andamento</h3>
          <Link href="/projects" className="text-sm text-primary font-medium hover:text-indigo-700">
            Ver todos
          </Link>
        </div>

        {projectsLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : activeProjects.length === 0 ? (
          <Card className="p-8 text-center">
            <LayoutPanelLeft className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">Nenhum projeto ativo</h3>
            <p className="text-gray-500 mt-2 mb-4">
              Comece criando seu primeiro projeto de lançamento.
            </p>
            <Button onClick={() => setIsNewProjectDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Projeto
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeProjects.map((project: any) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                description={project.description || "Sem descrição"}
                status={project.status}
                progress={project.progress}
                deadline={project.deadline || new Date().toISOString()}
                members={[
                  // This is a placeholder as we don't have the actual team members
                  // In a real application, we'd fetch this data from the server
                  { id: 1, name: "Usuário", avatar: "" },
                ]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...transitions.default }}
        >
          <Card className="overflow-hidden shadow-md border-0 bg-white dark:bg-gray-800">
            <div className="py-4 px-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center">
                <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-primary rounded-full mr-3"></div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Atividades Recentes</h3>
              </div>
            </div>
            <div className="p-5">
              {activitiesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !activitiesArray || activitiesArray.length === 0 ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={transitions.spring}
                  >
                    <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg">
                      <div className="w-16 h-16 mx-auto bg-indigo-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <Activity className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">Nenhuma atividade recente</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">As atividades da equipe aparecerão aqui</p>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-4">
                  {activitiesArray.map((activity: any, index: number) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, ...transitions.default }}
                    >
                      <ActivityItem
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
                    </motion.div>
                  ))}
                </div>
              )}

              {!activitiesLoading && activitiesArray && activitiesArray.length > 0 && (
                <motion.div 
                  className="mt-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, ...transitions.default }}
                >
                  <Button variant="link" size="sm" className="text-primary hover:text-indigo-700">
                    Ver mais atividades
                  </Button>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Upcoming Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...transitions.default }}
        >
          <Card className="overflow-hidden shadow-md border-0 bg-white dark:bg-gray-800">
            <div className="py-4 px-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-1 bg-gradient-to-b from-yellow-500 to-primary rounded-full mr-3"></div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Tarefas Próximas</h3>
              </div>
              <Button variant="ghost" size="sm" className="text-primary hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-gray-700" asChild>
                <Link href="/tasks">
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Tarefa
                </Link>
              </Button>
            </div>
            <div className="p-5">
              {tasksLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !upcomingTasks || upcomingTasks.length === 0 ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={transitions.spring}
                  >
                    <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg">
                      <div className="w-16 h-16 mx-auto bg-indigo-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <ListChecks className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">Nenhuma tarefa pendente</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Adicione tarefas para acompanhar seu progresso</p>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task: any, index: number) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, ...transitions.default }}
                    >
                      <TaskItem
                        id={task.id}
                        name={task.name}
                        priority={task.priority}
                        project={task.projectName || "Projeto"}
                        dueDate={task.dueDate || new Date().toISOString()}
                        completed={task.status === "completed"}
                        onStatusChange={handleTaskStatusChange}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {!tasksLoading && upcomingTasks && upcomingTasks.length > 0 && (
                <motion.div 
                  className="mt-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, ...transitions.default }}
                >
                  <Button variant="link" size="sm" className="text-primary hover:text-indigo-700" asChild>
                    <Link href="/tasks">
                      Ver todas as tarefas
                    </Link>
                  </Button>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* New Project Dialog */}
      <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Projeto</DialogTitle>
          </DialogHeader>
          <ProjectForm
            onSubmit={handleCreateProject}
            isLoading={createProjectMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
