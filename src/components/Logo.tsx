import React from 'react';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/logo-car.png" 
        alt="Car Logo" 
        className="h-12 md:h-16 object-contain mix-blend-multiply" 
      />
      <img 
        src="/logo-text.png" 
        alt="STYKY" 
        className="h-14 md:h-20 object-contain mix-blend-multiply" 
      />
    </div>
  );
}

