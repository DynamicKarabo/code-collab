import React, { useState, useEffect } from 'react';
import { Plus, LogOut, Code2, Clock, File as FileIcon, Search, Loader2, Github, Download, X, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { db } from '../services/db';
import { githubService } from '../services/github.ts';
import { Room, User } from '../types';
import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import randomColor from 'randomcolor';
import { SettingsDialog, EditorSettings } from './SettingsDialog';

interface DashboardProps {
  user: User;
  onJoinRoom: (roomId: string) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onJoinRoom, onLogout }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string; color: string }>({
    name: user.name,
    color: user.color
  });

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const p = await db.getProfile(user.id);
      if (p) {
        setProfile(p);
      }
    };
    loadProfile();
  }, [user.id]);

  const handleUpdateProfile = async (updates: Partial<User>) => {
    const newProfile = { name: updates.name || profile.name, color: updates.color || profile.color };
    setProfile(newProfile);
    await db.updateProfile(user.id, newProfile);
  };

  // ...

  // Update Header to include Settings Icon
  // <div className="flex items-center gap-4">
  //   <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors">
  //     <SettingsIcon size={20} />
  //   </button>
  //   <div className="flex items-center gap-3"> ... </div>
  // </div>

  // Add SettingsDialog at the end
  // <SettingsDialog 
  //   isOpen={isSettingsOpen} 
  //   onClose={() => setIsSettingsOpen(false)} 
  //   currentUser={{ ...user, ...profile }} 
  //   onUpdateUser={handleUpdateProfile} 
  //   editorSettings={{ fontSize: 14, wordWrap: 'on', minimap: false }} 
  //   onUpdateEditorSettings={() => {}} 
  // />

  // Create Room State
  const [isCreating, setIsCreating] = useState(false);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState('');
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

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

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project permanently?")) {
      const success = await db.deleteRoom(roomId);
      if (success) {
        await loadRooms();
        setShowDeleteSuccess(true);
        setTimeout(() => setShowDeleteSuccess(false), 3000);
      } else {
        console.error("Failed to delete project. Check console for database errors.");
        alert("Failed to delete project. Please check if your account has permission.");
      }
    }
  };

  const handleImportRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;

    try {
      setIsImporting(true);
      setImportError('');

      // Parse URL: https://github.com/owner/repo
      const parts = importUrl.replace(/\/$/, '').split('/');
      const repoIndex = parts.indexOf('github.com');

      if (repoIndex === -1 || parts.length < repoIndex + 3) {
        throw new Error("Invalid GitHub URL. Format: https://github.com/owner/repo");
      }

      const owner = parts[repoIndex + 1];
      const repo = parts[repoIndex + 2];

      // 1. Create Room
      const newRoom = await db.createRoom(`${repo}`, user.id);
      if (!newRoom) throw new Error("Failed to create room");

      // 2. Fetch Files
      const files = await githubService.fetchRepoContents(owner, repo);

      // 3. Save Files
      for (const file of files) {
        // Note: saveFile signature is (file, roomId) in db.ts based on earlier checks
        // Actually, let's verify db.ts signature. 
        // Previous view_file of db.ts showed: async saveFile(file: File, roomId: string)
        // Wait, line 65: async saveFile(file: File, roomId: string)
        // BUT line 86: room_id: roomId.
        // The issue is File interface in types.ts doesn't have roomId, but we are passing it separately.
        // So this aligns.
        await db.saveFile(file, newRoom.id);
      }

      // 4. Join
      onJoinRoom(newRoom.id);

    } catch (err: any) {
      console.error(err);
      setImportError(err.message || "Failed to import repository");
      setIsImporting(false);
    }
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
    <div className="h-screen w-full bg-[#030303] text-white relative overflow-y-auto overflow-x-hidden selection:bg-blue-500/30">

      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Import Modal Overlay */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-white/10 p-6 rounded-2xl w-full max-w-md relative shadow-2xl"
            >
              <button
                onClick={() => !isImporting && setShowImportModal(false)}
                className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors"
                disabled={isImporting}
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <Github size={24} className="text-white" />
                </div>
                <h2 className="text-xl font-bold">Import from GitHub</h2>
                <p className="text-sm text-gray-400 text-center mt-1">
                  Enter a public repository URL to clone it into your workspace.
                </p>
              </div>

              <form onSubmit={handleImportRepo}>
                <div className="mb-4">
                  <input
                    type="url"
                    placeholder="https://github.com/username/repo"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
                    required
                    disabled={isImporting}
                  />
                </div>

                {importError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                    {importError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isImporting}
                  className="w-full bg-white text-black font-semibold py-2.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isImporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                  {isImporting ? 'Cloning...' : 'Import Repository'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showDeleteSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 bg-[#111] border border-green-500/20 rounded-xl shadow-2xl shadow-green-900/10"
          >
            <div className="p-2 bg-green-500/10 rounded-full text-green-400">
              <Trash2 size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Project Deleted</h4>
              <p className="text-xs text-gray-400">The project was successfully removed.</p>
            </div>
            <button
              onClick={() => setShowDeleteSuccess(false)}
              className="ml-2 text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <motion.nav
        variants={item}
        className="flex items-center justify-between p-6 mb-8 bg-[#0a0a0a]/50 backdrop-blur-xl border-b border-white/5"
      >
        <Logo />

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
            title="Settings"
          >
            <SettingsIcon size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-gray-400">Online</p>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium border-2 border-[#0a0a0a]"
              style={{ backgroundColor: user.color }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </motion.nav>

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

          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium text-gray-300"
            >
              <Github size={16} />
              Import Repo
            </button>

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
          </div>
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

                  <button
                    onClick={(e) => handleDeleteRoom(e, room.id)}
                    className="absolute top-4 right-4 p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all z-20 hover:bg-white/5 rounded-lg"
                    title="Delete Project"
                  >
                    <Trash2 size={16} />
                  </button>

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
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handleCreateRoom}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline"
                  >
                    Create a project now &rarr;
                  </button>
                  <span className="text-gray-600">or</span>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="text-gray-400 hover:text-white text-sm font-medium hover:underline"
                  >
                    Import from GitHub
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </main>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={{ ...user, ...profile }}
        onUpdateUser={handleUpdateProfile}
        editorSettings={{ fontSize: 14, wordWrap: 'on', minimap: false }}
        onUpdateEditorSettings={() => { }}
      />
    </div>
  );
};

