import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Shield, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiConnectionStatusProps {
  apiName: string;
  endpoint: string;
  className?: string;
  errorMessage?: string;
  onStatusChange?: (status: 'connected' | 'error' | 'checking' | 'unknown') => void;
}

export function ApiConnectionStatus({
  apiName,
  endpoint,
  className,
  errorMessage,
  onStatusChange
}: ApiConnectionStatusProps) {
  const [status, setStatus] = useState<'connected' | 'error' | 'checking' | 'unknown'>('unknown');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const checkConnection = async () => {
    setStatus('checking');
    
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        setStatus('connected');
        if (onStatusChange) onStatusChange('connected');
      } else {
        setStatus('error');
        if (onStatusChange) onStatusChange('error');
      }
    } catch (error) {
      console.error(`Error checking ${apiName} connection:`, error);
      setStatus('error');
      if (onStatusChange) onStatusChange('error');
    }
    
    setLastChecked(new Date());
  };

  useEffect(() => {
    // Verificar a conexão quando o componente é montado
    checkConnection();
    
    // Verificar a conexão a cada 5 minutos
    const interval = setInterval(checkConnection, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [endpoint]);

  const statusConfig = {
    connected: {
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      text: "Conectado",
      bg: "bg-green-50",
      border: "border-green-200"
    },
    error: {
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      text: "Erro de conexão",
      bg: "bg-red-50",
      border: "border-red-200"
    },
    checking: {
      icon: <Shield className="h-5 w-5 text-blue-500 animate-pulse" />,
      text: "Verificando...",
      bg: "bg-blue-50",
      border: "border-blue-200"
    },
    unknown: {
      icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
      text: "Status desconhecido",
      bg: "bg-amber-50",
      border: "border-amber-200"
    }
  };

  const config = statusConfig[status];

  return (
    <div className={cn(
      "rounded-md border p-3 text-sm",
      config.bg,
      config.border,
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="font-medium">{apiName}: {config.text}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs underline text-gray-600 hover:text-gray-900"
          >
            {showDetails ? "Ocultar detalhes" : "Detalhes"}
          </button>
          <button
            onClick={checkConnection}
            className="text-xs underline text-blue-600 hover:text-blue-900 flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Verificar agora
          </button>
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          <p>Endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded">{endpoint}</code></p>
          {status === 'error' && (
            <p className="text-red-600">{errorMessage || "Não foi possível conectar ao serviço. Verifique as credenciais e tente novamente."}</p>
          )}
          {lastChecked && (
            <p>Última verificação: {lastChecked.toLocaleTimeString()}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Ícone RefreshCw copiado do lucide-react
function RefreshCw({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}