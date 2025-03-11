import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ActivityItemProps {
  user: {
    id: number;
    name: string;
    avatar?: string;
  };
  action: string;
  subject: string;
  details?: string;
  time: string | Date;
}

export default function ActivityItem({ user, action, subject, details, time }: ActivityItemProps) {
  const formatTime = (timeValue: string | Date) => {
    try {
      const date = typeof timeValue === "string" ? new Date(timeValue) : timeValue;
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch (e) {
      return typeof timeValue === "string" ? timeValue : format(timeValue, "dd/MM/yyyy HH:mm");
    }
  };

  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 mr-3">
        <Avatar>
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1 bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900">{user.name}</span>
            <span className="text-gray-600 text-sm"> {action}:</span>
            <span className="font-medium text-gray-900"> {subject}</span>
          </div>
          <span className="text-xs text-gray-500">{formatTime(time)}</span>
        </div>
        {details && <p className="text-sm text-gray-600 mt-1">{details}</p>}
      </div>
    </div>
  );
}
