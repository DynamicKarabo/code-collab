import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <div className="flex items-center gap-2 group cursor-default">
    <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 overflow-hidden transition-colors group-hover:bg-white/10">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <img
        src="https://i.postimg.cc/FFpw39rP/codecollab-(1)-(1).jpg"
        alt="CodeCollab"
        className={`${className} object-contain relative z-10`}
      />
    </div>
    <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent group-hover:to-white transition-all duration-300">
      codecollab
    </span>
  </div>
);
