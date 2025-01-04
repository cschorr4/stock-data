'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  clicked: boolean;
}

const LoadingScreen = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    'hsl(var(--chart-1))',
  ];

  useEffect(() => {
    // Initialize particles
    const initialParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10, // Keep particles away from edges (10-90%)
      y: Math.random() * 80 + 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      clicked: false,
    }));
    setParticles(initialParticles);
    setIsReady(true);
  }, []);

  const handleParticleClick = (id: number) => {
    setParticles(prev => prev.map(particle => 
      particle.id === id ? { ...particle, clicked: true } : particle
    ));
    setScore(prev => prev + 1);
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-background/95 backdrop-blur-md z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Game instructions */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-20">
        <motion.p 
          className="text-lg font-medium text-primary mb-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Click the floating particles while loading!
        </motion.p>
        <p className="text-primary/80">Score: {score}</p>
      </div>

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence>
          {isReady && particles.map((particle) => (
            <motion.button
              key={particle.id}
              className="absolute rounded-full cursor-pointer"
              style={{
                width: '48px',
                height: '48px',
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                backgroundColor: particle.clicked ? 'hsl(var(--muted))' : particle.color,
                opacity: particle.clicked ? 0.5 : 1,
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                x: [0, Math.random() * 100 - 50, 0],
                y: [0, Math.random() * 100 - 50, 0],
              }}
              transition={{
                duration: 5 + Math.random() * 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => !particle.clicked && handleParticleClick(particle.id)}
              disabled={particle.clicked}
            >
              {particle.clicked && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center text-background"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✓
                </motion.div>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Loading progress */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <motion.p 
          className="text-primary/60"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          Loading your portfolio...
        </motion.p>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
