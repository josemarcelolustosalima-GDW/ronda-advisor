import React from 'react';

interface GuidewayLogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

/**
 * Clean corporate text-only header lockup (graphical logo removed as requested).
 */
export const GuidewayLogo: React.FC<GuidewayLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const textSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }[size];

  const primaryColor = variant === 'dark' ? 'text-white' : 'text-slate-900';
  const subColor = variant === 'dark' ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`inline-flex flex-col select-none shrink-0 ${className}`}>
      <span className={`font-bold tracking-wider uppercase ${textSize} ${primaryColor}`}>
        GUIDEWAY
      </span>
      {showTagline && (
        <span className={`text-[10px] font-medium tracking-widest uppercase ${subColor}`}>
          Ronda Industrial
        </span>
      )}
    </div>
  );
};
