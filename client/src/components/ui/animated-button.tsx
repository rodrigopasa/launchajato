import { motion } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';
import { ReactNode } from 'react';

interface AnimatedButtonProps extends ButtonProps {
  children: ReactNode;
}

export function AnimatedButton({ children, ...props }: AnimatedButtonProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button {...props}>
        {children}
      </Button>
    </motion.div>
  );
}