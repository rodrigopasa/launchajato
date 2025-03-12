import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Loader2, FileText, FileSpreadsheet, Calendar } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { transitions } from "@/lib/animations";

interface ReportExporterProps {
  projectId?: number;
  data: any;
  type: "project" | "tasks" | "team" | "overview";
  className?: string;
}

export default function ReportExporter({ projectId, data, type, className }: ReportExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("csv");

  const downloadFileName = () => {
    const dateStr = format(new Date(), "yyyy-MM-dd");
    const projectStr = projectId ? `_project-${projectId}` : "";
    return `launchrocket_${type}_report${projectStr}_${dateStr}.${selectedFormat}`;
  };

  const getJsonData = () => {
    return JSON.stringify(data, null, 2);
  };

  const getCsvData = () => {
    if (!data || data.length === 0) return "";
    
    const headers = Object.keys(data[0]);
    const csvHeader = headers.join(",");
    
    const csvRows = data.map((item: any) => {
      return headers.map(header => {
        const value = item[header];
        // Handle special cases like arrays, dates, and values with commas
        if (value === null || value === undefined) return '';
        if (Array.isArray(value)) return `"${value.join("; ")}"`;
        if (typeof value === 'object' && value instanceof Date) return format(value, 'yyyy-MM-dd');
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return value;
      }).join(",");
    });
    
    return [csvHeader, ...csvRows].join("\n");
  };

  const exportData = async () => {
    if (!data) return;
    
    setIsExporting(true);
    
    try {
      setTimeout(() => {
        let content = "";
        let mimeType = "";
        
        if (selectedFormat === "json") {
          content = getJsonData();
          mimeType = "application/json";
        } else if (selectedFormat === "csv") {
          content = getCsvData();
          mimeType = "text/csv";
        }
        
        // Create blob and download
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadFileName();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setIsExporting(false);
      }, 800); // Simulate processing time for better UX
    } catch (error) {
      console.error("Error exporting data:", error);
      setIsExporting(false);
    }
  };

  const getTitle = () => {
    switch(type) {
      case "project": return "Relatório do Projeto";
      case "tasks": return "Relatório de Tarefas";
      case "team": return "Relatório da Equipe";
      case "overview": return "Visão Geral";
      default: return "Relatório";
    }
  };

  const getDescription = () => {
    switch(type) {
      case "project": return "Exportar detalhes do projeto, fases e progresso";
      case "tasks": return "Exportar lista de tarefas com status e prioridades";
      case "team": return "Exportar informações da equipe e atribuições";
      case "overview": return "Exportar visão geral de todos os projetos";
      default: return "Exportar dados";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <FileDown className="mr-2 h-5 w-5" />
          {getTitle()}
        </CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="csv" value={selectedFormat} onValueChange={setSelectedFormat}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv" className="flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center justify-center">
              <FileText className="h-4 w-4 mr-2" />
              JSON
            </TabsTrigger>
          </TabsList>
          <TabsContent value="csv">
            <div className="mt-2 text-sm text-gray-500">
              <p>Formato CSV para abrir no Excel ou Google Sheets</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Compatível com planilhas e ferramentas de análise</li>
                <li>Formato estruturado em colunas e linhas</li>
                <li>Ideal para processamento de dados</li>
              </ul>
            </div>
          </TabsContent>
          <TabsContent value="json">
            <div className="mt-2 text-sm text-gray-500">
              <p>Formato JSON para desenvolvedores e importação em outras ferramentas</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Estrutura de dados completa</li>
                <li>Ideal para integração com APIs e sistemas</li>
                <li>Preserva hierarquia e tipos de dados</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Gerado em: {format(new Date(), "dd/MM/yyyy")}
          </div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={transitions.quick}
          >
            <Button 
              onClick={exportData}
              disabled={isExporting || !data || data.length === 0}
              className="space-x-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  <span>Exportar {selectedFormat.toUpperCase()}</span>
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}