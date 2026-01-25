import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CursorGlowProps {
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent';
  size?: number;
}

const CursorGlow = ({ color = 'primary', size = 200 }: CursorGlowProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const colorClasses = {
    primary: 'bg-primary/30',
    secondary: 'bg-secondary/30',
    tertiary: 'bg-tertiary/30',
    accent: 'bg-accent/30',
  };

  return (
    <motion.div
      className={`fixed pointer-events-none z-0 rounded-full blur-3xl ${colorClasses[color]}`}
      style={{
        width: size,
        height: size,
      }}
      animate={{
        x: mousePosition.x - size / 2,
        y: mousePosition.y - size / 2,
      }}
      transition={{
        type: 'spring',
        damping: 30,
        stiffness: 200,
        mass: 0.5,
      }}
    />
  );
};

export default CursorGlow;
