import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, Filter, Tag, Clock, CalendarDays, BarChart, FileDown, ArrowUpDown } from "lucide-react";
import { transitions } from "@/lib/animations";
import ProjectFilter, { ProjectFilterState } from "@/components/projects/ProjectFilter";
import ReportExporter from "@/components/reports/ReportExporter";
import TaskTags from "@/components/tasks/TaskTags";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilters, setProjectFilters] = useState<ProjectFilterState>({
    search: "",
    status: [],
    sortBy: "recent",
    sortOrder: "desc"
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchType, setSearchType] = useState<"projects" | "tasks" | "files">("projects");

  // Fetch projects with filters
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects", projectFilters],
    enabled: searchType === "projects",
  });

  // Fetch tasks with filters
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks", searchQuery, selectedTags],
    enabled: searchType === "tasks",
  });

  // Fetch files with filters
  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ["/api/files", searchQuery],
    enabled: searchType === "files",
  });

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // If searching projects, update project filter
    if (searchType === "projects") {
      setProjectFilters(prev => ({
        ...prev,
        search: value
      }));
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setProjectFilters({
      search: "",
      status: [],
      sortBy: "recent",
      sortOrder: "desc"
    });
    setSelectedTags([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transitions.default}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Busca Avançada</h1>
            <p className="text-muted-foreground">
              Encontre projetos, tarefas e arquivos facilmente
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <SearchIcon className="h-5 w-5" />
              Buscar
            </CardTitle>
            <CardDescription>
              Filtre e encontre informações em todo o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Tabs 
                defaultValue={searchType} 
                onValueChange={(value) => setSearchType(value as "projects" | "tasks" | "files")}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="projects" className="flex items-center gap-1">
                    <BarChart className="h-4 w-4" />
                    <span>Projetos</span>
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> 
                    <span>Tarefas</span>
                  </TabsTrigger>
                  <TabsTrigger value="files" className="flex items-center gap-1">
                    <FileDown className="h-4 w-4" />
                    <span>Arquivos</span>
                  </TabsTrigger>
                </TabsList>

                <div className="relative mb-4">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={`Buscar ${searchType === "projects" ? "projetos" : searchType === "tasks" ? "tarefas" : "arquivos"}...`}
                    className="pl-10 w-full"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                  />
                  {(searchQuery !== "" || selectedTags.length > 0 || 
                      (searchType === "projects" && (projectFilters.status.length > 0 || projectFilters.sortBy !== "recent"))) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 px-2 text-xs"
                    >
                      Limpar
                    </Button>
                  )}
                </div>

                <TabsContent value="projects" className="mt-0">
                  <ProjectFilter onFilterChange={setProjectFilters} />
                  
                  <div className="mt-4">
                    {projectsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Carregando projetos...</p>
                      </div>
                    ) : projects && Array.isArray(projects) && projects.length > 0 ? (
                      <div className="space-y-4">
                        {projects.map((project: any) => (
                          <Card key={project.id} className="overflow-hidden transition-all hover:shadow-md">
                            <Link href={`/projects/${project.id}`}>
                              <a className="block p-4">
                                <div className="flex justify-between">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{project.description}</p>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <div className="text-xs font-medium text-gray-400 mb-1">
                                      <CalendarDays className="h-3 w-3 inline mr-1" />
                                      {format(new Date(project.deadline), "dd MMM yyyy", { locale: ptBR })}
                                    </div>
                                    <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                      project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                                      project.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                                      project.status === 'testing' ? 'bg-purple-100 text-purple-800' :
                                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {project.status === 'planning' ? 'Planejamento' :
                                      project.status === 'in_progress' ? 'Em andamento' :
                                      project.status === 'testing' ? 'Em teste' :
                                      project.status === 'completed' ? 'Concluído' :
                                      'Em espera'}
                                    </div>
                                  </div>
                                </div>
                              </a>
                            </Link>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <SearchIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhum projeto encontrado</h3>
                        <p className="text-gray-500 mt-1">Tente alterar os filtros ou criar um novo projeto</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="mt-0">
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4 text-gray-500" />
                        <h3 className="text-sm font-medium">Filtrar por tags</h3>
                      </div>
                      <TaskTags 
                        initialTags={selectedTags}
                        onChange={setSelectedTags}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Resultados: {tasks ? (Array.isArray(tasks) ? tasks.length : 0) : 0}
                      </div>
                      <Button variant="outline" size="sm" className="h-8 gap-1">
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        <span>Ordenar</span>
                      </Button>
                    </div>

                    {tasksLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Carregando tarefas...</p>
                      </div>
                    ) : tasks && Array.isArray(tasks) && tasks.length > 0 ? (
                      <div className="space-y-3">
                        {tasks.map((task: any) => (
                          <Card key={task.id} className="overflow-hidden">
                            <Link href={`/tasks/${task.id}`}>
                              <a className="block p-4">
                                <div className="flex justify-between">
                                  <div>
                                    <h3 className="font-medium text-gray-900">{task.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Projeto: {task.projectName || "Sem projeto"}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    {task.dueDate && (
                                      <div className="text-xs text-gray-400 mb-1">
                                        {format(new Date(task.dueDate), "dd MMM", { locale: ptBR })}
                                      </div>
                                    )}
                                    <div className={`text-xs px-2 py-0.5 rounded-full ${
                                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {task.priority === 'high' ? 'Alta' :
                                      task.priority === 'medium' ? 'Média' : 'Baixa'}
                                    </div>
                                  </div>
                                </div>
                              </a>
                            </Link>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <SearchIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma tarefa encontrada</h3>
                        <p className="text-gray-500 mt-1">Tente alterar os filtros ou criar uma nova tarefa</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="files" className="mt-0">
                  {filesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Carregando arquivos...</p>
                    </div>
                  ) : files && Array.isArray(files) && files.length > 0 ? (
                    <div className="space-y-3">
                      {files.map((file: any) => (
                        <Card key={file.id} className="overflow-hidden">
                          <div className="p-4">
                            <div className="flex justify-between">
                              <div className="flex items-start gap-3">
                                <div className="bg-gray-100 p-2 rounded">
                                  <FileDown className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">{file.name}</h3>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {file.size ? `${(file.size / 1024).toFixed(2)} KB` : "Tamanho desconhecido"} • 
                                    {file.uploadedAt ? format(new Date(file.uploadedAt), " dd MMM yyyy", { locale: ptBR }) : ""}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/api/files/${file.id}/download`}>
                                    <a>Baixar</a>
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <SearchIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <h3 className="text-lg font-medium text-gray-900">Nenhum arquivo encontrado</h3>
                      <p className="text-gray-500 mt-1">Tente alterar os termos da busca</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReportExporter
            type="overview"
            data={projects || []}
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                Buscas Recentes
              </CardTitle>
              <CardDescription>
                Suas buscas mais frequentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="mr-2 mb-2">
                  <Tag className="h-3.5 w-3.5 mr-1.5" />
                  Projetos atrasados
                </Button>
                <Button variant="outline" size="sm" className="mr-2 mb-2">
                  <Tag className="h-3.5 w-3.5 mr-1.5" />
                  Tarefas de alta prioridade
                </Button>
                <Button variant="outline" size="sm" className="mr-2 mb-2">
                  <Tag className="h-3.5 w-3.5 mr-1.5" />
                  Documentos PDF
                </Button>
                <Button variant="outline" size="sm" className="mr-2 mb-2">
                  <Tag className="h-3.5 w-3.5 mr-1.5" />
                  Projetos em andamento
                </Button>
              </div>
              <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                As buscas recentes são salvas automaticamente para facilitar o acesso rápido.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}