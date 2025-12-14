import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg 
    width="32" 
    height="32" 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* C shape with a connection node */}
    <path 
      d="M22 10C20.5 8.5 18.5 7.5 16 7.5C11.3056 7.5 7.5 11.3056 7.5 16C7.5 20.6944 11.3056 24.5 16 24.5C18.5 24.5 20.5 23.5 22 22" 
      stroke="white" 
      strokeWidth="2.5" 
      strokeLinecap="round"
    />
    <circle cx="22" cy="16" r="2.5" fill="white" />
    <path 
      d="M16 16H22" 
      stroke="white" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
    />
  </svg>
);