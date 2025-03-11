import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Send, Trash2 } from "lucide-react";

export default function Communication() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Fetch comments for selected project
  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: [`/api/projects/${selectedProjectId}/comments`],
    enabled: !!selectedProjectId,
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({ projectId, content }: { projectId: number; content: string }) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/comments`, { content });
      return response.json();
    },
    onSuccess: () => {
      setCommentContent("");
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/comments`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Ocorreu um erro ao enviar sua mensagem",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest("DELETE", `/api/comments/${commentId}`, undefined);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/comments`] });
      toast({
        title: "Mensagem excluída",
        description: "A mensagem foi excluída com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir mensagem",
        description: error.message || "Ocorreu um erro ao excluir a mensagem",
        variant: "destructive",
      });
    },
  });

  const handleSendComment = () => {
    if (!commentContent.trim() || !selectedProjectId) return;
    
    createCommentMutation.mutate({
      projectId: selectedProjectId,
      content: commentContent,
    });
  };

  const handleDeleteComment = (id: number) => {
    setCommentToDelete(id);
  };

  const confirmDeleteComment = () => {
    if (commentToDelete !== null) {
      deleteCommentMutation.mutate(commentToDelete);
      setCommentToDelete(null);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  return (
    <div className="py-6 px-4 md:px-8 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Comunicação</h2>
        <div className="w-full md:w-64">
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
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="py-4 px-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            {selectedProjectId 
              ? `Chat: ${projects?.find((p: any) => p.id === selectedProjectId)?.name || "Carregando..."}`
              : "Selecione um projeto para iniciar a conversa"
            }
          </h3>
        </div>

        <div className="flex-1 p-5 overflow-y-auto">
          {projectsLoading || (commentsLoading && selectedProjectId) ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !selectedProjectId ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-500 mb-4 text-center">
                Selecione um projeto para ver as mensagens e comunicar-se com a equipe.
              </p>
            </div>
          ) : comments?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-500 mb-4 text-center">
                Nenhuma mensagem ainda. Seja o primeiro a iniciar a conversa!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments?.map((comment: any) => (
                <div 
                  key={comment.id} 
                  className={`flex ${comment.user?.id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`flex max-w-[80%] ${comment.user?.id === user?.id ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-10 w-10 mt-1">
                      <AvatarImage src={comment.user?.avatar} alt={comment.user?.name} />
                      <AvatarFallback>
                        {comment.user?.name?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className={`mx-2 ${
                        comment.user?.id === user?.id 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 text-gray-800'
                      } rounded-lg p-3 relative`}
                    >
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <p className="font-medium text-sm">
                          {comment.user?.id === user?.id ? 'Você' : comment.user?.name}
                        </p>
                        <span className="text-xs opacity-70">
                          {format(new Date(comment.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                      
                      {comment.user?.id === user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-200 hover:bg-red-100 text-gray-600 hover:text-red-600"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {selectedProjectId && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <Textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
              />
              <Button 
                className="self-end"
                onClick={handleSendComment}
                disabled={!commentContent.trim() || createCommentMutation.isPending}
              >
                {createCommentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Comment Confirmation */}
      <AlertDialog
        open={commentToDelete !== null}
        onOpenChange={(open) => !open && setCommentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCommentMutation.isPending && (
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
