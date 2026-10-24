import React from 'react';

interface BrandLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = '', 
  iconOnly = false,
  size = 'md' 
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  const svgSizes = {
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
    lg: 'w-5.5 h-5.5',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className={`flex items-center space-x-2.5 ${className}`}>
      {/* Code-bracket icon with cyan / electric blue styling */}
      <div 
        className={`${iconSizes[size]} rounded-lg bg-gradient-to-br from-[#087CFF] to-[#2563EB] text-[#22D3EE] flex items-center justify-center shadow-glow-cyan flex-shrink-0 transition-transform group-hover:scale-105`}
        aria-hidden="true"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={svgSizes[size]}
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </div>

      {!iconOnly && (
        <span className={`${textSizes[size]} font-bold tracking-tight text-[#F1F7FF] leading-none`}>
          Debug <span className="text-[#22D3EE]">Dynasty</span>
        </span>
      )}
    </div>
  );
};
