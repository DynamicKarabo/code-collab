import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <img
    src="https://i.postimg.cc/FFpw39rP/codecollab-(1)-(1).jpg"
    alt="CodeCollab"
    className={`${className} object-contain`}
  />
);
