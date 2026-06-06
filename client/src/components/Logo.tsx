import React from "react";

export const Logo = ({ className, size, color }: { className?: string; size?: number | string; color?: string }) => {
  return (
    <img 
      src="/logo.png" 
      alt="Nexus Academic" 
      className={className} 
      style={{ 
        width: size || '100%', 
        height: size || '100%', 
        objectFit: 'contain'
      }} 
    />
  );
};
