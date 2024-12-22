"use client"

// Inspired by Aceternity UI (https://ui.aceternity.com)
import React, { useEffect, useRef, memo } from 'react';
import { cn } from "@/lib/utils";

interface BackgroundBeamsProps {
  className?: string;
  numBeams?: number;
  beamOpacity?: number;
}

export const BackgroundBeams = memo(({
  className,
  numBeams = 5,
  beamOpacity = 0.6,
}: BackgroundBeamsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animationFrameId: number;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let beams: Array<{
      x: number;
      y: number;
      angle: number;
      speed: number;
      width: number;
      length: number;
      chartIndex: number;
      velX: number;
      velY: number;
    }> = [];

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }, 100);
    };

    const parseHSLValues = (hslString: string) => {
      const [h, s, l] = hslString.split(' ').map(Number);
      return { h, s, l };
    };

    const getChartColor = (index: number) => {
      const root = document.documentElement;
      const rawValue = getComputedStyle(root).getPropertyValue(`--chart-${(index % 5) + 1}`).trim();
      const { h, s, l } = parseHSLValues(rawValue);
      return { h, s, l };
    };

    const createBeam = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      angle: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.5,
      width: 40 + Math.random() * 60,
      length: 200 + Math.random() * 200,
      chartIndex: Math.floor(Math.random() * 5) + 1,
      velX: (Math.random() - 0.5) * 2,
      velY: (Math.random() - 0.5) * 2,
    });

    const initBeams = () => {
      beams = Array(numBeams).fill(null).map(createBeam);
    };

    const drawBeam = (beam: typeof beams[0]) => {
      const color = getChartColor(beam.chartIndex);
      const gradient = ctx.createLinearGradient(
        beam.x,
        beam.y,
        beam.x + Math.cos(beam.angle) * beam.length,
        beam.y + Math.sin(beam.angle) * beam.length
      );

      gradient.addColorStop(0, `hsla(${color.h}, ${color.s}%, ${color.l}%, ${beamOpacity * 0.2})`);
      gradient.addColorStop(0.5, `hsla(${color.h}, ${color.s}%, ${color.l}%, ${beamOpacity * 0.1})`);
      gradient.addColorStop(1, `hsla(${color.h}, ${color.s}%, ${color.l}%, 0)`);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(beam.x, beam.y);
      ctx.lineTo(
        beam.x + Math.cos(beam.angle) * beam.length,
        beam.y + Math.sin(beam.angle) * beam.length
      );
      ctx.strokeStyle = gradient;
      ctx.lineWidth = beam.width;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    };

    const updateBeam = (beam: typeof beams[0]) => {
      beam.x += beam.velX;
      beam.y += beam.velY;

      if (beam.x < 0 || beam.x > canvas.width) {
        beam.velX *= -1;
        beam.velY += (Math.random() - 0.5) * 0.5;
      }
      if (beam.y < 0 || beam.y > canvas.height) {
        beam.velY *= -1;
        beam.velX += (Math.random() - 0.5) * 0.5;
      }

      beam.angle += 0.002;

      beams.forEach((otherBeam) => {
        if (beam === otherBeam) return;

        const dx = otherBeam.x - beam.x;
        const dy = otherBeam.y - beam.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < (beam.width + otherBeam.width) / 2) {
          const angle = Math.atan2(dy, dx);
          const sin = Math.sin(angle);
          const cos = Math.cos(angle);

          const vx1 = beam.velX * cos + beam.velY * sin;
          const vy1 = beam.velY * cos - beam.velX * sin;
          const vx2 = otherBeam.velX * cos + otherBeam.velY * sin;
          const vy2 = otherBeam.velY * cos - otherBeam.velX * sin;

          beam.velX = vx2 * cos - vy1 * sin + (Math.random() - 0.5) * 0.2;
          beam.velY = vy1 * cos + vx2 * sin + (Math.random() - 0.5) * 0.2;
          otherBeam.velX = vx1 * cos - vy2 * sin + (Math.random() - 0.5) * 0.2;
          otherBeam.velY = vy2 * cos + vx1 * sin + (Math.random() - 0.5) * 0.2;

          beam.angle += (Math.random() - 0.5) * 0.1;
          otherBeam.angle += (Math.random() - 0.5) * 0.1;
        }
      });
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      beams.forEach((beam) => {
        updateBeam(beam);
        drawBeam(beam);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    handleResize();
    initBeams();
    animate();

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [numBeams, beamOpacity]);

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "fixed inset-0 z-0 bg-background/80",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
});

BackgroundBeams.displayName = "BackgroundBeams";

export default BackgroundBeams;