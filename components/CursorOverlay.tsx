import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { MousePointer2 } from 'lucide-react';

interface CursorOverlayProps {
  users: User[];
}

// Real-time cursor overlay
export const CursorOverlay: React.FC<CursorOverlayProps> = ({ users }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {users
        .filter(u => !u.name.includes('(You)') && u.mouse)
        .map(user => (
          <div
            key={user.id}
            className="absolute transition-all duration-100 ease-linear flex flex-col items-start"
            style={{
              left: user.mouse!.x,
              top: user.mouse!.y,
            }}
          >
            <MousePointer2
              className="w-4 h-4"
              fill={user.color}
              color={user.color}
            />
            <span
              className="ml-2 px-2 py-0.5 text-xs rounded-full text-white whitespace-nowrap opacity-80"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </span>
          </div>
        ))}
    </div>
  );
};