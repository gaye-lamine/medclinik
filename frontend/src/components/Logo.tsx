import React from 'react';

interface LogoProps {
  size?: number;
  mode?: 'neon' | 'print';
}

export const Logo: React.FC<LogoProps> = ({ size = 32, mode = 'neon' }) => {
  const isPrint = mode === 'print';
  
  const strokeColor = isPrint ? '#000000' : 'url(#medclinik-grad)';
  const crossColor = isPrint ? 'rgba(0, 0, 0, 0.08)' : 'url(#cross-grad)';
  const glowFilter = isPrint ? undefined : 'url(#logo-glow)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="medclinik-grad" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan */}
          <stop offset="50%" stopColor="#3b82f6" /> {/* Blue */}
          <stop offset="100%" stopColor="#8b5cf6" /> {/* Violet */}
        </linearGradient>
        
        <linearGradient id="cross-grad" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="rgba(6, 182, 212, 0.15)" />
          <stop offset="100%" stopColor="rgba(139, 92, 246, 0.15)" />
        </linearGradient>

        {/* Glow filter for screen */}
        <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Styled Medical Cross Background */}
      <path
        d="M38 15H62V38H85V62H62V85H38V62H15V38H38V15Z"
        fill={crossColor}
        stroke={isPrint ? '#000000' : 'rgba(255, 255, 255, 0.12)'}
        strokeWidth={isPrint ? 2.5 : 1.5}
        strokeLinejoin="round"
      />

      {/* Pulse/ECG line running across the cross */}
      <path
        d="M10 50H30L37 42L44 65L52 28L60 72L67 47L73 50H90"
        stroke={strokeColor}
        strokeWidth={isPrint ? 4.5 : 3.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glowFilter}
      />
      
      {/* Vital dots at the ends of the pulse line */}
      {!isPrint && (
        <>
          <circle cx="10" cy="50" r="3.5" fill="#06b6d4" />
          <circle cx="90" cy="50" r="3.5" fill="#8b5cf6" />
        </>
      )}
    </svg>
  );
};
