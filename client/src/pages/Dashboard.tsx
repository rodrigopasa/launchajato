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
} from "lucide-react";

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
  } = useQuery({
    queryKey: projects?.[0] ? [`/api/projects/${projects[0].id}/activities`, { limit: 5 }] : null,
    enabled: !!(projects && projects.length > 0),
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
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
      const response = await apiRequest("PUT", `/api/tasks/${id}`, data);
      return response.json();
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

  // Calculate stats
  const stats = {
    activeProjects: projects?.filter((p: any) => p.status !== "completed").length || 0,
    completedTasks: tasks?.filter((t: any) => t.status === "completed").length || 0,
    pendingTasks: tasks?.filter((t: any) => t.status !== "completed").length || 0,
    teamMembers: projects?.reduce((acc: number, project: any) => {
      // This is a placeholder as we don't have the actual team member count
      // In a real application, we'd fetch this data from the server
      return acc + (project.teamSize || 0);
    }, 0) || 0,
  };

  // Filter active projects for display
  const activeProjects = projects
    ?.filter((p: any) => p.status !== "completed")
    .slice(0, 3) || [];

  // Get upcoming tasks - non-completed tasks sorted by due date
  const upcomingTasks = [...(tasks || [])]
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
        <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
        <div className="flex">
          <Button variant="outline" size="sm" className="mr-2">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
          <Button size="sm" onClick={() => setIsNewProjectDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>
      </div>

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
          <Link href="/projects">
            <a className="text-sm text-primary font-medium hover:text-indigo-700">Ver todos</a>
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

            {!activitiesLoading && activities && activities.length > 0 && (
              <div className="mt-4 text-center">
                <Button variant="link" size="sm">
                  Ver mais atividades
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <div className="py-4 px-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Tarefas Próximas</h3>
            <Link href="/tasks">
              <Button variant="link" size="sm">
                + Nova Tarefa
              </Button>
            </Link>
          </div>
          <div className="p-5">
            {tasksLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !upcomingTasks || upcomingTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma tarefa pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task: any) => (
                  <TaskItem
                    key={task.id}
                    id={task.id}
                    name={task.name}
                    priority={task.priority}
                    project={"Project Name"} // Placeholder - in a real app, fetch project name
                    dueDate={task.dueDate || new Date().toISOString()}
                    completed={task.status === "completed"}
                    onStatusChange={handleTaskStatusChange}
                  />
                ))}
              </div>
            )}

            {!tasksLoading && upcomingTasks && upcomingTasks.length > 0 && (
              <div className="mt-4 text-center">
                <Link href="/tasks">
                  <Button variant="link" size="sm">
                    Ver todas as tarefas
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
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
