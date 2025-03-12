import { motion } from "framer-motion";
import { variants, transitions } from "@/lib/animations";
import { Link } from "wouter";

interface TaskCardProps {
  id: number;
  name: string;
  description?: string;
  priority: string;
  projectId: number;
  dueDate?: string | Date;
}

export default function TaskCard({
  id,
  name,
  description,
  priority,
  projectId,
  dueDate,
}: TaskCardProps) {
  // Prioridade - configuração de cores
  const priorityConfig = {
    high: {
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Alta",
    },
    medium: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Média",
    },
    low: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Baixa",
    },
  };

  const priorityData = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

  return (
    <Link href={`/tasks/${id}`}>
      <motion.div
        className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 cursor-pointer hover:border-blue-300"
        initial="hidden"
        animate="visible"
        variants={variants.slideDown}
        whileHover={{ y: -3, boxShadow: "0 6px 10px rgba(0, 0, 0, 0.08)" }}
        whileTap={{ scale: 0.98 }}
        transition={transitions.default}
      >
        <div className="flex justify-between items-start mb-2">
          <motion.h4 
            className="font-medium text-gray-800"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {name}
          </motion.h4>
          <motion.span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityData.bg} ${priorityData.text}`}
            whileHover={{ scale: 1.05 }}
            transition={transitions.quick}
          >
            {priorityData.label}
          </motion.span>
        </div>
        {description && (
          <motion.p 
            className="text-xs text-gray-600 mb-2 line-clamp-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {description}
          </motion.p>
        )}
        <motion.div 
          className="flex justify-between items-center text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span>Projeto {projectId}</span>
          {dueDate && (
            <span>
              {new Date(dueDate).toLocaleDateString('pt-BR')}
            </span>
          )}
        </motion.div>
      </motion.div>
    </Link>
  );
}