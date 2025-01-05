'use client';

import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Loading spinner */}
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-primary/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        {/* Spinning segment */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
          animate={{ 
            rotate: 360 
          }}
          transition={{
            duration: 1.2,
            ease: "linear",
            repeat: Infinity
          }}
        />
      </div>

      {/* Loading text */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-lg font-medium text-primary">Loading your portfolio</p>
        <motion.div 
          className="text-primary/60 mt-2"
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <span>Please wait</span>
          <motion.span
            animate={{
              opacity: [0, 1, 1, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              times: [0, 0.25, 0.5, 0.75, 1]
            }}
          >
            ...
          </motion.span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;