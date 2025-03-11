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
    <div
      className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 cursor-pointer hover:border-blue-300 transition-colors"
      onClick={() => window.location.href = `/tasks/${id}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-800">{name}</h4>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityData.bg} ${priorityData.text}`}
        >
          {priorityData.label}
        </span>
      </div>
      {description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{description}</p>
      )}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Projeto {projectId}</span>
        {dueDate && (
          <span>
            {new Date(dueDate).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  );
}