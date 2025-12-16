import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <div className="flex items-center gap-2 group cursor-default">
    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 overflow-hidden transition-all duration-500 group-hover:border-blue-500/30 group-hover:shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]">
      <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-500" />
      <img
        src="/logo.png"
        alt="C"
        className={`${className} object-contain relative z-10`}
      />
    </div>
    <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent group-hover:to-white transition-all duration-300">
      codecollab
    </span>
  </div>
);
