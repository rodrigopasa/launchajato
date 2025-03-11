import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  Download, 
  FileCog, 
  FileSpreadsheet, 
  Filter, 
  Loader2, 
  PieChart as PieChartIcon, 
  RefreshCw, 
  BarChart as BarChartIcon,
  Activity,
  Calendar,
  Users
} from "lucide-react";
import { format, sub, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

// Status das tarefas para cálculos de estatísticas
type TaskStatus = "todo" | "in_progress" | "review" | "completed";

// Componente para exportar relatórios
function ExportReportButton({ data, type, isLoading }: { data: any; type: string; isLoading: boolean }) {
  const exportData = () => {
    // Converter dados para CSV
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((item: any) => Object.values(item).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;
    
    // Criar blob e link para download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `relatorio-${type}-${format(new Date(), "yyyy-MM-dd")}.csv`);
    a.click();
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={exportData} 
      disabled={isLoading || !data || data.length === 0}
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      Exportar Relatório
    </Button>
  );
}

// Componente para mostrar a distribuição de tarefas por status
function TaskStatusDistribution({ data }: { data: any[] }) {
  // Processamento dos dados para gráfico de pizza
  const statusCounts = {
    todo: 0,
    in_progress: 0,
    review: 0,
    completed: 0
  };
  
  data.forEach((task) => {
    statusCounts[task.status as TaskStatus] += 1;
  });
  
  const chartData = [
    { name: "A Fazer", value: statusCounts.todo, color: "#f97316" },
    { name: "Em Progresso", value: statusCounts.in_progress, color: "#3b82f6" },
    { name: "Em Revisão", value: statusCounts.review, color: "#8b5cf6" },
    { name: "Concluídas", value: statusCounts.completed, color: "#22c55e" }
  ];

  return (
    <div className="h-[350px] flex justify-center items-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={120}
            innerRadius={60}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} tarefas`, 'Quantidade']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Componente para mostrar progresso do projeto ao longo do tempo
function ProjectProgressChart({ data }: { data: any[] }) {
  // Ordenar por data
  const sortedActivities = [...data].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  // Cálculo de progresso acumulado
  let progressData = [];
  let completedTasks = 0;
  let totalTasks = data.length;
  
  for (let i = 0; i < sortedActivities.length; i++) {
    const activity = sortedActivities[i];
    if (activity.action === "updated" && activity.details?.includes("status") && activity.details?.includes("completed")) {
      completedTasks++;
      progressData.push({
        date: format(new Date(activity.createdAt), "dd/MM"),
        progresso: Math.round((completedTasks / totalTasks) * 100)
      });
    }
  }
  
  // Se não tivermos dados suficientes, criar dados fictícios com base na % de conclusão
  if (progressData.length < 2) {
    const totalCompleted = data.filter(task => task.status === "completed").length;
    const percentage = Math.round((totalCompleted / totalTasks) * 100);
    
    progressData = [
      { date: format(sub(new Date(), { days: 30 }), "dd/MM"), progresso: 0 },
      { date: format(new Date(), "dd/MM"), progresso: percentage }
    ];
  }

  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={progressData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value) => [`${value}%`, 'Progresso']} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="progresso" 
            stroke="#3b82f6" 
            name="Progresso (%)"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Componente para mostrar a distribuição de tarefas por prioridade
function TasksPriorityChart({ data }: { data: any[] }) {
  // Processar dados para o gráfico
  const priorityCounts = {
    low: 0,
    medium: 0,
    high: 0
  };
  
  data.forEach((task) => {
    if (priorityCounts[task.priority as keyof typeof priorityCounts] !== undefined) {
      priorityCounts[task.priority as keyof typeof priorityCounts] += 1;
    }
  });
  
  const chartData = [
    { name: "Baixa", valor: priorityCounts.low },
    { name: "Média", valor: priorityCounts.medium },
    { name: "Alta", valor: priorityCounts.high }
  ];

  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value) => [`${value} tarefas`, 'Quantidade']}
          />
          <Legend />
          <Bar dataKey="valor" name="Quantidade de Tarefas" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Componente para exibir métricas consolidadas em cartões
function MetricsCards({ projects, tasks }: { projects: any[]; tasks: any[] }) {
  const atRiskProjects = projects.filter(p => {
    // Projetos com prazo próximo (dentro de 7 dias) e baixo progresso (<70%)
    const deadlineDate = p.deadline ? new Date(p.deadline) : null;
    const isDeadlineSoon = deadlineDate && isAfter(deadlineDate, new Date()) && 
                            isBefore(deadlineDate, sub(new Date(), { days: -7 }));
    return isDeadlineSoon && p.progress < 70;
  });
  
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const highPriorityTasks = tasks.filter(t => t.priority === "high" && t.status !== "completed").length;
  
  const overdueTasksCount = tasks.filter(t => {
    const dueDate = t.dueDate ? new Date(t.dueDate) : null;
    return dueDate && isBefore(dueDate, new Date()) && t.status !== "completed";
  }).length;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <Activity className="h-6 w-6 text-blue-700" />
            </div>
            <h3 className="text-lg font-semibold text-center">Taxa de Conclusão</h3>
            <div className="text-3xl font-bold">{completionRate}%</div>
            <p className="text-sm text-gray-500 text-center">
              {completedTasks} de {totalTasks} tarefas concluídas
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-2">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Calendar className="h-6 w-6 text-yellow-700" />
            </div>
            <h3 className="text-lg font-semibold text-center">Tarefas Atrasadas</h3>
            <div className="text-3xl font-bold">{overdueTasksCount}</div>
            <p className="text-sm text-gray-500 text-center">
              {overdueTasksCount > 0 ? "Requer atenção imediata" : "Nenhuma tarefa atrasada"}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-2">
            <div className="p-2 bg-red-100 rounded-full">
              <Users className="h-6 w-6 text-red-700" />
            </div>
            <h3 className="text-lg font-semibold text-center">Projetos em Risco</h3>
            <div className="text-3xl font-bold">{atRiskProjects.length}</div>
            <p className="text-sm text-gray-500 text-center">
              {atRiskProjects.length > 0 ? "Projetos com prazo próximo" : "Todos os projetos no prazo"}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-2">
            <div className="p-2 bg-purple-100 rounded-full">
              <BarChartIcon className="h-6 w-6 text-purple-700" />
            </div>
            <h3 className="text-lg font-semibold text-center">Alta Prioridade</h3>
            <div className="text-3xl font-bold">{highPriorityTasks}</div>
            <p className="text-sm text-gray-500 text-center">
              Tarefas pendentes de alta prioridade
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Página principal de relatórios
export default function Reports() {
  const [dateRange, setDateRange] = useState("30");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [projectFilter, setProjectFilter] = useState("all");
  
  // Buscar projetos
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });
  
  // Buscar todas as tarefas
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });
  
  // Buscar atividades
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities"],
  });
  
  // Filtrar dados por data
  const filterByDateRange = (data: any[]) => {
    if (!data) return [];
    
    const today = new Date();
    const startDate = sub(today, { days: parseInt(dateRange) });
    
    return data.filter(item => {
      const itemDate = new Date(item.createdAt || item.dueDate || today);
      return isAfter(itemDate, startDate);
    });
  };
  
  // Filtrar dados por projeto
  const filterByProject = (data: any[]) => {
    if (!data || projectFilter === "all") return data || [];
    return data.filter(item => item.projectId === parseInt(projectFilter));
  };
  
  // Aplicar filtros
  const filteredTasks = filterByProject(filterByDateRange(tasks || []));
  const filteredActivities = filterByProject(filterByDateRange(activities || []));
  
  const isLoading = projectsLoading || tasksLoading || activitiesLoading;
  
  return (
    <div className="py-6 px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Relatórios e Métricas</h2>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="dateRange">Período:</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Label htmlFor="project">Projeto:</Label>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os projetos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                {projects && projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Métricas e KPIs */}
      {!isLoading && projects && tasks && (
        <MetricsCards projects={projects} tasks={filteredTasks} />
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tasks">Relatório de Tarefas</TabsTrigger>
          <TabsTrigger value="progress">Progresso dos Projetos</TabsTrigger>
          <TabsTrigger value="export">Exportar Dados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Tarefas por Status</CardTitle>
                <CardDescription>
                  Visão geral da distribuição das tarefas entre os diferentes status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-[350px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="flex justify-center items-center h-[350px]">
                    <p className="text-gray-500">Nenhum dado disponível para o período selecionado</p>
                  </div>
                ) : (
                  <TaskStatusDistribution data={filteredTasks} />
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tarefas por Prioridade</CardTitle>
                <CardDescription>
                  Distribuição das tarefas de acordo com seu nível de prioridade
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-[350px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="flex justify-center items-center h-[350px]">
                    <p className="text-gray-500">Nenhum dado disponível para o período selecionado</p>
                  </div>
                ) : (
                  <TasksPriorityChart data={filteredTasks} />
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolução do Progresso</CardTitle>
                <CardDescription>
                  Acompanhamento da evolução do progresso ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-[350px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredActivities.length === 0 ? (
                  <div className="flex justify-center items-center h-[350px]">
                    <p className="text-gray-500">Nenhum dado disponível para o período selecionado</p>
                  </div>
                ) : (
                  <ProjectProgressChart data={filteredActivities} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Relatório Detalhado de Tarefas</CardTitle>
                  <CardDescription>
                    Lista completa das tarefas e seus detalhes
                  </CardDescription>
                </div>
                <ExportReportButton 
                  data={filteredTasks} 
                  type="tarefas" 
                  isLoading={isLoading} 
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum dado disponível para o período selecionado</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nome</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Projeto</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Prioridade</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Prazo</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Responsável</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredTasks.map((task: any) => {
                          const projectName = projects?.find((p: any) => p.id === task.projectId)?.name || "Sem projeto";
                          
                          // Configuração de status
                          let statusConfig = {
                            text: "A Fazer",
                            bg: "bg-orange-100",
                            color: "text-orange-800"
                          };
                          
                          if (task.status === "in_progress") {
                            statusConfig = {
                              text: "Em Progresso",
                              bg: "bg-blue-100",
                              color: "text-blue-800"
                            };
                          } else if (task.status === "review") {
                            statusConfig = {
                              text: "Em Revisão",
                              bg: "bg-purple-100",
                              color: "text-purple-800"
                            };
                          } else if (task.status === "completed") {
                            statusConfig = {
                              text: "Concluída",
                              bg: "bg-green-100",
                              color: "text-green-800"
                            };
                          }
                          
                          // Prioridade
                          let priorityConfig = {
                            text: "Baixa",
                            bg: "bg-gray-100",
                            color: "text-gray-800"
                          };
                          
                          if (task.priority === "medium") {
                            priorityConfig = {
                              text: "Média",
                              bg: "bg-yellow-100",
                              color: "text-yellow-800"
                            };
                          } else if (task.priority === "high") {
                            priorityConfig = {
                              text: "Alta",
                              bg: "bg-red-100",
                              color: "text-red-800"
                            };
                          }
                          
                          return (
                            <tr key={task.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">{task.name}</td>
                              <td className="px-4 py-3 text-sm">{projectName}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                                  {statusConfig.text}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs rounded-full ${priorityConfig.bg} ${priorityConfig.color}`}>
                                  {priorityConfig.text}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {task.dueDate 
                                  ? format(new Date(task.dueDate), "dd/MM/yyyy", { locale: ptBR })
                                  : "Não definido"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {task.assignedUser?.name || "Não atribuído"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Progresso dos Projetos</CardTitle>
                  <CardDescription>
                    Visão geral do progresso de cada projeto e suas métricas
                  </CardDescription>
                </div>
                <ExportReportButton 
                  data={projects || []} 
                  type="projetos" 
                  isLoading={isLoading} 
                />
              </div>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !projects || projects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum projeto encontrado</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Projeto</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Progresso</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Prazo</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Tarefas</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Membros</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {projects.map((project: any) => {
                          // Contagem de tarefas por projeto
                          const projectTasks = (tasks || []).filter((t: any) => t.projectId === project.id);
                          const completedTasks = projectTasks.filter((t: any) => t.status === "completed").length;
                          
                          // Status do projeto
                          let statusConfig = {
                            text: "Planejamento",
                            bg: "bg-gray-100",
                            color: "text-gray-800"
                          };
                          
                          if (project.status === "in_progress") {
                            statusConfig = {
                              text: "Em Progresso",
                              bg: "bg-blue-100",
                              color: "text-blue-800"
                            };
                          } else if (project.status === "testing") {
                            statusConfig = {
                              text: "Em Testes",
                              bg: "bg-purple-100",
                              color: "text-purple-800"
                            };
                          } else if (project.status === "completed") {
                            statusConfig = {
                              text: "Concluído",
                              bg: "bg-green-100",
                              color: "text-green-800"
                            };
                          } else if (project.status === "on_hold") {
                            statusConfig = {
                              text: "Em Pausa",
                              bg: "bg-red-100",
                              color: "text-red-800"
                            };
                          }
                          
                          // Verificar se está atrasado
                          const deadlineDate = project.deadline ? new Date(project.deadline) : null;
                          const isOverdue = deadlineDate && isBefore(deadlineDate, new Date()) && project.status !== "completed";
                          
                          return (
                            <tr key={project.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium">{project.name}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                                  {statusConfig.text}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-full h-2 bg-gray-200 rounded-full">
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
                                  <span className="text-sm font-medium">{project.progress}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {project.deadline ? (
                                  <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                                    {format(new Date(project.deadline), "dd/MM/yyyy", { locale: ptBR })}
                                    {isOverdue && " (Atrasado)"}
                                  </span>
                                ) : (
                                  "Não definido"
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {completedTasks}/{projectTasks.length}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {project.memberCount || "N/A"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Exportar Dados do Projeto</CardTitle>
                <CardDescription>
                  Exporte dados completos para análise externa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg flex items-center justify-between bg-gray-50">
                    <div className="flex items-center">
                      <FileSpreadsheet className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <h4 className="font-medium">Relatório de Tarefas</h4>
                        <p className="text-sm text-gray-500">Dados detalhados de todas as tarefas</p>
                      </div>
                    </div>
                    <ExportReportButton 
                      data={tasks || []} 
                      type="tarefas-completo" 
                      isLoading={tasksLoading} 
                    />
                  </div>
                  
                  <div className="p-4 border rounded-lg flex items-center justify-between bg-gray-50">
                    <div className="flex items-center">
                      <FileSpreadsheet className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <h4 className="font-medium">Relatório de Projetos</h4>
                        <p className="text-sm text-gray-500">Dados gerenciais dos projetos</p>
                      </div>
                    </div>
                    <ExportReportButton 
                      data={projects || []} 
                      type="projetos-completo" 
                      isLoading={projectsLoading} 
                    />
                  </div>
                  
                  <div className="p-4 border rounded-lg flex items-center justify-between bg-gray-50">
                    <div className="flex items-center">
                      <FileCog className="h-8 w-8 text-purple-600 mr-3" />
                      <div>
                        <h4 className="font-medium">Histórico de Atividades</h4>
                        <p className="text-sm text-gray-500">Registro de todas as atividades</p>
                      </div>
                    </div>
                    <ExportReportButton 
                      data={activities || []} 
                      type="atividades" 
                      isLoading={activitiesLoading} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Relatório</CardTitle>
                <CardDescription>
                  Personalize seus relatórios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="reportName">Nome do Relatório</Label>
                    <Input id="reportName" placeholder="Relatório Gerencial" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Período do Relatório</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate" className="text-xs text-gray-500">Data Inicial</Label>
                        <Input id="startDate" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="endDate" className="text-xs text-gray-500">Data Final</Label>
                        <Input id="endDate" type="date" />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros Avançados
                    </Button>
                    <Button>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Gerar Relatório
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}