import React, { useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { File as FileIcon, Settings, Share2, MessageSquare, Play, Menu, ArrowLeft } from 'lucide-react';
import { INITIAL_FILES, MOCK_USERS } from '../constants';
import { File, User } from '../types';
import { ChatPanel } from './ChatPanel';
import { CursorOverlay } from './CursorOverlay';
import { Logo } from './Logo';

interface EditorWorkspaceProps {
  roomId: string;
  currentUser: User;
  onLeave: () => void;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({ roomId, currentUser, onLeave }) => {
  const [files, setFiles] = useState<File[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string>(INITIAL_FILES[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [users] = useState<User[]>([{ ...currentUser, color: '#3b82f6', name: `${currentUser.email?.split('@')[0]} (You)` }, ...MOCK_USERS]);
  
  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setFiles(prev => prev.map(f => 
      f.id === activeFileId ? { ...f, content: value } : f
    ));
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    monaco.editor.defineTheme('vercel-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0a0a0a',
        'editor.foreground': '#ededed',
        'editor.lineHighlightBorder': '#333333',
        'editorLineNumber.foreground': '#444444',
      }
    });
    monaco.editor.setTheme('vercel-dark');
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden relative">
      <CursorOverlay users={users} />

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 bg-black border-r border-[#333] transition-all duration-300 flex flex-col overflow-hidden`}>
        <div className="h-12 flex items-center px-4 border-b border-[#333] gap-2">
            <button onClick={onLeave} className="text-secondary hover:text-white transition-colors">
                <ArrowLeft size={16} />
            </button>
            <Logo className="w-5 h-5" />
            <span className="font-bold text-sm tracking-tight">{roomId}</span>
        </div>
        
        <div className="p-2 flex-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-secondary uppercase tracking-wider mb-2 px-2 mt-4">
            <span>Files</span>
          </div>
          <div className="space-y-0.5">
            {files.map(file => (
              <button
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  activeFileId === file.id 
                    ? 'bg-white/10 text-white' 
                    : 'text-secondary hover:bg-[#111] hover:text-white'
                }`}
              >
                <FileIcon size={14} />
                {file.name}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <div className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2 px-2">Collaborators</div>
            <div className="space-y-2 px-2">
                {users.map(user => (
                <div key={user.id} className="flex items-center gap-2">
                    <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: user.color }}
                    />
                    <span className="text-xs text-secondary">{user.name}</span>
                </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        {/* Top Navigation */}
        <div className="h-12 bg-black border-b border-[#333] flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-secondary hover:text-white">
               <Menu size={18} />
            </button>
            <span className="text-sm text-secondary flex items-center gap-2">
              {activeFile.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              className="bg-white text-black hover:bg-gray-200 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
              onClick={() => alert("Simulation: Code deployed successfully!")}
            >
              <Play size={12} fill="currentColor" /> Run
            </button>
            <button className="bg-[#222] text-white hover:bg-[#333] border border-[#333] px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors">
              <Share2 size={12} /> Share
            </button>
            <button 
              onClick={() => setChatOpen(!chatOpen)}
              className={`p-2 rounded transition-colors ${chatOpen ? 'bg-white text-black' : 'text-secondary hover:text-white hover:bg-[#222]'}`}
            >
              <MessageSquare size={16} />
            </button>
            <button className="p-2 text-secondary hover:text-white hover:bg-[#222] rounded">
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative flex overflow-hidden">
          <div className="flex-1 h-full relative">
            <Editor
              height="100%"
              defaultLanguage={activeFile.language}
              language={activeFile.language}
              value={activeFile.content}
              theme="vercel-dark"
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: '"Fira Code", monospace',
                lineHeight: 24,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                renderLineHighlight: 'all',
              }}
            />
          </div>
          
          <ChatPanel 
            activeFile={activeFile} 
            isOpen={chatOpen} 
            onClose={() => setChatOpen(false)} 
          />
        </div>
      </div>
    </div>
  );
};