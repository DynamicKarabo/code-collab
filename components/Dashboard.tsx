import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Hash, Code2, ArrowRight, Loader2 } from 'lucide-react';
import { User, Room } from '../types';
import { Logo } from './Logo';
import { db } from '../services/db';

interface DashboardProps {
  user: User;
  onJoinRoom: (roomId: string) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onJoinRoom, onLogout }) => {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Fetch rooms on mount
    const loadRooms = async () => {
      if (user.id) {
        const rooms = await db.getUserRooms(user.id);
        setRecentRooms(rooms);
        setLoading(false);
      }
    };
    loadRooms();
  }, [user.id]);

  const handleCreateRoom = async () => {
    const name = `Project ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    setCreating(true);
    const newRoom = await db.createRoom(name, user.id);
    setCreating(false);

    if (newRoom) {
      onJoinRoom(newRoom.id);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomIdInput.trim()) {
      onJoinRoom(roomIdInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-gray-800">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-3xl tracking-tight">codecollab</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-secondary">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                {(user.email?.[0] || user.name[0]).toUpperCase()}
              </div>
              <span className="hidden sm:inline">{user.email || user.name}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-secondary hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Actions Column */}
          <div className="space-y-6">
            <div className="bg-[#111] border border-[#333] rounded-lg p-6 hover:border-white/50 transition-colors group">
              <h3 className="text-lg font-semibold mb-2">New Project</h3>
              <p className="text-secondary text-sm mb-6">Create a new collaborative environment instantly.</p>
              <button
                onClick={handleCreateRoom}
                disabled={creating}
                className="w-full bg-white text-black font-medium py-2.5 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Create Room
              </button>
            </div>

            <div className="bg-[#111] border border-[#333] rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Join Room</h3>
              <p className="text-secondary text-sm mb-4">Enter a Room ID to join an existing session.</p>
              <form onSubmit={handleJoinSubmit} className="space-y-3">
                <input
                  type="text"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  placeholder="e.g. room-alpha"
                  className="w-full bg-black border border-[#333] rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                />
                <button
                  type="submit"
                  disabled={!roomIdInput.trim()}
                  className="w-full bg-[#222] text-white border border-[#333] font-medium py-2 rounded hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Join <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>

          {/* Recent Rooms Column */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Hash size={20} className="text-secondary" /> Recent Projects
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-secondary">
                <Loader2 size={24} className="animate-spin mr-2" /> Loading projects...
              </div>
            ) : recentRooms.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {recentRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => onJoinRoom(room.id)}
                    className="group bg-black border border-[#333] rounded-lg p-4 cursor-pointer hover:border-white/40 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-medium group-hover:text-white transition-colors">{room.name}</h4>
                        <p className="text-xs text-secondary font-mono mt-0.5">{room.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-secondary block">Created {new Date(room.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-[#333] rounded-lg p-8 flex flex-col items-center justify-center text-center text-secondary hover:text-gray-400 hover:border-[#444] transition-colors cursor-pointer" onClick={handleCreateRoom}>
                <Plus size={24} className="mb-2 opacity-50" />
                <span className="text-sm">No projects yet. Create one to get started.</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
