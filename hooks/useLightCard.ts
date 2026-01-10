import { useEffect, useRef, useState } from 'react';

interface IOptions {
  light?: {
    width?: number;
    height?: number;
    color?: string;
    blur?: number;
  };
}

export const useLightCard = (option: IOptions = {}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const { width = 80, height = 80, color = 'rgba(255, 179, 71, 0.1)', blur = 50 } = option.light ?? {};

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);
    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left - width / 2,
        y: e.clientY - rect.top - height / 2,
      });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);
    card.addEventListener('mousemove', handleMouseMove);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
      card.removeEventListener('mousemove', handleMouseMove);
    };
  }, [width, height]);

  return {
    cardRef,
    lightStyle: {
      position: 'absolute' as const,
      left: `${mousePos.x}px`,
      top: `${mousePos.y}px`,
      width: `${width}px`,
      height: `${height}px`,
      background: color,
      filter: `blur(${blur}px)`,
      borderRadius: '50%',
      pointerEvents: 'none' as const,
      zIndex: 1,
      opacity: isHovered ? 1 : 0,
      transition: 'opacity 0.3s ease-out',
    },
    isHovered,
  };
};
