import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { MousePointer2 } from 'lucide-react';

interface CursorOverlayProps {
  users: User[];
}

// Simulate movement for demo purposes
export const CursorOverlay: React.FC<CursorOverlayProps> = ({ users }) => {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    // Only simulate other users, not "You"
    const otherUsers = users.filter(u => !u.name.includes('(You)'));

    const interval = setInterval(() => {
      setPositions(prev => {
        const next = { ...prev };
        otherUsers.forEach(user => {
            // Random movement within a reasonable screen area for demo
            const current = prev[user.id] || { x: 500, y: 300 };
            const destX = current.x + (Math.random() - 0.5) * 100;
            const destY = current.y + (Math.random() - 0.5) * 100;
            
            // Clamp to screen approximately
            next[user.id] = {
              x: Math.max(300, Math.min(window.innerWidth - 400, destX)),
              y: Math.max(100, Math.min(window.innerHeight - 100, destY))
            };
        });
        return next;
      });
    }, 2000); // Move every 2 seconds

    return () => clearInterval(interval);
  }, [users]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {users.filter(u => !u.name.includes('(You)')).map(user => {
        const pos = positions[user.id] || { x: 500, y: 300 };
        return (
          <div
            key={user.id}
            className="absolute transition-all duration-[2000ms] ease-in-out flex flex-col items-start"
            style={{
              left: pos.x,
              top: pos.y,
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
        );
      })}
    </div>
  );
};