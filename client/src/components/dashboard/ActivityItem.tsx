import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { transitions } from "@/lib/animations";

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
    <motion.div 
      className="flex items-start"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.default}
      whileHover={{ 
        x: 5,
        transition: { duration: 0.2 }
      }}
    >
      <motion.div 
        className="flex-shrink-0 mr-3"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, ...transitions.bounce }}
      >
        <Avatar>
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </motion.div>
      <motion.div 
        className="flex-1 bg-gray-50 rounded-lg p-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, ...transitions.default }}
      >
        <div className="flex items-center justify-between">
          <div>
            <motion.span 
              className="font-medium text-gray-900"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {user.name}
            </motion.span>
            <motion.span 
              className="text-gray-600 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            > 
              {action}:
            </motion.span>
            <motion.span 
              className="font-medium text-gray-900"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            > 
              {subject}
            </motion.span>
          </div>
          <motion.span 
            className="text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            {formatTime(time)}
          </motion.span>
        </div>
        {details && (
          <motion.p 
            className="text-sm text-gray-600 mt-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ delay: 0.5, ...transitions.default }}
          >
            {details}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
