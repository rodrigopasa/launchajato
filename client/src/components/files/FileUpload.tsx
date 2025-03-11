import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { UploadCloud, File, X, FileText, FileImage, FileArchive, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  projectId: number;
  taskId?: number;
  onSuccess?: () => void;
}

export default function FileUpload({ projectId, taskId, onSuccess }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fileUploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const xhr = new XMLHttpRequest();
      
      // Create a promise to track the upload
      return new Promise((resolve, reject) => {
        xhr.open("POST", `/api/projects/${projectId}/files`, true);
        
        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error("Network error occurred during upload"));
        };
        
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      // Reset the form
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Show success toast
      toast({
        title: "Arquivo enviado com sucesso",
        description: "O arquivo foi adicionado ao projeto",
      });
      
      // Invalidate the files query to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/files`] });
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar arquivo",
        description: error.message || "Ocorreu um erro durante o upload",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    if (taskId) {
      formData.append("taskId", taskId.toString());
    }
    
    fileUploadMutation.mutate(formData);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Function to get the appropriate icon based on file type
  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (file.type.startsWith('image/')) {
      return <FileImage className="h-6 w-6 text-blue-500" />;
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return <FileArchive className="h-6 w-6 text-yellow-500" />;
    } else if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'xml'].includes(extension || '')) {
      return <FileCode className="h-6 w-6 text-green-500" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary",
          selectedFile && "border-primary"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          {!selectedFile ? (
            <>
              <UploadCloud className="h-10 w-10 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  Arraste e solte um arquivo aqui, ou{" "}
                  <Label htmlFor="file-upload" className="text-primary hover:underline cursor-pointer">
                    escolha um arquivo
                  </Label>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Arquivos suportados: Documentos, Imagens, Arquivos compactados (máx. 50MB)
                </p>
              </div>
              <Input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
                <div className="flex items-center space-x-3">
                  {getFileIcon(selectedFile)}
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-gray-500 hover:text-red-500"
                  aria-label="Remover arquivo"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {uploadProgress > 0 && (
                <div className="w-full mt-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-gray-500 text-right mt-1">{uploadProgress}%</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || fileUploadMutation.isPending}
          className="w-full sm:w-auto"
        >
          {fileUploadMutation.isPending ? "Enviando..." : "Enviar Arquivo"}
        </Button>
      </div>
    </div>
  );
}
