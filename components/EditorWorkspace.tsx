import React, { useState, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { File as FileIcon, Settings, Share2, MessageSquare, Play, Menu, ArrowLeft, Plus, Trash2, Undo, Redo, Code, Check, X } from 'lucide-react';
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
  
  // File Creation State
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Editor Reference
  const editorRef = useRef<any>(null);
  
  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setFiles(prev => prev.map(f => 
      f.id === activeFileId ? { ...f, content: value } : f
    ));
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
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

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const extension = newFileName.split('.').pop() || 'txt';
    const languageMap: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        css: 'css',
        html: 'html',
        json: 'json'
    };
    
    const newFile: File = {
        id: Date.now().toString(),
        name: newFileName,
        language: languageMap[extension] || 'plaintext',
        content: '// New file\n'
    };

    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
    setIsCreatingFile(false);
    setNewFileName('');
  };

  const handleDeleteFile = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (files.length <= 1) {
        alert("Cannot delete the last file.");
        return;
    }
    const confirmed = window.confirm("Are you sure you want to delete this file?");
    if (confirmed) {
        const newFiles = files.filter(f => f.id !== fileId);
        setFiles(newFiles);
        if (activeFileId === fileId) {
            setActiveFileId(newFiles[0].id);
        }
    }
  };

  const triggerUndo = () => {
    editorRef.current?.trigger('toolbar', 'undo', null);
  };

  const triggerRedo = () => {
    editorRef.current?.trigger('toolbar', 'redo', null);
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
            <span className="font-bold text-sm tracking-tight truncate">{roomId}</span>
        </div>
        
        <div className="p-2 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between text-[10px] font-bold text-secondary uppercase tracking-wider mb-2 px-2 mt-4">
            <span>Explorer</span>
            <button 
                onClick={() => setIsCreatingFile(true)}
                className="hover:text-white transition-colors"
                title="New File"
            >
                <Plus size={14} />
            </button>
          </div>
          
          <div className="space-y-0.5">
            {files.map(file => (
              <div
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                className={`group w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                  activeFileId === file.id 
                    ? 'bg-white/10 text-white' 
                    : 'text-secondary hover:bg-[#111] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                    <FileIcon size={14} className={activeFileId === file.id ? 'text-blue-400' : 'text-gray-500'} />
                    <span className="truncate">{file.name}</span>
                </div>
                <button 
                    onClick={(e) => handleDeleteFile(e, file.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-1"
                >
                    <Trash2 size={12} />
                </button>
              </div>
            ))}

            {isCreatingFile && (
                <div className="px-3 py-2 bg-[#111] rounded-md flex items-center gap-2">
                    <FileIcon size={14} className="text-gray-500" />
                    <input 
                        autoFocus
                        type="text" 
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateFile();
                            if (e.key === 'Escape') setIsCreatingFile(false);
                        }}
                        placeholder="filename.ts"
                        className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-600"
                    />
                    <div className="flex items-center gap-1">
                        <button onClick={handleCreateFile} className="text-green-500 hover:text-green-400"><Check size={12}/></button>
                        <button onClick={() => setIsCreatingFile(false)} className="text-red-500 hover:text-red-400"><X size={12}/></button>
                    </div>
                </div>
            )}
          </div>

          <div className="mt-8 border-t border-[#333] pt-4">
            <div className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2 px-2">Collaborators</div>
            <div className="space-y-2 px-2">
                {users.map(user => (
                <div key={user.id} className="flex items-center gap-2">
                    <div 
                    className="w-2 h-2 rounded-full ring-2 ring-black"
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
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-secondary hover:text-white transition-colors">
               <Menu size={18} />
            </button>
            <div className="flex items-center gap-3">
                 <span className="text-sm text-gray-300 font-medium flex items-center gap-2">
                 {activeFile.name}
                </span>
                {/* Undo / Redo Controls */}
                <div className="h-4 w-[1px] bg-[#333] mx-1"></div>
                <div className="flex items-center gap-1">
                    <button onClick={triggerUndo} className="p-1.5 text-secondary hover:text-white hover:bg-[#222] rounded transition-colors" title="Undo (Ctrl+Z)">
                        <Undo size={14} />
                    </button>
                    <button onClick={triggerRedo} className="p-1.5 text-secondary hover:text-white hover:bg-[#222] rounded transition-colors" title="Redo (Ctrl+Y)">
                        <Redo size={14} />
                    </button>
                </div>
            </div>
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
              className={`p-2 rounded transition-colors relative ${chatOpen ? 'bg-white text-black' : 'text-secondary hover:text-white hover:bg-[#222]'}`}
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