import { cn } from "@/lib/utils";
import { MoreVertical, Calendar } from "lucide-react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { variants, transitions } from "@/lib/animations";

interface ProjectMember {
  id: number;
  name: string;
  avatar?: string;
}

interface ProjectCardProps {
  id: number;
  name: string;
  description: string;
  status: string;
  progress: number;
  deadline: string;
  members: ProjectMember[];
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ProjectCard({
  id,
  name,
  description,
  status,
  progress,
  deadline,
  members,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  // Status badge colors
  const statusConfig = {
    planning: {
      color: "text-yellow-800",
      bg: "bg-yellow-100",
      label: "Em planejamento",
    },
    in_progress: {
      color: "text-green-800",
      bg: "bg-green-100",
      label: "Em progresso",
    },
    testing: {
      color: "text-blue-800",
      bg: "bg-blue-100",
      label: "Em testes",
    },
    completed: {
      color: "text-indigo-800",
      bg: "bg-indigo-100",
      label: "Concluído",
    },
    on_hold: {
      color: "text-gray-800",
      bg: "bg-gray-100",
      label: "Em pausa",
    },
  };

  const statusData = statusConfig[status as keyof typeof statusConfig] || statusConfig.planning;

  // Format date
  const formatDeadline = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd MMM yyyy", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  // Progress bar color
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 40) return "bg-blue-500";
    return "bg-yellow-500";
  };

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100"
      initial="hidden"
      animate="visible"
      variants={variants.scaleUp}
      whileHover={{ y: -5 }}
      transition={transitions.default}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <motion.span 
            className={cn("px-2 py-1 text-xs rounded-full", statusData.bg, statusData.color)}
            whileHover={{ scale: 1.05 }}
            transition={transitions.quick}
          >
            {statusData.label}
          </motion.span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button 
                className="text-gray-400 hover:text-gray-600"
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.95 }}
                transition={transitions.quick}
              >
                <MoreVertical className="h-4 w-4" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>}
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  Excluir
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => window.location.href = `/projects/${id}`}>
                Ver detalhes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <motion.h4 
          className="text-lg font-semibold text-gray-800 mb-2"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={transitions.default}
        >
          {name}
        </motion.h4>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatDeadline(deadline)}</span>
          </div>
          <div className="text-sm font-medium">
            <span>{progress}%</span> completo
          </div>
        </div>

        <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
          <motion.div
            className={cn("h-full rounded-full", getProgressColor(progress))}
            style={{ width: `${progress}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ...transitions.default, delay: 0.2 }}
          ></motion.div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...transitions.quick, delay: 0.1 + (index * 0.1) }}
              >
                <Avatar className="border-2 border-white">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </motion.div>
            ))}
            {members.length > 3 && (
              <motion.div 
                className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-500"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...transitions.quick, delay: 0.3 + (Math.min(members.length, 3) * 0.1) }}
              >
                +{members.length - 3}
              </motion.div>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-primary text-sm font-medium hover:underline"
            onClick={() => window.location.href = `/projects/${id}`}
          >
            Detalhes
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
