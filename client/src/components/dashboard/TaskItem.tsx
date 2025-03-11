import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaskItemProps {
  id: number;
  name: string;
  priority: string;
  project: string;
  dueDate: string | Date;
  completed?: boolean;
  onStatusChange: (id: number, completed: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewDetails?: () => void;
}

export default function TaskItem({
  id,
  name,
  priority,
  project,
  dueDate,
  completed = false,
  onStatusChange,
  onEdit,
  onDelete,
  onViewDetails,
}: TaskItemProps) {
  const [isCompleted, setIsCompleted] = useState(completed);

  // Priority badge styles
  const priorityConfig = {
    high: {
      color: "text-red-800",
      bg: "bg-red-100",
      label: "Alta",
    },
    medium: {
      color: "text-yellow-800",
      bg: "bg-yellow-100",
      label: "Média",
    },
    low: {
      color: "text-green-800",
      bg: "bg-green-100",
      label: "Baixa",
    },
  };

  const priorityData =
    priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

  // Format due date
  const formatDueDate = (dateValue: string | Date) => {
    try {
      const today = new Date();
      const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
      
      // Check if date is today
      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        return "Vence hoje";
      }

      // Check if date is tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (
        date.getDate() === tomorrow.getDate() &&
        date.getMonth() === tomorrow.getMonth() &&
        date.getFullYear() === tomorrow.getFullYear()
      ) {
        return "Vence amanhã";
      }

      // Check if date is within a week
      const oneWeek = new Date(today);
      oneWeek.setDate(oneWeek.getDate() + 7);
      if (date <= oneWeek) {
        const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return `Em ${diffDays} dias`;
      }

      // Otherwise, return formatted date
      return format(date, "dd MMM yyyy", { locale: ptBR });
    } catch (e) {
      return typeof dateValue === "string" ? dateValue : format(dateValue, "dd/MM/yyyy");
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setIsCompleted(checked);
    onStatusChange(id, checked);
  };

  return (
    <div className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150 ease-in-out">
      <div className="flex-shrink-0 mr-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleCheckboxChange}
          className="h-5 w-5"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p
            className={cn(
              "text-sm font-medium truncate",
              isCompleted ? "line-through text-gray-400" : "text-gray-900"
            )}
          >
            {name}
          </p>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
              priorityData.bg,
              priorityData.color
            )}
          >
            {priorityData.label}
          </span>
        </div>
        <div className="flex items-center mt-1">
          <p className="text-xs text-gray-500 truncate">{project}</p>
          <span className="mx-1 text-gray-300">•</span>
          <p className="text-xs text-gray-500">{formatDueDate(dueDate)}</p>
        </div>
      </div>
      <div className="flex-shrink-0 ml-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-gray-400 hover:text-gray-600 focus:outline-none">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onViewDetails && <DropdownMenuItem onClick={onViewDetails}>Ver detalhes</DropdownMenuItem>}
            {onEdit && <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>}
            {onDelete && (
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-600 focus:text-red-600"
              >
                Excluir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
