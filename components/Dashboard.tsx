import React, { useState, useEffect } from 'react';
import { Plus, LogOut, Code2, Clock, File as FileIcon, Search, Loader2 } from 'lucide-react';
import { db } from '../services/db';
import { Room, User } from '../types';
import { Logo } from './Logo';
import { motion } from 'framer-motion';
import randomColor from 'randomcolor';

interface DashboardProps {
  user: User;
  onJoinRoom: (roomId: string) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onJoinRoom, onLogout }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadRooms();
  }, [user.id]);

  const loadRooms = async () => {
    setIsLoading(true);
    const userRooms = await db.getUserRooms(user.id);
    setRooms(userRooms);
    setIsLoading(false);
  };

  const handleCreateRoom = async () => {
    setIsCreating(true);
    const newRoom = await db.createRoom(`Project ${rooms.length + 1}`, user.id);
    if (newRoom) {
      await loadRooms();
      onJoinRoom(newRoom.id);
    }
    setIsCreating(false);
  };

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen w-full bg-[#030303] text-white relative overflow-hidden selection:bg-blue-500/30">

      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/5 bg-black/50 backdrop-blur-xl h-16 flex items-center justify-between px-6 sticky top-0">
        <div className="flex items-center gap-3">
          <Logo />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
              style={{ backgroundColor: user.color || '#3b82f6' }}
            >
              {user.name[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-gray-300 font-medium pr-1">{user.name}</span>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-full"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent mb-2">
              Access your projects
            </h1>
            <p className="text-gray-400">Manage and collaborate on your code in real-time.</p>
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="group relative inline-flex h-10 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-50"
          >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-1 text-sm font-medium text-white backdrop-blur-3xl transition-all group-hover:bg-slate-900">
              {isCreating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus className="mr-2" size={16} />}
              New Project
            </span>
          </button>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {rooms.map((room) => (
              <motion.div
                key={room.id}
                variants={item}
                whileHover={{ scale: 1.02, translateY: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onJoinRoom(room.id)}
                className="group relative bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl cursor-pointer overflow-hidden transition-colors hover:border-white/10"
              >
                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:text-blue-300 transition-colors">
                      <Code2 size={24} />
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-gray-400 font-mono">
                      {room.id.slice(5)}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-100 mb-2">{room.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-6">
                    A collaborative workspace for real-time coding and AI assistance.
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-white/5 pt-4">
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {new Date(room.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileIcon size={12} />
                      Workspace
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Empty State */}
            {rooms.length === 0 && (
              <motion.div variants={item} className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                <div className="inline-flex p-4 rounded-full bg-white/5 mb-4 text-gray-400">
                  <Search size={24} />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No projects yet</h3>
                <p className="text-gray-400 max-w-sm mx-auto mb-6">
                  Create your first project to start collaborating with your team and using AI.
                </p>
                <button
                  onClick={handleCreateRoom}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline"
                >
                  Create a project now &rarr;
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};
