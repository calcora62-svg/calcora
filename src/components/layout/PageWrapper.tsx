import React from 'react';
import { motion } from 'motion/react';

export const PageWrapper = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`min-h-[calc(100vh-4rem)] flex flex-col ${className}`}
    >
      {children}
    </motion.div>
  );
};
