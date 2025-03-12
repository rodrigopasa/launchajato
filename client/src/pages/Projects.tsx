import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/ProjectForm";
import ProjectCard from "@/components/dashboard/ProjectCard";
import { Plus, Filter, Loader2, Search, MoreHorizontal } from "lucide-react";

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<any>(null);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);

  const { toast } = useToast();

  // Fetch projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      return await apiRequest("POST", "/api/projects", data);
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

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProjectFormValues }) => {
      return await apiRequest("PUT", `/api/projects/${id}`, data);
    },
    onSuccess: () => {
      setProjectToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Projeto atualizado",
        description: "O projeto foi atualizado com sucesso",
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
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/projects/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Projeto excluído",
        description: "O projeto foi excluído com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir projeto",
        description: error.message || "Ocorreu um erro ao excluir o projeto",
        variant: "destructive",
      });
    },
  });

  // Filter projects by search term and status
  const filteredProjects = Array.isArray(projects)
    ? projects.filter((project: any) => {
        const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === "all" || project.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
    : [];

  const handleCreateProject = (data: ProjectFormValues) => {
    createProjectMutation.mutate(data);
  };

  const handleEditProject = (project: any) => {
    setProjectToEdit(project);
  };

  const handleUpdateProject = (data: ProjectFormValues) => {
    if (projectToEdit) {
      updateProjectMutation.mutate({ id: projectToEdit.id, data });
    }
  };

  const handleDeleteProject = (id: number) => {
    setProjectToDelete(id);
  };

  const confirmDeleteProject = () => {
    if (projectToDelete !== null) {
      deleteProjectMutation.mutate(projectToDelete);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="py-6 px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Projetos</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar projetos..."
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
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("planning")}>
                Em planejamento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("in_progress")}>
                Em progresso
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("testing")}>
                Em testes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                Concluídos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("on_hold")}>
                Em pausa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setIsNewProjectDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>
      </div>

      <Tabs defaultValue="grid" className="mb-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-500">
            {filteredProjects.length} projeto{filteredProjects.length !== 1 ? "s" : ""} encontrado{filteredProjects.length !== 1 ? "s" : ""}
          </h3>
          <TabsList>
            <TabsTrigger value="grid">Grade</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="grid" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-10 border rounded-lg border-dashed">
              <h3 className="text-lg font-semibold text-gray-700">Nenhum projeto encontrado</h3>
              <p className="text-gray-500 mt-2 mb-4">
                {searchTerm
                  ? "Tente usar termos diferentes na sua busca"
                  : "Comece criando seu primeiro projeto de lançamento"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsNewProjectDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Projeto
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project: any) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  description={project.description || "Sem descrição"}
                  status={project.status}
                  progress={project.progress}
                  deadline={project.deadline || new Date().toISOString()}
                  members={[
                    // Placeholder for team members
                    { id: 1, name: "Usuário", avatar: "" },
                  ]}
                  onEdit={() => handleEditProject(project)}
                  onDelete={() => handleDeleteProject(project.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="list" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-10 border rounded-lg border-dashed">
              <h3 className="text-lg font-semibold text-gray-700">Nenhum projeto encontrado</h3>
              <p className="text-gray-500 mt-2 mb-4">
                {searchTerm
                  ? "Tente usar termos diferentes na sua busca"
                  : "Comece criando seu primeiro projeto de lançamento"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsNewProjectDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Projeto
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Nome
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Progresso
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Prazo
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.map((project: any) => (
                    <tr key={project.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${project.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                              project.status === 'testing' ? 'bg-yellow-100 text-yellow-800' : 
                              project.status === 'on_hold' ? 'bg-gray-100 text-gray-800' : 
                              'bg-indigo-100 text-indigo-800'}`}
                        >
                          {project.status === 'planning' ? 'Em planejamento' : 
                           project.status === 'in_progress' ? 'Em progresso' : 
                           project.status === 'testing' ? 'Em testes' : 
                           project.status === 'completed' ? 'Concluído' : 
                           project.status === 'on_hold' ? 'Em pausa' : project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full h-2 bg-gray-200 rounded-full mr-2 max-w-[100px]">
                            <div
                              className={`h-full rounded-full ${
                                project.progress >= 80
                                  ? 'bg-green-500'
                                  : project.progress >= 40
                                  ? 'bg-blue-500'
                                  : 'bg-yellow-500'
                              }`}
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-700">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString('pt-BR')
                          : 'Não definido'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/projects/${project.id}`}>Ver detalhes</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditProject(project)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteProject(project.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

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

      {/* Edit Project Dialog */}
      <Dialog
        open={!!projectToEdit}
        onOpenChange={(open) => !open && setProjectToEdit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Projeto</DialogTitle>
          </DialogHeader>
          {projectToEdit && (
            <ProjectForm
              defaultValues={{
                name: projectToEdit.name,
                description: projectToEdit.description || "",
                status: projectToEdit.status,
                progress: projectToEdit.progress,
                deadline: projectToEdit.deadline ? new Date(projectToEdit.deadline) : undefined,
              }}
              onSubmit={handleUpdateProject}
              isLoading={updateProjectMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation */}
      <AlertDialog
        open={projectToDelete !== null}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita e todos os
              dados relacionados (tarefas, arquivos, etc.) serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProjectMutation.isPending && (
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
