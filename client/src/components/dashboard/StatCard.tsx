import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { transitions, variants } from "@/lib/animations";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconColor: string;
  iconBgColor: string;
}

export default function StatCard({ title, value, icon, iconColor, iconBgColor }: StatCardProps) {
  return (
    <motion.div 
      className="bg-white rounded-lg shadow-sm p-6"
      initial="hidden"
      animate="visible"
      variants={variants.fadeIn}
      whileHover={{ 
        y: -5, 
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
        transition: { ...transitions.default }
      }}
    >
      <div className="flex items-center">
        <motion.div 
          className={cn("rounded-full p-3", iconBgColor)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, ...transitions.bounce }}
          whileHover={{ rotate: 15, scale: 1.1 }}
        >
          <div className={cn("text-xl", iconColor)}>{icon}</div>
        </motion.div>
        <div className="ml-4">
          <motion.h3 
            className="text-sm font-medium text-gray-500"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...transitions.default }}
          >
            {title}
          </motion.h3>
          <motion.p 
            className="text-2xl font-semibold text-gray-800"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ...transitions.default }}
          >
            {value}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
