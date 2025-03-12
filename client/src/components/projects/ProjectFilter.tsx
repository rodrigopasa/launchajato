import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Filter, Check, Calendar, Clock } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { transitions } from "@/lib/animations";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ProjectFilterProps {
  onFilterChange: (filters: ProjectFilterState) => void;
  className?: string;
}

export interface ProjectFilterState {
  search: string;
  status: string[];
  sortBy: "name" | "deadline" | "progress" | "recent";
  sortOrder: "asc" | "desc";
}

const initialFilters: ProjectFilterState = {
  search: "",
  status: [],
  sortBy: "recent",
  sortOrder: "desc"
};

export default function ProjectFilter({ onFilterChange, className }: ProjectFilterProps) {
  const [filters, setFilters] = useState<ProjectFilterState>(initialFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedStatus, setExpandedStatus] = useState(false);

  const statusOptions = [
    { id: "planning", label: "Planejamento", color: "bg-blue-100 text-blue-800" },
    { id: "in_progress", label: "Em Andamento", color: "bg-yellow-100 text-yellow-800" },
    { id: "testing", label: "Em Teste", color: "bg-purple-100 text-purple-800" },
    { id: "completed", label: "Concluído", color: "bg-green-100 text-green-800" },
    { id: "on_hold", label: "Em Espera", color: "bg-red-100 text-red-800" }
  ];

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const toggleStatus = (status: string) => {
    setFilters(prev => {
      const newStatus = prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status];
      
      return { ...prev, status: newStatus };
    });
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        {/* Pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            className="pl-10 w-full"
            placeholder="Buscar projetos..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        
        {/* Filtros rápidos */}
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-sm font-medium text-gray-700">Status:</Label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.slice(0, expandedStatus ? undefined : 3).map(status => (
              <Badge
                key={status.id}
                className={cn(
                  "cursor-pointer hover:opacity-80 transition-opacity px-3 py-1",
                  filters.status.includes(status.id) ? status.color : "bg-gray-100 text-gray-600"
                )}
                onClick={() => toggleStatus(status.id)}
              >
                {filters.status.includes(status.id) && (
                  <Check className="h-3 w-3 mr-1" />
                )}
                {status.label}
              </Badge>
            ))}
            
            {statusOptions.length > 3 && (
              <Badge
                className="cursor-pointer bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1"
                onClick={() => setExpandedStatus(!expandedStatus)}
              >
                {expandedStatus ? "Mostrar menos" : `+${statusOptions.length - 3}`}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showAdvanced ? "Esconder filtros" : "Mais filtros"}
          </Button>
          
          {(filters.search !== "" || filters.status.length > 0 || 
           filters.sortBy !== initialFilters.sortBy || 
           filters.sortOrder !== initialFilters.sortOrder) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={transitions.quick}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                Limpar filtros
              </Button>
            </motion.div>
          )}
        </div>
        
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={transitions.default}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="sortBy" className="text-sm">Ordenar por</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => 
                      setFilters({ ...filters, sortBy: value as ProjectFilterState["sortBy"] })
                    }
                  >
                    <SelectTrigger id="sortBy">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" /> 
                          Data de criação
                        </div>
                      </SelectItem>
                      <SelectItem value="name">
                        <div className="flex items-center">
                          <Search className="h-4 w-4 mr-2" /> 
                          Nome
                        </div>
                      </SelectItem>
                      <SelectItem value="deadline">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" /> 
                          Prazo
                        </div>
                      </SelectItem>
                      <SelectItem value="progress">
                        <div className="flex items-center">
                          <Filter className="h-4 w-4 mr-2" /> 
                          Progresso
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sortOrder" className="text-sm">Ordem</Label>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value) => 
                      setFilters({ ...filters, sortOrder: value as "asc" | "desc" })
                    }
                  >
                    <SelectTrigger id="sortOrder">
                      <SelectValue placeholder="Ordem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Crescente</SelectItem>
                      <SelectItem value="desc">Decrescente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}