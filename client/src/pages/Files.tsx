import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/files/FileUpload";
import FileList from "@/components/files/FileList";
import { Search, Plus, FolderPlus, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Files() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Fetch projects for the dropdown
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Determine if we should show global files or project-specific files
  const showProjectFiles = selectedProjectId !== null;

  return (
    <div className="py-6 px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Arquivos</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar arquivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select 
            value={selectedProjectId?.toString() || ""} 
            onValueChange={(value) => setSelectedProjectId(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Todos os projetos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os projetos</SelectItem>
              {projects?.map((project: any) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Arquivo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="files" className="mb-6">
        <TabsList>
          <TabsTrigger value="files">Todos os Arquivos</TabsTrigger>
          <TabsTrigger value="recent">Recentes</TabsTrigger>
          <TabsTrigger value="shared">Compartilhados</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="mt-6">
          <Card>
            <div className="py-4 px-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {showProjectFiles 
                  ? `Arquivos do Projeto: ${projects?.find((p: any) => p.id === selectedProjectId)?.name || "Carregando..."}`
                  : "Todos os Arquivos"
                }
              </h3>
              <Button size="sm" variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
            <div className="p-5">
              {projectsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !selectedProjectId && !projects?.length ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Nenhum projeto encontrado para mostrar arquivos.</p>
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Arquivo
                  </Button>
                </div>
              ) : showProjectFiles ? (
                <FileList projectId={selectedProjectId} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Selecione um projeto para visualizar seus arquivos.</p>
                  <Select 
                    value={selectedProjectId?.toString() || ""} 
                    onValueChange={(value) => setSelectedProjectId(value ? parseInt(value) : null)}
                  >
                    <SelectTrigger className="w-[250px] mx-auto">
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project: any) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <Card>
            <div className="py-4 px-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Arquivos Recentes</h3>
            </div>
            <div className="p-5">
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Os arquivos que você visualizou ou trabalhou recentemente aparecem aqui.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="shared" className="mt-6">
          <Card>
            <div className="py-4 px-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Arquivos Compartilhados</h3>
            </div>
            <div className="p-5">
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Arquivos compartilhados com você por outros membros da equipe aparecem aqui.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Arquivo</DialogTitle>
          </DialogHeader>
          
          {!selectedProjectId && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selecione o Projeto
              </label>
              <Select 
                value={selectedProjectId?.toString() || ""} 
                onValueChange={(value) => setSelectedProjectId(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {selectedProjectId ? (
            <FileUpload
              projectId={selectedProjectId}
              onSuccess={() => setIsUploadDialogOpen(false)}
            />
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">Por favor, selecione um projeto para fazer upload de arquivos.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
